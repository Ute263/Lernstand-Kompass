const fs = require('fs');
const path = require('path');
const vm = require('vm');
const nodeCrypto = require('crypto');

const root = path.resolve(__dirname, '..');
function assert(condition, message) { if (!condition) throw new Error(message); }
const context = {
  console,
  window: { crypto: nodeCrypto.webcrypto }, crypto: nodeCrypto.webcrypto,
  structuredClone: global.structuredClone, Blob: global.Blob, URL: global.URL,
  TextEncoder, TextDecoder,
  btoa: (v) => Buffer.from(v, 'binary').toString('base64'),
  atob: (v) => Buffer.from(v, 'base64').toString('binary'),
  document: { createElement() { return { style: {}, click() {}, remove() {} }; }, body: { append() {} } }
};
Object.assign(context.window, context);
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'models.js'), 'utf8'), context, { filename: 'models.js' });
vm.runInContext(fs.readFileSync(path.join(root, 'export.js'), 'utf8'), context, { filename: 'export.js' });

const state = context.emptyState();
state.activeClassId = 'c1';
state.classes = [{ id: 'c1', name: '2c' }];
state.animals = [{ id: 'a1', classId: 'c1', tierName: 'Test', qrToken: 'ak-TEST1234', aktiv: true }];
state.entries = [{ id: 'e1', classId: 'c1', tierID: 'a1', status: 'fertig', updatedAt: '2026-09-20T18:00:00Z' }];
state.weeklyPlans = [
  { id: 'p1', classId: 'c1', title: 'Aktiv', validFrom: '2026-09-21', validTo: '2026-09-25', planningMode: 'week', assignmentMode: 'all', days: { Montag: { lesezeitIds: ['l1'], lernwoerterIds: ['lw1'], matheIds: ['m1'], matheTaskNumbers: ['1'] } }, active: true, createdAt: '2026-09-20T10:00:00Z', updatedAt: '2026-09-20T18:00:00Z' },
  { id: 'p-del', classId: 'c1', title: 'Gelöscht', days: {}, active: false, deletedAt: '2026-09-20T17:00:00Z', updatedAt: '2026-09-20T17:00:00Z' }
];
state.weeklyPlanStatuses = [{
  id: 's1', classId: 'c1', planId: 'p1', animalId: 'a1', day: 'Montag', field: 'Mathe:m1',
  status: 'teilweise', pageStatuses: { '4': 'fertig', '5': 'teilweise' },
  pageUpdatedAt: { '4': '2026-09-20T17:00:00Z', '5': '2026-09-20T18:00:00Z' }, updatedAt: '2026-09-20T18:00:00Z'
}];
state.trainingCompletions = [{ id: 't1', classId: 'c1', animalId: 'a1', taskCode: 'T1', status: 'bearbeitet', updatedAt: '2026-09-20T18:00:00Z' }];
state.learningGameSessions = [{ id: 'g1', classId: 'c1', animalId: 'a1', score: 5, finishedAt: '2026-09-20T18:00:00Z' }];

const backup = context.makeFullBackup(context.normalizeState(state));
const restored = context.stateFromBackup(backup);
assert(restored.classes.length === 1 && restored.animals.length === 1, 'Klasse/Kind gingen im Gesamtbackup verloren.');
assert(restored.entries.length === 1, 'Lernstand ging im Gesamtbackup verloren.');
assert(restored.weeklyPlans.length === 2, 'Wochenpläne gingen im Gesamtbackup verloren.');
assert(restored.weeklyPlans.find((p) => p.id === 'p-del')?.active === false, 'Löschstatus eines Wochenplans ging im Backup verloren.');
assert(restored.weeklyPlans.find((p) => p.id === 'p-del')?.deletedAt, 'Löschzeitpunkt eines Wochenplans ging im Backup verloren.');
const plan = restored.weeklyPlans.find((p) => p.id === 'p1');
assert(plan?.planningMode === 'week', 'Planungsmodus ging im Backup verloren.');
assert(plan?.days?.Montag?.lesezeitIds?.[0] === 'l1', 'Lesezeit-Aufgabe ging im Backup verloren.');
assert(plan?.days?.Montag?.lernwoerterIds?.[0] === 'lw1', 'Lernwörter-Aufgabe ging im Backup verloren.');
const status = restored.weeklyPlanStatuses.find((s) => s.id === 's1');
assert(status?.pageStatuses?.['4'] === 'fertig' && status?.pageStatuses?.['5'] === 'teilweise', 'Seitenstatus ging im Backup verloren.');
assert(restored.trainingCompletions.length === 1 && restored.learningGameSessions.length === 1, 'Kinder-/Trainingsdaten gingen im Backup verloren.');
console.log('Gesamtbackup-Roundtrip-Prüfung erfolgreich.');
