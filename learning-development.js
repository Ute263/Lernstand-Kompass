/* Lernentwicklung v8: individuelle Kindersicht über Wochenplan, Deutsch, Mathematik und LZK */
(() => {
  if (typeof TEACHER_GROUPS === 'undefined' || typeof renderTeacherSection !== 'function') return;

  const learningIndex = TEACHER_GROUPS.findIndex(g => g.id === 'learning');
  if (!TEACHER_GROUPS.some(g => g.id === 'learningDevelopmentGroup')) {
    TEACHER_GROUPS.splice(Math.max(0, learningIndex + 1), 0, {
      id: 'learningDevelopmentGroup',
      label: 'Lernentwicklung',
      sections: [['learningDevelopment', 'Lernentwicklung']]
    });
  }

  let selectedChildId = '';
  let periodMode = 'current';

  const MM_TITLES = {1:'Zahlen bis 100',2:'Vom Zahlenstrahl zum Rechenstrich',3:'Addition und Subtraktion üben',4:'Addition mit Zehnerübergang',5:'Subtraktion mit Zehnerübergang',6:'Addition und Subtraktion üben',7:'Sachrechnen',8:'Multiplikation mit 2, 5 und 10',9:'Multiplikation',10:'Multiplikation üben',11:'Division',12:'Multiplikation und Division üben',13:'Addition mit Zehnerübergang',14:'Subtraktion mit Zehnerübergang',15:'Addition und Subtraktion üben',16:'Division mit Rest',17:'Längen',18:'Geld',19:'Sachaufgaben lösen',20:'Zeit',21:'Körper',22:'Flächen',23:'Figuren und Muster',24:'Spiegeln'};

  function esc(v){ return typeof escapeHtml === 'function' ? escapeHtml(String(v ?? '')) : String(v ?? ''); }
  function attr(v){ return typeof escapeAttribute === 'function' ? escapeAttribute(String(v ?? '')) : esc(v); }
  function kids(){ return (typeof animalsForActiveClass === 'function' ? animalsForActiveClass() : (state.animals||[]).filter(a=>a.classId===state.activeClassId)).filter(a=>a.aktiv !== false); }
  function childName(a){ if(!a) return 'Kind'; return state.teacherShowFirstNames && a.firstName ? `${a.tierEmoji||''} ${a.firstName}`.trim() : `${a.tierEmoji||''} ${a.tierName||a.firstName||'Kind'}`.trim(); }

  function weeklySummary(animalId){
    const plans = typeof weeklyPlansForAnimal === 'function' ? weeklyPlansForAnimal(animalId) : [];
    const plan = typeof selectRelevantWeeklyPlan === 'function' ? selectRelevantWeeklyPlan(plans, undefined, animalId) : plans[0];
    if(!plan) return {empty:true};
    const rows=[];
    (typeof WEEK_DAYS !== 'undefined' ? WEEK_DAYS : ['Montag','Dienstag','Mittwoch','Donnerstag','Freitag']).forEach(day=>{
      const items = typeof weeklyPlanItemsForDay === 'function' ? weeklyPlanItemsForDay(plan,day,animalId) : [];
      items.forEach(item=>{
        const rec = typeof weeklyPlanStatusRecord === 'function' ? weeklyPlanStatusRecord(plan.id,animalId,day,item.field) : null;
        rows.push({day,item,status: typeof normalizeSimpleWorkStatus==='function' ? normalizeSimpleWorkStatus(rec?.status||'offen') : (rec?.status||'offen')});
      });
    });
    const c={fertig:0,teilweise:0,offen:0}; rows.forEach(r=>{ if(r.status==='fertig')c.fertig++; else if(r.status==='teilweise')c.teilweise++; else c.offen++; });
    const total=rows.length; const pct=total?Math.round((c.fertig + c.teilweise*.5)/total*100):0;
    return {plan,rows,c,total,pct};
  }

  function minimaxSummary(animalId){
    const points = state.minimaxTestPoints || {};
    const classId = state.activeClassId || 'none';
    const tests=[];
    for(let t=1;t<=24;t++){
      const prefix=`${classId}:${t}:`; const vals=[];
      Object.entries(points).forEach(([k,v])=>{ if(k.startsWith(prefix) && k.endsWith(`:${animalId}`) && v!=='' && v!=null) vals.push(Number(v)); });
      if(vals.length) tests.push({id:t,title:MM_TITLES[t],filled:vals.length,earned:vals.reduce((a,b)=>a+b,0)});
    }
    return tests;
  }

  function assessmentSummary(animalId){
    const assessments = typeof assessmentsForActiveClass==='function' ? assessmentsForActiveClass() : (state.assessments||[]).filter(a=>a.classId===state.activeClassId);
    return assessments.map(a=>({assessment:a,result: typeof assessmentResultFor==='function' ? assessmentResultFor(a.id,animalId) : (state.assessmentResults||[]).find(r=>r.assessmentId===a.id&&r.animalId===animalId)})).filter(x=>x.result).sort((a,b)=>String(b.assessment.datum||'').localeCompare(String(a.assessment.datum||'')));
  }

  function abcSummary(animalId){
    const entries=(state.entries||[]).filter(e=>e.classId===state.activeClassId && (e.tierID||e.animalId||e.tierId)===animalId && /ABC der Tiere/i.test(String(e.materialName||e.workbook||'')));
    entries.sort((a,b)=>String(b.updatedAt||b.datumUhrzeit||b.createdAt||'').localeCompare(String(a.updatedAt||a.datumUhrzeit||a.createdAt||'')));
    return entries.slice(0,5);
  }

  function metric(label,value,sub=''){
    return `<div class="lk-dev-metric"><span>${esc(label)}</span><strong>${esc(value)}</strong>${sub?`<small>${esc(sub)}</small>`:''}</div>`;
  }
  function card(title, icon, body, action=''){
    return `<section class="panel lk-dev-card"><div class="lk-dev-card-head"><span class="lk-dev-icon">${icon}</span><h3>${esc(title)}</h3>${action}</div>${body}</section>`;
  }

  function renderDevelopment(){
    const children=kids();
    if(!children.length) return `<section class="panel"><h2>Lernentwicklung</h2><p class="message">Noch keine Kinder in der aktiven Klasse angelegt.</p></section>`;
    if(!children.some(k=>k.id===selectedChildId)) selectedChildId=children[0].id;
    const child=children.find(k=>k.id===selectedChildId);
    const week=weeklySummary(selectedChildId), mm=minimaxSummary(selectedChildId), lzk=assessmentSummary(selectedChildId), abc=abcSummary(selectedChildId);
    const latestMm=mm.length?mm[mm.length-1]:null, latestLzk=lzk[0]||null;

    const weekBody = week.empty ? `<p class="lk-dev-empty">Kein Wochenplan vorhanden.</p>` : `
      <div class="lk-dev-metrics">${metric('bearbeitet',`${week.c.fertig}/${week.total}`)}${metric('teilweise',week.c.teilweise)}${metric('offen',week.c.offen)}${metric('Stand',`${week.pct} %`)}</div>
      <div class="lk-dev-row"><b>${esc(week.plan.title||'Aktueller Wochenplan')}</b><span>${esc(week.plan.validFrom||'')} ${week.plan.validTo?`– ${esc(week.plan.validTo)}`:''}</span></div>`;

    const deBody = `<div class="lk-dev-split"><div><h4>ABC der Tiere</h4>${abc.length?abc.map(e=>`<div class="lk-dev-row"><span>${esc(e.displayTitle||e.topicTitle||e.zusatzText||e.workbookArea||'Lernstand')}</span><b>${esc(e.workStatus||e.status||'erfasst')}</b></div>`).join(''):`<p class="lk-dev-empty">Noch kein Lernstand erfasst.</p>`}</div><div><h4>Lernzielkontrollen</h4>${lzk.filter(x=>String(x.assessment.fach||'').toLowerCase().startsWith('deutsch')).slice(0,4).map(x=>`<div class="lk-dev-row"><span>${esc(x.assessment.titel||'LZK')}</span><b>${esc(typeof formatAssessmentMatrixValue==='function'?formatAssessmentMatrixValue(x.assessment,x.result):'erfasst')}</b></div>`).join('')||`<p class="lk-dev-empty">Noch keine Deutsch-LZK.</p>`}</div></div>`;

    const mathLzk=lzk.filter(x=>/mathe/i.test(String(x.assessment.fach||''))).slice(0,4);
    const maBody = `<div class="lk-dev-split"><div><h4>MiniMax · Teste dich</h4>${mm.slice(-4).reverse().map(t=>`<div class="lk-dev-row"><span>Teste dich ${t.id} · ${esc(t.title)}</span><b>${t.filled} Aufgaben erfasst</b></div>`).join('')||`<p class="lk-dev-empty">Noch keine Teste-dich-Punkte.</p>`}</div><div><h4>Lernzielkontrollen</h4>${mathLzk.map(x=>`<div class="lk-dev-row"><span>${esc(x.assessment.titel||'LZK')}</span><b>${esc(typeof formatAssessmentMatrixValue==='function'?formatAssessmentMatrixValue(x.assessment,x.result):'erfasst')}</b></div>`).join('')||`<p class="lk-dev-empty">Noch keine Mathe-LZK.</p>`}</div></div>`;

    return `<div class="lk-dev">
      <section class="panel lk-dev-top"><div><h2>Lernentwicklung</h2><p>Alles Wichtige zu einem Kind auf einen Blick.</p></div><label>Kind<select id="lkDevChild">${children.map(k=>`<option value="${attr(k.id)}" ${k.id===selectedChildId?'selected':''}>${esc(childName(k))}</option>`).join('')}</select></label></section>
      <section class="lk-dev-overview">${metric('Wochenplan',week.empty?'–':`${week.pct} %`,'aktueller Stand')}${metric('Teste dich',latestMm?`Nr. ${latestMm.id}`:'–',latestMm?latestMm.title:'noch kein Ergebnis')}${metric('LZK',latestLzk?esc(typeof formatAssessmentMatrixValue==='function'?formatAssessmentMatrixValue(latestLzk.assessment,latestLzk.result):'erfasst'):'–',latestLzk?.assessment?.titel||'noch keine')}${metric('ABC-Lernstände',abc.length||0,'zuletzt erfasst')}</section>
      <div class="lk-dev-grid">
        ${card('Wochenplan','✓',weekBody,`<button class="secondary compact" type="button" onclick="setTeacherTab('overview')">Öffnen</button>`)}
        ${card('Deutsch','D',deBody,`<button class="secondary compact" type="button" onclick="setTeacherTab('learningGerman')">Öffnen</button>`)}
        ${card('Mathematik','M',maBody,`<button class="secondary compact" type="button" onclick="setTeacherTab('minimaxTests')">Öffnen</button>`)}
      </div>
    </div>`;
  }

  const base=renderTeacherSection;
  renderTeacherSection=function(tab){
    if(tab==='learningDevelopment'){ setTimeout(()=>{const s=document.getElementById('lkDevChild'); if(s)s.onchange=()=>{selectedChildId=s.value;render();};},0); return renderDevelopment(); }
    return base(tab);
  };
})();
