/* MiniMax 2 · Teste-dich-Auswertung – integriert in Lernstand-Kompass */
(() => {
  if (typeof TEACHER_GROUPS === "undefined" || typeof renderTeacherSection !== "function") {
    console.warn("Teste-dich-Modul konnte nicht initialisiert werden.");
    return;
  }

const TASKS = {
1:[['Zehnerzahlen notieren',2,'I'],['Anzahlen in Stellenwerttafel und als Zahl notieren',4,'I'],['Dargestellte Zahlen unterschiedlich notieren',6,'II'],['Eine Zahl verschieden zerlegen',4,'II'],['Dargestellte Zahlen und eigene Zahl unterschiedlich notieren',6,'II'],['Zahlenrätsel lösen',3,'III']],
2:[['Zahlen mit dem Zahlenstrahl verbinden',6,'I'],['Vorgänger und Nachfolger bestimmen',6,'I'],['Nachbarzehner bestimmen',6,'I'],['Zahlen vergleichen',8,'I'],['Nachbarzahlen bestimmen',6,'I'],['Zahlen ordnen',4,'II'],['Zahlen auf Rechenstrich-Ausschnitten einzeichnen',8,'II'],['Eigenen Rechenstrich zeichnen und Zahlen einzeichnen',6,'III']],
3:[['Additions- und Subtraktionsaufgaben lösen',10,'I'],['Tauschaufgaben bilden und lösen',6,'II'],['Zahlenmauern durch Addition lösen',8,'II'],['Aufgabenfamilien bilden',6,'II'],['Zahlenfolgen mit Zielzahl fortsetzen',4,'II'],['Ergänzungsaufgaben lösen',8,'I'],['Zahlenmauern durch Probieren lösen',4,'III']],
4:[['Additionsaufgaben darstellen und lösen',10.5,'I'],['Additionsaufgaben am Rechenstrich darstellen und lösen',7,'II'],['Eigenen Rechenweg notieren und Aufgaben lösen',6,'II'],['Additionsaufgaben mit Zehnerübergang lösen',8,'I'],['Zahlenmauern lösen',6,'II'],['Gesetzmäßigkeiten in Zahlenfolgen erkennen und nutzen',6,'II'],['Veränderungen in Froschaufgaben beschreiben und nutzen',6,'III']],
5:[['Subtraktionsaufgaben darstellen und lösen',10.5,'I'],['Subtraktionsaufgaben am Rechenstrich darstellen und lösen',7,'II'],['Subtraktionsaufgaben mit Zehnerübergang lösen',8,'I'],['Umkehraufgabe bilden und lösen',2,'II'],['Ergebnisse auf Plausibilität prüfen',2,'II'],['Ergebnisse mit der Probe kontrollieren',8,'II'],['Veränderungen in Froschaufgaben beschreiben und nutzen',6,'III']],
6:[['Additions- und Subtraktionsaufgaben mit Zehnerübergang lösen',8,'I'],['Tauschaufgaben bilden und lösen',6,'II'],['Additions- und Subtraktionsaufgaben mit Zehnerübergang lösen',6,'I'],['Zahlenmauern lösen',6,'II'],['Ergänzungsaufgaben lösen',8,'I'],['Vorgegebene Zahlen in Zahlenmauern eintragen',4,'II'],['Zahlenrätsel lösen',3,'III']],
7:[['Informationen entnehmen und Frage beantworten',1,'I'],['Informationen entnehmen, Lösungsweg notieren und Frage beantworten',3,'II'],['Informationen entnehmen, Lösungsweg notieren und Frage beantworten',3,'II'],['Passende Fragestellung finden und Sachaufgabe lösen',3,'II'],['Passende Fragestellung finden und komplexe Sachaufgabe lösen',4,'III']],
8:[['Zu Bildern Multiplikationsaufgaben notieren',2,'I'],['Multiplikationsaufgaben mit Punktefeldern darstellen',4,'II'],['Einmaleins mit 2, 5 und 10 lösen',15,'I'],['Zu Sprüngen Malaufgaben notieren',4,'II'],['Verdopplungsaufgaben rechnen',6,'I'],['2er- und 10er-Sprünge darstellen und vergleichen',5,'II'],['Zu einem Multiplikationsterm eine Geschichte schreiben',3,'III']],
9:[['Zu Bildern Multiplikationsaufgaben notieren',4,'I'],['Kernaufgaben beherrschen',15,'I'],['Passende Bilder zu Multiplikationsaufgaben zeichnen',4,'II'],['Aufgaben mithilfe der Königsaufgaben lösen',6,'II'],['Zusammenhang zwischen 3er- und 9er-Reihe erkennen',7,'III']],
10:[['Multiplikationsaufgaben beherrschen',18,'I'],['Multiplikationstabellen lösen',18,'I'],['Froschaufgaben berechnen, untersuchen und fortsetzen',6,'II'],['Zahlenrätsel lösen',2,'II'],['Komplexe Sachaufgabe zur Multiplikation lösen',3,'III']],
11:[['Bildlich geleitete Division durch Verteilen lösen',2,'I'],['Division durch Verteilen lösen',2,'I'],['Bildlich geleitete Division durch Aufteilen lösen',2,'I'],['Division durch Aufteilen lösen',2,'I'],['Division durch Verteilen rechnerisch lösen',4,'II'],['Division durch Aufteilen rechnerisch lösen',4,'II'],['Komplexe Sachaufgabe zur Division lösen',3,'III']],
12:[['Multiplikation als Umkehrung der Division nutzen',4,'II'],['Aufgabenfamilie bilden',4,'II'],['Ergebnisse mit Umkehraufgabe kontrollieren',8,'II'],['Gleichungen und Ungleichungen lösen',6,'I'],['Aufgabenfamilien zu Multiplikation und Division bilden',6,'II'],['Sachaufgabe lösen',3,'II'],['Multiplikations- und Divisionsaufgaben finden',6,'III']],
13:[['Additionsaufgaben lösen',5,'I'],['Additionsaufgaben am Rechenstrich darstellen und lösen',7,'II'],['Zehnertrick am Rechenstrich anwenden',7,'II'],['Eigenen Rechenweg notieren und lösen',6,'II'],['Gesetzmäßigkeiten in Zahlenmauern erkennen und nutzen',4,'II'],['Muster in Froschaufgaben erkennen und Fehler korrigieren',6,'III'],['Komplexe Sachaufgabe lösen',3,'III']],
14:[['Subtraktionsaufgaben am Rechenstrich darstellen und lösen',7,'II'],['Zehnertrick anwenden',7,'II'],['Subtraktionsaufgaben durch Ergänzen lösen',5,'II'],['Eigenen Rechenweg notieren und lösen',6,'II'],['Gesetzmäßigkeiten in Zahlenfolgen erkennen und nutzen',9,'II'],['Muster in Froschaufgaben erkennen und Fehler korrigieren',6,'III'],['Komplexe Sachaufgabe lösen',3,'III']],
15:[['Additions- und Subtraktionsaufgaben lösen',8,'I'],['Rechenvorteile erkennen und nutzen',8,'II'],['Gleichungen und Ungleichungen lösen',6,'I'],['Aufgabenfamilien bilden',6,'II'],['Ergebnisse mit Umkehraufgabe kontrollieren',8,'II'],['Gerade und ungerade Zahlen erkennen und zerlegen',6,'II'],['Gesetzmäßigkeiten bei geraden und ungeraden Zahlen erkennen',6,'III']],
16:[['Division mit Rest durch Verteilen lösen',4,'I'],['Division mit Rest durch Verteilen lösen',4,'I'],['Division mit Rest durch Verteilen lösen',4,'I'],['Sachsituation zur Division mit Rest lösen',3,'II'],['Mehrschrittige Sachsituation zur Division mit Rest lösen',4,'II'],['Komplexe Sachsituation zur Division mit Rest lösen',4,'III']],
17:[['Stiftlängen mit dem Lineal messen',4,'I'],['Strecken mit dem Lineal zeichnen',4,'I'],['Längen addieren',6,'I'],['Längen auf Plausibilität prüfen',4,'II'],['Längen ordnen',6,'II'],['Mit Längen rechnen',8,'II']],
18:[['Euro- und Cent-Beträge ordnen',8,'I'],['Geldbeträge ermitteln',4,'I'],['Gemischte Geldbeträge zeichnen',3,'II'],['Gemischte Geldbeträge bestimmen und notieren',3,'I'],['Realistische Preise zuordnen',3,'II'],['Geldbeträge unterschiedlich darstellen',4,'III']],
19:[['Sachaufgabe mit Längen lösen',3,'II'],['Tabelle zum Lösen einer Sachaufgabe nutzen',4,'II'],['Sachaufgabe mit Geld lösen',3,'II'],['Angebot überprüfen',3,'III'],['Komplexe Sachaufgabe mit Geld lösen',5,'III']],
20:[['Uhrzeiten an analogen Uhren ablesen',6,'I'],['Uhrzeiten in analoge Uhren eintragen',3,'I'],['Uhrzeiten an digitalen und analogen Uhren ablesen',6,'I'],['Zeitspanne bestimmen und fehlende Uhrzeiten eintragen',3,'II'],['Uhrzeiten und Zeitspannen bestimmen',4,'II'],['Uhrzeiten bestimmen',4,'II'],['Aus Texten Zeitinformationen entnehmen',6,'III']],
21:[['Geometrische Körper benennen',3,'I'],['Baupläne ausfüllen und Würfelanzahl bestimmen',6,'II'],['Ansichten erkennen und zuordnen',1,'I'],['Körperrätsel lösen',3,'II'],['Baupläne ausfüllen und Würfelanzahl bestimmen',6,'II'],['Ansichten passend zeichnen',2,'III']],
22:[['Flächenrätsel lösen',3,'I'],['Ecken, Seiten und Flächen kennzeichnen',8,'I'],['Anzahl der Seiten und Ecken bestimmen',8,'I'],['Ecken und Flächen kennzeichnen',8,'II'],['Flächenrätsel lösen und Fläche beschreiben',3,'III']],
23:[['Muster auf Karoraster fortsetzen',4,'II'],['Muster auf Punktraster fortsetzen',4,'II'],['Am Geobrett dargestellte Figuren benennen',6,'I'],['Komplexes Muster auf Karoraster fortsetzen',3,'II'],['Komplexes Muster auf Punktraster fortsetzen',3,'II'],['Fehler in Mustern finden und einkreisen',4,'II'],['Eigenes Muster mit Lineal zeichnen',3,'III']],
24:[['Passende Spiegelbilder erkennen',2,'I'],['Spiegelbilder an horizontaler Spiegelachse zeichnen',2,'II'],['Spiegelbilder auf Korrektheit untersuchen',4,'II'],['Spiegelachsen einzeichnen',4,'III']]
};

const TEST_TITLES={1:'Zahlen bis 100',2:'Vom Zahlenstrahl zum Rechenstrich',3:'Addition und Subtraktion üben',4:'Addition mit Zehnerübergang',5:'Subtraktion mit Zehnerübergang',6:'Addition und Subtraktion üben',7:'Sachrechnen',8:'Multiplikation mit 2, 5 und 10',9:'Multiplikation',10:'Multiplikation üben',11:'Division',12:'Multiplikation und Division üben',13:'Addition mit Zehnerübergang',14:'Subtraktion mit Zehnerübergang',15:'Addition und Subtraktion üben',16:'Division mit Rest',17:'Längen',18:'Geld',19:'Sachaufgaben lösen',20:'Zeit',21:'Körper',22:'Flächen',23:'Figuren und Muster',24:'Spiegeln'};
const TESTS=Object.keys(TEST_TITLES).map(id=>({id:+id,title:TEST_TITLES[id],tasks:TASKS[id].map((x,i)=>({id:i+1,label:x[0],defaultMax:x[1],defaultAfb:x[2]}))}));
const TEST_GROUPS=[
  {label:'Zahlen und Rechnen',icon:'🔢',ids:[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]},
  {label:'Größen und Sachrechnen',icon:'📏',ids:[17,18,19,20]},
  {label:'Geometrie',icon:'◻️',ids:[21,22,23,24]}
];
function mmTestOptions(){return TEST_GROUPS.map(g=>`<optgroup label="${g.icon} ${g.label}">${g.ids.map(id=>{const t=TESTS.find(x=>x.id===id);return `<option value="${id}" ${id===mmSelectedTest?'selected':''}>Teste dich ${id} · ${mmEsc(t.title)}</option>`}).join('')}</optgroup>`).join('')}
function mmGroupForTest(id){return TEST_GROUPS.find(g=>g.ids.includes(+id))||TEST_GROUPS[0]}



  const MM_GRADE_KEY = [[91,1],[80,2],[65,3],[50,4],[11,5],[0,6]];
  const MM_COMP_KEY = [[85,'++','gesichert','pp'],[70,'+','weitgehend gesichert','p'],[40,'−','teilweise gesichert','m'],[0,'O','Übungsbedarf','o']];
  let mmView = 'entry';
  let mmSelectedTest = 1;
  let mmSelectedChildId = '';
  let mmScoringOpen = false;

  function mmClassId(){ return state.activeClassId || 'none'; }
  function mmChildren(){ return (typeof animalsForActiveClass === 'function' ? animalsForActiveClass() : (state.animals||[]).filter(a=>a.classId===state.activeClassId)).filter(a=>a.aktiv !== false); }
  function mmChildName(a){
    if (!a) return 'Kind';
    return state.teacherShowFirstNames && a.firstName ? a.firstName : (a.tierName || a.firstName || 'Kind');
  }
  function mmPoints(){ return state.minimaxTestPoints || {}; }
  function mmScoring(){ return state.minimaxTestScoring || {}; }
  function mmPointKey(testId,taskId,childId){ return `${mmClassId()}:${testId}:${taskId}:${childId}`; }
  function mmGetPoint(testId,taskId,childId){ const v=mmPoints()[mmPointKey(testId,taskId,childId)]; return v===undefined||v===null?'':v; }
  function mmConfig(testId,taskId){
    const t=TESTS.find(x=>x.id===+testId)?.tasks.find(x=>x.id===+taskId);
    const o=mmScoring()?.[mmClassId()]?.[testId]?.[taskId] || {};
    return {...t,max:+(o.max ?? t.defaultMax),afb:o.afb || t.defaultAfb};
  }
  function mmGrade(p){ return p>=91?1:p>=80?2:p>=65?3:p>=50?4:p>=11?5:6; }
  function mmComp(p){ return p>=85?['++','gesichert','pp']:p>=70?['+','weitgehend gesichert','p']:p>=40?['−','teilweise gesichert','m']:['O','Übungsbedarf','o']; }
  function mmSummary(test,childId){
    let earned=0,max=0,filled=0; const afb={I:[0,0],II:[0,0],III:[0,0]};
    test.tasks.forEach(task=>{ const c=mmConfig(test.id,task.id),v=mmGetPoint(test.id,task.id,childId); max+=c.max; afb[c.afb][1]+=c.max; if(v!==''){filled++;const n=Math.min(+v,c.max);earned+=n;afb[c.afb][0]+=n;} });
    const pct=max?Math.round(earned/max*100):0; return {earned,max,filled,total:test.tasks.length,complete:filled===test.tasks.length,pct,grade:filled===test.tasks.length?mmGrade(pct):null,afb};
  }
  function mmStats(test){const by={I:0,II:0,III:0};let total=0;test.tasks.forEach(task=>{const c=mmConfig(test.id,task.id);total+=c.max;by[c.afb]+=c.max});return{total,by};}
  function mmTest(){return TESTS.find(t=>t.id===mmSelectedTest)||TESTS[0];}
  function mmEsc(s){return typeof escapeHtml==='function'?escapeHtml(String(s??'')):String(s??'').replace(/[&<>"']/g,'');}
  function mmAttr(s){return typeof escapeAttribute==='function'?escapeAttribute(String(s??'')):mmEsc(s);}
  async function mmSavePatch(patch){ await persist({...state,...patch}); }
  async function mmSetPoint(testId,taskId,childId,value){
    const points={...mmPoints()}; const k=mmPointKey(testId,taskId,childId);
    if(value==='') delete points[k]; else points[k]=Math.max(0,Number(value));
    await mmSavePatch({minimaxTestPoints:points});
  }

  function mmHeader(){
    return `<div class="lk-mm-header"><h2>MiniMax 2 · Teste dich</h2><div class="lk-mm-testpick"><label class="sr-only" for="lkMmTestSelect">Teste dich auswählen</label><select id="lkMmTestSelect" aria-label="Teste dich auswählen">${mmTestOptions()}</select></div></div>
    <div class="lk-mm-tabs"><button type="button" data-mm-view="entry" class="${mmView==='entry'?'active':''}">Eingabe</button><button type="button" data-mm-view="child" class="${mmView==='child'?'active':''}">Kindansicht</button><button type="button" data-mm-view="class" class="${mmView==='class'?'active':''}">Klasse</button><button type="button" data-mm-view="info" class="${mmView==='info'?'active':''}">Info</button></div>`;
  }

  function mmEntry(){
    const t=mmTest(), kids=mmChildren();
    if(!kids.length) return `<section class="panel"><h3>Keine Kinder angelegt</h3><p>Lege zuerst unter <strong>Klasse → Kinder</strong> Kinder an.</p></section>`;
    return `${mmScoringOpen?mmScoringEditor(t):''}
    <section class="panel lk-mm-entry"><div class="lk-mm-focus"><div id="lkMmFocusText"><strong>${mmEsc(t.title)}</strong> · Aufgabe auswählen</div><button type="button" class="secondary compact" id="lkMmEditScoring">Punkte & AFB</button></div><div class="lk-mm-tablewrap" id="lkMmTableWrap"><table class="lk-mm-matrix"><thead><tr><th>Kind</th>${t.tasks.map((task,i)=>{const c=mmConfig(t.id,task.id);return `<th data-mm-head="${i}"><b>A${task.id}</b><span>${mmEsc(task.label)}</span><small>${c.afb} · ${c.max} P.</small></th>`}).join('')}</tr></thead><tbody>${kids.map((ch,ci)=>`<tr data-mm-row="${ci}"><td class="lk-mm-name">${mmEsc(mmChildName(ch))}</td>${t.tasks.map((task,ti)=>{const c=mmConfig(t.id,task.id),v=mmGetPoint(t.id,task.id,ch.id);return `<td data-mm-cell="${ti}"><div class="lk-mm-point"><input type="number" min="0" max="${c.max}" step="0.5" value="${v}" data-mm-point data-test="${t.id}" data-task="${task.id}" data-task-index="${ti}" data-child-index="${ci}" data-child="${mmAttr(ch.id)}"><span>/ ${c.max}</span></div></td>`}).join('')}</tr>`).join('')}</tbody></table></div></section>`;
  }

  function mmScoringEditor(t){const s=mmStats(t);return `<section class="panel lk-mm-score"><div class="lk-mm-scorehead"><div><h3>Bewertungsschlüssel anpassen</h3><p>Maximalpunkte und Anforderungsbereich können nachträglich verändert werden.</p></div><button class="secondary" type="button" id="lkMmCloseScore">Schließen</button></div><div class="lk-mm-afb"><b>${s.total} P. gesamt</b>${['I','II','III'].map(a=>`<span>AFB ${a}: ${s.by[a]} P. (${s.total?Math.round(s.by[a]/s.total*100):0} %)</span>`).join('')}</div>${t.tasks.map(task=>{const c=mmConfig(t.id,task.id);return `<div class="lk-mm-scorerow"><b>A${task.id}</b><span>${mmEsc(task.label)}</span><label>Max. <input type="number" min="0.5" step="0.5" data-mm-max="${task.id}" value="${c.max}"></label><label>AFB <select data-mm-afb="${task.id}"><option ${c.afb==='I'?'selected':''}>I</option><option ${c.afb==='II'?'selected':''}>II</option><option ${c.afb==='III'?'selected':''}>III</option></select></label></div>`}).join('')}<div class="backup-actions"><button class="primary" type="button" id="lkMmSaveScore">Änderungen speichern</button><button class="secondary" type="button" id="lkMmResetScore">Vorschlag wiederherstellen</button></div></section>`;}

  function mmChild(){const kids=mmChildren(); if(!kids.length)return `<section class="panel">Keine Kinder angelegt.</section>`; if(!kids.some(k=>k.id===mmSelectedChildId))mmSelectedChildId=kids[0].id;const id=mmSelectedChildId;return `<div class="lk-mm-title"><h3>Kindansicht</h3><div class="lk-mm-actions"><label>Kind <select id="lkMmChildSelect">${kids.map(k=>`<option value="${mmAttr(k.id)}" ${k.id===id?'selected':''}>${mmEsc(mmChildName(k))}</option>`).join('')}</select></label><button type="button" class="secondary" id="lkMmPrintChildTest">Test drucken</button><button type="button" class="secondary" id="lkMmPrintChildAll">Gesamt drucken</button></div></div><section class="panel lk-mm-key"><b>Kompetenzbewertung</b><span>85–100 % = ++ gesichert</span><span>70–84 % = + weitgehend gesichert</span><span>40–69 % = − teilweise gesichert</span><span>0–39 % = O Übungsbedarf</span></section>${TESTS.map(t=>{const s=mmSummary(t,id);if(!s.filled)return'';return `<section class="panel lk-mm-childtest"><div class="lk-mm-testhead"><div><h3>Teste dich ${t.id} – ${mmEsc(t.title)}</h3><div class="lk-mm-afb">${['I','II','III'].map(a=>`<span>AFB ${a}: ${s.afb[a][0]}/${s.afb[a][1]}</span>`).join('')}</div></div>${s.complete?`<div class="lk-mm-grade"><b>Note ${s.grade}</b><span>${s.earned}/${s.max} P. · ${s.pct}%</span></div>`:`<div class="lk-mm-grade open"><b>Noch keine Note</b><span>${s.filled}/${s.total} Aufgaben</span></div>`}</div>${t.tasks.map(task=>{const c=mmConfig(t.id,task.id),v=mmGetPoint(t.id,task.id,id);if(v==='')return `<div class="lk-mm-comp"><span><b>A${task.id}</b> ${mmEsc(task.label)} <small>AFB ${c.afb}</small></span><em class="blank">leer</em></div>`;const pct=Math.round(Math.min(+v,c.max)/c.max*100),r=mmComp(pct);return `<div class="lk-mm-comp"><span><b>A${task.id}</b> ${mmEsc(task.label)} <small>AFB ${c.afb} · ${v}/${c.max} P.</small></span><em class="${r[2]}">${r[0]} ${r[1]}</em></div>`}).join('')}</section>`}).join('')||'<section class="panel">Noch keine Punkte eingetragen.</section>'}`;}

  function mmClass(){const t=mmTest(),kids=mmChildren();return `<div class="lk-mm-title"><h3>Klasse · Teste dich ${t.id}</h3><div class="lk-mm-actions"><button class="secondary" type="button" id="lkMmPrintAllChildCompetencies">Einzelansichten drucken</button><button class="secondary" type="button" id="lkMmPrintCompetencyOverview">Kompetenzübersicht drucken</button><button class="secondary" type="button" id="lkMmPrintClassAll">Gesamt drucken</button></div></div><div class="lk-mm-grid">${t.tasks.map(task=>{const c=mmConfig(t.id,task.id),cnt={pp:0,p:0,m:0,o:0,blank:0};kids.forEach(ch=>{const v=mmGetPoint(t.id,task.id,ch.id);if(v==='')cnt.blank++;else cnt[mmComp(Math.round(Math.min(+v,c.max)/c.max*100))[2]]++});return `<section class="panel lk-mm-card"><h3>A${task.id} · ${mmEsc(task.label)}</h3><p>AFB ${c.afb} · max. ${c.max} Punkte</p><div class="lk-mm-bars"><span><b>${cnt.pp}</b> ++</span><span><b>${cnt.p}</b> +</span><span><b>${cnt.m}</b> −</span><span><b>${cnt.o}</b> O</span><span><b>${cnt.blank}</b> leer</span></div></section>`}).join('')}</div>`;}

  function mmInfo(){return `<section class="panel lk-mm-info"><h3>Berechnung und Bewertung</h3><p><strong>Punkte:</strong> Die hinterlegten Maximalpunkte orientieren sich an den sichtbaren Leistungseinheiten. Bei mehrschrittigen Aufgaben werden Rechenschritte berücksichtigt; Ergebnisübertragungen können 0,5 Punkte erhalten. Sehr umfangreiche reine Übungsserien wurden reduziert, damit sie das Gesamtergebnis nicht unverhältnismäßig dominieren.</p><h4>Kompetenzstufen</h4><p>85–100 % = <strong>++ gesichert</strong><br>70–84 % = <strong>+ weitgehend gesichert</strong><br>40–69 % = <strong>− teilweise gesichert</strong><br>0–39 % = <strong>O Übungsbedarf</strong></p><h4>Notenschlüssel</h4><p>91–100 % = 1 · 80–90 % = 2 · 65–79 % = 3 · 50–64 % = 4 · 11–49 % = 5 · 0–10 % = 6</p><h4>Anforderungsbereiche</h4><p>AFB I, II und III werden diagnostisch ausgewiesen, aber nicht zusätzlich gewichtet. Vorrangig wird dokumentiert, ob die Kompetenzen beherrscht werden. Die Zuordnungen und Maximalpunkte sind ein pädagogischer Vorschlag und können unter „Punkte & AFB bearbeiten“ verändert werden.</p><h4>Speicherung</h4><p>Die Teste-dich-Daten gehören jetzt zum Lernstand-Kompass und werden zusammen mit dessen Daten gespeichert und gesichert. Die Kinder werden aus der aktuell gewählten Klasse übernommen; sie müssen nicht doppelt angelegt werden.</p></section>`;}

  function mmRender(){setTimeout(mmBind,0);return `<div class="lk-mm">${mmHeader()}${mmView==='entry'?mmEntry():mmView==='child'?mmChild():mmView==='class'?mmClass():mmInfo()}</div>`;}

  function mmFocusInput(inp){const wrap=document.getElementById('lkMmTableWrap');if(!wrap)return;const td=inp.closest('td');const th=document.querySelector(`[data-mm-head="${inp.dataset.taskIndex}"]`);td?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'smooth'});th?.classList.add('focus');document.querySelectorAll('[data-mm-head].focus').forEach(x=>{if(x!==th)x.classList.remove('focus')});const kid=mmChildren()[+inp.dataset.childIndex],task=mmTest().tasks[+inp.dataset.taskIndex],c=mmConfig(mmSelectedTest,task.id);const bar=document.getElementById('lkMmFocusText');if(bar)bar.innerHTML=`<strong>${mmEsc(mmChildName(kid))}</strong> · A${task.id}: ${mmEsc(task.label)} · max. ${c.max} P.`;}

  function mmBind(){
    const root=document.querySelector('.lk-mm'); if(!root)return;
    root.querySelectorAll('[data-mm-view]').forEach(b=>b.onclick=()=>{mmView=b.dataset.mmView;mmScoringOpen=false;render()});
    const test=root.querySelector('#lkMmTestSelect');if(test)test.onchange=()=>{mmSelectedTest=+test.value;mmScoringOpen=false;render()};
    const child=root.querySelector('#lkMmChildSelect');if(child)child.onchange=()=>{mmSelectedChildId=child.value;render()};
    const edit=root.querySelector('#lkMmEditScoring');if(edit)edit.onclick=()=>{mmScoringOpen=!mmScoringOpen;render()};
    const close=root.querySelector('#lkMmCloseScore');if(close)close.onclick=()=>{mmScoringOpen=false;render()};
    const save=root.querySelector('#lkMmSaveScore');if(save)save.onclick=async()=>{const scoring=structuredClone(mmScoring());scoring[mmClassId()] ||= {};scoring[mmClassId()][mmSelectedTest] ||= {};mmTest().tasks.forEach(task=>{scoring[mmClassId()][mmSelectedTest][task.id]={max:Math.max(.5,+root.querySelector(`[data-mm-max="${task.id}"]`).value||task.defaultMax),afb:root.querySelector(`[data-mm-afb="${task.id}"]`).value}});await mmSavePatch({minimaxTestScoring:scoring});mmScoringOpen=false;render()};
    const reset=root.querySelector('#lkMmResetScore');if(reset)reset.onclick=async()=>{const scoring=structuredClone(mmScoring());if(scoring[mmClassId()])delete scoring[mmClassId()][mmSelectedTest];await mmSavePatch({minimaxTestScoring:scoring});render()};
    root.querySelectorAll('[data-mm-point]').forEach(inp=>{
      inp.onfocus=()=>mmFocusInput(inp);
      inp.onchange=async()=>{const value=inp.value===''?'':Math.min(+inp.value,+inp.max);inp.value=value;await mmSetPoint(+inp.dataset.test,+inp.dataset.task,inp.dataset.child,value);};
      inp.onkeydown=e=>{if(e.key!=='Tab')return;e.preventDefault();const kids=mmChildren(),cols=mmTest().tasks.length;let ci=+inp.dataset.childIndex,ti=+inp.dataset.taskIndex+(e.shiftKey?-1:1);if(ti>=cols){ti=0;ci=Math.min(ci+1,kids.length-1)}if(ti<0){ti=cols-1;ci=Math.max(ci-1,0)}const next=root.querySelector(`[data-mm-point][data-child-index="${ci}"][data-task-index="${ti}"]`);if(next){next.focus();next.select();mmFocusInput(next)}};
    });
    root.querySelector('#lkMmPrintChildTest')?.addEventListener('click',()=>mmPrintChild(mmSelectedChildId,mmSelectedTest,false));
    root.querySelector('#lkMmPrintChildAll')?.addEventListener('click',()=>mmPrintChild(mmSelectedChildId,mmSelectedTest,true));
    root.querySelector('#lkMmPrintAllChildCompetencies')?.addEventListener('click',()=>mmPrintAllChildCompetencies());
    root.querySelector('#lkMmPrintCompetencyOverview')?.addEventListener('click',()=>mmPrintCompetencyOverview());
    root.querySelector('#lkMmPrintClassAll')?.addEventListener('click',()=>mmPrintClass(true));
  }

  function mmPrintWindow(title,body,landscape=false,multipage=false){const w=window.open('','_blank','width=1100,height=800');if(!w){alert('Druckfenster wurde blockiert.');return}w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${mmEsc(title)}</title><style>@page{size:A4 ${landscape?'landscape':''};margin:10mm}body{font-family:Arial,sans-serif;font-size:10px;color:#222}h1{font-size:20px;margin:0 0 4px}h2{font-size:14px;margin:0 0 8px}p{margin:4px 0 8px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #aaa;padding:4px;vertical-align:top}th{background:#eef4f6}.num{text-align:center}.small{font-size:8px;color:#555}.legend{margin:8px 0 10px}.child-page{${multipage?'break-after:page;page-break-after:always;':''}}.child-page:last-child{break-after:auto;page-break-after:auto}.overview{font-size:8px}.overview .competency{min-width:170px;text-align:left}.overview .kidhead{writing-mode:vertical-rl;transform:rotate(180deg);height:90px;white-space:nowrap;text-align:left}</style></head><body>${body}<script>onload=()=>setTimeout(()=>print(),150)<\/script></body></html>`);w.document.close()}
  function mmPrintChild(id,testId,all){const ch=mmChildren().find(x=>x.id===id);if(!ch)return;if(!all){const t=TESTS.find(x=>x.id===testId),s=mmSummary(t,id);const rows=t.tasks.map(task=>{const c=mmConfig(t.id,task.id),v=mmGetPoint(t.id,task.id,id),pct=v===''?'':Math.round(Math.min(+v,c.max)/c.max*100),r=v===''?['–','']:mmComp(pct);return `<tr><td>A${task.id}</td><td>${mmEsc(task.label)}</td><td class="num">${c.afb}</td><td class="num">${v===''?'–':v+'/'+c.max}</td><td>${v===''?'–':r[0]+' '+r[1]}</td></tr>`}).join('');mmPrintWindow(`${mmChildName(ch)} – Teste dich ${t.id}`,`<h1>${mmEsc(mmChildName(ch))}</h1><p>Teste dich ${t.id} – ${mmEsc(t.title)}</p><p><b>${s.complete?'Note '+s.grade:'noch unvollständig'}</b> · ${s.earned}/${s.max} Punkte · ${s.pct}%</p><table><tr><th>Aufgabe</th><th>Kompetenz</th><th>AFB</th><th>Punkte</th><th>Kompetenzstand</th></tr>${rows}</table>`)}else{const rows=TESTS.map(t=>{const s=mmSummary(t,id);return `<tr><td>${t.id}</td><td>${mmEsc(t.title)}</td><td>${s.filled?s.earned+'/'+s.max:'–'}</td><td>${s.filled?s.pct+'%':'–'}</td><td>${s.complete?s.grade:'–'}</td></tr>`}).join('');mmPrintWindow(`${mmChildName(ch)} – Gesamtübersicht`,`<h1>${mmEsc(mmChildName(ch))}</h1><p>MiniMax 2 · Teste dich 1–24</p><table><tr><th>Nr.</th><th>Test</th><th>Punkte</th><th>%</th><th>Note</th></tr>${rows}</table>`)}}

  function mmPrintAllChildCompetencies(){
    const t=mmTest(),kids=mmChildren();
    const legend=`<div class="legend"><b>Kompetenzstufen:</b> ++ gesichert · + weitgehend gesichert · − teilweise gesichert · O Übungsbedarf</div>`;
    const pages=kids.map((ch,idx)=>{
      const s=mmSummary(t,ch.id);
      const rows=t.tasks.map(task=>{
        const c=mmConfig(t.id,task.id),v=mmGetPoint(t.id,task.id,ch.id);
        const pct=v===''?'':Math.round(Math.min(+v,c.max)/c.max*100),r=v===''?['–','']:mmComp(pct);
        return `<tr><td>A${task.id}</td><td>${mmEsc(task.label)}</td><td class="num">${c.afb}</td><td class="num">${v===''?'–':v+'/'+c.max}</td><td class="num">${v===''?'–':pct+'%'}</td><td>${v===''?'–':r[0]+' '+r[1]}</td></tr>`
      }).join('');
      return `<section class="child-page"><h1>${mmEsc(mmChildName(ch))}</h1><h2>Teste dich ${t.id} · ${mmEsc(t.title)}</h2><p><b>${s.complete?'Note '+s.grade:'noch unvollständig'}</b>${s.filled?' · '+s.earned+'/'+s.max+' Punkte · '+s.pct+'%':''}</p>${legend}<table><tr><th>Aufgabe</th><th>Kompetenz</th><th>AFB</th><th>Punkte</th><th>%</th><th>Kompetenzstand</th></tr>${rows}</table></section>`
    }).join('');
    mmPrintWindow(`Einzelansichten · Teste dich ${t.id}`,pages,false,true);
  }

  function mmPrintCompetencyOverview(){
    const t=mmTest(),kids=mmChildren();
    const head=kids.map(ch=>`<th class="kidhead">${mmEsc(mmChildName(ch))}</th>`).join('');
    const rows=t.tasks.map(task=>{
      const c=mmConfig(t.id,task.id);
      const cells=kids.map(ch=>{
        const v=mmGetPoint(t.id,task.id,ch.id);
        if(v==='')return `<td class="num">–</td>`;
        const pct=Math.round(Math.min(+v,c.max)/c.max*100),r=mmComp(pct);
        return `<td class="num"><b>${r[0]}</b><div class="small">${pct}%</div></td>`
      }).join('');
      return `<tr><th class="competency"><b>A${task.id}</b> ${mmEsc(task.label)}<div class="small">AFB ${c.afb} · ${c.max} P.</div></th>${cells}</tr>`
    }).join('');
    const legend=`<p class="legend"><b>Legende:</b> ++ gesichert · + weitgehend gesichert · − teilweise gesichert · O Übungsbedarf · – nicht erfasst</p>`;
    mmPrintWindow(`Kompetenzübersicht · Teste dich ${t.id}`,`<h1>Kompetenzübersicht · Teste dich ${t.id}</h1><p>${mmEsc(t.title)}</p>${legend}<table class="overview"><tr><th>Kompetenz</th>${head}</tr>${rows}</table>`,true);
  }

  function mmPrintClass(all){const kids=mmChildren();if(!all){const t=mmTest();const head=t.tasks.map(x=>`<th>A${x.id}</th>`).join('');const rows=kids.map(ch=>`<tr><td>${mmEsc(mmChildName(ch))}</td>${t.tasks.map(task=>{const c=mmConfig(t.id,task.id),v=mmGetPoint(t.id,task.id,ch.id);if(v==='')return'<td>–</td>';const r=mmComp(Math.round(Math.min(+v,c.max)/c.max*100));return `<td>${r[0]}<div class="small">${v}/${c.max}</div></td>`}).join('')}<td>${mmSummary(t,ch.id).complete?'Note '+mmSummary(t,ch.id).grade:'–'}</td></tr>`).join('');mmPrintWindow(`Klasse – Teste dich ${t.id}`,`<h1>Klassenübersicht · Teste dich ${t.id}</h1><p>${mmEsc(t.title)}</p><table><tr><th>Kind</th>${head}<th>Gesamt</th></tr>${rows}</table>`,true)}else{const head=TESTS.map(t=>`<th>T${t.id}</th>`).join('');const rows=kids.map(ch=>`<tr><td>${mmEsc(mmChildName(ch))}</td>${TESTS.map(t=>{const s=mmSummary(t,ch.id);return `<td>${s.complete?s.grade:'–'}<div class="small">${s.filled?s.pct+'%':''}</div></td>`}).join('')}</tr>`).join('');mmPrintWindow('Klasse – Teste dich Gesamtübersicht',`<h1>Gesamtklassenübersicht</h1><p>MiniMax 2 · Teste dich 1–24</p><table><tr><th>Kind</th>${head}</tr>${rows}</table>`,true)}}

  // Navigation unter Lernübersicht ergänzen.
  const learning=TEACHER_GROUPS.find(g=>g.id==='learning');
  if(learning && !learning.sections.some(s=>s[0]==='minimaxTests')) learning.sections.push(['minimaxTests','Teste dich']);
  const baseRender=renderTeacherSection;
  renderTeacherSection=function(tab){if(tab==='minimaxTests')return mmRender();return baseRender(tab)};
})();
