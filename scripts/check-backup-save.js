// Prüft die Logik zum Speichern von Sicherungsdateien: Dialog, Download-Fallback, Abbruch, Teilen-Dialog, Merker.
const fs = require('fs'); const path = require('path'); const vm = require('vm'); const assert = require('assert');
const root = path.resolve(__dirname, '..');
function makeContext({ picker, share, canShare, withPickerApi = true }) {
  const store = {}; const clicks = [];
  const window = withPickerApi ? { showSaveFilePicker: picker } : {};
  const navigator = { share, canShare };
  const document = { body: { append() {} }, createElement() { return { click() { clicks.push(this.download); }, remove() {} }; } };
  const ctx = {
    window, navigator, document, console, Blob, File: global.File,
    URL: { createObjectURL: () => 'blob:x', revokeObjectURL() {} },
    localStorage: { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); } },
    clicks, store
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'export.js'), 'utf8'), ctx, { filename: 'export.js' });
  return ctx;
}
const run = (ctx, code) => vm.runInContext(code, ctx);
(async () => {
  // 1) Speichern-Dialog erfolgreich
  let written = [];
  let ctx = makeContext({ picker: async () => ({ createWritable: async () => ({ write: async (b) => written.push(b), close: async () => {} }) }) });
  let r = await run(ctx, `writeFileWithPickerOrDownload('a.json','application/json','{}')`);
  assert.deepStrictEqual({ ok: r.ok, via: r.via }, { ok: true, via: 'picker' }); assert.strictEqual(written.length, 1);
  assert.strictEqual(await run(ctx, `saveFileWithPickerOrDownload('a.json','application/json','{}')`), 'Datei erstellt. Bitte an einem geschützten Ort ablegen.');
  // 2) Abbruch im Dialog: kein Fehler, keine Datei, Meldung
  ctx = makeContext({ picker: async () => { const e = new Error('x'); e.name = 'AbortError'; throw e; } });
  r = await run(ctx, `writeFileWithPickerOrDownload('a.json','application/json','{}')`);
  assert.deepStrictEqual({ ok: r.ok, via: r.via }, { ok: false, via: 'cancelled' });
  assert(/abgebrochen/.test(await run(ctx, `saveFileWithPickerOrDownload('a.json','application/json','{}')`)));
  // 3) Anderer Fehler im Dialog wird weitergereicht (nicht verschluckt)
  ctx = makeContext({ picker: async () => { throw new Error('Platte voll'); } });
  await assert.rejects(() => run(ctx, `writeFileWithPickerOrDownload('a.json','application/json','{}')`), /Platte voll/);
  // 4) Safari ohne Dialog: Download, mit Hinweis auf Download-Ordner
  ctx = makeContext({ withPickerApi: false });
  r = await run(ctx, `writeFileWithPickerOrDownload('b.json','application/json','{}')`);
  assert.deepStrictEqual({ ok: r.ok, via: r.via }, { ok: true, via: 'download' }); assert.deepStrictEqual(ctx.clicks, ['b.json']);
  assert(/Download-Ordner/.test(await run(ctx, `saveFileWithPickerOrDownload('b.json','application/json','{}')`)));
  // 5) Teilen-Dialog
  let shared = null;
  ctx = makeContext({ withPickerApi: false, share: async (d) => { shared = d; }, canShare: () => true });
  assert.strictEqual(run(ctx, 'canShareFiles()'), true);
  r = await run(ctx, `shareFileToFiles('c.json','application/json','{}')`); assert.strictEqual(r.ok, true); assert.strictEqual(shared.files[0].name, 'c.json');
  ctx = makeContext({ withPickerApi: false, share: async () => { const e = new Error('x'); e.name = 'AbortError'; throw e; }, canShare: () => true });
  r = await run(ctx, `shareFileToFiles('c.json','application/json','{}')`); assert.strictEqual(r.via, 'cancelled');
  ctx = makeContext({ withPickerApi: false }); assert.strictEqual(run(ctx, 'canShareFiles()'), false);
  ctx = makeContext({ withPickerApi: false, share: async () => {}, canShare: () => false }); assert.strictEqual(run(ctx, 'canShareFiles()'), false);
  // 6) Zeitpunkt der letzten Sicherung (außerhalb der App-Daten)
  ctx = makeContext({ withPickerApi: false });
  assert.strictEqual(run(ctx, 'lastBackupSavedAt()'), '');
  run(ctx, 'rememberBackupSaved()'); assert(!Number.isNaN(Date.parse(run(ctx, 'lastBackupSavedAt()'))));
  assert.deepStrictEqual(Object.keys(ctx.store), ['lk_last_backup_at']);
  console.log('Sicherungsdatei-Prüfung erfolgreich: Dialog, Abbruch, Fehler, Download-Fallback, Teilen-Dialog und Merker der letzten Sicherung.');
})().catch((e) => { console.error(e); process.exit(1); });
