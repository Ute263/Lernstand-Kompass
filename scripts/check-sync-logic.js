const fs = require('fs');
const path = require('path');
const vm = require('vm');
const nodeCrypto = require('crypto');

const root = path.resolve(__dirname, '..');
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const context = {
  console,
  window: { crypto: nodeCrypto.webcrypto },
  crypto: nodeCrypto.webcrypto,
  Blob: global.Blob,
  URL: global.URL,
  TextEncoder,
  TextDecoder,
  structuredClone: global.structuredClone,
  btoa: (value) => Buffer.from(value, 'binary').toString('base64'),
  atob: (value) => Buffer.from(value, 'base64').toString('binary'),
  document: {
    createElement() { return { style: {}, append() {}, click() {}, remove() {} }; },
    body: { append() {} }
  }
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'models.js'), 'utf8'), context, { filename: 'models.js' });
vm.runInContext(fs.readFileSync(path.join(root, 'export.js'), 'utf8'), context, { filename: 'export.js' });

assert(typeof context.mergeWeeklyPlanStatusRecord === 'function', 'Status-Merge ist nicht verfügbar.');
assert(typeof context.mergeBackupData === 'function', 'Backup-Merge ist nicht verfügbar.');
assert(typeof context.emptyState === 'function', 'Leerer Zustand ist nicht verfügbar.');

// Zwei Geräte bearbeiten verschiedene Seiten derselben Wochenplanaufgabe.
const localStatus = {
  id: 'status-local', classId: 'c1', planId: 'p1', animalId: 'a1', day: 'Montag', field: 'Mathe:heft1',
  status: 'teilweise', pageStatuses: { '4': 'fertig', '5': 'offen' },
  pageUpdatedAt: { '4': '2026-09-20T10:00:00.000Z', '5': '2026-09-20T09:00:00.000Z' },
  updatedAt: '2026-09-20T10:00:00.000Z'
};
const cloudStatus = {
  id: 'status-cloud', classId: 'c1', planId: 'p1', animalId: 'a1', day: 'Montag', field: 'Mathe:heft1',
  status: 'teilweise', pageStatuses: { '4': 'offen', '5': 'fertig' },
  pageUpdatedAt: { '4': '2026-09-20T08:00:00.000Z', '5': '2026-09-20T11:00:00.000Z' },
  updatedAt: '2026-09-20T11:00:00.000Z'
};
const statusMerged = context.mergeWeeklyPlanStatusRecord(localStatus, cloudStatus);
assert(statusMerged.pageStatuses['4'] === 'fertig', 'Lokaler neuerer Seitenstatus S.4 ging beim Merge verloren.');
assert(statusMerged.pageStatuses['5'] === 'fertig', 'Cloud-neuerer Seitenstatus S.5 ging beim Merge verloren.');
assert(statusMerged.status === 'fertig', 'Gesamtstatus wurde nach Seiten-Merge nicht korrekt berechnet.');

const local = context.emptyState();
local.classes = [{ id: 'c1', name: '2c', updatedAt: '2026-09-20T08:00:00.000Z' }];
local.activeClassId = 'c1';
local.animals = [{ id: 'a1', classId: 'c1', tierName: 'Test', qrToken: 'ak-TEST1234', updatedAt: '2026-09-20T08:00:00.000Z' }];
local.entries = [{ id: 'e1', classId: 'c1', tierID: 'a1', status: 'offen', updatedAt: '2026-09-20T09:00:00.000Z' }];
local.weeklyPlans = [{ id: 'p1', classId: 'c1', title: 'Alt', days: {}, updatedAt: '2026-09-20T09:00:00.000Z' }];
local.weeklyPlanStatuses = [localStatus];
local.workbookCatalog = [{ id: 'w1', classId: 'c1', workbook: 'Heft', startPage: 4, updatedAt: '2026-09-20T09:00:00.000Z' }];
local.learningGameSessions = [{ id: 'g1', classId: 'c1', animalId: 'a1', score: 1, finishedAt: '2026-09-20T09:00:00.000Z' }];

const remote = context.emptyState();
remote.classes = local.classes;
remote.activeClassId = 'c1';
remote.animals = local.animals;
remote.entries = [{ id: 'e1', classId: 'c1', tierID: 'a1', status: 'fertig', updatedAt: '2026-09-20T12:00:00.000Z' }];
remote.weeklyPlans = [{ id: 'p1', classId: 'c1', title: 'Neu', days: { Montag: { matheIds: ['w1'] } }, updatedAt: '2026-09-20T12:00:00.000Z' }];
remote.weeklyPlanStatuses = [cloudStatus];
remote.workbookCatalog = [{ id: 'w1', classId: 'c1', workbook: 'Heft', startPage: 5, updatedAt: '2026-09-20T12:00:00.000Z' }];
remote.learningGameSessions = [{ id: 'g1', classId: 'c1', animalId: 'a1', score: 5, finishedAt: '2026-09-20T12:00:00.000Z' }];

const merged = context.mergeBackupData(local, { app: 'Lernstand-Kompass', type: 'full-backup', version: 4, state: remote }).state;
assert(merged.entries.find((item) => item.id === 'e1')?.status === 'fertig', 'Neuerer Lernstandseintrag wurde nicht übernommen.');
assert(merged.weeklyPlans.find((item) => item.id === 'p1')?.title === 'Neu', 'Neuerer Wochenplan wurde nicht übernommen.');
assert(merged.workbookCatalog.find((item) => item.id === 'w1')?.startPage === 5, 'Neuere Heft-/Materialdaten wurden nicht übernommen.');
assert(merged.learningGameSessions.find((item) => item.id === 'g1')?.score === 5, 'Neuere Lernspielsitzung wurde nicht übernommen.');
const mergedStatus = merged.weeklyPlanStatuses.find((item) => item.planId === 'p1' && item.animalId === 'a1');
assert(mergedStatus?.pageStatuses?.['4'] === 'fertig' && mergedStatus?.pageStatuses?.['5'] === 'fertig', 'Seitenstände gingen im vollständigen Backup-Merge verloren.');

console.log('Sync-/Merge-Prüfung erfolgreich.');

// Gelöschte Wochenpläne dürfen nicht durch einen älteren OneDrive-Stand wieder auftauchen.
const deletedLocal = context.emptyState();
deletedLocal.classes = [{ id: 'c1', name: '2c' }];
deletedLocal.activeClassId = 'c1';
deletedLocal.weeklyPlans = [{
  id: 'p-del', classId: 'c1', title: 'Gelöscht', active: false,
  deletedAt: '2026-09-20T13:00:00.000Z', updatedAt: '2026-09-20T13:00:00.000Z', days: {}
}];
const staleCloud = context.emptyState();
staleCloud.classes = deletedLocal.classes;
staleCloud.activeClassId = 'c1';
staleCloud.weeklyPlans = [{
  id: 'p-del', classId: 'c1', title: 'Alter Cloud-Plan', active: true,
  updatedAt: '2026-09-20T12:00:00.000Z', days: {}
}];
const deletionMerged = context.mergeBackupData(deletedLocal, {
  app: 'Lernstand-Kompass', type: 'full-backup', version: 4, state: staleCloud
}).state;
const deletedPlan = deletionMerged.weeklyPlans.find((item) => item.id === 'p-del');
assert(deletedPlan?.active === false, 'Gelöschter Wochenplan wurde durch einen älteren Cloud-Stand wieder aktiviert.');
assert(Boolean(deletedPlan?.deletedAt), 'Löschzeitpunkt des Wochenplans ging beim Merge verloren.');

console.log('Lösch-Synchronisierung für Wochenpläne erfolgreich.');
