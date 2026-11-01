/* Paket 4: Klassen-Posteingang
 *
 * Baut auf dem vorhandenen Bereich "Von Kindern gemeldet" auf.
 * Neue Meldungen werden oben als Posteingang zusammengeführt:
 * - Kindmeldungen zu Arbeitsmaterial
 * - Wochenplan-Markierungen
 * - Zuweisungs-Markierungen
 * - Lernspiele beendet
 * - Lernspiele gestartet / Fortschritt / abgebrochen
 *
 * "Gesehen" ist bewusst getrennt von "bestätigt":
 * Eine Meldung kann gelesen sein, aber weiterhin auf fachliche Bestätigung warten.
 */
(() => {
  if (typeof renderPendingReportsDashboard !== "function") {
    console.warn("Klassen-Posteingang konnte nicht initialisiert werden.");
    return;
  }

  const baseRenderPendingReportsDashboard = renderPendingReportsDashboard;
  const baseRenderTeacher = typeof renderTeacher === "function" ? renderTeacher : null;

  let lkInboxFilter = "new";

  function inboxSeenMap() {
    return state?.teacherInboxSeen && typeof state.teacherInboxSeen === "object"
      ? state.teacherInboxSeen
      : {};
  }

  function eventTimeValue(event) {
    const ms = Date.parse(event.timestamp || "");
    return Number.isFinite(ms) ? ms : 0;
  }

  function isInboxEventNew(event) {
    const seenAt = inboxSeenMap()[event.key];
    if (!seenAt) return true;
    const seenMs = Date.parse(seenAt);
    return !Number.isFinite(seenMs) || eventTimeValue(event) > seenMs;
  }

  function activeAnimal(animalId) {
    return (state.animals || []).find((animal) => (
      animal.id === animalId && animal.classId === state.activeClassId
    )) || null;
  }

  function animalLabel(animalId) {
    const animal = activeAnimal(animalId);
    if (!animal) return "Tier";
    if (typeof teacherAnimalLabel === "function") return teacherAnimalLabel(animal);
    return `${animal.tierEmoji || ""} ${animal.tierName || "Tier"}`.trim();
  }

  function safeDate(value) {
    if (!value) return "–";
    if (typeof formatDateTime === "function") return formatDateTime(value);
    try {
      return new Intl.DateTimeFormat("de-DE", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date(value));
    } catch {
      return value;
    }
  }

  function statusIcon(status) {
    const value = String(status || "").toLocaleLowerCase("de-DE");
    if (value.includes("hilfe")) return "🟡";
    if (value.includes("kontroll")) return "🔵";
    if (value.includes("fertig") || value.includes("beendet")) return "✅";
    if (value.includes("teil")) return "🟠";
    return "📩";
  }

  function priorityForStatus(status) {
    const value = String(status || "").toLocaleLowerCase("de-DE");
    return value.includes("hilfe") || value.includes("kontroll") ? "attention" : "normal";
  }

  function catalogById(id) {
    return (state.workbookCatalog || []).find((item) => item.id === id) || null;
  }

  function compactCatalogLabel(catalog) {
    if (!catalog) return "";
    const workbook = catalog.workbook || catalog.material || catalog.title || "";
    const page = catalog.pageRange || catalog.pages || catalog.page || "";
    const topic = catalog.topic || catalog.title || "";
    return [
      workbook,
      page ? `S. ${page}` : "",
      topic && topic !== workbook ? topic : ""
    ].filter(Boolean).join(" · ");
  }

  function makeEvent({
    key,
    type,
    animalId,
    timestamp,
    title,
    detail,
    meta = "",
    icon = "📩",
    priority = "normal",
    target = "pendingReports"
  }) {
    return {
      key,
      type,
      animalId,
      timestamp,
      title,
      detail,
      meta,
      icon,
      priority,
      target
    };
  }

  function childReportEvents() {
    return (state.childWorkbookReports || [])
      .filter((report) => report.classId === state.activeClassId)
      .map((report) => {
        const status = report.status || "gemeldet";
        const material = [
          report.subject,
          report.materialFamily,
          report.pageText ? `S. ${report.pageText}` : ""
        ].filter(Boolean).join(" · ");
        const note = String(report.note || "").trim();
        const detail = [material, note ? `Notiz: ${note}` : ""].filter(Boolean).join(" · ");
        let title = "Arbeit gemeldet";
        const lower = String(status).toLocaleLowerCase("de-DE");
        if (lower.includes("hilfe")) title = "Braucht Hilfe";
        else if (lower.includes("kontroll")) title = "Bittet um Kontrolle";
        else if (lower.includes("fertig")) title = "Meldet Arbeit fertig";

        return makeEvent({
          key: `child-report:${report.id}`,
          type: "Kindmeldung",
          animalId: report.animalId,
          timestamp: report.updatedAt || report.createdAt,
          title,
          detail: detail || "Arbeitsmaterial",
          meta: report.reviewStatus === "wartet" ? "wartet auf Bestätigung" : "bereits bearbeitet",
          icon: statusIcon(status),
          priority: priorityForStatus(status)
        });
      });
  }

  function assignmentStatusEvents() {
    return (state.workbookAssignmentStatuses || [])
      .filter((status) => (
        status.classId === state.activeClassId &&
        status.markedByChild
      ))
      .map((status) => {
        const assignment = (state.workbookAssignments || []).find((item) => item.id === status.assignmentId);
        const catalog = catalogById(status.workbookCatalogId || assignment?.workbookCatalogId);
        const normalizedStatus = status.status || "gemeldet";
        return makeEvent({
          key: `assignment:${status.id}`,
          type: "Zuweisung",
          animalId: status.animalId,
          timestamp: status.updatedAt || status.createdAt,
          title: `${statusIcon(normalizedStatus)} ${normalizedStatus}`,
          detail: compactCatalogLabel(catalog) || "Zugewiesenes Arbeitsmaterial",
          meta: status.reviewStatus === "wartet" ? "wartet auf Bestätigung" : "automatisch/bereits bestätigt",
          icon: "📘",
          priority: priorityForStatus(normalizedStatus)
        });
      });
  }

  function weeklyPlanStatusEvents() {
    return (state.weeklyPlanStatuses || [])
      .filter((status) => (
        status.classId === state.activeClassId &&
        status.markedByChild
      ))
      .map((status) => {
        const plan = (state.weeklyPlans || []).find((item) => item.id === status.planId || item.id === status.weeklyPlanId);
        const catalog = catalogById(status.workbookCatalogId);
        const task = compactCatalogLabel(catalog) || status.freeText || status.field || "Wochenplan-Aufgabe";
        const normalizedStatus = status.status || "gemeldet";
        return makeEvent({
          key: `weekly:${status.id}`,
          type: "Wochenplan",
          animalId: status.animalId,
          timestamp: status.updatedAt || status.completedAt || status.createdAt,
          title: `Wochenplan: ${normalizedStatus}`,
          detail: [
            status.day || "",
            task,
            plan?.title || plan?.name || ""
          ].filter(Boolean).join(" · "),
          meta: status.reviewStatus === "wartet" ? "wartet auf Bestätigung" : "automatisch/bereits bestätigt",
          icon: "📅",
          priority: priorityForStatus(normalizedStatus)
        });
      });
  }

  function learningGameIcon(session) {
    if (session.gameId === "kopfrechnen-10-min") return "🧠";
    if (session.gameId === "einmaleins-grundreihen") return "✖️";
    if (session.gameId === "verb-probe") return "🏃";
    if (session.gameId === "adjektiv-probe") return "🎨";
    if (session.gameId === "wortarten-mix") return "🔤";
    if (session.gameId === "nomen-probe") return session.mode === "test" ? "🎯" : "🌱";
    return "🎮";
  }

  function learningGameResultDetail(session) {
    const summary = session.summary || {};
    if (session.gameId === "nomen-probe") {
      const words = Array.isArray(session.items) ? session.items.length : 0;
      const total = Number(summary.totalInteractions || 0);
      const first = Number(summary.firstTryCorrect || 0);
      const pct = total ? Math.round((first / total) * 100) : null;
      return [
        session.mode === "test" ? "Test" : "Üben",
        `${words || 10} Wörter`,
        pct !== null ? `${pct}% Prüfschritte direkt richtig` : ""
      ].filter(Boolean).join(" · ");
    }
    if (session.gameId === "kopfrechnen-10-min") {
      return [
        session.variantLabel || "Kopfrechnen",
        `${Math.round(Number(session.timeLimitSeconds || 600) / 60)} Min`,
        `${Number(summary.attemptedItems || 0)} bearbeitet`,
        `${Number(summary.correctItems || 0)} richtig`,
        `${Number(summary.accuracy || 0)}%`
      ].filter(Boolean).join(" · ");
    }
    const total = Number(summary.totalItems || (session.items || []).length || 10);
    const score = Number(summary.scoreItems ?? summary.correctItems ?? 0);
    return [
      session.variantLabel || "",
      session.mode === "test" ? "Test" : "Üben",
      `${score} von ${total} ${session.mode === "practice" ? "direkt richtig" : "richtig"}`
    ].filter(Boolean).join(" · ");
  }

  function learningGameResultEvents() {
    return (state.learningGameSessions || [])
      .filter((session) => (
        session.classId === state.activeClassId &&
        session.finishedAt &&
        session.gameId !== "nomen-probe-activity" &&
        session.gameId !== "learning-game-activity"
      ))
      .map((session) => makeEvent({
        key: `learning-result:${session.id}`,
        type: "Lernspiel",
        animalId: session.animalId,
        timestamp: session.finishedAt,
        title: `${session.gameTitle || "Lernspiel"} beendet`,
        detail: learningGameResultDetail(session),
        meta: `gestartet ${safeDate(session.startedAt)} · beendet ${safeDate(session.finishedAt)}`,
        icon: learningGameIcon(session),
        target: "learningGames"
      }));
  }

  function learningGameActivityEvents() {
    return (state.learningGameSessions || [])
      .filter((item) => (
        item.classId === state.activeClassId &&
        (item.gameId === "nomen-probe-activity" || item.gameId === "learning-game-activity") &&
        item.status !== "completed"
      ))
      .map((item) => {
        const aborted = item.status === "aborted";
        const gameTitle = item.gameTitle || (item.gameId === "nomen-probe-activity" ? "Nomen-Probe" : "Lernspiel");
        const processed = Math.max(0, Number(item.processedWords ?? item.processedItems ?? 0));
        const total = Math.max(0, Number(item.totalWords ?? item.totalItems ?? 0));
        const challenge = Number(item.timeLimitSeconds || 0) > 0 || item.mode === "challenge";
        const progress = challenge
          ? `${processed} Aufgaben bearbeitet · ${Math.round(Number(item.timeLimitSeconds || 600) / 60)}-Minuten-Challenge`
          : `${processed} von ${total || 10} ${item.activityGameId?.includes("probe") || item.gameId === "nomen-probe-activity" ? "Wörtern" : "Aufgaben"} bearbeitet`;
        return makeEvent({
          key: `learning-activity:${item.id}:${item.status || "in_progress"}`,
          type: "Aktivität",
          animalId: item.animalId,
          timestamp: item.updatedAt || item.abortedAt || item.lastActivityAt || item.startedAt,
          title: aborted ? `${gameTitle} abgebrochen` : `${gameTitle} gestartet / läuft`,
          detail: [item.variantLabel || "", progress].filter(Boolean).join(" · "),
          meta: aborted
            ? `Start ${safeDate(item.startedAt)} · Abbruch ${safeDate(item.abortedAt || item.updatedAt)}`
            : `Start ${safeDate(item.startedAt)} · letzte Aktivität ${safeDate(item.lastActivityAt || item.updatedAt)}`,
          icon: aborted ? "❌" : "🟢",
          priority: aborted ? "attention" : "normal",
          target: "learningGames"
        });
      });
  }

  function allInboxEvents() {
    const events = [
      ...childReportEvents(),
      ...assignmentStatusEvents(),
      ...weeklyPlanStatusEvents(),
      ...learningGameResultEvents(),
      ...learningGameActivityEvents()
    ];

    const deduped = new Map();
    for (const event of events) {
      const previous = deduped.get(event.key);
      if (!previous || eventTimeValue(event) >= eventTimeValue(previous)) {
        deduped.set(event.key, event);
      }
    }

    return [...deduped.values()]
      .filter((event) => event.timestamp)
      .sort((a, b) => eventTimeValue(b) - eventTimeValue(a))
      .slice(0, 120);
  }

  function unreadInboxCount() {
    return allInboxEvents().filter(isInboxEventNew).length;
  }

  async function saveSeenMap(nextMap) {
    await persist({
      ...state,
      teacherInboxSeen: nextMap
    });
  }

  window.setTeacherInboxFilter = function setTeacherInboxFilter(value) {
    lkInboxFilter = value === "all" ? "all" : "new";
    render();
  };

  window.markTeacherInboxSeen = async function markTeacherInboxSeen(key) {
    const event = allInboxEvents().find((item) => item.key === key);
    const next = {
      ...inboxSeenMap(),
      [key]: event?.timestamp || nowIso()
    };
    await saveSeenMap(next);
    render();
  };

  window.markAllTeacherInboxSeen = async function markAllTeacherInboxSeen() {
    const next = { ...inboxSeenMap() };
    const timestamp = nowIso();
    allInboxEvents().forEach((event) => {
      next[event.key] = event.timestamp || timestamp;
    });
    await saveSeenMap(next);
    render();
  };

  window.openTeacherInboxEvent = async function openTeacherInboxEvent(key, target) {
    const event = allInboxEvents().find((item) => item.key === key);
    const next = {
      ...inboxSeenMap(),
      [key]: event?.timestamp || nowIso()
    };
    await saveSeenMap(next);
    if (typeof setTeacherTab === "function") {
      setTeacherTab(target || event?.target || "pendingReports");
    } else {
      render();
    }
  };

  function renderInboxCard(event) {
    const isNew = isInboxEventNew(event);
    const animal = animalLabel(event.animalId);
    const priorityClass = event.priority === "attention" ? " attention" : "";
    return `
      <article class="lk-inbox-card${isNew ? " is-new" : ""}${priorityClass}">
        <div class="lk-inbox-icon">${escapeHtml(event.icon || "📩")}</div>
        <div class="lk-inbox-main">
          <div class="lk-inbox-title-row">
            <div>
              <span class="lk-inbox-type">${escapeHtml(event.type)}</span>
              <strong>${escapeHtml(animal)} · ${escapeHtml(event.title)}</strong>
            </div>
            <time>${escapeHtml(safeDate(event.timestamp))}</time>
          </div>
          <p>${escapeHtml(event.detail || "")}</p>
          ${event.meta ? `<small>${escapeHtml(event.meta)}</small>` : ""}
        </div>
        <div class="lk-inbox-actions">
          ${isNew
            ? `<button class="small-button" type="button" onclick='markTeacherInboxSeen(${JSON.stringify(event.key)})'>✓ Gesehen</button>`
            : `<span class="lk-seen-badge">gesehen</span>`}
          <button class="small-button" type="button" onclick='openTeacherInboxEvent(${JSON.stringify(event.key)}, ${JSON.stringify(event.target || "pendingReports")})'>Öffnen</button>
        </div>
      </article>
    `;
  }

  function renderTeacherInbox() {
    const all = allInboxEvents();
    const unread = all.filter(isInboxEventNew);
    const visible = lkInboxFilter === "all" ? all : unread;
    const attention = unread.filter((event) => event.priority === "attention").length;

    return `
      <section class="panel lk-inbox-panel">
        <div class="lk-inbox-heading">
          <div>
            <p class="lk-inbox-kicker">Klassen-Posteingang</p>
            <h2>${unread.length ? `${unread.length} neue Meldung${unread.length === 1 ? "" : "en"}` : "Alles gesehen"}</h2>
            <p class="message">
              Kindmeldungen, Wochenplan, Lernspiele und Abbrüche an einer Stelle.
              „Gesehen“ bedeutet nur gelesen – fachliche Bestätigungen bleiben unten weiterhin offen.
            </p>
          </div>
          <div class="lk-inbox-summary">
            ${attention ? `<span class="lk-attention-badge">⚠️ ${attention} wichtig</span>` : ""}
            <span>${all.length} zuletzt erfasst</span>
          </div>
        </div>

        <div class="lk-inbox-toolbar">
          <div class="section-tabs">
            <button class="small-button ${lkInboxFilter === "new" ? "active" : ""}" type="button" onclick="setTeacherInboxFilter('new')">
              Neu${unread.length ? ` (${unread.length})` : ""}
            </button>
            <button class="small-button ${lkInboxFilter === "all" ? "active" : ""}" type="button" onclick="setTeacherInboxFilter('all')">
              Alle
            </button>
          </div>
          <button class="secondary" type="button" ${unread.length ? "" : "disabled"} onclick="markAllTeacherInboxSeen()">
            Alle als gesehen markieren
          </button>
        </div>

        <div class="lk-inbox-list">
          ${visible.length
            ? visible.map(renderInboxCard).join("")
            : `<div class="empty">${lkInboxFilter === "new" ? "Keine neuen Meldungen. Unter „Alle“ findest du die letzten Aktivitäten." : "Noch keine Kindmeldungen vorhanden."}</div>`}
        </div>
      </section>
    `;
  }

  renderPendingReportsDashboard = function renderPendingReportsWithInbox() {
    return `${renderTeacherInbox()}${baseRenderPendingReportsDashboard()}`;
  };

  // Aus "Von Kindern gemeldet" wird sichtbar "Posteingang".
  const learningGroup = Array.isArray(TEACHER_GROUPS)
    ? TEACHER_GROUPS.find((group) => group.id === "learning")
    : null;
  const pendingSection = learningGroup?.sections?.find((section) => section[0] === "pendingReports");
  if (pendingSection) pendingSection[1] = "Posteingang";

  // Badge-Zahl im Navigationspunkt bei jedem Rendern aktualisieren.
  if (baseRenderTeacher) {
    renderTeacher = function renderTeacherWithInboxBadge() {
      if (pendingSection) {
        const unread = unreadInboxCount();
        pendingSection[1] = unread ? `Posteingang (${unread})` : "Posteingang";
      }
      return baseRenderTeacher();
    };
  }

  const style = document.createElement("style");
  style.id = "lk-teacher-inbox-style";
  style.textContent = `
    .lk-inbox-panel { border: 2px solid rgba(47, 111, 145, .16); }
    .lk-inbox-heading { display:flex; justify-content:space-between; gap:20px; align-items:flex-start; }
    .lk-inbox-kicker { margin:0 0 4px; font-size:.78rem; font-weight:800; text-transform:uppercase; letter-spacing:.08em; opacity:.65; }
    .lk-inbox-heading h2 { margin:.1rem 0 .35rem; }
    .lk-inbox-summary { display:flex; flex-wrap:wrap; gap:8px; justify-content:flex-end; font-size:.9rem; }
    .lk-inbox-summary > span { padding:7px 10px; border-radius:999px; background:rgba(0,0,0,.045); white-space:nowrap; }
    .lk-inbox-summary .lk-attention-badge { background:#fff1c9; font-weight:750; }
    .lk-inbox-toolbar { display:flex; justify-content:space-between; gap:12px; align-items:center; margin:18px 0 12px; flex-wrap:wrap; }
    .lk-inbox-list { display:grid; gap:10px; }
    .lk-inbox-card { display:grid; grid-template-columns:auto minmax(0,1fr) auto; gap:12px; align-items:start; padding:14px; border:1px solid rgba(0,0,0,.09); border-radius:16px; background:rgba(255,255,255,.72); }
    .lk-inbox-card.is-new { border-width:2px; box-shadow:0 5px 16px rgba(25,60,80,.08); }
    .lk-inbox-card.attention { background:#fffaf0; }
    .lk-inbox-icon { width:40px; height:40px; border-radius:12px; display:grid; place-items:center; background:rgba(47,111,145,.09); font-size:1.25rem; }
    .lk-inbox-title-row { display:flex; justify-content:space-between; gap:12px; align-items:flex-start; }
    .lk-inbox-title-row > div { display:grid; gap:2px; }
    .lk-inbox-title-row time { font-size:.78rem; opacity:.65; white-space:nowrap; }
    .lk-inbox-type { font-size:.72rem; font-weight:800; text-transform:uppercase; letter-spacing:.06em; opacity:.55; }
    .lk-inbox-main p { margin:6px 0 3px; }
    .lk-inbox-main small { opacity:.7; }
    .lk-inbox-actions { display:flex; gap:6px; align-items:center; flex-wrap:wrap; justify-content:flex-end; }
    .lk-seen-badge { font-size:.78rem; opacity:.55; padding:4px 7px; }
    @media (max-width: 760px) {
      .lk-inbox-heading { display:block; }
      .lk-inbox-summary { justify-content:flex-start; margin-top:10px; }
      .lk-inbox-card { grid-template-columns:auto 1fr; }
      .lk-inbox-actions { grid-column:2; justify-content:flex-start; }
      .lk-inbox-title-row { display:block; }
      .lk-inbox-title-row time { display:block; margin-top:3px; }
    }
  `;
  if (!document.getElementById(style.id)) document.head.appendChild(style);
})();
