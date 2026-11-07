const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const path = require('path');
const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'),'utf8');
const extract = (from, to) => app.slice(app.indexOf(from),app.indexOf(to,app.indexOf(from)));
const context = {
  nowIso: ()=>'2026-11-07T10:00:00.000Z',
  normalizeSimpleWorkStatus: x=>x,
  makeId: ()=>'generated',
  weeklyCatalogPages: c=>[c.page, c.pageEnd].filter((v,i,a)=>a.indexOf(v)===i),
  weeklyPlanPeriodLabel: ()=>'Woche',
  console
};
vm.createContext(context);
vm.runInContext(extract('function removeWeeklyProgressLink(', '\nfunction activeClass()'),context);
const status={id:'w1',status:'offen',progressLinked:true,progressEntryId:'e1'};
const onlyWeek={entries:[{id:'e1',source:'Wochenplan',status:'fertig'}],weeklyPlanStatuses:[status]};
const removed=context.removeWeeklyProgressLink(onlyWeek,'w1');
assert.equal(removed.entries.length,0,'Wochenplan-Fortschritt bleibt als Duplikat erhalten');
assert.equal(removed.weeklyPlanStatuses[0].progressLinked,false);
const mixed={entries:[{id:'e1',source:'Direkteingabe + Wochenplan',weeklyPlanId:'p1'}],weeklyPlanStatuses:[status]};
const kept=context.removeWeeklyProgressLink(mixed,'w1');
assert.equal(kept.entries.length,1,'Unabhängiger Fortschritt wurde gelöscht');
assert.equal(kept.entries[0].source,'Direkteingabe');
vm.runInContext(extract('function findWorkbookProgressDuplicate(', '\nfunction openProgressDetail('),context);
const catalog={id:'c1',subject:'Mathe',workbook:'MiniMax',part:'A',page:10,pageEnd:11};
const animal={id:'a1',tierName:'Igel',tierEmoji:'x'};
const week={id:'p1'};
let state={entries:[],weeklyPlanStatuses:[]};
state=context.upsertWorkbookProgressEntry(state,{classId:'class',animal,catalog,status:'fertig',source:'Wochenplan',weeklyPlan:week,weeklyStatus:{day:'Montag',field:'a'},completedPages:['10','11']});
assert.equal(state.entries.length,1);
assert.equal(state.entries[0].completedPages.length,2);
state=context.upsertWorkbookProgressEntry(state,{classId:'class',animal,catalog,status:'teilweise',source:'Wochenplan',weeklyPlan:week,weeklyStatus:{day:'Montag',field:'a'},completedPages:['10']});
assert.deepEqual([...state.entries[0].completedPages],['10'],'Zurückgesetzte Seite blieb fälschlich erledigt');
assert.equal(state.entries[0].pageStatuses['11'],'offen');
assert(app.includes('const workbook = String(catalog?.workbook || row?.workbookLabel'), 'Heftschlüssel stimmen nicht überein');

// Simuliert ein iPad: IndexedDB-Schreibfehler und ein volles localStorage.
const storageSource=fs.readFileSync(path.join(root,'storage.js'),'utf8');
const storeListeners={};
const storageContext={
  window:{ indexedDB:{}, addEventListener:(event,handler)=>{storeListeners[event]=handler;} },
  document:{addEventListener:()=>{}},
  localStorage:{setItem:()=>{throw new Error('QuotaExceededError');}},
  nowIso:()=>'2026-11-07T10:00:00Z',
  normalizeState:(s)=>s,
  DATA_VERSION:1,
  STORE_KEY:'state',
  LEGACY_STORE_KEYS:[],
  console,setTimeout,clearTimeout
};
vm.createContext(storageContext);
vm.runInContext(storageSource+'\nthis.AppStorage=AppStorage;',storageContext);
(async()=>{
  const storage=new storageContext.AppStorage();
  storage.openDB=async()=>({});
  storage.writeRecord=async()=>{throw new Error('IndexedDB unavailable');};
  await assert.rejects(storage.save({hello:'world'}),/Weder IndexedDB noch localStorage/);
  assert.equal(storage.usesIndexedDB,true,'IndexedDB wurde nach Speicherversagen dauerhaft deaktiviert');
  console.log('iPad-/Status-Regressionstest bestanden: Fortschritt zurücknehmen, unabhängige Daten schützen, Seitenstatus ersetzen und vollen Gerätespeicher melden.');
})().catch(error=>{console.error(error);process.exitCode=1;});
