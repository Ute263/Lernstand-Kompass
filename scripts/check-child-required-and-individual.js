const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const child = fs.readFileSync(path.join(__dirname, '..', 'weekly-plan-9e.js'), 'utf8');
function part(start, end) {
  const from=app.indexOf(start),to=app.indexOf(end,from);
  assert(from>=0 && to>from,'Funktion nicht gefunden: '+start);
  return app.slice(from,to);
}
const one={id:'c1',classId:'class',tierName:'Igel'};
const mandatory={field:'Deutsch:book-page13',workbookCatalogId:'book-page13',catalogItem:{id:'book-page13',subject:'Deutsch',page:13}};
const extra={field:'FreieAufgabe:Deutsch:star1',freeText:'Sternchen',catalogItem:null};
const classPlan={id:'p-class',classId:'class',assignmentMode:'all',animalIds:[],active:true,progressMode:'auto',validFrom:'2026-11-02',validTo:'2026-11-06'};
const individual={id:'p-ind',classId:'class',assignmentMode:'selected',animalIds:['c1'],active:true,progressMode:'confirm',validFrom:'2026-11-02',validTo:'2026-11-06'};
const state={activeClassId:'class',weeklyPlans:[classPlan,individual],weeklyPlanStatuses:[],entries:[]};
let renders=0, failLink=false;
const ctx={console,state,childDraft:{animalId:'c1'},WEEKLY_PLAN_STATUSES:['offen','teilweise','fertig'],
  selectedAnimal:()=>one,weeklyPlanAppliesToAnimal:(p,id)=>p.assignmentMode==='all'||p.animalIds.includes(id),
  weeklyPlanItemsForDay:(p,d,a)=>p.id==='p-class'?[mandatory,extra]:[mandatory],
  normalizeSimpleWorkStatus:(x)=>x, nowIso:(()=>{let t=0;return()=>new Date(1794045600000+(++t*1000)).toISOString()})(),
  weeklyCatalogPages:(c)=>[c.page],weeklyPlanStatusStableId:(...parts)=>parts.join(':'),
  weeklyPlanProgressMode:(p)=>p.progressMode,
  render:()=>{renders++},
  async persist(next){this.state=next;ctx.state=next; return next;},
  linkWeeklyStatusToProgress:(current,id)=>{ if(failLink) throw Error('Übernahme fehlgeschlagen'); return {...current,weeklyPlanStatuses:current.weeklyPlanStatuses.map(x=>x.id===id?{...x,progressLinked:true}:x)}; },
  removeWeeklyProgressLink:(current,id)=>({...current,weeklyPlanStatuses:current.weeklyPlanStatuses.map(x=>x.id===id?{...x,progressLinked:false}:x)}),
  globalMessage:'',escapeAttribute:x=>x,escapeHtml:x=>x,weeklyPlanPeriodLabel:()=> 'Woche',
  weeklyPlanIsCurrent:()=>true,weeklyPlanAudiencePriority:(p)=>p.assignmentMode==='selected'?2:1,
  WEEK_DAYS:['Montag','Dienstag','Mittwoch','Donnerstag','Freitag']
};
vm.createContext(ctx);
vm.runInContext(part('function weeklyPlanStatusRecord(', '\nfunction weeklyStatusBadge('),ctx);
vm.runInContext(part('async function updateChildWeeklyStatus(', '\nasync function updateChildWorkbookAssignmentStatus('),ctx);
(async()=>{
  failLink=true;
  await ctx.updateChildWeeklyStatus('p-class','Montag','Deutsch:book-page13','fertig');
  assert.equal(ctx.state.weeklyPlanStatuses[0].status,'fertig','Pflichtaufgabe wird bei Übernahmefehler nicht fertig');
  assert.equal(ctx.state.weeklyPlanStatuses[0].markedByChild,true,'Kinderkennung verloren');
  assert(renders>0,'Kinderansicht wurde nicht aktualisiert');
  failLink=false;
  await ctx.updateChildWeeklyStatus('p-class','Montag','Deutsch:book-page13','offen');
  assert.equal(ctx.state.weeklyPlanStatuses[0].status,'offen','Pflichtaufgabe kann nicht zurückgesetzt werden');
  await ctx.updateChildWeeklyStatus('p-class','Montag','FreieAufgabe:Deutsch:star1','fertig');
  assert.equal(ctx.state.weeklyPlanStatuses.find(x=>x.field.includes('star1')).status,'fertig','Sternchen funktioniert nicht mehr');
  await ctx.updateChildWeeklyStatus('p-ind','Montag','Deutsch:book-page13','fertig');
  assert.equal(ctx.state.weeklyPlanStatuses.find(x=>x.planId==='p-ind').status,'fertig','Individuelle Aufgabe nicht gespeichert');
  assert.equal(ctx.state.weeklyPlanStatuses.length,3,'Status darf andere Aufgaben nicht löschen');
  assert(child.includes('samePeriod.map((plan)'), 'Kinderansicht zeigt nur einen Plan');
  assert(child.includes('weeklyPlanAudiencePriority(b, animal.id)'), 'Individueller Plan wird nicht bevorzugt');
  assert(child.includes('renderChildWeeklyPlan(plan, animal)'), 'Plan kann nicht abgehakt werden');
  console.log('Kinder-Funktionstest bestanden: Pflichtaufgabe und Sternchen, Rücksetzen, Übernahmefehler, individueller Plan und Klassenplan.');
})().catch(e=>{console.error(e);process.exitCode=1});
