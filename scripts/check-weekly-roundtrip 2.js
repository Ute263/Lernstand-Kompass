const fs = require('fs');
const path = require('path');
const vm = require('vm');
const nodeCrypto = require('crypto');

const root = path.resolve(__dirname, '..');
const noop = () => '';
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
const document = {
  createElement() { return { style: {}, append() {}, appendChild() {}, setAttribute() {}, classList: { add() {}, remove() {}, toggle() {} } }; },
  head: { append() {}, appendChild() {} },
  body: { append() {}, classList: { add() {}, remove() {}, toggle() {} } },
  querySelector() { return null; },
  getElementById() { return null; },
  addEventListener() {}
};
const window = { crypto: nodeCrypto.webcrypto };
const context = {
  console, window, document, crypto: nodeCrypto.webcrypto,
  Blob: global.Blob, URL: global.URL, TextEncoder, TextDecoder,
  structuredClone: global.structuredClone,
  btoa: (value) => Buffer.from(value, 'binary').toString('base64'),
  atob: (value) => Buffer.from(value, 'base64').toString('binary'),
  renderWeeklyPlannerTable: noop,
  renderWeeklyPickCell: noop,
  readWeeklyDaysFromDom: noop,
  setWeeklyDraftValue: noop,
  weeklyPlanItemsForDay: () => [],
  renderWorkbookCatalogManager: noop,
  escapeAttribute: (value) => String(value ?? ''),
  escapeHtml: (value) => String(value ?? ''),
  normalizeIdArray: (value) => Array.isArray(value)
    ? value.filter(Boolean).map(String)
    : typeof value === 'string'
      ? value.split(',').map((item) => item.trim()).filter(Boolean)
      : value ? [String(value)] : []
};
Object.assign(window, context);
vm.createContext(context);
['models.js', 'weekly-extra-tasks.js', 'weekly-plan-9e.js'].forEach((file) => {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
});

const plan = {
  id: 'p1', classId: 'c1', title: 'Testplan', planningMode: 'week',
  deutschSectionOrder: ['Lernwörter', 'Deutsch', 'Lesezeit'],
  assignmentMode: 'selected', animalIds: ['a1'],
  days: {
    Montag: {
      deutschIds: ['d1', 'd1'], deutschTaskNumbers: ['1', '2'], deutschTaskStars: [false, true], deutschTaskSocialForms: ['partner', ''],
      lesezeitIds: ['l1'], lesezeitTaskNumbers: ['3'], lesezeitTaskStars: [false], lesezeitTaskSocialForms: ['individual'],
      lernwoerterIds: ['lw1'], lernwoerterTaskNumbers: ['4'], lernwoerterTaskStars: [true], lernwoerterTaskSocialForms: ['group'],
      matheIds: ['m1'], matheTaskNumbers: ['5'], matheTaskStars: [true], matheTaskSocialForms: ['group'],
      deutschFreeTasks: [{ id: 'fd', text: 'AB Deutsch', isWorksheet: true, socialForm: 'individual' }],
      matheFreeTasks: [{ id: 'fm', text: 'Mikro Mathe', isMicrophone: true, socialForm: 'partner' }],
      extraFreeTasks: [{ id: 'fx', text: 'Zusatz', starred: true }]
    }
  },
  overrides: {
    a1: { days: { Montag: {
      matheIds: ['m2'], matheTaskNumbers: ['6'], matheTaskStars: [false], matheTaskSocialForms: ['partner'],
      matheFreeTasks: [{ id: 'ofm', text: 'AB individuell', isWorksheet: true }]
    } } }
  },
  createdAt: '2026-09-20T08:00:00.000Z', updatedAt: '2026-09-20T12:00:00.000Z'
};
const status = {
  id: 's1', classId: 'c1', planId: 'p1', animalId: 'a1', day: 'Montag', field: 'Mathe:m1',
  status: 'teilweise', pageStatuses: { '4': 'fertig', '5': 'teilweise', '6': 'offen' },
  pageUpdatedAt: { '4': '2026-09-20T09:00:00.000Z', '5': '2026-09-20T10:00:00.000Z', '6': '2026-09-20T11:00:00.000Z' },
  updatedAt: '2026-09-20T11:00:00.000Z'
};
const state = context.emptyState();
state.activeClassId = 'c1';
state.classes = [{ id: 'c1', name: '2c' }];
state.animals = [{ id: 'a1', classId: 'c1', tierName: 'Test', qrToken: 'ak-TEST1234' }];
state.weeklyPlans = [plan];
state.weeklyPlanStatuses = [status];

const normalized = context.normalizeState(state);
const roundtrip = normalized.weeklyPlans.find((item) => item.id === 'p1');
assert(roundtrip, 'Wochenplan ging bei normalizeState verloren.');
assert(roundtrip.planningMode === 'week', 'Planungsart ging beim Speichern verloren.');
assert(JSON.stringify(roundtrip.deutschSectionOrder) === JSON.stringify(['Lernwörter', 'Deutsch', 'Lesezeit']), 'Deutsch-Reihenfolge ging verloren.');
assert(roundtrip.days.Montag.lesezeitIds?.[0] === 'l1', 'Lesezeit-Aufgabe ging beim Speichern verloren.');
assert(roundtrip.days.Montag.lernwoerterIds?.[0] === 'lw1', 'Lernwörter-Aufgabe ging beim Speichern verloren.');
assert(roundtrip.days.Montag.deutschTaskStars?.[1] === true, 'Pflicht/Zusatz-Status ging verloren.');
assert(roundtrip.days.Montag.matheTaskSocialForms?.[0] === 'group', 'Sozialform ging verloren.');
assert(roundtrip.days.Montag.deutschFreeTasks?.[0]?.isWorksheet === true, 'Arbeitsblatt-Markierung ging verloren.');
assert(roundtrip.days.Montag.matheFreeTasks?.[0]?.isMicrophone === true, 'Mikrofon-Markierung ging verloren.');
assert(roundtrip.overrides?.a1?.days?.Montag?.matheIds?.[0] === 'm2', 'Individueller Kinderplan ging verloren.');
assert(roundtrip.overrides?.a1?.days?.Montag?.matheTaskSocialForms?.[0] === 'partner', 'Sozialform im individuellen Kinderplan ging verloren.');

const roundStatus = normalized.weeklyPlanStatuses.find((item) => item.id === 's1');
assert(roundStatus?.pageStatuses?.['4'] === 'fertig', 'Seitenstatus S.4 ging bei normalizeState verloren.');
assert(roundStatus?.pageStatuses?.['5'] === 'teilweise', 'Seitenstatus S.5 ging bei normalizeState verloren.');
assert(roundStatus?.pageUpdatedAt?.['6'] === '2026-09-20T11:00:00.000Z', 'Seiten-Zeitstempel ging bei normalizeState verloren.');

console.log('Wochenplan-Roundtrip-Prüfung erfolgreich.');
