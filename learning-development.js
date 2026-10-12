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
        const subject = String(item?.subject || (String(item?.field||'').startsWith('Mathe') ? 'Mathe' : 'Deutsch'));
        rows.push({plan,animal:{id:animalId},day,item,subject,statusRecord:rec,status: typeof normalizeSimpleWorkStatus==='function' ? normalizeSimpleWorkStatus(rec?.status||'offen') : (rec?.status||'offen')});
      });
    });
    const c={fertig:0,teilweise:0,offen:0}; rows.forEach(r=>{ if(r.status==='fertig')c.fertig++; else if(r.status==='teilweise')c.teilweise++; else c.offen++; });
    const total=rows.length; const pct=total?Math.round((c.fertig + c.teilweise*.5)/total*100):0;
    return {plan,rows,c,total,pct};
  }


  function weekItemLabel(row){
    const catalog=row?.item?.catalogItem;
    const material = typeof weeklyRowMaterialLabel==='function' ? weeklyRowMaterialLabel(row) : String(catalog?.workbook || row?.item?.workbookLabel || row?.item?.workbook || 'Material');
    const topic=String(catalog?.topicTitle || catalog?.displayTitle || row?.item?.topicTitle || row?.item?.title || '').trim();
    return {material,topic};
  }

  function weekPageStatus(row,page){
    if(typeof weeklyRowPageStatus==='function') return weeklyRowPageStatus(row,page);
    return row?.status || 'offen';
  }

  function weekPages(row){
    if(typeof weeklyRowPages==='function') return weeklyRowPages(row);
    const c=row?.item?.catalogItem;
    if(c && typeof weeklyCatalogPages==='function') return weeklyCatalogPages(c).map(Number).filter(Boolean);
    return [];
  }

  function statusMeta(status){
    const st = typeof normalizeSimpleWorkStatus==='function' ? normalizeSimpleWorkStatus(status||'offen') : (status||'offen');
    if(st==='fertig') return {symbol:'✓',label:'fertig',css:'done'};
    if(st==='teilweise') return {symbol:'◐',label:'begonnen',css:'partial'};
    return {symbol:'○',label:'offen',css:'open'};
  }

  function weeklyDetailsHtml(week){
    if(week.empty || !week.rows?.length) return `<div class="lk-dev-emptyline">Kein Wochenplan vorhanden.</div>`;
    const days=[...(typeof WEEK_DAYS!=='undefined'?WEEK_DAYS:['Montag','Dienstag','Mittwoch','Donnerstag','Freitag'])];
    const groups=days.map(day=>({day,rows:week.rows.filter(r=>r.day===day)})).filter(g=>g.rows.length);
    return `<div class="lk-dev-week-details">${groups.map(g=>`<div class="lk-dev-week-day">
      <div class="lk-dev-week-day-name">${esc(g.day)}</div>
      <div class="lk-dev-week-day-tasks">${g.rows.map(row=>{
        const {material,topic}=weekItemLabel(row);
        const pages=weekPages(row);
        const overall=statusMeta(row.status);
        const pageHtml=pages.length ? pages.map(page=>{const m=statusMeta(weekPageStatus(row,page));return `<span class="lk-dev-page-chip ${m.css}" title="${esc(m.label)}">S. ${page}<b>${m.symbol}</b></span>`}).join('') : `<span class="lk-dev-page-chip ${overall.css}">${esc(row?.item?.taskNumber || row?.item?.text || 'Aufgabe')}<b>${overall.symbol}</b></span>`;
        return `<div class="lk-dev-week-task"><div class="lk-dev-week-task-main"><span class="lk-dev-subject-badge ${row.subject==='Mathe'?'math':'german'}">${row.subject==='Mathe'?'M':'D'}</span><div><strong>${esc(material)}</strong>${topic && topic!==material?`<small>${esc(topic)}</small>`:''}</div></div><div class="lk-dev-week-pages">${pageHtml}</div></div>`;
      }).join('')}</div>
    </div>`).join('')}</div>`;
  }

  function weeklyPrintDetails(week){
    if(week.empty || !week.rows?.length) return '<p>Kein Wochenplan vorhanden.</p>';
    const rows=[];
    week.rows.forEach(row=>{
      const {material,topic}=weekItemLabel(row);
      const pages=weekPages(row);
      if(pages.length){
        pages.forEach(page=>{const m=statusMeta(weekPageStatus(row,page)); rows.push(`<tr><td>${esc(row.day)}</td><td>${esc(row.subject)}</td><td>${esc(material)}</td><td>S. ${page}</td><td>${m.symbol} ${esc(m.label)}</td></tr>`);});
      }else{
        const m=statusMeta(row.status); rows.push(`<tr><td>${esc(row.day)}</td><td>${esc(row.subject)}</td><td>${esc(material)}</td><td>${esc(topic||row?.item?.text||'Aufgabe')}</td><td>${m.symbol} ${esc(m.label)}</td></tr>`);
      }
    });
    return `<table><thead><tr><th>Tag</th><th>Fach</th><th>Material</th><th>Seite/Aufgabe</th><th>Status</th></tr></thead><tbody>${rows.join('')}</tbody></table>`;
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

  function childrenOverview(children){
    return `<section class="panel lk-dev-children-overview">
      <div class="lk-dev-children-overview-head"><h3>Kinder</h3><span>${children.length} Kinder</span></div>
      <div class="lk-dev-children-grid">${children.map(k=>`<button type="button" class="lk-dev-child-overview-btn ${k.id===selectedChildId?'is-selected':''}" data-child-id="${attr(k.id)}">${esc(childName(k))}</button>`).join('')}</div>
    </section>`;
  }

  function renderDevelopment(){
    const children=kids();
    if(!children.length) return `<section class="panel"><h2>Lernentwicklung</h2><p class="message">Noch keine Kinder in der aktiven Klasse angelegt.</p></section>`;
    if(!children.some(k=>k.id===selectedChildId)) selectedChildId=children[0].id;
    const {child,week,mm,lzk,abc,latestMm,latestLzk}=childData(selectedChildId);

    const weekLine = week.empty ? `<span class="lk-dev-status-muted">Kein Wochenplan</span>` : `<strong>${week.pct} %</strong><span>${week.c.fertig}/${week.total} fertig · ${week.c.teilweise} teilweise · ${week.c.offen} offen</span>`;
    const germanLzk=lzk.filter(x=>String(x.assessment.fach||'').toLowerCase().startsWith('deutsch')).slice(0,4);
    const mathLzk=lzk.filter(x=>/mathe/i.test(String(x.assessment.fach||''))).slice(0,4);

    const abcRows=abc.length?abc.slice(0,5).map(e=>`<div class="lk-dev-line"><span>${esc(e.displayTitle||e.topicTitle||e.zusatzText||e.workbookArea||'Lernstand')}</span><b>${esc(e.workStatus||e.status||'erfasst')}</b></div>`).join(''):`<div class="lk-dev-emptyline">Noch kein Lernstand erfasst.</div>`;
    const deLzkRows=germanLzk.length?germanLzk.map(x=>`<div class="lk-dev-line"><span>${esc(x.assessment.titel||'LZK')}</span><b>${esc(typeof formatAssessmentMatrixValue==='function'?formatAssessmentMatrixValue(x.assessment,x.result):'erfasst')}</b></div>`).join(''):`<div class="lk-dev-emptyline">Noch keine Deutsch-LZK.</div>`;
    const mmRows=mm.length?mm.slice(-5).reverse().map(t=>`<div class="lk-dev-line"><span>Teste dich ${t.id} · ${esc(t.title)}</span><b>${t.filled} erfasst</b></div>`).join(''):`<div class="lk-dev-emptyline">Noch keine Teste-dich-Punkte.</div>`;
    const maLzkRows=mathLzk.length?mathLzk.map(x=>`<div class="lk-dev-line"><span>${esc(x.assessment.titel||'LZK')}</span><b>${esc(typeof formatAssessmentMatrixValue==='function'?formatAssessmentMatrixValue(x.assessment,x.result):'erfasst')}</b></div>`).join(''):`<div class="lk-dev-emptyline">Noch keine Mathe-LZK.</div>`;

    return `<div class="lk-dev lk-dev-compact">
      <section class="panel lk-dev-header">
        <div><h2>Lernentwicklung · ${esc(childName(child))}</h2><p>${esc(className())}</p></div>
        <div class="lk-dev-print-actions"><button class="secondary compact" type="button" id="lkDevPrintOne">Drucken</button><button class="secondary compact" type="button" id="lkDevPrintAll">Alle drucken</button></div>
      </section>

      ${childrenOverview(children)}

      <section class="lk-dev-summarybar">
        <div><span>Wochenplan</span>${week.empty?'<b>–</b>':`<b>${week.pct} %</b>`}</div>
        <div><span>Teste dich</span><b>${latestMm?`Nr. ${latestMm.id}`:'–'}</b></div>
        <div><span>LZK</span><b>${latestLzk?esc(typeof formatAssessmentMatrixValue==='function'?formatAssessmentMatrixValue(latestLzk.assessment,latestLzk.result):'erfasst'):'–'}</b></div>
        <div><span>ABC</span><b>${abc.length||0}</b></div>
      </section>

      <section class="panel lk-dev-section">
        <div class="lk-dev-section-head"><div><span class="lk-dev-section-icon">✓</span><h3>Wochenplan</h3></div><button class="secondary compact" type="button" onclick="setTeacherTab('weeklyPlans')">Öffnen</button></div>
        <div class="lk-dev-weekline">${weekLine}</div>
        ${weeklyDetailsHtml(week)}
      </section>

      <section class="panel lk-dev-section">
        <div class="lk-dev-section-head"><div><span class="lk-dev-section-icon">D</span><h3>Deutsch</h3></div><button class="secondary compact" type="button" onclick="setTeacherTab('learningGerman')">Öffnen</button></div>
        <div class="lk-dev-subsection"><h4>ABC der Tiere</h4>${abcRows}</div>
        <div class="lk-dev-subsection"><h4>Lernzielkontrollen</h4>${deLzkRows}</div>
      </section>

      <section class="panel lk-dev-section">
        <div class="lk-dev-section-head"><div><span class="lk-dev-section-icon">M</span><h3>Mathematik</h3></div><button class="secondary compact" type="button" onclick="setTeacherTab('minimaxTests')">Öffnen</button></div>
        <div class="lk-dev-subsection"><h4>MiniMax · Teste dich</h4>${mmRows}</div>
        <div class="lk-dev-subsection"><h4>Lernzielkontrollen</h4>${maLzkRows}</div>
      </section>
    </div>`;
  }

  function assessmentValue(x){ return typeof formatAssessmentMatrixValue==='function' ? formatAssessmentMatrixValue(x.assessment,x.result) : 'erfasst'; }

  function printChildSection(animalId){
    const {child,week,mm,lzk,abc}=childData(animalId);
    const deLzk=lzk.filter(x=>String(x.assessment.fach||'').toLowerCase().startsWith('deutsch'));
    const maLzk=lzk.filter(x=>/mathe/i.test(String(x.assessment.fach||'')));
    const weekHtml=week.empty?'<p>Kein Wochenplan vorhanden.</p>':`<table><tbody><tr><th>Bearbeitet</th><td>${week.c.fertig}/${week.total}</td><th>Teilweise</th><td>${week.c.teilweise}</td><th>Offen</th><td>${week.c.offen}</td><th>Stand</th><td>${week.pct} %</td></tr></tbody></table>${weeklyPrintDetails(week)}`;
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
    const choose=id=>{ if(!id) return; selectedChildId=id; render(); };
    document.querySelectorAll('.lk-dev-child-overview-btn').forEach(btn=>btn.addEventListener('click',()=>choose(btn.dataset.childId)));
    const one=document.getElementById('lkDevPrintOne'); if(one) one.onclick=window.lkPrintCurrentLearningDevelopment;
    const all=document.getElementById('lkDevPrintAll'); if(all) all.onclick=window.lkPrintAllLearningDevelopment;
  }

  const base=renderTeacherSection;
  renderTeacherSection=function(tab){
    if(tab==='learningDevelopment'){ setTimeout(bindDevelopment,0); return renderDevelopment(); }
    return base(tab);
  };
})();
