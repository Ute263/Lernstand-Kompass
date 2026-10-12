/* Lernentwicklung v9: individuelle Kindersicht + direkte Kinderauswahl + Sammeldruck */
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

  const MM_TITLES = {1:'Zahlen bis 100',2:'Vom Zahlenstrahl zum Rechenstrich',3:'Addition und Subtraktion üben',4:'Addition mit Zehnerübergang',5:'Subtraktion mit Zehnerübergang',6:'Addition und Subtraktion üben',7:'Sachrechnen',8:'Multiplikation mit 2, 5 und 10',9:'Multiplikation',10:'Multiplikation üben',11:'Division',12:'Multiplikation und Division üben',13:'Addition mit Zehnerübergang',14:'Subtraktion mit Zehnerübergang',15:'Addition und Subtraktion üben',16:'Division mit Rest',17:'Längen',18:'Geld',19:'Sachaufgaben lösen',20:'Zeit',21:'Körper',22:'Flächen',23:'Figuren und Muster',24:'Spiegeln'};

  function esc(v){ return typeof escapeHtml === 'function' ? escapeHtml(String(v ?? '')) : String(v ?? '').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function attr(v){ return typeof escapeAttribute === 'function' ? escapeAttribute(String(v ?? '')) : esc(v); }
  function kids(){ return (typeof animalsForActiveClass === 'function' ? animalsForActiveClass() : (state.animals||[]).filter(a=>a.classId===state.activeClassId)).filter(a=>a.aktiv !== false); }
  function childName(a){ if(!a) return 'Kind'; return state.teacherShowFirstNames && a.firstName ? `${a.tierEmoji||''} ${a.firstName}`.trim() : `${a.tierEmoji||''} ${a.tierName||a.firstName||'Kind'}`.trim(); }
  function className(){ const cls=(state.classes||[]).find(c=>c.id===state.activeClassId); return cls?.name || cls?.title || 'Klasse'; }

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
    return entries.slice(0,8);
  }

  function metric(label,value,sub=''){
    return `<div class="lk-dev-metric"><span>${esc(label)}</span><strong>${esc(value)}</strong>${sub?`<small>${esc(sub)}</small>`:''}</div>`;
  }
  function card(title, icon, body, action=''){
    return `<section class="panel lk-dev-card"><div class="lk-dev-card-head"><span class="lk-dev-icon">${icon}</span><h3>${esc(title)}</h3>${action}</div>${body}</section>`;
  }

  function childData(animalId){
    const child=kids().find(k=>k.id===animalId);
    const week=weeklySummary(animalId), mm=minimaxSummary(animalId), lzk=assessmentSummary(animalId), abc=abcSummary(animalId);
    return {child,week,mm,lzk,abc,latestMm:mm.length?mm[mm.length-1]:null,latestLzk:lzk[0]||null};
  }

  function childSelector(children){
    return `<div class="lk-dev-child-picker" role="list" aria-label="Kind auswählen">${children.map(k=>`
      <button type="button" role="listitem" class="lk-dev-child-chip ${k.id===selectedChildId?'is-selected':''}" data-child-id="${attr(k.id)}" aria-pressed="${k.id===selectedChildId?'true':'false'}">${esc(childName(k))}</button>`).join('')}</div>`;
  }

  function renderDevelopment(){
    const children=kids();
    if(!children.length) return `<section class="panel"><h2>Lernentwicklung</h2><p class="message">Noch keine Kinder in der aktiven Klasse angelegt.</p></section>`;
    if(!children.some(k=>k.id===selectedChildId)) selectedChildId=children[0].id;
    const {child,week,mm,lzk,abc,latestMm,latestLzk}=childData(selectedChildId);

    const weekBody = week.empty ? `<p class="lk-dev-empty">Kein Wochenplan vorhanden.</p>` : `
      <div class="lk-dev-metrics">${metric('bearbeitet',`${week.c.fertig}/${week.total}`)}${metric('teilweise',week.c.teilweise)}${metric('offen',week.c.offen)}${metric('Stand',`${week.pct} %`)}</div>
      <div class="lk-dev-row"><b>${esc(week.plan.title||'Aktueller Wochenplan')}</b><span>${esc(week.plan.validFrom||'')} ${week.plan.validTo?`– ${esc(week.plan.validTo)}`:''}</span></div>`;

    const germanLzk=lzk.filter(x=>String(x.assessment.fach||'').toLowerCase().startsWith('deutsch')).slice(0,4);
    const deBody = `<div class="lk-dev-split"><div><h4>ABC der Tiere</h4>${abc.length?abc.map(e=>`<div class="lk-dev-row"><span>${esc(e.displayTitle||e.topicTitle||e.zusatzText||e.workbookArea||'Lernstand')}</span><b>${esc(e.workStatus||e.status||'erfasst')}</b></div>`).join(''):`<p class="lk-dev-empty">Noch kein Lernstand erfasst.</p>`}</div><div><h4>Lernzielkontrollen</h4>${germanLzk.map(x=>`<div class="lk-dev-row"><span>${esc(x.assessment.titel||'LZK')}</span><b>${esc(typeof formatAssessmentMatrixValue==='function'?formatAssessmentMatrixValue(x.assessment,x.result):'erfasst')}</b></div>`).join('')||`<p class="lk-dev-empty">Noch keine Deutsch-LZK.</p>`}</div></div>`;

    const mathLzk=lzk.filter(x=>/mathe/i.test(String(x.assessment.fach||''))).slice(0,4);
    const maBody = `<div class="lk-dev-split"><div><h4>MiniMax · Teste dich</h4>${mm.slice(-4).reverse().map(t=>`<div class="lk-dev-row"><span>Teste dich ${t.id} · ${esc(t.title)}</span><b>${t.filled} Aufgaben erfasst</b></div>`).join('')||`<p class="lk-dev-empty">Noch keine Teste-dich-Punkte.</p>`}</div><div><h4>Lernzielkontrollen</h4>${mathLzk.map(x=>`<div class="lk-dev-row"><span>${esc(x.assessment.titel||'LZK')}</span><b>${esc(typeof formatAssessmentMatrixValue==='function'?formatAssessmentMatrixValue(x.assessment,x.result):'erfasst')}</b></div>`).join('')||`<p class="lk-dev-empty">Noch keine Mathe-LZK.</p>`}</div></div>`;

    return `<div class="lk-dev">
      <section class="panel lk-dev-top">
        <div><h2>Lernentwicklung · ${esc(childName(child))}</h2><p>Wochenplan, Lernstände und Leistungsnachweise auf einen Blick.</p></div>
        <div class="lk-dev-print-actions"><button class="secondary compact" type="button" id="lkDevPrintOne">Dieses Kind drucken</button><button class="primary compact" type="button" id="lkDevPrintAll">Alle Kinder drucken</button></div>
      </section>
      <section class="panel lk-dev-picker-panel"><div class="lk-dev-picker-title">Kind auswählen</div>${childSelector(children)}</section>
      <section class="lk-dev-overview">${metric('Wochenplan',week.empty?'–':`${week.pct} %`,'aktueller Stand')}${metric('Teste dich',latestMm?`Nr. ${latestMm.id}`:'–',latestMm?latestMm.title:'noch kein Ergebnis')}${metric('LZK',latestLzk?esc(typeof formatAssessmentMatrixValue==='function'?formatAssessmentMatrixValue(latestLzk.assessment,latestLzk.result):'erfasst'):'–',latestLzk?.assessment?.titel||'noch keine')}${metric('ABC-Lernstände',abc.length||0,'zuletzt erfasst')}</section>
      <div class="lk-dev-grid">
        ${card('Wochenplan','✓',weekBody,`<button class="secondary compact" type="button" onclick="setTeacherTab('weeklyPlans')">Öffnen</button>`)}
        ${card('Deutsch','D',deBody,`<button class="secondary compact" type="button" onclick="setTeacherTab('learningGerman')">Öffnen</button>`)}
        ${card('Mathematik','M',maBody,`<button class="secondary compact" type="button" onclick="setTeacherTab('minimaxTests')">Öffnen</button>`)}
      </div>
    </div>`;
  }

  function assessmentValue(x){ return typeof formatAssessmentMatrixValue==='function' ? formatAssessmentMatrixValue(x.assessment,x.result) : 'erfasst'; }

  function printChildSection(animalId){
    const {child,week,mm,lzk,abc}=childData(animalId);
    const deLzk=lzk.filter(x=>String(x.assessment.fach||'').toLowerCase().startsWith('deutsch'));
    const maLzk=lzk.filter(x=>/mathe/i.test(String(x.assessment.fach||'')));
    const weekHtml=week.empty?'<p>Kein Wochenplan vorhanden.</p>':`<table><tbody><tr><th>Bearbeitet</th><td>${week.c.fertig}/${week.total}</td><th>Teilweise</th><td>${week.c.teilweise}</td><th>Offen</th><td>${week.c.offen}</td><th>Stand</th><td>${week.pct} %</td></tr></tbody></table>`;
    const mmHtml=mm.length?`<table><thead><tr><th>Teste dich</th><th>Thema</th><th>Erfasste Aufgaben</th></tr></thead><tbody>${mm.map(t=>`<tr><td>${t.id}</td><td>${esc(t.title)}</td><td>${t.filled}</td></tr>`).join('')}</tbody></table>`:'<p>Noch keine Teste-dich-Punkte.</p>';
    const abcHtml=abc.length?`<table><thead><tr><th>Lernstand</th><th>Status</th></tr></thead><tbody>${abc.map(e=>`<tr><td>${esc(e.displayTitle||e.topicTitle||e.zusatzText||e.workbookArea||'Lernstand')}</td><td>${esc(e.workStatus||e.status||'erfasst')}</td></tr>`).join('')}</tbody></table>`:'<p>Noch kein ABC-Lernstand erfasst.</p>';
    function lzkTable(items){ return items.length?`<table><thead><tr><th>Lernzielkontrolle</th><th>Ergebnis</th></tr></thead><tbody>${items.map(x=>`<tr><td>${esc(x.assessment.titel||'LZK')}</td><td>${esc(assessmentValue(x))}</td></tr>`).join('')}</tbody></table>`:'<p>Noch keine Lernzielkontrollen.</p>'; }
    return `<section class="print-child-page"><header><h1>${esc(childName(child))}</h1><div>${esc(className())} · Lernentwicklung</div></header><h2>Wochenplan</h2>${weekHtml}<h2>Deutsch</h2><h3>ABC der Tiere</h3>${abcHtml}<h3>Lernzielkontrollen</h3>${lzkTable(deLzk)}<h2>Mathematik</h2><h3>MiniMax · Teste dich</h3>${mmHtml}<h3>Lernzielkontrollen</h3>${lzkTable(maLzk)}</section>`;
  }

  function openPrintWindow(ids, title){
    const w=window.open('', '_blank');
    if(!w){ alert('Das Druckfenster konnte nicht geöffnet werden. Bitte Pop-ups für diese Seite erlauben.'); return; }
    const css=`@page{size:A4 portrait;margin:13mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#173f52;margin:0}header{border-bottom:2px solid #79cbd4;padding-bottom:8px;margin-bottom:14px}h1{font-size:23px;margin:0 0 3px}h2{font-size:17px;margin:16px 0 7px;color:#177f94}h3{font-size:13px;margin:10px 0 5px}p{font-size:11px;color:#617888;margin:5px 0 10px}table{border-collapse:collapse;width:100%;font-size:10.5px;margin:0 0 10px}th,td{border:1px solid #d9e6eb;padding:5px 6px;text-align:left}th{background:#eef8fa}.print-child-page{break-after:page;page-break-after:always}.print-child-page:last-child{break-after:auto;page-break-after:auto}@media print{.print-toolbar{display:none!important}}.print-toolbar{position:sticky;top:0;background:#fff;padding:10px;border-bottom:1px solid #ddd;display:flex;gap:8px;z-index:2}.print-toolbar button{padding:8px 14px;border:1px solid #b9d7e0;border-radius:9px;background:#fff;font:inherit}.print-toolbar button:first-child{background:#178da4;color:white;border-color:#178da4}`;
    w.document.open();
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>${css}</style></head><body><div class="print-toolbar"><button onclick="window.print()">Drucken / als PDF speichern</button><button onclick="window.close()">Schließen</button></div>${ids.map(printChildSection).join('')}</body></html>`);
    w.document.close();
    w.focus();
  }

  window.lkPrintCurrentLearningDevelopment = function(){ if(selectedChildId) openPrintWindow([selectedChildId], 'Lernentwicklung'); };
  window.lkPrintAllLearningDevelopment = function(){ openPrintWindow(kids().map(k=>k.id), `Lernentwicklung ${className()}`); };

  function bindDevelopment(){
    document.querySelectorAll('.lk-dev-child-chip').forEach(btn=>btn.addEventListener('click',()=>{ selectedChildId=btn.dataset.childId||''; render(); }));
    const one=document.getElementById('lkDevPrintOne'); if(one) one.onclick=window.lkPrintCurrentLearningDevelopment;
    const all=document.getElementById('lkDevPrintAll'); if(all) all.onclick=window.lkPrintAllLearningDevelopment;
  }

  const base=renderTeacherSection;
  renderTeacherSection=function(tab){
    if(tab==='learningDevelopment'){ setTimeout(bindDevelopment,0); return renderDevelopment(); }
    return base(tab);
  };
})();
