/* Paket 9l: Wochenplan – Schuljahreskalender nach Kalenderwochen
 *
 * Ziele:
 * - "Diese Woche" und "Vorlagen" als eigene Bereiche entfernen
 * - Wochenübersicht wird Startpunkt des Wochenplans
 * - Schuljahr August bis Juli mit Kalenderwochen anzeigen
 * - Status: offen / begonnen / fertig geplant
 * - Woche anklicken -> Bearbeiten / Drucken / Kopieren direkt erreichbar
 * - Hefte bleiben als eigener, kompakter Bereich erhalten
 *
 * Lädt NACH weekly-minimax-pages.js.
 */
(() => {
  if (
    typeof renderWeeklyPlans !== "function" ||
    typeof renderWeeklyPlanEditor !== "function" ||
    typeof renderWorkbookCatalogManager !== "function" ||
    typeof weeklyPlansForActiveClass !== "function" ||
    typeof openWeeklyPrintDialog !== "function"
  ) {
    console.warn("Paket 9l konnte nicht initialisiert werden.");
    return;
  }

  const baseSaveWeeklyPlan = typeof saveWeeklyPlan === "function" ? saveWeeklyPlan : null;
  const baseCopyWeeklyPlan = typeof copyWeeklyPlan === "function" ? copyWeeklyPlan : null;

  let lkCalendarSelectedMonday = "";
  let lkCalendarStartYear = null;
  let lkCalendarCreatingWeek = null;

  const MONTHS = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember"
  ];

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function localDateKey(date) {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  }

  function fromDateKey(value) {
    const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0, 0);
  }

  function addDays(date, amount) {
    const next = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
    next.setDate(next.getDate() + amount);
    return next;
  }

  function startOfWeek(date) {
    const source = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
    const day = source.getDay();
    const delta = day === 0 ? -6 : 1 - day;
    source.setDate(source.getDate() + delta);
    return source;
  }

  function isoWeekInfo(date) {
    const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNumber = target.getUTCDay() || 7;
    target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
    const isoYear = target.getUTCFullYear();
    const yearStart = new Date(Date.UTC(isoYear, 0, 1));
    const week = Math.ceil((((target - yearStart) / 86400000) + 1) / 7);
    return { week, year: isoYear };
  }

  function shortDate(date) {
    return `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.`;
  }

  function longDateRange(monday) {
    const friday = addDays(monday, 4);
    return `${shortDate(monday)} – ${shortDate(friday)}${friday.getFullYear() !== monday.getFullYear() ? ` ${friday.getFullYear()}` : ""}`;
  }

  function schoolYearLabel(startYear) {
    return `${startYear}/${String(startYear + 1).slice(-2)}`;
  }

  function schoolYearStartFromClass() {
    const stored = Number(state?.weeklyCalendarStartYear);
    if (Number.isFinite(stored) && stored >= 2000 && stored <= 2200) return stored;

    const classItem = typeof activeClass === "function" ? activeClass() : null;
    const label = String(classItem?.schoolYearLabel || classItem?.archiveSchoolYearLabel || "");
    const match = label.match(/(20\d{2})\s*\/\s*(\d{2,4})/);
    if (match) return Number(match[1]);

    const today = new Date();
    return today.getMonth() >= 7 ? today.getFullYear() : today.getFullYear() - 1;
  }

  function calendarStartYear() {
    if (Number.isFinite(lkCalendarStartYear)) return lkCalendarStartYear;
    lkCalendarStartYear = schoolYearStartFromClass();
    return lkCalendarStartYear;
  }

  function schoolYearForDate(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
    return date.getMonth() >= 7 ? date.getFullYear() : date.getFullYear() - 1;
  }

  function schoolYearOptionYears() {
    const selected = calendarStartYear();
    const today = new Date();
    const current = today.getMonth() >= 7 ? today.getFullYear() : today.getFullYear() - 1;
    const years = new Set();

    // Die Liste wird bei jedem Öffnen dynamisch berechnet. Dadurch muss
    // für ein neues Schuljahr nie wieder Code ergänzt werden.
    for (let year = Math.min(selected, current) - 4; year <= Math.max(selected, current) + 8; year += 1) {
      years.add(year);
    }

    // Schuljahre, zu denen bereits Wochenpläne vorhanden sind, immer mit anbieten.
    try {
      weeklyPlansForActiveClass().forEach((plan) => {
        const date = fromDateKey(plan.validFrom || plan.validTo || "");
        const year = schoolYearForDate(date);
        if (Number.isFinite(year)) years.add(year);
      });
    } catch {}

    return [...years].sort((a, b) => a - b);
  }

  function schoolYearWeeks(startYear) {
    const firstDay = new Date(startYear, 7, 1, 12, 0, 0, 0);      // 1. August
    const lastDay = new Date(startYear + 1, 6, 31, 12, 0, 0, 0); // 31. Juli
    let monday = startOfWeek(firstDay);
    const weeks = [];

    // Eine ISO-Woche wird eindeutig dem Schuljahr zugeordnet, in dem ihr
    // Donnerstag liegt. So gibt es am Juli/August-Übergang keine doppelte
    // oder fehlende Kalenderwoche.
    while (monday <= addDays(lastDay, 7)) {
      const thursday = addDays(monday, 3);
      if (thursday >= firstDay && thursday <= lastDay) {
        const friday = addDays(monday, 4);
        const info = isoWeekInfo(monday);
        weeks.push({
          key: localDateKey(monday),
          monday: new Date(monday),
          friday,
          thursday,
          week: info.week,
          isoYear: info.year,
          month: thursday.getMonth(),
          monthYear: thursday.getFullYear()
        });
      }
      monday = addDays(monday, 7);
    }
    return weeks;
  }

  function currentMondayKey() {
    return localDateKey(startOfWeek(new Date()));
  }

  function ensureSelectedWeek() {
    const weeks = schoolYearWeeks(calendarStartYear());
    if (!weeks.length) return "";
    if (weeks.some((week) => week.key === lkCalendarSelectedMonday)) return lkCalendarSelectedMonday;

    const current = currentMondayKey();
    const inYear = weeks.find((week) => week.key === current);
    lkCalendarSelectedMonday = inYear?.key || weeks[0].key;
    return lkCalendarSelectedMonday;
  }

  function planMatchesWeek(plan, week) {
    if (!plan || !week) return false;
    const mondayKey = week.key;
    const fridayKey = localDateKey(week.friday);
    const from = String(plan.validFrom || "");
    const to = String(plan.validTo || "");

    if (from || to) {
      const planFrom = from || to;
      const planTo = to || from;
      return planFrom <= fridayKey && planTo >= mondayKey;
    }

    const match = String(plan.weekLabel || "").match(/KW\s*(\d{1,2})/i);
    if (!match) return false;
    return Number(match[1]) === week.week;
  }

  function plansForWeek(week) {
    return weeklyPlansForActiveClass()
      .filter((plan) => plan.active !== false && planMatchesWeek(plan, week))
      .sort((a, b) => String(a.title || "").localeCompare(String(b.title || ""), "de", { numeric: true }));
  }

  function planningStateMap() {
    return state.weeklyPlanningStatus && typeof state.weeklyPlanningStatus === "object"
      ? state.weeklyPlanningStatus
      : {};
  }

  function planPlanningState(plan) {
    const stored = planningStateMap()[plan?.id];
    if (stored === "draft" || stored === "ready") return stored;
    // Bestehende, schon vor dem Kalender gespeicherte Pläne gelten als fertig geplant.
    return "ready";
  }

  function weekPlanningState(week) {
    const plans = plansForWeek(week);
    if (!plans.length) return "open";
    return plans.every((plan) => planPlanningState(plan) === "ready") ? "ready" : "draft";
  }

  function stateMeta(value) {
    if (value === "ready") return { icon: "✓", label: "fertig", className: "ready" };
    if (value === "draft") return { icon: "◐", label: "begonnen", className: "draft" };
    return { icon: "○", label: "offen", className: "open" };
  }

  function weekByKey(key) {
    return schoolYearWeeks(calendarStartYear()).find((week) => week.key === key) || null;
  }

  function selectedWeek() {
    return weekByKey(ensureSelectedWeek());
  }

  function emptyDays() {
    return Object.fromEntries(WEEK_DAYS.map((day) => [day, {
      deutschId: "",
      deutschIds: [],
      deutschTaskNumber: "",
      deutschTaskNumbers: [],
      deutschTaskStars: [],
      deutschFreeTasks: [],
      matheId: "",
      matheIds: [],
      matheTaskNumber: "",
      matheTaskNumbers: [],
      matheTaskStars: [],
      matheFreeTasks: [],
      extraFreeTasks: [],
      freeText: ""
    }]));
  }

  function makeDraftForWeek(week) {
    return {
      title: "Wochenplan",
      weekLabel: `KW ${week.week}`,
      validFrom: week.key,
      validTo: localDateKey(week.friday),
      note: "",
      assignmentMode: "all",
      animalIds: [],
      progressMode: "confirm",
      autoCreateEntries: false,
      days: emptyDays(),
      overrides: {}
    };
  }

  function taskCountForDay(plan, day) {
    try {
      return weeklyPlanItemsForDay(plan, day, "").length;
    } catch {
      return 0;
    }
  }

  function totalTasks(plan) {
    return WEEK_DAYS.reduce((sum, day) => sum + taskCountForDay(plan, day), 0);
  }

  function selectedWeekTitle(week) {
    return `KW ${week.week} · ${longDateRange(week.monday)}`;
  }

  function renderWeekTile(week) {
    const status = weekPlanningState(week);
    const meta = stateMeta(status);
    const selected = week.key === ensureSelectedWeek();
    const current = week.key === currentMondayKey();
    return `
      <button
        class="lk-cal-week ${meta.className} ${selected ? "selected" : ""} ${current ? "current" : ""}"
        type="button"
        onclick="lkSelectCalendarWeek('${escapeAttribute(week.key)}')"
        aria-label="KW ${week.week}, ${escapeAttribute(meta.label)}"
      >
        <span class="lk-cal-week-number">KW ${week.week}</span>
        <span class="lk-cal-week-dates">${escapeHtml(shortDate(week.monday))}–${escapeHtml(shortDate(week.friday))}</span>
        <span class="lk-cal-week-state">${meta.icon}</span>
      </button>
    `;
  }

  function renderMonthCards(weeks) {
    const groups = new Map();
    weeks.forEach((week) => {
      const key = `${week.monthYear}-${week.month}`;
      if (!groups.has(key)) groups.set(key, {
        month: week.month,
        year: week.monthYear,
        weeks: []
      });
      groups.get(key).weeks.push(week);
    });

    return [...groups.values()].map((group) => `
      <section class="lk-cal-month">
        <h3>${escapeHtml(MONTHS[group.month])}<small>${group.year}</small></h3>
        <div class="lk-cal-month-weeks">
          ${group.weeks.map(renderWeekTile).join("")}
        </div>
      </section>
    `).join("");
  }

  function renderCalendarHeader(weeks) {
    const counts = weeks.reduce((acc, week) => {
      acc[weekPlanningState(week)] += 1;
      return acc;
    }, { ready: 0, draft: 0, open: 0 });
    const startYear = calendarStartYear();
    const years = schoolYearOptionYears();

    return `
      <section class="panel lk-cal-hero">
        <div class="lk-cal-hero-main">
          <p class="lk-cal-kicker">Wochenplan</p>
          <div class="lk-cal-title-line">
            <div>
              <h2>Wochenübersicht</h2>
              <p class="privacy-text">
                Wähle eine Kalenderwoche. Du siehst sofort, was fertig geplant ist und welche Wochen noch offen sind.
              </p>
            </div>
            <div class="lk-cal-year-picker" aria-label="Schuljahr auswählen">
              <button class="secondary lk-cal-year-arrow" type="button" onclick="lkShiftCalendarSchoolYear(-1)" aria-label="Vorheriges Schuljahr">←</button>
              <label>
                <span>Schuljahr</span>
                <select class="select-input" onchange="lkSetCalendarSchoolYear(Number(this.value))">
                  ${years.map((year) => `
                    <option value="${year}" ${year === startYear ? "selected" : ""}>${escapeHtml(schoolYearLabel(year))}</option>
                  `).join("")}
                </select>
              </label>
              <button class="secondary lk-cal-year-arrow" type="button" onclick="lkShiftCalendarSchoolYear(1)" aria-label="Nächstes Schuljahr">→</button>
            </div>
          </div>
          <p class="lk-cal-year-range">August ${startYear} bis Juli ${startYear + 1}</p>
        </div>
        <div class="lk-cal-summary" aria-label="Planungsstand">
          <span class="ready">✓ ${counts.ready} fertig</span>
          <span class="draft">◐ ${counts.draft} begonnen</span>
          <span class="open">○ ${counts.open} offen</span>
        </div>
      </section>
    `;
  }

  function renderSelectedPlanCard(plan, week) {
    const status = planPlanningState(plan);
    const meta = stateMeta(status);
    const taskCount = totalTasks(plan);
    const visibility = typeof weeklyPlanChildVisibility === "function"
      ? weeklyPlanChildVisibility(plan)
      : { label: "" };

    return `
      <article class="lk-cal-plan-card">
        <div class="lk-cal-plan-main">
          <div class="lk-cal-plan-title">
            <span class="lk-cal-plan-status ${meta.className}">${meta.icon} ${escapeHtml(meta.label)}</span>
            <h3>${escapeHtml(plan.title || "Wochenplan")}</h3>
            <p>
              ${taskCount} Aufgabe${taskCount === 1 ? "" : "n"}
              ${visibility?.label ? ` · ${escapeHtml(visibility.label)}` : ""}
            </p>
          </div>
          <div class="lk-cal-plan-actions">
            <button class="primary" type="button" onclick="lkEditCalendarPlan('${escapeAttribute(plan.id)}')">Bearbeiten</button>
            <button class="primary lk-cal-print" type="button" onclick="openWeeklyPrintDialog('${escapeAttribute(plan.id)}')">🖨 Wochenplan drucken</button>
            <button class="secondary small-button" type="button" onclick="lkCopyCalendarPlan('${escapeAttribute(plan.id)}')">Kopieren</button>
          </div>
        </div>

        <div class="lk-cal-day-summary">
          ${WEEK_DAYS.map((day) => {
            const count = taskCountForDay(plan, day);
            return `<span class="${count ? "has-tasks" : ""}">${escapeHtml(day.slice(0, 2))} <b>${count}</b></span>`;
          }).join("")}
        </div>

        <div class="lk-cal-plan-footer">
          <button
            class="${status === "ready" ? "link-button" : "secondary"}"
            type="button"
            onclick="lkTogglePlanningReady('${escapeAttribute(plan.id)}')"
          >${status === "ready" ? "Als begonnen markieren" : "✓ Als fertig geplant markieren"}</button>
          <button class="link-button danger-text" type="button" onclick="deleteWeeklyPlan('${escapeAttribute(plan.id)}')">Löschen</button>
        </div>
      </article>
    `;
  }

  function renderSelectedWeekPanel(week) {
    const plans = plansForWeek(week);
    const meta = stateMeta(weekPlanningState(week));

    return `
      <section class="panel lk-cal-selected">
        <div class="lk-cal-selected-head">
          <div>
            <span class="lk-cal-week-status ${meta.className}">${meta.icon} ${escapeHtml(meta.label)}</span>
            <h2>${escapeHtml(selectedWeekTitle(week))}</h2>
          </div>
          ${plans.length
            ? `<button class="primary" type="button" onclick="lkOpenSelectedWeekEditor()">✏️ Plan bearbeiten</button>`
            : `<button class="primary" type="button" onclick="lkCreateCalendarWeek('${escapeAttribute(week.key)}')">+ Wochenplan erstellen</button>`}
        </div>

        ${plans.length
          ? `<div class="lk-cal-plan-list">${plans.map((plan) => renderSelectedPlanCard(plan, week)).join("")}</div>`
          : `<div class="lk-cal-empty">
              <span>○</span>
              <div>
                <strong>Für diese Woche ist noch kein Plan angelegt.</strong>
                <small>Mit einem Klick werden KW und Zeitraum bereits eingetragen.</small>
              </div>
            </div>`}
      </section>
    `;
  }

  function renderOverview() {
    const weeks = schoolYearWeeks(calendarStartYear());
    const week = selectedWeek();
    return `
      ${renderCalendarHeader(weeks)}
      <section class="lk-cal-grid">
        ${renderMonthCards(weeks)}
      </section>
      ${week ? renderSelectedWeekPanel(week) : ""}
    `;
  }

  function renderTopTabs(section) {
    return `
      <section class="panel lk-cal-nav">
        <div class="section-tabs weekly-section-tabs lk-cal-tabs">
          <button class="small-button ${section === "current" ? "active" : ""}" type="button" onclick="lkSetCalendarSection('current')">📅 Wochenübersicht</button>
          <button class="small-button ${section === "create" ? "active" : ""}" type="button" onclick="lkOpenSelectedWeekEditor()">✏️ Plan bearbeiten</button>
          <button class="small-button ${section === "catalog" ? "active" : ""}" type="button" onclick="lkSetCalendarSection('catalog')">📚 Hefte</button>
        </div>
      </section>
    `;
  }

  renderWeeklyPlans = function renderWeeklyPlansCalendar() {
    const plans = weeklyPlansForActiveClass()
      .sort((a, b) => String(b.validFrom || b.createdAt || "").localeCompare(String(a.validFrom || a.createdAt || "")));
    const editorPlan = weeklyPlanEditorId ? plans.find((plan) => plan.id === weeklyPlanEditorId) : null;
    let section = weeklyPlanSection || "current";

    if (section === "templates") {
      section = "current";
      weeklyPlanSection = "current";
    }

    if (!["current", "create", "catalog"].includes(section)) {
      section = "current";
      weeklyPlanSection = "current";
    }

    ensureSelectedWeek();

    return `
      ${renderTopTabs(section)}
      ${section === "current" ? renderOverview() : ""}
      ${section === "create" ? renderWeeklyPlanEditor(editorPlan, null) : ""}
      ${section === "catalog" ? renderWorkbookCatalogManager() : ""}
      ${typeof renderWeeklyCatalogPicker === "function" ? renderWeeklyCatalogPicker() : ""}
      ${typeof renderWeeklyPrintDialog === "function" ? renderWeeklyPrintDialog() : ""}
    `;
  };

  window.lkSetCalendarSection = function lkSetCalendarSection(section) {
    if (weeklyPlanSection === "create") {
      try { weeklyPlanDraft = collectWeeklyPlanDraftFromDom(); } catch {}
    }
    weeklyPlanSection = section === "catalog" ? "catalog" : "current";
    render();
  };

  window.lkSetCalendarSchoolYear = async function lkSetCalendarSchoolYear(startYear) {
    const year = Number(startYear);
    if (!Number.isFinite(year) || year < 2000 || year > 2200) return;

    lkCalendarStartYear = year;
    lkCalendarSelectedMonday = "";
    weeklyPlanSection = "current";
    weeklyPlanEditorId = "";
    weeklyPlanDraft = null;

    await persist({ ...state, weeklyCalendarStartYear: year });
    render();
  };

  window.lkShiftCalendarSchoolYear = function lkShiftCalendarSchoolYear(direction) {
    const delta = Number(direction) < 0 ? -1 : 1;
    return lkSetCalendarSchoolYear(calendarStartYear() + delta);
  };

  window.lkSelectCalendarWeek = function lkSelectCalendarWeek(key) {
    lkCalendarSelectedMonday = key;
    weeklyPlanSection = "current";
    weeklyPlanEditorId = "";
    weeklyPlanDraft = null;
    render();
    requestAnimationFrame(() => {
      document.querySelector(".lk-cal-selected")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  };

  window.lkCreateCalendarWeek = function lkCreateCalendarWeek(key) {
    const week = weekByKey(key);
    if (!week) return;
    lkCalendarSelectedMonday = key;
    lkCalendarCreatingWeek = {
      key,
      validFrom: week.key,
      validTo: localDateKey(week.friday)
    };
    weeklyPlanEditorId = "";
    weeklyPlanDraft = makeDraftForWeek(week);
    weeklyPickRequest = null;
    weeklyPlanSection = "create";
    render();
  };

  window.lkOpenSelectedWeekEditor = function lkOpenSelectedWeekEditor() {
    const week = selectedWeek();
    if (!week) return;
    const plans = plansForWeek(week);

    if (plans.length) {
      weeklyPlanDraft = null;
      editWeeklyPlan(plans[0].id);
      return;
    }
    lkCreateCalendarWeek(week.key);
  };

  window.lkEditCalendarPlan = function lkEditCalendarPlan(planId) {
    weeklyPlanDraft = null;
    editWeeklyPlan(planId);
  };

  window.lkCopyCalendarPlan = function lkCopyCalendarPlan(planId) {
    if (baseCopyWeeklyPlan) {
      baseCopyWeeklyPlan(planId);
      return;
    }
    if (typeof copyWeeklyPlan === "function") copyWeeklyPlan(planId);
  };

  window.lkTogglePlanningReady = async function lkTogglePlanningReady(planId) {
    const plan = (state.weeklyPlans || []).find((item) => item.id === planId);
    if (!plan) return;

    const current = planPlanningState(plan);
    const nextMap = {
      ...planningStateMap(),
      [planId]: current === "ready" ? "draft" : "ready"
    };
    await persistAndRender({ ...state, weeklyPlanningStatus: nextMap });
  };

  window.lkChangeCalendarSchoolYear = function lkChangeCalendarSchoolYear(delta) {
    lkCalendarStartYear = calendarStartYear() + Number(delta || 0);
    lkCalendarSelectedMonday = "";
    weeklyPlanSection = "current";
    render();
  };

  // Neue Pläne, die direkt aus einer offenen Kalenderwoche erzeugt werden,
  // bleiben nach dem ersten Speichern zunächst "begonnen".
  if (baseSaveWeeklyPlan) {
    saveWeeklyPlan = async function saveWeeklyPlanCalendar(event) {
      const pending = lkCalendarCreatingWeek ? { ...lkCalendarCreatingWeek } : null;
      await baseSaveWeeklyPlan(event);

      if (!pending) return;

      const candidates = (state.weeklyPlans || [])
        .filter((plan) => plan.validFrom === pending.validFrom && plan.validTo === pending.validTo)
        .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
      const created = candidates[0];

      lkCalendarCreatingWeek = null;
      if (!created) return;

      const nextMap = {
        ...planningStateMap(),
        [created.id]: planningStateMap()[created.id] || "draft"
      };
      await persist({ ...state, weeklyPlanningStatus: nextMap });
      render();
    };
  }

  const style = document.createElement("style");
  style.id = "lk-weekly-calendar-style";
  style.textContent = `
    .lk-cal-nav { padding-block:10px; }
    .lk-cal-tabs { margin:0; }
    .lk-cal-tabs .small-button { font-size:.9rem; }

    .lk-cal-hero {
      display:flex;
      justify-content:space-between;
      gap:18px;
      align-items:flex-start;
      border:2px solid rgba(47,111,145,.10);
      background:linear-gradient(135deg,rgba(223,243,255,.78),rgba(255,250,231,.75));
    }
    .lk-cal-hero-main { min-width:0; flex:1; }
    .lk-cal-title-line {
      display:flex;
      align-items:flex-start;
      justify-content:space-between;
      gap:18px;
    }
    .lk-cal-title-line > div:first-child { min-width:0; }
    .lk-cal-hero h2 { margin:.15rem 0 .35rem; }
    .lk-cal-year-picker {
      display:grid;
      grid-template-columns:auto minmax(126px,auto) auto;
      align-items:end;
      gap:6px;
      flex:none;
    }
    .lk-cal-year-picker label {
      display:grid;
      gap:3px;
      font-size:.7rem;
      font-weight:800;
      opacity:.85;
    }
    .lk-cal-year-picker .select-input {
      min-width:126px;
      padding:7px 9px;
      font-weight:800;
      background:#fff;
    }
    .lk-cal-year-arrow { min-width:38px; padding:7px 9px; font-size:1rem; }
    .lk-cal-year-range { margin:6px 0 0; font-size:.76rem; opacity:.58; font-weight:700; }
    .lk-cal-kicker {
      margin:0 0 2px;
      font-size:.73rem;
      text-transform:uppercase;
      letter-spacing:.08em;
      font-weight:800;
      opacity:.55;
    }
    .lk-cal-summary {
      display:flex;
      gap:6px;
      flex-wrap:wrap;
      justify-content:flex-end;
    }
    .lk-cal-summary span,
    .lk-cal-plan-status,
    .lk-cal-week-status {
      padding:5px 8px;
      border-radius:999px;
      font-size:.78rem;
      font-weight:800;
      white-space:nowrap;
    }
    .lk-cal-summary .ready,
    .lk-cal-plan-status.ready,
    .lk-cal-week-status.ready { background:rgba(72,154,92,.13); color:#356e43; }
    .lk-cal-summary .draft,
    .lk-cal-plan-status.draft,
    .lk-cal-week-status.draft { background:#fff1c7; color:#835916; }
    .lk-cal-summary .open,
    .lk-cal-week-status.open { background:rgba(0,0,0,.05); color:#555; }

    .lk-cal-grid {
      display:grid;
      grid-template-columns:repeat(3,minmax(0,1fr));
      gap:10px;
      margin:12px 0;
    }
    .lk-cal-month {
      border:1px solid rgba(0,0,0,.08);
      border-radius:16px;
      padding:11px;
      background:rgba(255,255,255,.78);
      min-width:0;
    }
    .lk-cal-month h3 {
      display:flex;
      align-items:baseline;
      justify-content:space-between;
      gap:8px;
      margin:0 0 8px;
      font-size:.96rem;
    }
    .lk-cal-month h3 small { font-size:.7rem; opacity:.5; font-weight:600; }
    .lk-cal-month-weeks {
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:6px;
    }
    .lk-cal-week {
      position:relative;
      min-height:52px;
      display:grid;
      grid-template-columns:1fr auto;
      grid-template-rows:auto auto;
      gap:1px 6px;
      align-items:center;
      padding:7px 8px;
      border:1.5px solid rgba(0,0,0,.10);
      border-radius:12px;
      background:#fff;
      color:inherit;
      text-align:left;
      cursor:pointer;
      font:inherit;
    }
    .lk-cal-week.ready { background:rgba(225,245,230,.72); border-color:rgba(72,154,92,.22); }
    .lk-cal-week.draft { background:#fff8df; border-color:rgba(200,151,40,.26); }
    .lk-cal-week.open { background:#fff; }
    .lk-cal-week.selected {
      outline:3px solid rgba(47,111,145,.23);
      border-color:rgba(47,111,145,.58);
    }
    .lk-cal-week.current::before {
      content:"heute";
      position:absolute;
      top:-6px;
      right:7px;
      padding:1px 5px;
      border-radius:999px;
      background:#2f6f91;
      color:#fff;
      font-size:.57rem;
      font-weight:800;
    }
    .lk-cal-week-number { font-size:.82rem; font-weight:800; }
    .lk-cal-week-dates { grid-column:1; font-size:.66rem; opacity:.62; }
    .lk-cal-week-state {
      grid-column:2;
      grid-row:1 / 3;
      font-size:1rem;
      font-weight:900;
    }

    .lk-cal-selected { border:2px solid rgba(47,111,145,.13); }
    .lk-cal-selected-head {
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:14px;
      margin-bottom:12px;
    }
    .lk-cal-selected-head h2 { margin:5px 0 0; }
    .lk-cal-plan-list { display:grid; gap:10px; }
    .lk-cal-plan-card {
      border:1px solid rgba(0,0,0,.08);
      border-radius:16px;
      padding:13px;
      background:rgba(255,255,255,.82);
    }
    .lk-cal-plan-main {
      display:grid;
      grid-template-columns:minmax(0,1fr) auto;
      gap:14px;
      align-items:start;
    }
    .lk-cal-plan-title h3 { margin:6px 0 3px; }
    .lk-cal-plan-title p { margin:0; opacity:.65; font-size:.82rem; }
    .lk-cal-plan-actions {
      display:flex;
      align-items:center;
      gap:6px;
      flex-wrap:wrap;
      justify-content:flex-end;
    }
    .lk-cal-print { white-space:nowrap; }
    .lk-cal-day-summary {
      display:flex;
      gap:6px;
      flex-wrap:wrap;
      margin-top:10px;
    }
    .lk-cal-day-summary span {
      min-width:42px;
      padding:4px 7px;
      border-radius:999px;
      background:rgba(0,0,0,.04);
      font-size:.72rem;
      text-align:center;
    }
    .lk-cal-day-summary span.has-tasks { background:rgba(47,111,145,.08); }
    .lk-cal-plan-footer {
      display:flex;
      justify-content:space-between;
      gap:10px;
      align-items:center;
      margin-top:10px;
      padding-top:9px;
      border-top:1px solid rgba(0,0,0,.06);
    }
    .danger-text { color:#a34c4c; }
    .lk-cal-empty {
      display:grid;
      grid-template-columns:auto 1fr;
      gap:11px;
      align-items:center;
      padding:15px;
      border-radius:14px;
      background:rgba(0,0,0,.025);
    }
    .lk-cal-empty > span {
      width:38px;
      height:38px;
      display:grid;
      place-items:center;
      border-radius:50%;
      background:#fff;
      font-size:1.25rem;
    }
    .lk-cal-empty > div { display:grid; gap:3px; }
    .lk-cal-empty small { opacity:.65; }

    @media (max-width:980px) {
      .lk-cal-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
      .lk-cal-plan-main { grid-template-columns:1fr; }
      .lk-cal-plan-actions { justify-content:flex-start; }
    }
    @media (max-width:640px) {
      .lk-cal-hero,
      .lk-cal-selected-head { display:block; }
      .lk-cal-title-line { display:block; }
      .lk-cal-year-picker {
        margin-top:10px;
        grid-template-columns:auto minmax(0,1fr) auto;
      }
      .lk-cal-year-picker .select-input { width:100%; }
      .lk-cal-summary { justify-content:flex-start; margin-top:10px; }
      .lk-cal-grid { grid-template-columns:1fr; }
      .lk-cal-selected-head > button { margin-top:10px; }
      .lk-cal-plan-footer { align-items:flex-start; flex-direction:column; }
    }
  `;
  if (!document.getElementById(style.id)) document.head.appendChild(style);

  window.LKWeeklyCalendar = {
    schoolYearWeeks,
    isoWeekInfo,
    schoolYearForDate,
    schoolYearOptionYears,
    planMatchesWeek,
    weekPlanningState,
    makeDraftForWeek
  };
})();
