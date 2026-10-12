const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'sync.js'), 'utf8');
function assert(condition, message) { if (!condition) throw new Error(message); }
function extractFunction(name) {
  const asyncStart = source.indexOf(`async function ${name}(`);
  if (asyncStart >= 0) return extractFrom(asyncStart);
  const start = source.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`Funktion fehlt: ${name}`);
  return extractFrom(start);
}
function extractFrom(start) {
  const brace = source.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error('Funktion unvollständig.');
}

// Statische Schutzregeln: ETag muss beim Schreiben tatsächlich verwendet werden.
const putSource = extractFunction('putOneDriveBackup');
assert(putSource.includes('If-Match'), 'OneDrive-Schreiben nutzt keinen If-Match-Konfliktschutz.');
assert(putSource.includes('If-None-Match'), 'Erstes OneDrive-Anlegen ist nicht gegen paralleles Erstellen geschützt.');
const autoSource = extractFunction('uploadOneDriveBackupNow');
const childPos = autoSource.indexOf('lkPullAllChildChangesForCloud');
const cloudReadPos = autoSource.indexOf('getOneDriveBackupRecord');
const commitPos = autoSource.indexOf('commitOneDriveWithConflictRetry');
assert(childPos >= 0 && cloudReadPos > childPos && commitPos > cloudReadPos, 'Auto-Sync-Reihenfolge Kinder → OneDrive lesen → schreiben ist nicht eingehalten.');

// Dynamischer Konflikttest: erster Schreibversuch scheitert mit 412, neuer Cloudstand
// wird eingelesen/gemergt, danach wird mit dem neuen ETag erneut geschrieben.
let state = { version: 'local-1' };
let putCalls = 0;
const etags = [];
const context = {
  console,
  state,
  makeFullBackup: (s) => ({ type: 'full-backup', state: JSON.parse(JSON.stringify(s)) }),
  putOneDriveBackup: async (_backup, eTag) => {
    putCalls += 1;
    etags.push(eTag);
    if (putCalls === 1) {
      const error = new Error('precondition failed');
      error.status = 412;
      throw error;
    }
    return { ok: true };
  },
  getOneDriveBackupRecord: async () => ({ eTag: 'etag-new', backup: { type: 'full-backup', state: { version: 'cloud-new' } } }),
  mergeRemoteBackupIntoState: (local, remote) => ({ state: { ...local, mergedCloud: remote.state.version }, changed: 1, cloudFirst: false }),
  persistWithoutMicrosoftAuto: async (next) => { state = next; context.state = next; }
};
vm.createContext(context);
vm.runInContext(extractFunction('commitOneDriveWithConflictRetry'), context, { filename: 'sync.js:commitOneDriveWithConflictRetry' });

(async () => {
  const result = await context.commitOneDriveWithConflictRetry({ eTag: 'etag-old', backup: { type: 'full-backup', state: {} } }, 3);
  assert(result.conflicts === 1, 'OneDrive-Konflikt wurde nicht gezählt/erneut versucht.');
  assert(putCalls === 2, 'OneDrive-Konflikt führte nicht zu genau einem sicheren Wiederholungsversuch.');
  assert(etags[0] === 'etag-old' && etags[1] === 'etag-new', 'Wiederholungsupload nutzt nicht den neu gelesenen ETag.');
  assert(context.state.mergedCloud === 'cloud-new', 'Parallel geänderter Cloud-Stand wurde vor Wiederholung nicht zusammengeführt.');
  console.log('OneDrive-Konflikt-/Reihenfolgeprüfung erfolgreich.');
})().catch((error) => { console.error(error); process.exit(1); });
