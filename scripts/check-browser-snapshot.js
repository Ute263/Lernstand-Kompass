// Browser-Schnappschusstest: rendert Lehrkraft-Tabs, Wochenplan-Editor, Druck und Kinderansicht im echten
// Browser (Chromium via Playwright) und vergleicht das normalisierte HTML per Hash mit der Referenz.
//   node scripts/check-browser-snapshot.js            vergleicht mit scripts/browser-snapshot-referenz.json
//   node scripts/check-browser-snapshot.js --update   schreibt die Referenz neu (nur nach bewusster Änderung!)
// Voraussetzung: `npm run build` (liest dist/) und ein installiertes Playwright. Ohne Playwright wird übersprungen.
let chromium;
try { ({ chromium } = require('playwright')); } catch (error) {
  console.log('Browser-Schnappschusstest übersprungen: Playwright ist nicht installiert.'); process.exit(0);
}
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const dist = path.resolve(__dirname, '..', 'dist');
const refFile = path.join(__dirname, 'browser-snapshot-referenz.json');
const update = process.argv.includes('--update');
if (!fs.existsSync(dist)) { console.error('dist/ fehlt: bitte zuerst `npm run build` ausführen.'); process.exit(1); }
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.otf': 'font/otf' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(dist, p);
  if (!f.startsWith(dist) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': mime[path.extname(f)] || 'application/octet-stream' }); res.end(fs.readFileSync(f));
});
const tabIds = new Set();
for (const f of fs.readdirSync(dist).filter((n) => n.endsWith('.js'))) {
  if (['exceljs.min.js', 'jsqr.js'].includes(f)) continue;
  const src = fs.readFileSync(path.join(dist, f), 'utf8');
  for (const m of src.matchAll(/setTeacherTab\(\\?['"]([A-Za-z0-9_]+)\\?['"]\)/g)) tabIds.add(m[1]);
  for (const m of src.matchAll(/\bteacherTab = ['"]([A-Za-z0-9_]+)['"]/g)) tabIds.add(m[1]);
}
(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1024, height: 768 }, serviceWorkers: 'block' });
  const p = await ctx.newPage();
  await p.addInitScript(() => {
    let s = 12345; Math.random = () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
    if (window.crypto && crypto.randomUUID) { let n = 0; crypto.randomUUID = () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`; }
  });
  await p.clock.install({ time: new Date('2026-11-04T09:00:00+01:00') });
  const errors = []; p.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  await p.goto(`http://127.0.0.1:${port}/index.html`); await p.waitForTimeout(1500);
  const out = await p.evaluate(async (tabList) => {
    const res = {}; const cap = (k) => { res[k] = (document.querySelector('#app')?.innerHTML || '').replace(/\s+/g, ' ').replace(/127\.0\.0\.1:\d+/g, 'HOST').replace(/ak-[A-Z0-9]{8}/g, 'ak-TOKEN').replace(/ d="M[^"]*"/g, ' d="QR"').trim(); };
    const safe = async (k, fn) => { try { await fn(); cap(k); } catch (e) { res[k] = 'FEHLER: ' + e.message; } };
    // --- Fixture
    const st = createInitialState({ pinHash: 'x', recoveryKeyHash: 'y', className: '2c', description: '' });
    const cat = st.workbookCatalog; const pick = (subject, n) => cat.filter((x) => x.subject === subject).slice(0, n).map((x) => x.id);
    const [d1, d2] = pick('Deutsch', 2), [m1, m2] = pick('Mathe', 2);
    const a1 = st.animals[0].id, a2 = st.animals[1].id;
    const mk = (id, title, mode) => ({
      id, classId: st.activeClassId, title, planningMode: mode, theme: 'Herbst', extraNote: 'Zusatz', assignmentMode: 'selected', animalIds: [a1, a2],
      deutschSectionOrder: ['Lernwörter', 'Deutsch', 'Lesezeit'],
      days: {
        Montag: { deutschIds: [d1, d2], deutschTaskNumbers: ['1', '2'], deutschTaskStars: [false, true], deutschTaskSocialForms: ['partner', ''], matheIds: [m1], matheTaskNumbers: ['5'], matheTaskStars: [true], matheTaskSocialForms: ['group'],
          deutschFreeTasks: [{ id: 'fd', text: 'AB Deutsch', isWorksheet: true, socialForm: 'individual' }], matheFreeTasks: [{ id: 'fm', text: 'Mikro Mathe', isMicrophone: true, socialForm: 'partner' }], extraFreeTasks: [{ id: 'fx', text: 'Zusatz', starred: true }] },
        Dienstag: { matheIds: [m1, m2], matheTaskNumbers: ['6', '7'], matheTaskStars: [false, false], matheTaskSocialForms: ['', 'individual'], deutschIds: [d1], deutschTaskNumbers: ['3'] }
      },
      overrides: { [a1]: { days: { Montag: { matheIds: [m2], matheTaskNumbers: ['9'], matheTaskStars: [false], matheTaskSocialForms: ['partner'], matheFreeTasks: [{ id: 'ofm', text: 'AB individuell', isWorksheet: true }] } } } },
      createdAt: '2026-11-02T08:00:00.000Z', updatedAt: '2026-11-02T12:00:00.000Z', startDate: '2026-11-02', endDate: '2026-11-06'
    });
    const pf = mk('plan-f', 'Woche 2', 'week'); pf.overrides[a1].fullOverride = true; pf.days.Dienstag.matheFreeTasks = [{ id: 'fm2', text: 'Rechenmauer', socialForm: 'individual' }];
    st.weeklyPlans = [mk('plan-w', 'Woche 1', 'week'), mk('plan-d', 'Tag 1', 'day'), pf];
    st.weeklyPlanStatuses = [{ id: 's1', classId: st.activeClassId, planId: 'plan-w', animalId: a1, day: 'Montag', field: `Mathe:${m1}`, status: 'teilweise', pageStatuses: { '5': 'fertig' }, pageUpdatedAt: { '5': '2026-11-03T09:00:00.000Z' }, updatedAt: '2026-11-03T09:00:00.000Z' }];
    state = normalizeState(st); res.__plans = state.weeklyPlans.length; res.__catalog = state.workbookCatalog.length;
    const groupIds = (typeof TEACHER_GROUPS !== 'undefined') ? TEACHER_GROUPS.flatMap((g) => g.sections.map((s) => s[0])) : [];
    res.navigation = JSON.stringify(TEACHER_GROUPS.map((g) => [g.id, g.label, g.sections.map((s) => s.join('|'))]));
    // --- Lehrkraft-Tabs
    const tabs = [...new Set([...groupIds, ...tabList])].sort();
    for (const t of tabs) await safe('tab:' + t, async () => { screen = 'teacher'; teacherTab = t; render(); });
    // --- Einstellungen: Unteransichten (Datei-Sicherung, Speicher & Diagnose, Datenschutz)
    for (const sub of ['backup', 'storageStatus', 'privacy']) await safe('einstellung:' + sub, async () => { screen = 'teacher'; teacherTab = 'simpleMoreSettings'; lkOpenSimpleSetting(sub); });
    lkSimpleSettingsBack();
    // --- Wochenplan-Editor
    for (const [pid, sec] of [['plan-w', 'create'], ['plan-d', 'create'], ['plan-f', 'create']]) {
      await safe(`editor:${pid}`, async () => { screen = 'teacher'; teacherTab = 'weeklyPlans'; await editWeeklyPlan(pid); });
      await safe(`editor:${pid}:fokus-a1`, async () => { weeklyPlanFocusAnimalId = a1; weeklyOverrideAnimalId = a1; render(); });
      weeklyPlanFocusAnimalId = ''; weeklyOverrideAnimalId = '';
    }
    for (const sec of ['current', 'all', 'archive', 'create']) await safe('planliste:' + sec, async () => { weeklyPlanEditorId = ''; weeklyPlanDraft = null; screen = 'teacher'; teacherTab = 'weeklyPlans'; weeklyPlanSection = sec; render(); });
    // --- Druck
    for (const pid of ['plan-w', 'plan-d', 'plan-f']) {
      const plan = state.weeklyPlans.find((x) => x.id === pid);
      await safe(`druckdialog:${pid}`, async () => { weeklyPrintPlanId = pid; weeklyPrintDraft = null; weeklyPrintDialogOpen = true; screen = 'teacher'; teacherTab = 'weeklyPlans'; render(); });
      weeklyPrintDialogOpen = false;
      for (const variant of ['short', 'detail', 'compact']) for (const target of ['all', 'single']) for (const boxes of [false, true]) {
        await safe(`druck:${pid}:${variant}:${target}:${boxes ? 'box' : 'ohne'}`, async () => {
          currentWeeklyPrintPlan = plan; currentPrintType = 'weeklyPlan'; printReturnTab = 'weeklyPlans';
          currentWeeklyPrintOptions = { variant, target, animalIds: target === 'single' ? [a1] : [], days: [...WEEK_DAYS], showTheme: true, showExtra: true, showCheckboxes: boxes, showFirstNames: false };
          screen = 'printView'; render();
        });
      }
    }
    // --- Kinderansicht
    childDraft.animalId = a1;
    for (const sc of ['childAnimal', 'childSubject', 'childWeek', 'childWorkbookTasks']) await safe('kind:' + sc, async () => { setChildScreen(sc); });
    childDraft.animalId = a2;
    await safe('kind:childWeek:a2', async () => { setChildScreen('childWeek'); });
    return res;
  }, [...tabIds]);
  await b.close(); server.close();
  const keys = Object.keys(out).filter((k) => !k.startsWith('__')).sort();
  const hashes = Object.fromEntries(keys.map((k) => [k, crypto.createHash('sha256').update(String(out[k])).digest('hex').slice(0, 16)]));
  const failed = keys.filter((k) => String(out[k]).startsWith('FEHLER'));
  if (failed.length || errors.length) { console.error('Fehler beim Rendern:', failed.slice(0, 5), errors.slice(0, 3)); process.exit(1); }
  if (update) { fs.writeFileSync(refFile, JSON.stringify(hashes, null, 1) + '\n'); console.log(`Referenz geschrieben: ${keys.length} Schnappschüsse.`); return; }
  if (!fs.existsSync(refFile)) { console.error('Referenzdatei fehlt: mit --update erzeugen.'); process.exit(1); }
  const ref = JSON.parse(fs.readFileSync(refFile, 'utf8'));
  const diff = [...new Set([...Object.keys(ref), ...keys])].filter((k) => ref[k] !== hashes[k]);
  if (diff.length) { console.error(`Browser-Schnappschusstest FEHLGESCHLAGEN: ${diff.length} Abweichung(en):\n  ` + diff.slice(0, 20).join('\n  ')); process.exit(1); }
  console.log(`Browser-Schnappschusstest erfolgreich: ${keys.length} Ansichten (Lehrkraft-Tabs, Wochenplan-Editor, Druck, Kinderansicht) unverändert.`);
  return;

})();
