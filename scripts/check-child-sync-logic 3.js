const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'child-sync.js'), 'utf8');
function assert(condition, message) { if (!condition) throw new Error(message); }
function extractFunction(name) {
  const start = source.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`Funktion fehlt: ${name}`);
  const brace = source.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`Funktion nicht vollständig: ${name}`);
}

const context = { console };
vm.createContext(context);
['recordTimestamp', 'childMergeKey', 'mergeWeeklyStatusPages', 'mergeByIdPreferNewest', 'mergeChildSnapshotsForPush']
  .forEach((name) => vm.runInContext(extractFunction(name), context, { filename: `child-sync.js:${name}` }));
context.nowIso = () => '2026-09-20T20:00:00.000Z';

const remote = {
  type: 'lernstand-kompass-child-state', classId: 'c1', animalId: 'a1',
  entries: [{ id: 'e1', classId: 'c1', tierID: 'a1', status: 'offen', updatedAt: '2026-09-20T18:00:00.000Z' }],
  weeklyPlanStatuses: [{
    id: 's-remote', classId: 'c1', planId: 'p1', animalId: 'a1', day: 'Montag', field: 'Mathe:m1',
    status: 'teilweise', pageStatuses: { '4': 'fertig', '5': 'offen' },
    pageUpdatedAt: { '4': '2026-09-20T18:10:00.000Z', '5': '2026-09-20T18:00:00.000Z' },
    updatedAt: '2026-09-20T18:10:00.000Z'
  }],
  workbookAssignmentStatuses: [], childWorkbookReports: [], trainingCompletions: [], learningGameSessions: []
};
const local = {
  type: 'lernstand-kompass-child-state', classId: 'c1', animalId: 'a1',
  entries: [{ id: 'e1', classId: 'c1', tierID: 'a1', status: 'fertig', updatedAt: '2026-09-20T19:00:00.000Z' }],
  weeklyPlanStatuses: [{
    id: 's-local', classId: 'c1', planId: 'p1', animalId: 'a1', day: 'Montag', field: 'Mathe:m1',
    status: 'teilweise', pageStatuses: { '4': 'offen', '5': 'fertig' },
    pageUpdatedAt: { '4': '2026-09-20T17:00:00.000Z', '5': '2026-09-20T19:10:00.000Z' },
    updatedAt: '2026-09-20T19:10:00.000Z'
  }],
  workbookAssignmentStatuses: [], childWorkbookReports: [], trainingCompletions: [], learningGameSessions: []
};
const merged = context.mergeChildSnapshotsForPush(remote, local);
assert(merged.entries.length === 1 && merged.entries[0].status === 'fertig', 'Neuerer Kinder-Lernstand wurde beim Cloudflare-Push nicht erhalten.');
assert(merged.weeklyPlanStatuses.length === 1, 'Gleicher Wochenplanstatus wurde beim Kinder-Sync doppelt angelegt.');
const status = merged.weeklyPlanStatuses[0];
assert(status.pageStatuses['4'] === 'fertig', 'Neuere Remote-Seite S.4 ging beim Kinder-Sync verloren.');
assert(status.pageStatuses['5'] === 'fertig', 'Neuere lokale Seite S.5 ging beim Kinder-Sync verloren.');
assert(status.status === 'fertig', 'Gesamtstatus des Kinder-Syncs wurde nach Seitenmerge nicht neu berechnet.');

// Sicherstellen, dass alle aktuell kinderrelevanten Daten im Snapshot und Mergepfad vorkommen.
[
  'entries', 'weeklyPlanStatuses', 'workbookAssignmentStatuses',
  'childWorkbookReports', 'trainingCompletions', 'learningGameSessions'
].forEach((field) => {
  assert(source.includes(`\"${field}\"`) || source.includes(`${field}:`), `Kinder-Sync-Feld fehlt im Quellcode: ${field}`);
});
assert(source.includes('existingRemoteChildSnapshot(marker)'), 'Kindergerät liest den vorhandenen Cloudflare-Stand vor dem Schreiben nicht ein.');
assert(source.includes('mergeChildSnapshotsForPush(remoteSnapshot, localSnapshot)'), 'Kindergerät führt Remote- und Lokalstand vor dem Schreiben nicht zusammen.');

console.log('Kinder-/Cloudflare-Sync-Prüfung erfolgreich.');
