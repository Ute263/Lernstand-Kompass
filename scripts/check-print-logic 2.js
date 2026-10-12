const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
function assert(condition, message) { if (!condition) throw new Error(message); }
const styleNodes = new Map();
const document = {
  createElement(tag) {
    return {
      tagName: String(tag).toUpperCase(), id: '', style: {}, dataset: {}, textContent: '',
      append() {}, appendChild() {}, remove() {}, setAttribute() {},
      classList: { add() {}, remove() {}, toggle() {} }
    };
  },
  getElementById(id) { return styleNodes.get(id) || null; },
  head: { appendChild(node) { if (node?.id) styleNodes.set(node.id, node); } },
  body: { append() {}, classList: { add() {}, remove() {}, toggle() {} } },
  querySelector() { return null; },
  querySelectorAll() { return []; },
  addEventListener() {}
};

const itemsByDay = {
  Montag: [
    { subject: 'Deutsch', isFreeTask: true, isWorksheetTask: true, freeText: '1b', socialForm: 'partner' },
    { subject: 'Deutsch', isFreeTask: true, freeText: '2b' },
    { subject: 'Deutsch', isFreeTask: true, freeText: '3b', socialForm: 'individual' },
    { subject: 'Deutsch', catalogItem: { workbook: 'ABC der Tiere 2', subject: 'Deutsch', page: 8 }, taskNumber: '1', socialForm: '' },
    { subject: 'Deutsch', catalogItem: { workbook: 'ABC der Tiere 2', subject: 'Deutsch', page: 9 }, taskNumber: '2', socialForm: 'group' },
    { subject: 'Mathe', catalogItem: { workbook: 'MiniMax 2', subject: 'Mathe', page: 4 }, taskNumber: '1' },
    { subject: 'Mathe', catalogItem: { workbook: 'MiniMax 2', subject: 'Mathe', page: 5 }, taskNumber: '2' },
    { subject: 'Extra', isFreeTask: true, freeText: 'Lerne das Gedicht von Seite 16 vollständig auswendig und trage es anschließend vor.' }
  ]
};

const context = {
  console,
  window: { LKWeeklyPlan9e: { RICO_WORKBOOK: '', RICO_ROWS: [] } },
  document,
  setTimeout: () => 0,
  clearTimeout: () => {},
  WEEK_DAYS: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'],
  state: { animals: [], weeklyPlans: [] },
  renderWeeklyPrintDialog: () => '',
  startWeeklyPlanPrint: () => {},
  renderPrintWeeklyPlan: () => '',
  renderAnimalMapping: () => '',
  weeklyPlanItemsForDay: (_plan, day) => (itemsByDay[day] || []).map((item, i) => ({ ...item, field: `${item.subject}:${i}` })),
  animalsForActiveClass: () => [],
  escapeAttribute: (value) => String(value ?? '').replaceAll('"', '&quot;'),
  escapeHtml: (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;'),
  formatGermanDate: (value) => String(value || ''),
  pageRangeLabel: (catalog) => catalog?.page ? `S. ${catalog.page}` : '',
  renderWorkbookCoverImage: (catalog, className = '') => `<img class="${className}" data-workbook="${catalog?.workbook || ''}" alt="Buchcover">`,
  weeklySocialFormIconHtml: (value, className = '') => `<span class="${className}" data-social="${value}"></span>`,
  persist: async () => {},
  makeId: () => 'id',
  nowIso: () => '2026-09-20T12:00:00.000Z',
  currentWeeklyPrintPlan: null,
  currentWeeklyPrintOptions: null,
  currentPrintType: '', printReturnTab: '', screen: '', weeklyPrintDialogOpen: false,
  weeklyPrintDraft: null, weeklyPrintPlanId: '',
  closeWeeklyPrintDialog: () => {}, render: () => {},
  confirm: () => true,
  window_print: () => {}
};
context.window.window = context.window;
context.window.weeklySocialFormIconHtml = context.weeklySocialFormIconHtml;
context.window.lkFitWeeklyPrintPages = null;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'weekly-plan-9f.js'), 'utf8'), context, { filename: 'weekly-plan-9f.js' });

const plan = { id: 'p1', classId: 'c1', title: 'Plan', planningMode: 'week', validFrom: '2026-09-21', validTo: '2026-09-25', days: {} };
context.currentWeeklyPrintPlan = plan;
context.currentWeeklyPrintOptions = { layout: 'week', showExtra: true, footerNotes: {} };
let html = context.renderPrintWeeklyPlan('2c');
assert(html.includes('Deutsch') && html.includes('Mathe'), 'Wochenplan-Druck enthält nicht beide Fächer.');
assert((html.match(/alt="Arbeitsblatt"/g) || []).length === 1, 'Arbeitsblatt-Symbol wird im Wochenblock nicht genau einmal ausgegeben.');
assert(html.includes('>1b<') && html.includes('>2b<') && html.includes('>3b<'), 'Arbeitsblatt-Aufgaben fehlen im Wochenplan-Druck.');
assert((html.match(/data-workbook="ABC der Tiere 2"/g) || []).length === 1, 'Buchcover wird für denselben Aufgabenblock mehrfach ausgegeben.');
assert((html.match(/data-workbook="MiniMax 2"/g) || []).length === 1, 'Mathe-Buchcover wird für denselben Aufgabenblock mehrfach ausgegeben.');
assert(html.includes('data-social="partner"') && html.includes('data-social="individual"') && html.includes('data-social="group"'), 'Sozialform-Symbole fehlen an Einzelaufgaben.');

context.currentWeeklyPrintOptions = { layout: 'day', showExtra: true, footerNotes: {} };
html = context.renderPrintWeeklyPlan('2c');
assert(html.includes('lk-dayplan-wrap') && html.includes('lk-dayplan-day'), 'Tagesplan nutzt nicht die kompakte Tagesblock-Struktur.');
assert(!html.includes('rowspan='), 'Tagesplan verwendet noch rowspan und kann dadurch Tageshoehen verzerren.');
assert((html.match(/alt="Arbeitsblatt"/g) || []).length === 1, 'Arbeitsblatt-Symbol wird im Tagesplan nicht genau einmal pro Block ausgegeben.');
assert(html.includes('Mathe'), 'Mathe fehlt im Tagesplan-Druck.');
assert(html.includes('>1b<') && html.includes('>2b<') && html.includes('>3b<'), 'Aufgaben fehlen im Tagesplan-Druck.');
assert(html.includes('padding-left:12.5mm') && html.includes('width:12.5mm'), 'Tagesplan nutzt nicht die feste Materialspalte.');
assert(html.includes('height:8mm !important') && html.includes('text-xlong'), 'Tagesplan nutzt keine adaptiven Aufgabenzeilen.');
assert(html.includes('white-space:normal') && html.includes('overflow-wrap:anywhere'), 'Lange Tagesplantexte koennen noch abgeschnitten werden.');
assert(html.includes('font-size:9.4pt') && html.includes('height:10.2mm !important'), 'Sehr lange Tagesplantexte werden nicht ausreichend verkleinert/erhoeht.');
assert(html.includes('width:7.8mm') && html.includes('height:9.2mm'), 'Materialbilder im Tagesplan sind noch zu gross.');
assert(!html.includes('lk-wp-day-table'), 'Alte Tagesplan-Tabelle ist noch aktiv.');
assert(html.includes('.lk-dayplan-day {\n          position:relative') && html.includes('.lk-dayplan-dayname {\n          position:absolute'), 'Tagesname kann die Tageshoehe noch beeinflussen.');
assert(html.includes('.lk-dayplan-material {\n          position:absolute'), 'Materialbild kann die Blockhoehe noch beeinflussen.');

console.log('Drucklogik-Prüfung erfolgreich.');
