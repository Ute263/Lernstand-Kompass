/* Paket 9p: Lernübersicht auf Klasse + Kind reduzieren */
(() => {
  if (
    typeof TEACHER_GROUPS === "undefined" ||
    typeof renderOverview !== "function" ||
    typeof renderProgress !== "function"
  ) {
    console.warn("Paket 9p konnte nicht initialisiert werden.");
    return;
  }

  const learningGroup = TEACHER_GROUPS.find((group) => group.id === "learning");
  if (learningGroup) {
    learningGroup.sections.splice(
      0,
      learningGroup.sections.length,
      ["overview", "Klassenübersicht"],
      ["progress", "Kindübersicht"]
    );
  }

  let lkSelectedLearningAnimalId = "";

  function animals() {
    try {
      return animalsForActiveClass()
        .filter((animal) => animal.aktiv !== false)
        .sort((a, b) => String(a.firstName || a.tierName || "").localeCompare(
          String(b.firstName || b.tierName || ""), "de", { numeric: true }
        ));
    } catch {
      return (state.animals || [])
        .filter((animal) => animal.classId === state.activeClassId && animal.aktiv !== false);
    }
  }

  function animalName(animal) {
    if (!animal) return "Kind";
    return animal.firstName || animal.tierName || "Kind";
  }

  function animalSubline(animal) {
    if (!animal?.firstName || !animal?.tierName) return "";
    return animal.tierName;
  }

  function entryAnimalId(entry) {
    return entry?.tierID || entry?.animalId || entry?.tierId || "";
  }

  function timestamp(item) {
    const value = item?.updatedAt || item?.datumUhrzeit || item?.completedAt ||
      item?.finishedAt || item?.createdAt || item?.startedAt || "";
    const ms = Date.parse(value);
    return Number.isFinite(ms) ? ms : 0;
  }

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return "";
    return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" }).format(date);
  }

  function entriesFor(animalId) {
    return (state.entries || [])
      .filter((entry) => entry.classId === state.activeClassId && entryAnimalId(entry) === animalId)
      .sort((a, b) => timestamp(b) - timestamp(a));
  }

  function latestFor(animalId, subject) {
    return entriesFor(animalId).find((entry) => String(entry.fach || entry.subject || "") === subject) || null;
  }

  function pageLabel(entry) {
    if (!entry) return "";
    const explicit = entry.catalogPages || entry.pages || entry.pageText || "";
    if (explicit) return /^S\./i.test(String(explicit)) ? String(explicit) : `S. ${explicit}`;
    const from = Number(entry.seiteVon || 0);
    const to = Number(entry.seiteBis || entry.seite || from || 0);
    if (from && to && to > from) return `S. ${from}–${to}`;
    if (to) return `S. ${to}`;
    return "";
  }

  function entryTitle(entry) {
    if (!entry) return "Noch kein Eintrag";
    return [
      entry.materialName || entry.material || "",
      pageLabel(entry),
      entry.topic || entry.displayTitle || entry.topicTitle || ""
    ].filter(Boolean).join(" · ");
  }

  function pendingFor(animalId) {
    const reports = (state.childWorkbookReports || []).filter((item) =>
      item.classId === state.activeClassId &&
      item.animalId === animalId &&
      (item.reviewStatus === "wartet" || item.status === "offen")
    );
    const assignments = (state.workbookAssignmentStatuses || []).filter((item) =>
      item.classId === state.activeClassId &&
      item.animalId === animalId &&
      item.markedByChild === true &&
      item.reviewStatus === "wartet"
    );
    const weekly = (state.weeklyPlanStatuses || []).filter((item) =>
      item.classId === state.activeClassId &&
      item.animalId === animalId &&
      item.markedByChild === true &&
      item.reviewStatus === "wartet"
    );
    const help = entriesFor(animalId).filter((entry) =>
      entry.erledigt !== true &&
      ["brauche Hilfe", "bitte kontrollieren"].includes(entry.status)
    );
    return { reports, assignments, weekly, help, count: reports.length + assignments.length + weekly.length + help.length };
  }

  function subjectMini(animalId, subject, icon) {
    const entry = latestFor(animalId, subject);
    return `
      <div class="lk-simple-subject-mini">
        <span>${icon}</span>
        <div>
          <strong>${escapeHtml(subject)}</strong>
          <small>${escapeHtml(entry ? entryTitle(entry) : "noch kein Eintrag")}</small>
        </div>
      </div>
    `;
  }

  renderOverview = function renderSimpleClassOverview() {
    const list = animals();
    const attention = list.reduce((sum, animal) => sum + (pendingFor(animal.id).count ? 1 : 0), 0);

    return `
      <section class="panel lk-simple-learning-head">
        <div>
          <p class="lk-simple-kicker">Lernübersicht</p>
          <h2>Klassenübersicht</h2>
          <p class="message">Klicke ein Kind an, um seinen Lernstand zu öffnen.</p>
        </div>
        <div class="lk-simple-class-stats">
          <span><b>${list.length}</b> Kinder</span>
          ${attention ? `<span class="attention"><b>${attention}</b> mit Hinweis</span>` : `<span class="clear">✓ keine offenen Hinweise</span>`}
        </div>
      </section>

      <section class="lk-simple-child-grid">
        ${list.map((animal) => {
          const pending = pendingFor(animal.id);
          const sub = animalSubline(animal);
          return `
            <button class="lk-simple-child-card ${pending.count ? "has-attention" : ""}" type="button"
              onclick="lkOpenChildOverview('${escapeAttribute(animal.id)}')">
              <div class="lk-simple-child-title">
                <span class="lk-simple-animal">${escapeHtml(animal.tierEmoji || "🐾")}</span>
                <div>
                  <strong>${escapeHtml(animalName(animal))}</strong>
                  ${sub ? `<small>${escapeHtml(sub)}</small>` : ""}
                </div>
                ${pending.count ? `<em>${pending.count}</em>` : ""}
              </div>
              ${subjectMini(animal.id, "Deutsch", "📘")}
              ${subjectMini(animal.id, "Mathe", "🔢")}
              <span class="lk-simple-open-label">Kindübersicht öffnen →</span>
            </button>
          `;
        }).join("")}
      </section>
    `;
  };

  function renderCurrentSubject(animalId, subject, icon) {
    const entry = latestFor(animalId, subject);
    return `
      <article class="lk-simple-current-card">
        <div class="lk-simple-current-head"><span>${icon}</span><h3>${escapeHtml(subject)}</h3></div>
        ${entry ? `
          <strong>${escapeHtml(entryTitle(entry))}</strong>
          <small>${escapeHtml(formatDate(entry.updatedAt || entry.datumUhrzeit || entry.createdAt))}</small>
        ` : `<p class="message">Noch kein Lernstand eingetragen.</p>`}
      </article>
    `;
  }

  function renderAttention(animalId) {
    const pending = pendingFor(animalId);
    const rows = [];

    pending.help.slice(0, 5).forEach((entry) => {
      rows.push(`
        <div class="lk-simple-notice ${entry.status === "brauche Hilfe" ? "help" : "check"}">
          <span>${entry.status === "brauche Hilfe" ? "🟡" : "🔵"}</span>
          <div><strong>${escapeHtml(entry.status === "brauche Hilfe" ? "Braucht Hilfe" : "Bitte kontrollieren")}</strong>
          <small>${escapeHtml(entryTitle(entry))}</small></div>
        </div>
      `);
    });

    if (pending.reports.length + pending.assignments.length + pending.weekly.length) {
      rows.push(`
        <div class="lk-simple-notice">
          <span>📥</span>
          <div><strong>${pending.reports.length + pending.assignments.length + pending.weekly.length} Rückmeldung${pending.reports.length + pending.assignments.length + pending.weekly.length === 1 ? "" : "en"} warten</strong>
          <small>Vom Kind gemeldete oder markierte Aufgaben</small></div>
        </div>
      `);
    }

    return rows.length
      ? rows.join("")
      : `<div class="lk-simple-clear"><span>✓</span><div><strong>Keine offenen Hinweise</strong><small>Gerade ist nichts zu prüfen.</small></div></div>`;
  }

  function renderRecent(animalId) {
    const recent = entriesFor(animalId).slice(0, 8);
    if (!recent.length) return `<div class="empty">Noch keine Einträge vorhanden.</div>`;

    return `
      <div class="lk-simple-history">
        ${recent.map((entry) => `
          <div class="lk-simple-history-row">
            <span class="lk-simple-history-subject">${String(entry.fach || entry.subject || "") === "Mathe" ? "🔢" : "📘"}</span>
            <div>
              <strong>${escapeHtml(entryTitle(entry))}</strong>
              <small>${escapeHtml(entry.fach || entry.subject || "")}</small>
            </div>
            <time>${escapeHtml(formatDate(entry.updatedAt || entry.datumUhrzeit || entry.createdAt))}</time>
          </div>
        `).join("")}
      </div>
    `;
  }

  renderProgress = function renderSimpleChildOverview() {
    const list = animals();
    const selected = list.find((animal) => animal.id === lkSelectedLearningAnimalId)
      || list.find((animal) => animal.id === progressFilters?.animalId)
      || list[0]
      || null;

    if (!selected) {
      return `<section class="panel"><h2>Kindübersicht</h2><div class="empty">Keine Kinder in der aktiven Klasse.</div></section>`;
    }

    lkSelectedLearningAnimalId = selected.id;
    try { progressFilters = { ...progressFilters, animalId: selected.id }; } catch {}

    return `
      <section class="panel lk-simple-child-hero">
        <button class="secondary small-button" type="button" onclick="lkBackToClassOverview()">← Klassenübersicht</button>
        <div class="lk-simple-child-identity">
          <span>${escapeHtml(selected.tierEmoji || "🐾")}</span>
          <div>
            <p class="lk-simple-kicker">Kindübersicht</p>
            <h2>${escapeHtml(animalName(selected))}</h2>
            ${animalSubline(selected) ? `<small>${escapeHtml(animalSubline(selected))}</small>` : ""}
          </div>
        </div>
        <label class="lk-simple-child-picker">
          <span>Kind wechseln</span>
          <select class="select-input" onchange="lkOpenChildOverview(this.value)">
            ${list.map((animal) => `<option value="${escapeAttribute(animal.id)}" ${animal.id === selected.id ? "selected" : ""}>${escapeHtml(`${animal.tierEmoji || ""} ${animalName(animal)}`.trim())}</option>`).join("")}
          </select>
        </label>
      </section>

      <section class="lk-simple-current-grid">
        ${renderCurrentSubject(selected.id, "Deutsch", "📘")}
        ${renderCurrentSubject(selected.id, "Mathe", "🔢")}
      </section>

      <section class="panel">
        <h2>Offene Hinweise</h2>
        <div class="lk-simple-notices">${renderAttention(selected.id)}</div>
      </section>

      <section class="panel">
        <div class="lk-simple-section-head">
          <div><h2>Zuletzt bearbeitet</h2><p class="message">Die letzten Lernstandseinträge dieses Kindes.</p></div>
        </div>
        ${renderRecent(selected.id)}
      </section>
    `;
  };

  window.lkOpenChildOverview = function lkOpenChildOverview(animalId) {
    lkSelectedLearningAnimalId = animalId || "";
    try {
      progressFilters = { ...progressFilters, animalId: lkSelectedLearningAnimalId };
      progressDetailAnimalId = lkSelectedLearningAnimalId;
    } catch {}
    teacherTab = "progress";
    globalMessage = "";
    render();
  };

  window.lkBackToClassOverview = function lkBackToClassOverview() {
    teacherTab = "overview";
    globalMessage = "";
    render();
  };

  const hiddenLearningTabs = new Set([
    "pendingReports", "activeMaterials", "workbookAssignments", "workDone",
    "workbookCatalog", "today", "help", "history"
  ]);
  const baseSetTeacherTab = typeof setTeacherTab === "function" ? setTeacherTab : null;
  if (baseSetTeacherTab) {
    setTeacherTab = function setTeacherTab9p(tab) {
      if (hiddenLearningTabs.has(tab)) tab = "overview";
      return baseSetTeacherTab(tab);
    };
  }

  const style = document.createElement("style");
  style.id = "lk-simple-learning-style";
  style.textContent = `
    .lk-simple-learning-head,.lk-simple-child-hero{display:flex;justify-content:space-between;align-items:center;gap:18px}
    .lk-simple-kicker{margin:0 0 3px;font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em;opacity:.55}
    .lk-simple-learning-head h2,.lk-simple-child-hero h2{margin:.1rem 0}
    .lk-simple-class-stats{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}
    .lk-simple-class-stats span{padding:7px 10px;border-radius:999px;background:rgba(47,111,145,.07);font-size:.78rem}
    .lk-simple-class-stats .attention{background:#fff0c8;color:#7b581a}.lk-simple-class-stats .clear{background:#e9f6ec;color:#356e43}
    .lk-simple-child-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:12px}
    .lk-simple-child-card{display:grid;gap:8px;text-align:left;border:1.5px solid rgba(0,0,0,.08);border-radius:17px;background:#fff;padding:13px;color:inherit;font:inherit;cursor:pointer;transition:.15s}
    .lk-simple-child-card:hover{transform:translateY(-1px);border-color:rgba(77,111,220,.36);box-shadow:0 6px 18px rgba(40,70,110,.08)}
    .lk-simple-child-card.has-attention{border-color:rgba(201,150,36,.32)}
    .lk-simple-child-title{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:9px;align-items:center;padding-bottom:7px;border-bottom:1px solid rgba(0,0,0,.05)}
    .lk-simple-child-title>div{display:grid}.lk-simple-child-title strong{font-size:1rem}.lk-simple-child-title small{opacity:.55;font-size:.72rem}
    .lk-simple-child-title em{min-width:25px;height:25px;display:grid;place-items:center;border-radius:999px;background:#fff0c8;color:#7b581a;font-style:normal;font-size:.72rem;font-weight:800}
    .lk-simple-animal{font-size:1.45rem}.lk-simple-subject-mini{display:grid;grid-template-columns:auto minmax(0,1fr);gap:7px;align-items:start}
    .lk-simple-subject-mini>div{display:grid;gap:1px;min-width:0}.lk-simple-subject-mini strong{font-size:.76rem}.lk-simple-subject-mini small{font-size:.72rem;opacity:.67;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .lk-simple-open-label{font-size:.7rem;color:#526fd7;font-weight:750;margin-top:2px}
    .lk-simple-child-identity{display:flex;align-items:center;gap:10px;flex:1}.lk-simple-child-identity>span{font-size:2rem}.lk-simple-child-identity small{opacity:.55}
    .lk-simple-child-picker{min-width:230px}.lk-simple-child-picker>span{display:block;margin-bottom:4px;font-size:.7rem;font-weight:800;opacity:.55}
    .lk-simple-current-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:12px 0}
    .lk-simple-current-card{display:grid;gap:5px;padding:15px;border:1px solid rgba(0,0,0,.08);border-radius:17px;background:#fff}
    .lk-simple-current-head{display:flex;align-items:center;gap:8px}.lk-simple-current-head h3{margin:0}.lk-simple-current-card>small{opacity:.55}
    .lk-simple-notices{display:grid;gap:7px}.lk-simple-notice,.lk-simple-clear{display:grid;grid-template-columns:auto minmax(0,1fr);gap:9px;align-items:center;padding:10px 12px;border-radius:13px;background:rgba(47,111,145,.05)}
    .lk-simple-notice.help{background:#fff5d9}.lk-simple-notice.check{background:#eaf3ff}.lk-simple-notice>div,.lk-simple-clear>div{display:grid}.lk-simple-notice small,.lk-simple-clear small{opacity:.62}
    .lk-simple-clear{background:#eaf7ed}.lk-simple-clear>span{color:#356e43;font-weight:900}
    .lk-simple-history{display:grid}.lk-simple-history-row{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:9px;align-items:center;padding:9px 3px;border-bottom:1px solid rgba(0,0,0,.06)}
    .lk-simple-history-row:last-child{border-bottom:0}.lk-simple-history-row>div{display:grid;min-width:0}.lk-simple-history-row strong{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.lk-simple-history-row small,.lk-simple-history-row time{font-size:.72rem;opacity:.55}
    @media(max-width:1000px){.lk-simple-child-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:680px){.lk-simple-learning-head,.lk-simple-child-hero{align-items:flex-start;flex-direction:column}.lk-simple-class-stats{justify-content:flex-start}.lk-simple-child-grid,.lk-simple-current-grid{grid-template-columns:1fr}.lk-simple-child-picker{width:100%;min-width:0}}
  `;
  if (!document.getElementById(style.id)) document.head.appendChild(style);
})();
