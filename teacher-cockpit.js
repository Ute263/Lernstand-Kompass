/* Paket 5: Lehrkraft-Cockpit auf der Startseite.
 *
 * Zeigt direkt nach dem Login:
 * - neue Posteingangsmeldungen
 * - offene Hilfe- und Kontrollwünsche
 * - Aktivität heute in der App
 * - laufende / abgebrochene / beendete Lernspiele
 * - offene fachliche Bestätigungen
 *
 * Die vorhandenen Startseiten-Kacheln bleiben darunter vollständig erhalten.
 */
(() => {
  if (typeof renderTeacherHome !== "function") {
    console.warn("Lehrkraft-Cockpit konnte nicht initialisiert werden.");
    return;
  }

  const baseRenderTeacherHome = renderTeacherHome;

  function activeAnimals() {
    if (typeof animalsForActiveClass === "function") {
      return animalsForActiveClass().filter((animal) => animal.aktiv !== false);
    }
    return (state.animals || []).filter((animal) => (
      animal.classId === state.activeClassId && animal.aktiv !== false
    ));
  }

  function animalLabel(animal) {
    if (!animal) return "Tier";
    if (typeof teacherAnimalLabel === "function") return teacherAnimalLabel(animal);
    return `${animal.tierEmoji || ""} ${animal.tierName || "Tier"}`.trim();
  }

  function localDayKey(value) {
    if (!value) return "";
    const date = value instanceof Date ? value : new Date(value);
    if (!Number.isFinite(date.getTime())) return "";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function isToday(value) {
    return localDayKey(value) === localDayKey(new Date());
  }

  function timeValue(value) {
    const ms = Date.parse(value || "");
    return Number.isFinite(ms) ? ms : 0;
  }

  function newestTime(...values) {
    return values
      .filter(Boolean)
      .sort((a, b) => timeValue(b) - timeValue(a))[0] || "";
  }

  function formatMoment(value) {
    if (!value) return "–";
    if (typeof formatDateTime === "function") return formatDateTime(value);
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return "–";
    return new Intl.DateTimeFormat("de-DE", {
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }

  function todayTitle() {
    const now = new Date();
    return new Intl.DateTimeFormat("de-DE", {
      weekday: "long",
      day: "2-digit",
      month: "long"
    }).format(now);
  }

  function greeting() {
    const hour = new Date().getHours();
    if (hour < 11) return "Guten Morgen";
    if (hour < 17) return "Guten Tag";
    return "Guten Abend";
  }

  function inboxUnreadCount() {
    const learning = Array.isArray(TEACHER_GROUPS)
      ? TEACHER_GROUPS.find((group) => group.id === "learning")
      : null;
    const pending = learning?.sections?.find((section) => section[0] === "pendingReports");
    const match = String(pending?.[1] || "").match(/\((\d+)\)/);
    return match ? Number(match[1]) : 0;
  }

  function unresolvedEntries(status) {
    return (state.entries || [])
      .filter((entry) => (
        entry.classId === state.activeClassId &&
        entry.status === status &&
        entry.erledigt !== true
      ))
      .sort((a, b) => timeValue(b.updatedAt || b.datumUhrzeit || b.createdAt) - timeValue(a.updatedAt || a.datumUhrzeit || a.createdAt));
  }

  function pendingReviewCount() {
    const childReports = (state.childWorkbookReports || []).filter((item) => (
      item.classId === state.activeClassId &&
      item.reviewStatus === "wartet"
    )).length;

    const assignments = (state.workbookAssignmentStatuses || []).filter((item) => (
      item.classId === state.activeClassId &&
      item.markedByChild &&
      item.reviewStatus === "wartet"
    )).length;

    const weekly = (state.weeklyPlanStatuses || []).filter((item) => (
      item.classId === state.activeClassId &&
      item.markedByChild &&
      item.reviewStatus === "wartet"
    )).length;

    return childReports + assignments + weekly;
  }

  function activityTimestamp(item) {
    return newestTime(
      item.updatedAt,
      item.lastActivityAt,
      item.finishedAt,
      item.completedAt,
      item.abortedAt,
      item.datumUhrzeit,
      item.createdAt,
      item.startedAt
    );
  }

  function activityAnimalId(item, key = "animalId") {
    return item?.[key] || "";
  }

  function todayActivityAnimalIds() {
    const ids = new Set();

    const sources = [
      [(state.entries || []).filter((item) => item.classId === state.activeClassId), "tierID"],
      [(state.weeklyPlanStatuses || []).filter((item) => item.classId === state.activeClassId), "animalId"],
      [(state.workbookAssignmentStatuses || []).filter((item) => item.classId === state.activeClassId), "animalId"],
      [(state.childWorkbookReports || []).filter((item) => item.classId === state.activeClassId), "animalId"],
      [(state.trainingCompletions || []).filter((item) => item.classId === state.activeClassId), "animalId"],
      [(state.learningGameSessions || []).filter((item) => item.classId === state.activeClassId), "animalId"]
    ];

    sources.forEach(([items, key]) => {
      items.forEach((item) => {
        const timestamp = activityTimestamp(item);
        const animalId = activityAnimalId(item, key);
        if (animalId && isToday(timestamp)) ids.add(animalId);
      });
    });

    return ids;
  }

  function learningGameActivitiesToday() {
    return (state.learningGameSessions || [])
      .filter((item) => (
        item.classId === state.activeClassId &&
        (item.gameId === "nomen-probe-activity" || item.gameId === "learning-game-activity") &&
        isToday(item.startedAt || item.updatedAt)
      ))
      .sort((a, b) => timeValue(b.updatedAt || b.startedAt) - timeValue(a.updatedAt || a.startedAt));
  }

  function learningGameResultsToday() {
    return (state.learningGameSessions || [])
      .filter((item) => (
        item.classId === state.activeClassId &&
        item.finishedAt &&
        item.gameId !== "nomen-probe-activity" &&
        item.gameId !== "learning-game-activity" &&
        isToday(item.finishedAt)
      ));
  }

  function activityGameTitle(item) {
    return item.gameTitle || (item.gameId === "nomen-probe-activity" ? "Nomen-Probe" : "Lernspiel");
  }

  function activityProgressText(item) {
    const processed = Number(item.processedWords ?? item.processedItems ?? 0);
    const total = Number(item.totalWords ?? item.totalItems ?? 0);
    if (Number(item.timeLimitSeconds || 0) > 0 || item.mode === "challenge") {
      return `${processed} Aufgaben bearbeitet`;
    }
    const unit = item.gameId === "nomen-probe-activity" || String(item.activityGameId || "").includes("probe")
      ? "Wörtern"
      : "Aufgaben";
    return `${processed} von ${total || 10} ${unit}`;
  }

  function activityStatus(item) {
    if (item.status === "aborted") {
      return { icon: "❌", label: "abgebrochen", className: "attention" };
    }
    if (item.status === "completed") {
      return { icon: "✅", label: "beendet", className: "done" };
    }

    const last = timeValue(item.lastActivityAt || item.updatedAt || item.startedAt);
    const minutes = last ? (Date.now() - last) / 60000 : Infinity;
    if (minutes <= 10) {
      return { icon: "🟢", label: "gerade aktiv", className: "live" };
    }
    return { icon: "⏸️", label: "angefangen", className: "paused" };
  }

  function entryDetail(entry) {
    if (typeof entryStandLabel === "function") {
      try {
        return entryStandLabel(entry);
      } catch {}
    }
    return [entry.fach, entry.material, entry.seite ? `S. ${entry.seite}` : ""]
      .filter(Boolean)
      .join(" · ") || "Lernstand";
  }

  function renderImportantRows(helpEntries, controlEntries, activities, pendingReviews) {
    const rows = [];

    helpEntries.slice(0, 4).forEach((entry) => {
      const animal = activeAnimals().find((item) => item.id === entry.tierID);
      rows.push(`
        <button class="lk-cockpit-row attention" type="button" onclick="setTeacherTab('help')">
          <span class="lk-cockpit-row-icon">🟡</span>
          <span><strong>${escapeHtml(animalLabel(animal))} braucht Hilfe</strong><small>${escapeHtml(entryDetail(entry))}</small></span>
          <em>${escapeHtml(formatMoment(entry.updatedAt || entry.datumUhrzeit || entry.createdAt))}</em>
        </button>
      `);
    });

    controlEntries.slice(0, 4).forEach((entry) => {
      const animal = activeAnimals().find((item) => item.id === entry.tierID);
      rows.push(`
        <button class="lk-cockpit-row control" type="button" onclick="setTeacherTab('help')">
          <span class="lk-cockpit-row-icon">🔵</span>
          <span><strong>${escapeHtml(animalLabel(animal))} bittet um Kontrolle</strong><small>${escapeHtml(entryDetail(entry))}</small></span>
          <em>${escapeHtml(formatMoment(entry.updatedAt || entry.datumUhrzeit || entry.createdAt))}</em>
        </button>
      `);
    });

    activities
      .filter((item) => item.status === "aborted")
      .slice(0, 3)
      .forEach((item) => {
        const animal = activeAnimals().find((entry) => entry.id === item.animalId);
        rows.push(`
          <button class="lk-cockpit-row attention" type="button" onclick="setTeacherTab('learningGames')">
            <span class="lk-cockpit-row-icon">❌</span>
            <span><strong>${escapeHtml(animalLabel(animal))} hat ${escapeHtml(activityGameTitle(item))} abgebrochen</strong><small>${escapeHtml(activityProgressText(item))}</small></span>
            <em>${escapeHtml(formatMoment(item.abortedAt || item.updatedAt))}</em>
          </button>
        `);
      });

    if (pendingReviews) {
      rows.push(`
        <button class="lk-cockpit-row" type="button" onclick="setTeacherTab('pendingReports')">
          <span class="lk-cockpit-row-icon">📥</span>
          <span><strong>${pendingReviews} fachliche Bestätigung${pendingReviews === 1 ? "" : "en"} offen</strong><small>Kindmeldungen und Markierungen warten auf deine Prüfung.</small></span>
          <em>Posteingang</em>
        </button>
      `);
    }

    if (!rows.length) {
      return `
        <div class="lk-cockpit-clear">
          <span>✓</span>
          <div><strong>Gerade nichts Dringendes.</strong><small>Keine offenen Hilfe-/Kontrollwünsche und keine Abbruchmeldung von heute.</small></div>
        </div>
      `;
    }

    return rows.slice(0, 8).join("");
  }

  function renderAnimalChips(animals, emptyText) {
    if (!animals.length) return `<span class="lk-cockpit-empty">${escapeHtml(emptyText)}</span>`;
    return animals.map((animal) => `
      <span class="lk-animal-chip">${escapeHtml(animal.tierEmoji || "🐾")} ${escapeHtml(animal.tierName || "Tier")}</span>
    `).join("");
  }

  function renderLearningGameRows(activities) {
    if (!activities.length) {
      return `<div class="lk-cockpit-empty-block">Heute wurde noch kein Lernspiel gestartet.</div>`;
    }

    return activities.slice(0, 8).map((item) => {
      const animal = activeAnimals().find((entry) => entry.id === item.animalId);
      const status = activityStatus(item);
      const modeLabel = item.mode === "challenge" ? `${Math.round(Number(item.timeLimitSeconds || 600) / 60)}-Minuten-Challenge` : item.mode === "test" ? "Test" : "Üben";
      return `
        <button class="lk-game-row ${status.className}" type="button" onclick="setTeacherTab('learningGames')">
          <span>${status.icon}</span>
          <span>
            <strong>${escapeHtml(animalLabel(animal))} · ${escapeHtml(activityGameTitle(item))}</strong>
            <small>${escapeHtml([item.variantLabel || "", modeLabel, activityProgressText(item)].filter(Boolean).join(" · "))}</small>
          </span>
          <em>${escapeHtml(status.label)}</em>
        </button>
      `;
    }).join("");
  }

  function renderCockpit() {
    const animals = activeAnimals();
    const activeIds = todayActivityAnimalIds();
    const activeToday = animals.filter((animal) => activeIds.has(animal.id));
    const quietToday = animals.filter((animal) => !activeIds.has(animal.id));
    const helpEntries = unresolvedEntries("brauche Hilfe");
    const controlEntries = unresolvedEntries("bitte kontrollieren");
    const activities = learningGameActivitiesToday();
    const results = learningGameResultsToday();
    const runningNow = activities.filter((item) => activityStatus(item).className === "live").length;
    const abortedToday = activities.filter((item) => item.status === "aborted").length;
    const pendingReviews = pendingReviewCount();
    const unread = inboxUnreadCount();
    const lastPull = state.classSync?.lastPullAt || "";
    const className = typeof activeClass === "function" ? activeClass()?.name : "";

    return `
      <section class="panel lk-cockpit">
        <div class="lk-cockpit-hero">
          <div>
            <p class="lk-cockpit-kicker">${escapeHtml(todayTitle())}</p>
            <h2>${escapeHtml(greeting())}${className ? ` · ${escapeHtml(className)}` : ""}</h2>
            <p class="message">Das ist heute in deiner Klasse wichtig.</p>
          </div>
          <div class="lk-cockpit-sync">
            <span>${lastPull ? `Kinder-Sync: ${escapeHtml(formatMoment(lastPull))}` : "Kinder-Sync: noch kein Abruf"}</span>
          </div>
        </div>

        <div class="lk-cockpit-stat-grid">
          <button type="button" onclick="setTeacherTab('pendingReports')">
            <span>📥</span><strong>${unread}</strong><small>neue Meldungen</small>
          </button>
          <button class="${helpEntries.length ? "attention" : ""}" type="button" onclick="setTeacherTab('help')">
            <span>🟡</span><strong>${helpEntries.length}</strong><small>brauchen Hilfe</small>
          </button>
          <button class="${controlEntries.length ? "control" : ""}" type="button" onclick="setTeacherTab('help')">
            <span>🔵</span><strong>${controlEntries.length}</strong><small>bitte kontrollieren</small>
          </button>
          <button type="button" onclick="setTeacherTab('today')">
            <span>👣</span><strong>${activeToday.length}/${animals.length}</strong><small>heute in der App aktiv</small>
          </button>
        </div>

        <div class="lk-cockpit-main-grid">
          <section class="lk-cockpit-box">
            <div class="lk-cockpit-box-title">
              <div><span>⚡</span><strong>Jetzt wichtig</strong></div>
              <button class="small-button" type="button" onclick="setTeacherTab('pendingReports')">Posteingang</button>
            </div>
            <div class="lk-cockpit-row-list">
              ${renderImportantRows(helpEntries, controlEntries, activities, pendingReviews)}
            </div>
          </section>

          <section class="lk-cockpit-box">
            <div class="lk-cockpit-box-title">
              <div><span>🎮</span><strong>Lernspiele heute</strong></div>
              <button class="small-button" type="button" onclick="setTeacherTab('learningGames')">Auswertung</button>
            </div>
            <div class="lk-game-summary">
              <span><strong>${activities.length}</strong> gestartet</span>
              <span><strong>${runningNow}</strong> gerade aktiv</span>
              <span><strong>${results.length}</strong> beendet</span>
              <span><strong>${abortedToday}</strong> abgebrochen</span>
            </div>
            <div class="lk-game-list">${renderLearningGameRows(activities)}</div>
          </section>
        </div>

        <div class="lk-cockpit-class-grid">
          <section class="lk-cockpit-box compact">
            <div class="lk-cockpit-box-title">
              <div><span>✅</span><strong>Heute aktiv in der App</strong></div>
              <span>${activeToday.length} Kinder</span>
            </div>
            <div class="lk-animal-chips">${renderAnimalChips(activeToday, "Heute noch keine App-Aktivität erfasst.")}</div>
          </section>

          <section class="lk-cockpit-box compact">
            <div class="lk-cockpit-box-title">
              <div><span>○</span><strong>Heute noch ohne App-Aktivität</strong></div>
              <span>${quietToday.length} Kinder</span>
            </div>
            <div class="lk-animal-chips">${renderAnimalChips(quietToday, "Alle aktiven Tiere haben heute bereits eine App-Aktivität.")}</div>
          </section>
        </div>

        <div class="lk-cockpit-quick">
          <button class="secondary" type="button" onclick="setTeacherTab('pendingReports')">📥 Posteingang</button>
          <button class="secondary" type="button" onclick="setTeacherTab('help')">🟡 Hilfe & Kontrolle</button>
          <button class="secondary" type="button" onclick="setTeacherTab('today')">📅 Heute</button>
          <button class="secondary" type="button" onclick="setTeacherGroup('weeklyPlansGroup')">🗓️ Wochenplan</button>
          <button class="secondary" type="button" onclick="setTeacherTab('learningGames')">🎮 Lernspiele</button>
        </div>
      </section>
    `;
  }

  renderTeacherHome = function renderTeacherHomeWithCockpit() {
    const oldHome = baseRenderTeacherHome()
      .replace("<h2>Startseite</h2>", "<h2>Alle Bereiche</h2>")
      .replace(
        "Wähle aus, womit du arbeiten möchtest. Die Kacheln führen direkt in den passenden Bereich.",
        "Hier findest du weiterhin alle Bereiche des Lernstand-Kompasses."
      );
    return `${renderCockpit()}${oldHome}`;
  };

  const style = document.createElement("style");
  style.id = "lk-teacher-cockpit-style";
  style.textContent = `
    .lk-cockpit { border:2px solid rgba(47,111,145,.13); }
    .lk-cockpit-hero { display:flex; justify-content:space-between; gap:20px; align-items:flex-start; margin-bottom:18px; }
    .lk-cockpit-kicker { margin:0 0 4px; font-size:.78rem; text-transform:uppercase; letter-spacing:.08em; font-weight:800; opacity:.58; }
    .lk-cockpit-hero h2 { margin:.1rem 0 .35rem; }
    .lk-cockpit-sync { padding:7px 10px; border-radius:999px; background:rgba(47,111,145,.08); font-size:.82rem; white-space:nowrap; }

    .lk-cockpit-stat-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; margin-bottom:14px; }
    .lk-cockpit-stat-grid button { appearance:none; border:1px solid rgba(0,0,0,.08); border-radius:16px; padding:14px; background:rgba(255,255,255,.78); text-align:left; cursor:pointer; display:grid; grid-template-columns:auto 1fr; gap:2px 9px; align-items:center; }
    .lk-cockpit-stat-grid button > span { grid-row:1 / span 2; font-size:1.35rem; }
    .lk-cockpit-stat-grid button strong { font-size:1.45rem; line-height:1; }
    .lk-cockpit-stat-grid button small { opacity:.68; }
    .lk-cockpit-stat-grid button.attention { background:#fff7dd; }
    .lk-cockpit-stat-grid button.control { background:#edf7ff; }

    .lk-cockpit-main-grid { display:grid; grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr); gap:12px; }
    .lk-cockpit-class-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:12px; }
    .lk-cockpit-box { border:1px solid rgba(0,0,0,.08); border-radius:18px; padding:14px; background:rgba(255,255,255,.6); min-width:0; }
    .lk-cockpit-box.compact { min-height:112px; }
    .lk-cockpit-box-title { display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:10px; }
    .lk-cockpit-box-title > div { display:flex; align-items:center; gap:7px; }
    .lk-cockpit-box-title > span { font-size:.82rem; opacity:.62; }

    .lk-cockpit-row-list, .lk-game-list { display:grid; gap:7px; }
    .lk-cockpit-row, .lk-game-row { width:100%; appearance:none; border:0; border-radius:12px; background:rgba(0,0,0,.035); padding:10px; display:grid; grid-template-columns:auto minmax(0,1fr) auto; gap:9px; align-items:center; text-align:left; cursor:pointer; }
    .lk-cockpit-row.attention { background:#fff4d2; }
    .lk-cockpit-row.control { background:#eaf6ff; }
    .lk-cockpit-row-icon { font-size:1.08rem; }
    .lk-cockpit-row span:nth-child(2), .lk-game-row span:nth-child(2) { display:grid; gap:2px; }
    .lk-cockpit-row small, .lk-game-row small { opacity:.67; }
    .lk-cockpit-row em, .lk-game-row em { font-size:.78rem; font-style:normal; opacity:.62; white-space:nowrap; }

    .lk-cockpit-clear { display:flex; gap:10px; align-items:center; min-height:64px; padding:10px; border-radius:12px; background:rgba(75,150,95,.08); }
    .lk-cockpit-clear > span { font-size:1.2rem; }
    .lk-cockpit-clear > div { display:grid; gap:2px; }
    .lk-cockpit-clear small { opacity:.67; }

    .lk-game-summary { display:grid; grid-template-columns:repeat(2,1fr); gap:6px; margin-bottom:8px; }
    .lk-game-summary span { padding:7px 9px; border-radius:10px; background:rgba(0,0,0,.035); font-size:.82rem; }
    .lk-game-row.live { background:rgba(70,155,90,.09); }
    .lk-game-row.attention { background:#fff4d2; }
    .lk-game-row.done { background:rgba(70,155,90,.06); }
    .lk-game-row.paused { background:rgba(0,0,0,.035); }

    .lk-animal-chips { display:flex; flex-wrap:wrap; gap:7px; align-content:flex-start; }
    .lk-animal-chip { padding:6px 9px; border-radius:999px; background:rgba(47,111,145,.08); font-size:.82rem; }
    .lk-cockpit-empty { font-size:.86rem; opacity:.62; }
    .lk-cockpit-empty-block { padding:12px; border-radius:12px; background:rgba(0,0,0,.03); opacity:.65; font-size:.86rem; }

    .lk-cockpit-quick { display:flex; flex-wrap:wrap; gap:8px; margin-top:14px; }

    @media (max-width: 920px) {
      .lk-cockpit-stat-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
      .lk-cockpit-main-grid, .lk-cockpit-class-grid { grid-template-columns:1fr; }
    }
    @media (max-width: 620px) {
      .lk-cockpit-hero { display:block; }
      .lk-cockpit-sync { display:inline-block; margin-top:8px; }
      .lk-cockpit-stat-grid { grid-template-columns:1fr 1fr; }
      .lk-cockpit-row, .lk-game-row { grid-template-columns:auto minmax(0,1fr); }
      .lk-cockpit-row em, .lk-game-row em { grid-column:2; }
    }
  `;
  if (!document.getElementById(style.id)) document.head.appendChild(style);
})();
