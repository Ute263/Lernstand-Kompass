const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const root = path.resolve(__dirname, '..');
const get = f => fs.readFileSync(path.join(root, f), 'utf8');
const context = {
  console,
  crypto: require('crypto').webcrypto,
  window: { crypto: require('crypto').webcrypto },
  document: {
    createElement: () => ({ id: '', textContent: '' }),
    getElementById: () => null,
    head: { appendChild: () => {} }
  },
  renderWeeklyCatalogPicker: () => '',
  selectWeeklyCatalogItem: () => {},
  render: () => {},
  escapeHtml: s => String(s),
  escapeAttribute: s => String(s).replace(/"/g, '&quot;'),
  weeklyInputPrefix: () => 'fake',
  normalizeIdArray: () => [],
  weeklyPickRequest: null,
  weeklyPlanDraft: null
};
vm.createContext(context);
vm.runInContext(get('minimax-katalog-daten.js'), context, {filename:'minimax-katalog-daten.js'});
vm.runInContext(get('models.js'), context, {filename:'models.js'});
vm.runInContext(`var state = {activeClassId:'testclass', classes:[{id:'testclass',name:'Klasse 2c',activeSchoolYear:'2'}], workbookCatalog: createDefaultWorkbookCatalog('testclass'), weeklyPlans:[], weeklyPlanStatuses:[], workbookAssignmentStatuses:[],workbookAssignments:[],entries:[]};`,context);
context.activeClassSchoolYear = () => '2';
context.workbookCatalogForActiveClass = () => context.state.workbookCatalog;
context.materialMatchesSchoolYear = (item,year) => item.schoolYear === year || item.schoolYear === 'cross';
vm.runInContext(get('weekly-minimax-pages.js'),context,{filename:'weekly-minimax-pages.js'});
const renderPicker = () => context.renderWeeklyCatalogPicker();
context.weeklyPickRequest = {subject:'Mathe',day:'Montag',dayIndex:0,scope:'class',animalId:'',filters:{schoolYear:'2',supportMode:false}};
const before = renderPicker();
for(const y of ['1','2','3','4']) assert(before.includes(`<option value="${y}"`),`Jahrgang ${y} Dropdown-Option fehlt`);
assert(before.includes('aria-label="Arbeitsheft auswählen"'), 'Heft-Dropdown fehlt');
assert(before.includes('aria-label="Materialart auswählen"'), 'Materialart-Dropdown fehlt');
for(const y of ['1','2','3','4']){
  context.window.lkSetPickerSchoolYear(y);
  assert.strictEqual(context.weeklyPickRequest.filters.schoolYear,y,`Jahrgang ${y} Auswahl fehlgeschlagen`);
  const html=renderPicker();
  assert(html.includes(`MiniMax ${y}`),`MiniMax ${y} fehlt im sichtbaren Heft-Picker`);
  assert(html.includes('lk-page-button'),`Seiten fuer ${y} fehlen`);
  if(y==='3') assert(html.includes('Größen und Sachrechnen'), 'MiniMax 3 Größen und Sachrechnen fehlt');
  console.log(`Klasse ${y}: MiniMax ${y} sichtbar, Seitenbedienung vorhanden`);
}
// Ein Jahrgang ohne Mathe-Hefte darf niemals Hefte aus einem anderen Jahrgang erben.
context.weeklyPickRequest = {subject:'Deutsch',day:'Montag',dayIndex:0,scope:'class',animalId:'',filters:{schoolYear:'4',supportMode:false}};
const deutsch4 = renderPicker();
assert(!deutsch4.includes('ABC der Tiere 1'), 'Falsche ABC-1-Zuordnung zu Klasse 4');
assert(!deutsch4.includes('ABC der Tiere 2'), 'Falsche ABC-2-Zuordnung zu Klasse 4');
context.weeklyPickRequest = {subject:'Mathe',day:'Montag',dayIndex:0,scope:'class',animalId:'',filters:{schoolYear:'4',supportMode:false}};
context.window.lkSetPickerSupportMode(true);
assert.strictEqual(context.weeklyPickRequest.filters.supportMode,true);
assert(renderPicker().includes('Förderhefte werden hier schuljahrübergreifend angezeigt.'),'Förderhefte-Umschaltung fehlt');
console.log('Jahrgangs-Picker erfolgreich: 1 bis 4 und Förderheftumschaltung.');
