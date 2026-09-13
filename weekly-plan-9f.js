/* Paket 9f: kindgerechte A4-Wochenplan-Druckvorlage,
 * diskreter Kinder-Code, korrigierte freie Aufgaben und konkretisierte
 * Rico-Schnabel-Themen.
 *
 * Lädt NACH weekly-plan-9e.js.
 */
(() => {
  if (
    typeof renderWeeklyPrintDialog !== "function" ||
    typeof startWeeklyPlanPrint !== "function" ||
    typeof renderPrintWeeklyPlan !== "function" ||
    typeof renderAnimalMapping !== "function" ||
    typeof weeklyPlanItemsForDay !== "function"
  ) {
    console.warn("Paket 9f konnte nicht initialisiert werden.");
    return;
  }

  const baseRenderAnimalMapping = renderAnimalMapping;
  const RICO_WORKBOOK = window.LKWeeklyPlan9e?.RICO_WORKBOOK || "Rico Schnabel 2 – Rechtschreiben";
  const RICO_ROWS = window.LKWeeklyPlan9e?.RICO_ROWS || [];

  let lkPrint9fMessage = "";

  function normalizeCode(value) {
    return String(value || "")
      .trim()
      .toUpperCase()
      .replace(/[^A-ZÄÖÜ0-9]/g, "")
      .slice(0, 3);
  }

  function teacherAnimalName(animal) {
    const base = `${animal?.tierEmoji || ""} ${animal?.tierName || ""}`.trim();
    return animal?.firstName ? `${base} · ${animal.firstName}` : base;
  }

  function printAudienceLabel(animal) {
    if (!animal) return "Ganze Klasse";
    return `${animal?.tierEmoji || ""} ${animal?.tierName || "Kind"}`.trim();
  }

  function printDensityClass(taskCount = 0) {
    if (taskCount > 22) return "lk-wp-density-compact";
    if (taskCount > 16) return "lk-wp-density-medium";
    return "lk-wp-density-roomy";
  }

  /* ---------- Diskreter Kinder-Code ---------- */

  window.lkSaveWeeklyCode = async function lkSaveWeeklyCode(animalId, value) {
    const code = normalizeCode(value);
    const animals = (state.animals || []).map((animal) =>
      animal.id === animalId ? { ...animal, weeklyCode: code } : animal
    );
    await persist({ ...state, animals });
  };

  renderAnimalMapping = function renderAnimalMapping9f() {
    const animals = animalsForActiveClass().filter((animal) => animal.aktiv);
    return `
      ${baseRenderAnimalMapping()}
      <section class="panel lk-weekly-code-panel">
        <div class="lk-code-head">
          <div>
            <h2>Wochenplan-Code</h2>
            <p class="privacy-text">
              Optionaler, unauffälliger Buchstabe für individuelle Wochenpläne.
              Beispiel: A für Adrian, E für Emil. Der Name wird nicht auf den Plan gedruckt.
            </p>
          </div>
          <span class="lk-code-example">A</span>
        </div>
        <div class="lk-code-grid">
          ${animals.map((animal) => `
            <label class="lk-code-row">
              <span>${escapeHtml(teacherAnimalName(animal))}</span>
              <input
                class="text-input lk-code-input"
                maxlength="3"
                value="${escapeAttribute(animal.weeklyCode || "")}"
                placeholder="z. B. A"
                aria-label="Wochenplan-Code für ${escapeAttribute(animal.tierName || "")}"
                onchange="lkSaveWeeklyCode('${escapeAttribute(animal.id)}', this.value)"
              >
            </label>
          `).join("")}
        </div>
        <p class="message subtle">
          Der Code erscheint nur klein und ohne Beschriftung oben rechts auf einem individuell gedruckten Plan.
        </p>
      </section>
    `;
  };

  /* ---------- Rico Schnabel konkretisieren ---------- */

  function ricoTopicForPage(page) {
    const number = Number(page || 0);
    if (!number || !RICO_ROWS.length) return null;
    let result = null;
    for (let i = 0; i < RICO_ROWS.length; i += 1) {
      const [start, title, area] = RICO_ROWS[i];
      const nextStart = RICO_ROWS[i + 1]?.[0] || 113;
      if (number >= start && number < nextStart) {
        result = {
          start,
          end: Math.max(start, nextStart - 1),
          title,
          area
        };
        break;
      }
    }
    return result;
  }

  async function migrateRicoTopics9f() {
    if (!state?.setupComplete || !state.activeClassId || !RICO_ROWS.length) return 0;
    let changed = 0;
    const timestamp = typeof nowIso === "function" ? nowIso() : new Date().toISOString();

    const workbookCatalog = (state.workbookCatalog || []).map((item) => {
      if (item.classId !== state.activeClassId || item.workbook !== RICO_WORKBOOK) return item;
      const page = Number(item.page || item.startPage || 0);
      const topic = ricoTopicForPage(page);
      if (!topic) return item;

      const next = {
        ...item,
        part: topic.area,
        area: topic.area,
        category: topic.area,
        title: topic.title,
        competence: "Rechtschreiben",
        updatedAt: timestamp
      };

      if (
        next.part !== item.part ||
        next.area !== item.area ||
        next.category !== item.category ||
        next.title !== item.title
      ) changed += 1;
      return next;
    });

    if (changed) await persist({ ...state, workbookCatalog });
    return changed;
  }

  window.lkRefreshRicoTopics = async function lkRefreshRicoTopics() {
    const count = await migrateRicoTopics9f();
    globalMessage = count
      ? `${count} Rico-Schnabel-Seiten wurden mit den Themen aus dem Inhaltsverzeichnis aktualisiert.`
      : "Rico Schnabel 2 ist bereits konkret nach Themen zugeordnet.";
    render();
  };

  /* ---------- Druckdialog ---------- */

  function fixedPrintAnimalIds(plan, animals) {
    if (!plan || plan.assignmentMode !== "selected" || !Array.isArray(plan.animalIds) || !plan.animalIds.length) return [];
    const validIds = new Set((animals || []).map((animal) => animal.id));
    return [...new Set(plan.animalIds)].filter((id) => validIds.has(id));
  }

  function fixedPrintAnimalRows(animals) {
    return animals.map((animal) => `
      <div class="lk-print-animal-row lk-print-animal-row-fixed">
        <span class="lk-print-fixed-mark" aria-hidden="true">✓</span>
        <span>${escapeHtml(teacherAnimalName(animal))}</span>
        <span class="lk-print-code-label">Code</span>
        <input
          class="text-input lk-print-code-input"
          id="lkPrintCode_${escapeAttribute(animal.id)}"
          maxlength="3"
          value="${escapeAttribute(animal.weeklyCode || "")}"
          placeholder="A"
          aria-label="Druck-Code für ${escapeAttribute(teacherAnimalName(animal))}"
        >
      </div>
    `).join("");
  }

  function animalPrintRows(animals) {
    return animals.map((animal, index) => `
      <label class="lk-print-animal-row">
        <input class="weeklyPrintAnimalCheckbox" type="checkbox" value="${escapeAttribute(animal.id)}" ${index === 0 ? "checked" : ""}>
        <span>${escapeHtml(teacherAnimalName(animal))}</span>
        <span class="lk-print-code-label">Code</span>
        <input
          class="text-input lk-print-code-input"
          id="lkPrintCode_${escapeAttribute(animal.id)}"
          maxlength="3"
          value="${escapeAttribute(animal.weeklyCode || "")}"
          placeholder="A"
          aria-label="Druck-Code"
        >
      </label>
    `).join("");
  }

  renderWeeklyPrintDialog = function renderWeeklyPrintDialog9f() {
    if (!weeklyPrintDialogOpen) return "";
    const plan = weeklyPrintDraft || (state.weeklyPlans || []).find((item) => item.id === weeklyPrintPlanId);
    const animals = animalsForActiveClass().filter((animal) => animal.aktiv);
    const fixedIds = fixedPrintAnimalIds(plan, animals);
    const fixedAnimals = fixedIds.map((id) => animals.find((animal) => animal.id === id)).filter(Boolean);
    const isClassPlan = !plan || plan.assignmentMode === "all" || !fixedAnimals.length;
    const audienceLabel = isClassPlan
      ? "Ganze Klasse"
      : `${fixedAnimals.length} ${fixedAnimals.length === 1 ? "ausgewähltes Kind" : "ausgewählte Kinder"}`;

    return `
      <div class="training-modal-overlay lk-print9f-overlay" role="presentation" onclick="if (event.target === this) closeWeeklyPrintDialog()">
        <section class="training-modal-card lk-print9f-card" role="dialog" aria-modal="true" aria-labelledby="weeklyPrintTitle">
          <button class="modal-close" type="button" aria-label="Schließen" onclick="closeWeeklyPrintDialog()">×</button>
          <div class="lk-print9f-head">
            <div>
              <span class="weekly-editor-badge">Druck</span>
              <h2 id="weeklyPrintTitle">Wochenplan drucken</h2>
              <p class="privacy-text">
                Die Druckvorlage ist fest auf eine ruhige DIN-A4-Seite ausgelegt.
                Name und Erledigt-Kreise bleiben zum handschriftlichen Ausfüllen frei.
              </p>
            </div>
          </div>

          ${plan ? `
            <div class="lk-print9f-steps">
              <section class="lk-print-fixed-audience">
                <strong>Für wen wird gedruckt?</strong>
                <div class="lk-print-fixed-summary">
                  <span class="lk-print-fixed-icon">✓</span>
                  <div>
                    <b>${escapeHtml(audienceLabel)}</b>
                    <small>${isClassPlan
                      ? "Die Zielgruppe wurde beim Erstellen des Wochenplans festgelegt. Alle erhalten denselben Plan."
                      : "Die Zielgruppe wurde beim Erstellen des Wochenplans festgelegt und wird automatisch übernommen."}</small>
                  </div>
                </div>

                ${isClassPlan ? "" : `
                  <div class="lk-print-animal-grid lk-print-fixed-grid">
                    ${fixedPrintAnimalRows(fixedAnimals)}
                  </div>
                  <p class="message subtle">
                    Die kleinen Druck-Codes kannst du bei Bedarf ändern. Die Kinder-Auswahl selbst ist fest.
                  </p>
                `}
              </section>

              <section class="lk-print-layout-section">
                <strong>Layout</strong>
                <div class="lk-print-layout-grid">
                  <label class="lk-print-layout-choice ${plan?.planningMode === "week" ? "disabled" : ""}">
                    <input type="radio" name="lkPrintLayout" value="day"
                      ${plan?.planningMode === "week" ? "disabled" : "checked"}>
                    <span>📅</span>
                    <div>
                      <b>Tagesplan</b>
                      <small>Montag bis Freitag einzeln</small>
                      ${plan?.planningMode === "week" ? `<em>Nur bei Planung nach Tagen</em>` : ""}
                    </div>
                  </label>
                  <label class="lk-print-layout-choice">
                    <input type="radio" name="lkPrintLayout" value="week"
                      ${plan?.planningMode === "week" ? "checked" : ""}>
                    <span>🗂</span>
                    <div>
                      <b>Wochenplan</b>
                      <small>Deutsch/Mathe · Pflicht vor Sternchen</small>
                    </div>
                  </label>
                </div>
              </section>

              <section>
                <strong>Inhalt</strong>
                <label class="toggle-label lk-print-toggle">
                  <input id="weeklyPrintExtra" type="checkbox" checked>
                  ⭐ Zusatzaufgaben mitdrucken
                </label>
              </section>

              <section class="lk-print-footer-inputs">
                <div class="lk-print-footer-inputs-head">
                  <strong>Notizfelder auf dem Ausdruck <span>optional</span></strong>
                  <small>Nur ausgewählte Felder werden gedruckt. So bleibt mehr Platz für die Aufgaben.</small>
                </div>
                <div class="lk-print-footer-choice-grid">
                  <label class="lk-print-footer-choice">
                    <input type="checkbox" id="lkPrintRememberEnabled" onchange="lkTogglePrintFooterField('Remember',this.checked)">
                    <span>Daran denke ich</span>
                  </label>
                  <label class="lk-print-footer-choice">
                    <input type="checkbox" id="lkPrintTeacherNoteEnabled" onchange="lkTogglePrintFooterField('TeacherNote',this.checked)">
                    <span>Mitteilung Lehrkraft</span>
                  </label>
                  <label class="lk-print-footer-choice">
                    <input type="checkbox" id="lkPrintParentNoteEnabled" onchange="lkTogglePrintFooterField('ParentNote',this.checked)">
                    <span>Mitteilung Eltern</span>
                  </label>
                </div>
                <div class="lk-print-footer-input-grid">
                  <label class="field lk-print-footer-field hidden" id="lkPrintRememberWrap">
                    Daran denke ich
                    <textarea class="text-input lk-print-footer-text" id="lkPrintRemember" rows="2" placeholder="Leer lassen für Schreiblinien"></textarea>
                  </label>
                  <label class="field lk-print-footer-field hidden" id="lkPrintTeacherNoteWrap">
                    Mitteilung Lehrkraft
                    <textarea class="text-input lk-print-footer-text" id="lkPrintTeacherNote" rows="2" placeholder="Leer lassen für Schreiblinien"></textarea>
                  </label>
                  <label class="field lk-print-footer-field hidden" id="lkPrintParentNoteWrap">
                    Mitteilung Eltern
                    <textarea class="text-input lk-print-footer-text" id="lkPrintParentNote" rows="2" placeholder="Leer lassen für Schreiblinien"></textarea>
                  </label>
                </div>
              </section>
            </div>

            ${lkPrint9fMessage ? `<p class="message error">${escapeHtml(lkPrint9fMessage)}</p>` : ""}

            <div class="backup-actions lk-print9f-actions">
              <button class="secondary" type="button" onclick="closeWeeklyPrintDialog()">Abbrechen</button>
              <button class="primary" type="button" onclick="startWeeklyPlanPrint()">Vorschau öffnen</button>
            </div>
          ` : `<div class="empty">Der Wochenplan wurde nicht gefunden.</div>`}
        </section>
      </div>
    `;
  };

  window.lkToggle9fPrintTarget = function lkToggle9fPrintTarget() {
    const target = document.querySelector('input[name="lkPrintTarget"]:checked')?.value || "all";
    document.getElementById("lkPrintIndividualWrap")?.classList.toggle("hidden", target !== "selected");
  };

  window.lkSelectAllPrintAnimals = function lkSelectAllPrintAnimals(checked) {
    document.querySelectorAll(".weeklyPrintAnimalCheckbox").forEach((input) => {
      input.checked = Boolean(checked);
    });
  };

  window.lkTogglePrintFooterField = function lkTogglePrintFooterField(key, enabled) {
    const wrap = document.getElementById(`lkPrint${key}Wrap`);
    wrap?.classList.toggle("hidden", !enabled);
    if (enabled) setTimeout(() => document.getElementById(`lkPrint${key}`)?.focus(), 0);
  };

  startWeeklyPlanPrint = function startWeeklyPlanPrint9f() {
    const plan = weeklyPrintDraft || (state.weeklyPlans || []).find((item) => item.id === weeklyPrintPlanId);
    if (!plan) return;

    const availableAnimals = animalsForActiveClass().filter((animal) => animal.aktiv);
    const fixedIds = fixedPrintAnimalIds(plan, availableAnimals);
    const target = fixedIds.length ? "selected" : "all";
    const selectedAnimals = fixedIds;

    const codes = {};
    selectedAnimals.forEach((animalId) => {
      codes[animalId] = normalizeCode(document.getElementById(`lkPrintCode_${animalId}`)?.value || "");
    });

    lkPrint9fMessage = "";
    currentWeeklyPrintPlan = plan;
    currentWeeklyPrintOptions = {
      template: "kindgerecht-v1",
      variant: "kindgerecht",
      target,
      animalIds: selectedAnimals,
      days: [...WEEK_DAYS],
      showTheme: true,
      showExtra: document.querySelector("#weeklyPrintExtra")?.checked !== false,
      showCheckboxes: true,
      showFirstNames: false,
      layout: document.querySelector('input[name="lkPrintLayout"]:checked')?.value
        || (plan.planningMode === "week" ? "week" : "day"),
      codes,
      footerNotes: {
        rememberEnabled: document.querySelector("#lkPrintRememberEnabled")?.checked === true,
        teacherEnabled: document.querySelector("#lkPrintTeacherNoteEnabled")?.checked === true,
        parentEnabled: document.querySelector("#lkPrintParentNoteEnabled")?.checked === true,
        remember: String(document.querySelector("#lkPrintRemember")?.value || "").trim(),
        teacher: String(document.querySelector("#lkPrintTeacherNote")?.value || "").trim(),
        parent: String(document.querySelector("#lkPrintParentNote")?.value || "").trim()
      }
    };
    weeklyPrintDialogOpen = false;
    currentPrintType = "weeklyPlan";
    printReturnTab = "weeklyPlans";
    screen = "printView";
    render();
  };

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !weeklyPrintDialogOpen) return;
    event.preventDefault();
    closeWeeklyPrintDialog();
  });

  /* ---------- A4 Druckvorlage ---------- */

  function germanDate(value) {
    if (!value) return "";
    try {
      return typeof formatGermanDate === "function"
        ? formatGermanDate(value)
        : new Date(value).toLocaleDateString("de-DE");
    } catch {
      return String(value);
    }
  }

  function codeForAnimal(animal, options) {
    if (!animal) return "";
    return normalizeCode(options?.codes?.[animal.id] || animal.weeklyCode || "");
  }

  function printSubject(item) {
    const raw = String(item?.subject || item?.label || "")
      .replace(/^⭐\s*/, "")
      .trim();
    if (/deutsch/i.test(raw)) return "Deutsch";
    if (/mathe/i.test(raw)) return "Mathe";
    if (/extra|freie aufgabe|sonstig/i.test(raw)) return "Extra";

    const catalogSubject = String(item?.catalogItem?.subject || "").trim();
    if (/deutsch/i.test(catalogSubject)) return "Deutsch";
    if (/mathe/i.test(catalogSubject)) return "Mathe";
    return item?.isFreeTask ? "Extra" : raw;
  }

  function printDisplaySection(item) {
    return item?.weeklySection || printSubject(item);
  }

  function printDeutschSectionOrder(plan) {
    const defaults = ["Deutsch", "Lesezeit", "Lernwörter"];
    const input = Array.isArray(plan?.deutschSectionOrder) ? plan.deutschSectionOrder : [];
    const valid = input.filter((item) => defaults.includes(item));
    return [...new Set([...valid, ...defaults])].slice(0, defaults.length);
  }

  function printSectionTitle(section) {
    return section === "Deutsch" ? "Arbeitsaufträge" : section;
  }

  function printParentSubject(section) {
    return section === "Lesezeit" || section === "Lernwörter" ? "Deutsch" : section;
  }

  function printTaskSubjectLabel(section) {
    if (section === "Deutsch") return "Arbeitsaufträge";
    if (section === "Lesezeit") return "Lesezeit";
    if (section === "Lernwörter") return "Lernwörter";
    return section;
  }

  function printableItems(plan, day, animal, options) {
    let items = weeklyPlanItemsForDay(plan, day, animal?.id || "");
    if (options?.showExtra === false) items = items.filter((item) => !item.isExtraTask);

    const order = printDeutschSectionOrder(plan);
    const rank = Object.fromEntries(order.map((section, index) => [section, index + 1]));
    rank.Mathe = 10;
    rank.Extra = 20;
    return items
      .map((item, index) => ({ item, index }))
      .sort((a, b) => (
        (rank[printDisplaySection(a.item)] || 30) - (rank[printDisplaySection(b.item)] || 30)
        || a.index - b.index
      ))
      .map(({ item }) => item);
  }

  function pageText(item) {
    if (item?.weeklySection === "Lernwörter") {
      const free = String(item.freeText || item.text || "").replace(/^⭐\s*/, "").trim();
      if (free) return free;
      const legacyTitle = String(item?.catalogItem?.title || "").trim();
      if (legacyTitle && !/^Lernwörter(?:\s+Seite\s+\d+)?$/i.test(legacyTitle)) return legacyTitle;
      return "Lernwörter";
    }
    if (item.isFreeTask || !item.catalogItem) {
      return String(item.freeText || item.text || "").replace(/^⭐\s*/, "").trim();
    }
    const catalog = item.catalogItem;
    let page = "";
    try { page = pageRangeLabel(catalog); } catch {}
    const bits = [
      page,
      item.taskNumber ? `Nr. ${item.taskNumber}` : ""
    ].filter(Boolean);
    return bits.join(" · ");
  }

  function detailText(item) {
    if (!item.catalogItem) return "";
    const bits = [
      String(item.catalogItem.title || item.catalogItem.area || "").trim(),
      String(item.catalogItem.workbook || "").trim()
    ].filter(Boolean);
    return bits.join(" · ");
  }

  function printSubjectClass(subject) {
    if (subject === "Deutsch") return "deutsch";
    if (subject === "Lesezeit") return "lesezeit";
    if (subject === "Lernwörter") return "lernwoerter";
    if (subject === "Mathe") return "mathe";
    return "extra";
  }

  function renderWorksheetCoverImage(className = "") {
    const classes = ["lk-wp-book-cover", className].filter(Boolean).join(" ");
    return `<img class="${escapeAttribute(classes)}" src="./materials/cover-arbeitsblatt.png" alt="Arbeitsblatt">`;
  }

  function printSubjectBadge(subject) {
    if (subject === "Deutsch") {
      return `<span class="lk-wp-subject-badge deutsch" aria-hidden="true"><span class="a">A</span><span class="b">B</span><span class="c">C</span></span>`;
    }
    if (subject === "Lesezeit") {
      return `<span class="lk-wp-subject-badge lesezeit" aria-hidden="true">📖</span>`;
    }
    if (subject === "Lernwörter") {
      return `<span class="lk-wp-subject-badge lernwoerter" aria-hidden="true">Aa</span>`;
    }
    if (subject === "Mathe") {
      return `<span class="lk-wp-subject-badge mathe" aria-hidden="true"><span class="n1">1</span><span class="n2">2</span><span class="n3">3</span></span>`;
    }
    return `<span class="lk-wp-subject-badge extra" aria-hidden="true">✏️</span>`;
  }

  function printTaskRow(item = null, previousSubject = "", previousWorkbook = "") {
    if (!item) {
      return `
        <div class="lk-wp-task-row blank">
          <div class="lk-wp-task-text"><span>&nbsp;</span></div>
          <span class="lk-wp-circle"></span>
        </div>
      `;
    }

    const subject = printDisplaySection(item);
    const subjectClass = printSubjectClass(subject);
    const parentSubject = printParentSubject(subject);
    const subjectLabel = printTaskSubjectLabel(subject);
    const workbook = String(item?.catalogItem?.workbook || "");
    const showCover = Boolean(item.catalogItem && workbook && workbook !== previousWorkbook);
    const showWorksheetCover = Boolean(item.isWorksheetTask && !item.catalogItem);
    return `
      <div class="lk-wp-task-row ${subjectClass} ${item.isExtraTask ? "starred" : ""} ${previousSubject && previousSubject !== subject ? "subject-break" : ""}">
        <div class="lk-wp-task-text">
          <span class="lk-wp-task-main">
            ${item.isExtraTask ? `<b class="lk-wp-star" aria-label="Zusatzaufgabe">★</b>` : ""}
            ${printSubjectBadge(parentSubject)}
            <span class="lk-wp-task-subject-label">${escapeHtml(subjectLabel)}</span>
          </span>
          <div class="lk-wp-task-assignment ${(item.catalogItem || showWorksheetCover) ? "with-cover" : ""}">
            ${showCover ? renderWorkbookCoverImage(item.catalogItem, "lk-wp-book-cover") : showWorksheetCover ? renderWorksheetCoverImage() : `<span class="lk-wp-book-cover-spacer" aria-hidden="true"></span>`}
            <div class="lk-wp-task-copy">
              <strong>${escapeHtml(pageText(item))}</strong>
            </div>
          </div>
        </div>
        <span class="lk-wp-circle"></span>
      </div>
    `;
  }

  function renderPrintDay9f(plan, day, animal, options) {
    const items = printableItems(plan, day, animal, options);
    const minimumRows = 5;
    const rows = [];
    let previousSubject = "";
    let previousWorkbook = "";

    items.forEach((item) => {
      rows.push(printTaskRow(item, previousSubject, previousWorkbook));
      previousSubject = printDisplaySection(item);
      previousWorkbook = String(item?.catalogItem?.workbook || "");
    });

    while (rows.length < minimumRows) rows.push(printTaskRow(null));

    return `
      <section class="lk-wp-day">
        <div class="lk-wp-day-name">${escapeHtml(day)}</div>
        <div class="lk-wp-day-tasks">
          ${rows.join("")}
        </div>
      </section>
    `;
  }

  function renderFooterBox(title, kind = "", value = "") {
    const text = String(value || "").trim();
    return `
      <section class="lk-wp-footer-box ${escapeAttribute(kind)} ${text ? "has-text" : ""}">
        <h3>${escapeHtml(title)}</h3>
        ${text
          ? `<div class="lk-wp-footer-text">${escapeHtml(text).replace(/\n/g, "<br>")}</div>`
          : `<div class="lk-wp-footer-lines"><span></span><span></span><span></span></div>`}
      </section>
    `;
  }

  function allPrintableItems(plan, animal, options) {
    let items = WEEK_DAYS.flatMap((day) => weeklyPlanItemsForDay(plan, day, animal?.id || "")
      .map((item) => ({ ...item, sourceDay: day })));
    if (options?.showExtra === false) items = items.filter((item) => !item.isExtraTask);
    return items;
  }

  function renderSelectedFooter(options) {
    const notes = options?.footerNotes || {};
    const boxes = [];
    if (notes.rememberEnabled) boxes.push(renderFooterBox("Daran denke ich", "remember", notes.remember));
    if (notes.teacherEnabled) boxes.push(renderFooterBox("Mitteilung Lehrkraft", "teacher-note", notes.teacher));
    if (notes.parentEnabled) boxes.push(renderFooterBox("Mitteilung Eltern", "parent-note", notes.parent));
    if (!boxes.length) return "";
    return `<footer class="lk-wp-footer footer-count-${boxes.length}">${boxes.join("")}</footer>`;
  }

  function renderWeekLayoutRows(items) {
    if (!items.length) return `<div class="lk-wp-week-empty">keine Aufgabe</div>`;

    const groups = [];
    items.forEach((item) => {
      const workbook = String(item?.catalogItem?.workbook || "");
      if (workbook) {
        const key = workbook;
        const last = groups[groups.length - 1];
        if (last && last.key === key) last.items.push(item);
        else groups.push({ key, workbook, catalogItem: item.catalogItem || null, showWorksheetCover: false, showBlankCoverCell: false, items: [item] });
      } else {
        const worksheet = item.isWorksheetTask === true;
        const key = worksheet ? "__worksheet__" : `__free__${groups.length}`;
        const last = groups[groups.length - 1];
        // Mehrere direkt aufeinanderfolgende Arbeitsblätter werden wie ein Heft
        // als gemeinsame Gruppe dargestellt. Dadurch erscheint das AB-Symbol
        // nur einmal neben der gesamten Aufgabenliste.
        if (worksheet && last && last.key === key && last.showWorksheetCover) {
          last.items.push(item);
        } else {
          groups.push({
            key,
            workbook: "",
            catalogItem: null,
            showWorksheetCover: worksheet,
            showBlankCoverCell: !worksheet,
            items: [item]
          });
        }
      }
    });

    return groups.map((group) => `
      <div class="lk-wp-workbook-group ${(group.catalogItem || group.showWorksheetCover || group.showBlankCoverCell) ? "has-cover" : "no-cover"}">
        ${group.catalogItem
          ? `<div class="lk-wp-workbook-cover-cell">${renderWorkbookCoverImage(group.catalogItem, "lk-wp-book-cover grouped")}</div>`
          : group.showWorksheetCover
            ? `<div class="lk-wp-workbook-cover-cell">${renderWorksheetCoverImage("grouped")}</div>`
            : group.showBlankCoverCell
              ? `<div class="lk-wp-workbook-cover-cell blank" aria-hidden="true"></div>`
              : ""}
        <div class="lk-wp-workbook-tasks">
          ${group.items.map((item) => `
            <div class="lk-wp-week-row">
              <div class="lk-wp-week-row-main">
                ${item.isExtraTask ? `<b class="lk-wp-star">★</b>` : ""}
                <div class="lk-wp-task-copy">
                  <strong>${escapeHtml(pageText(item))}</strong>
                </div>
              </div>
              <span class="lk-wp-circle"></span>
            </div>
          `).join("")}
        </div>
      </div>
    `).join("");
  }

  function renderWeekLayoutSection(title, items, className = "") {
    return `
      <section class="lk-wp-week-section ${escapeAttribute(className)}">
        <h2>${escapeHtml(title)}</h2>
        <div class="lk-wp-week-list">${renderWeekLayoutRows(items)}</div>
      </section>
    `;
  }

  function renderWeekSubjectHeader(subject, subtitle = "") {
    return `
      <header class="lk-wp-week-subject-head ${escapeAttribute(printSubjectClass(subject))}">
        ${printSubjectBadge(subject)}
        <div class="lk-wp-week-subject-copy">
          <strong>${escapeHtml(subject)}</strong>
          ${subtitle ? `<small>${escapeHtml(subtitle)}</small>` : ""}
        </div>
      </header>
    `;
  }

  function printPageWeekLayout(className, plan, animal, options) {
    const code = codeForAnimal(animal, options);
    const items = allPrintableItems(plan, animal, options);
    const deutschRequired = items.filter((item) => printSubject(item) === "Deutsch" && !item.weeklySection && !item.isExtraTask);
    const deutschStar = items.filter((item) => printSubject(item) === "Deutsch" && !item.weeklySection && item.isExtraTask);
    const lesezeitRequired = items.filter((item) => item.weeklySection === "Lesezeit" && !item.isExtraTask);
    const lesezeitStar = items.filter((item) => item.weeklySection === "Lesezeit" && item.isExtraTask);
    const lernwoerterRequired = items.filter((item) => item.weeklySection === "Lernwörter" && !item.isExtraTask);
    const lernwoerterStar = items.filter((item) => item.weeklySection === "Lernwörter" && item.isExtraTask);
    const matheRequired = items.filter((item) => printSubject(item) === "Mathe" && !item.isExtraTask);
    const matheStar = items.filter((item) => printSubject(item) === "Mathe" && item.isExtraTask);
    const extra = items.filter((item) => !["Deutsch", "Mathe"].includes(printSubject(item)));

    const densityClass = printDensityClass(items.length);
    return `
      <section class="lk-wp-page lk-wp-week-layout ${densityClass}">
        <header class="lk-wp-header">
          <div class="lk-wp-title-wrap">
            <h1>Wochenplan</h1>
            <div class="lk-wp-wave" aria-hidden="true">~~~~~~~</div>
          </div>
          ${animal ? `<div class="lk-wp-animal-corner">${escapeHtml(printAudienceLabel(animal))}</div>` : ""}
          <div class="lk-wp-meta">
            <div><strong>Name:</strong><span class="lk-wp-write-line"></span></div>
            <div class="lk-wp-period">
              <strong>Woche vom:</strong>
              <span>${escapeHtml(germanDate(plan.validFrom))}</span>
              <strong>bis:</strong>
              <span>${escapeHtml(germanDate(plan.validTo))}</span>
            </div>
          </div>
          <div class="lk-wp-small-meta">
            <span>${escapeHtml(className || "")}</span>
            ${plan.weekLabel ? `<span>${escapeHtml(plan.weekLabel)}</span>` : ""}
          </div>
        </header>

        <main class="lk-wp-week-groups">
          <section class="lk-wp-week-subject-block deutsch-group">
            ${renderWeekSubjectHeader("Deutsch", "Arbeitsaufträge · Lesezeit · Lernwörter")}
            <div class="lk-wp-week-subsections">
              ${printDeutschSectionOrder(plan).map((section) => {
                const required = section === "Deutsch" ? deutschRequired : section === "Lesezeit" ? lesezeitRequired : lernwoerterRequired;
                const starred = section === "Deutsch" ? deutschStar : section === "Lesezeit" ? lesezeitStar : lernwoerterStar;
                const cssClass = section === "Deutsch" ? "deutsch" : section === "Lesezeit" ? "lesezeit" : "lernwoerter";
                return `${required.length ? renderWeekLayoutSection(`${printSectionTitle(section)} · Pflichtaufgaben`, required, cssClass) : ""}${starred.length ? renderWeekLayoutSection(`${printSectionTitle(section)} · ⭐ Sternchenaufgaben`, starred, `${cssClass} star`) : ""}`;
              }).join("")}
            </div>
          </section>

          <section class="lk-wp-week-subject-block mathe-group">
            ${renderWeekSubjectHeader("Mathe")}
            <div class="lk-wp-week-subsections">
              ${renderWeekLayoutSection("Pflichtaufgaben", matheRequired, "mathe")}
              ${matheStar.length ? renderWeekLayoutSection("⭐ Sternchenaufgaben", matheStar, "mathe star") : ""}
            </div>
          </section>

          ${extra.length ? renderWeekLayoutSection("Sonstiges", extra, "extra") : ""}
        </main>

        ${renderSelectedFooter(options)}
      </section>
    `;
  }

  function printPage9f(className, plan, animal, options) {
    const code = codeForAnimal(animal, options);
    const densityClass = printDensityClass(allPrintableItems(plan, animal, options).length);
    return `
      <section class="lk-wp-page ${densityClass}">
        <header class="lk-wp-header">
          <div class="lk-wp-title-wrap">
            <h1>Wochenplan</h1>
            <div class="lk-wp-wave" aria-hidden="true">~~~~~~~</div>
          </div>
          ${animal ? `<div class="lk-wp-animal-corner">${escapeHtml(printAudienceLabel(animal))}</div>` : ""}
          <div class="lk-wp-meta">
            <div><strong>Name:</strong><span class="lk-wp-write-line"></span></div>
            <div class="lk-wp-period">
              <strong>Woche vom:</strong>
              <span>${escapeHtml(germanDate(plan.validFrom))}</span>
              <strong>bis:</strong>
              <span>${escapeHtml(germanDate(plan.validTo))}</span>
            </div>
          </div>
          <div class="lk-wp-small-meta">
            <span>${escapeHtml(className || "")}</span>
            ${plan.weekLabel ? `<span>${escapeHtml(plan.weekLabel)}</span>` : ""}
          </div>
        </header>

        <div class="lk-wp-table-head">
          <span>Tag</span>
          <span>Aufgaben</span>
          <span>Erledigt</span>
        </div>

        <main class="lk-wp-days">
          ${WEEK_DAYS.map((day) => renderPrintDay9f(plan, day, animal, options)).join("")}
        </main>

        ${renderSelectedFooter(options)}
      </section>
    `;
  }

  renderPrintWeeklyPlan = function renderPrintWeeklyPlan9f(className) {
    const plan = currentWeeklyPrintPlan;
    const options = currentWeeklyPrintOptions || {};
    if (!plan) return typeof printEmpty === "function"
      ? printEmpty("Es ist kein Wochenplan für den Druck ausgewählt.")
      : "<p>Kein Wochenplan ausgewählt.</p>";

    const selected = options.target === "selected"
      ? (options.animalIds || []).map((id) => animalsForActiveClass().find((animal) => animal.id === id)).filter(Boolean)
      : [];

    const targets = selected.length ? selected : [null];

    return `
      <style id="lk-weekly-print-9f-inline">
        @page { size: A4 portrait; margin: 0; }

        .print-page.weekly-print-sheet {
          padding: 0 !important;
          margin: 0 !important;
          max-width: none !important;
          width: auto !important;
          background: #fff !important;
          box-shadow: none !important;
        }

        .lk-wp-page {
          box-sizing: border-box;
          width: 210mm;
          min-height: 297mm;
          padding: 5mm 7mm 5mm;
          margin: 0 auto;
          background: #fff;
          color: #232323;
          font-family: "Chalkboard SE", "Noteworthy", "Segoe Print", "Bradley Hand", "Comic Sans MS", cursive;
          break-after: page;
          page-break-after: always;
        }
        .lk-wp-page:last-child {
          break-after: auto;
          page-break-after: auto;
        }

        .lk-wp-header {
          position: relative;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 2mm 5mm;
          margin-bottom: 2.5mm;
        }
        .lk-wp-title-wrap {
          grid-column: 1 / -1;
          text-align: center;
          padding: 0 28mm;
        }
        .lk-wp-title-wrap h1 {
          margin: 0;
          font-size: 27pt;
          font-weight: 500;
          line-height: 1;
          letter-spacing: .2mm;
        }
        .lk-wp-wave {
          margin-top: -1.2mm;
          color: #9fcfbc;
          font-size: 13pt;
          letter-spacing: 1mm;
          height: 3.5mm;
          overflow: hidden;
        }
        .lk-wp-animal-corner {
          position: absolute;
          right: 0;
          top: 0;
          max-width: 42mm;
          padding: 1.5mm 2.5mm;
          border-radius: 3mm;
          background: #f4f8f6;
          border: .3mm solid #c8ddd4;
          font-family: Arial, sans-serif;
          font-size: 11.5pt;
          font-weight: 700;
          line-height: 1.15;
          white-space: nowrap;
        }
        .lk-wp-meta {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: 1fr 1.15fr;
          gap: 8mm;
          align-items: end;
          font-size: 11.8pt;
        }
        .lk-wp-meta > div {
          display: flex;
          align-items: end;
          gap: 2mm;
          white-space: nowrap;
        }
        .lk-wp-write-line {
          display: inline-block;
          flex: 1;
          min-width: 35mm;
          height: 5mm;
          border-bottom: .3mm solid #555;
        }
        .lk-wp-period span {
          display: inline-block;
          min-width: 21mm;
          text-align: center;
          border-bottom: .3mm solid #555;
          font-family: Arial, sans-serif;
          font-size: 10.2pt;
          padding-bottom: .5mm;
        }
        .lk-wp-small-meta {
          grid-column: 1 / -1;
          display: flex;
          justify-content: center;
          gap: 5mm;
          font-family: Arial, sans-serif;
          font-size: 8.8pt;
          color: #666;
          min-height: 3mm;
        }

        .lk-wp-audience-badge {
          display:inline-flex;
          align-items:center;
          justify-content:center;
          width:max-content;
          max-width:150mm;
          margin:1.2mm auto .2mm;
          padding:.8mm 3.2mm;
          border-radius:999px;
          background:#edf5ff;
          border:.3mm solid #9fc0df;
          color:#244f73;
          font-family:Arial,sans-serif;
          font-size:10.5pt;
          font-weight:700;
          line-height:1.1;
        }

        .lk-wp-density-medium .lk-wp-task-main,
        .lk-wp-density-medium .lk-wp-week-row > div { font-size:12.1pt; }
        .lk-wp-density-medium .lk-wp-task-copy strong,
        .lk-wp-density-medium .lk-wp-week-row-main .lk-wp-task-copy strong { font-size:15pt; }
        .lk-wp-density-medium .lk-wp-week-row { min-height:6.2mm; }
        .lk-wp-density-compact .lk-wp-task-main,
        .lk-wp-density-compact .lk-wp-week-row > div { font-size:11.4pt; }
        .lk-wp-density-compact .lk-wp-task-copy strong,
        .lk-wp-density-compact .lk-wp-week-row-main .lk-wp-task-copy strong { font-size:14pt; }
        .lk-wp-density-compact .lk-wp-week-row { min-height:5.8mm; }
        .lk-wp-density-compact .lk-wp-book-cover.grouped { width:12mm; height:17mm; }
        .lk-wp-density-compact .lk-wp-workbook-group { grid-template-columns:16mm minmax(0,1fr); }
        .lk-wp-density-compact .lk-wp-week-groups { gap:1.2mm; }
        .lk-wp-density-compact .lk-wp-week-subsections { gap:.6mm; }

        .lk-wp-table-head {
          display: grid;
          grid-template-columns: 31mm 1fr 22mm;
          border: .35mm solid #444;
          border-radius: 4mm 4mm 0 0;
          overflow: hidden;
          background: #eef6fb;
          font-size: 11pt;
          text-align: center;
        }
        .lk-wp-table-head span {
          padding: 2mm 1mm;
          border-right: .25mm solid #666;
        }
        .lk-wp-table-head span:last-child { border-right: 0; }

        .lk-wp-days {
          border-left: .35mm solid #444;
          border-right: .35mm solid #444;
          border-bottom: .35mm solid #444;
          border-radius: 0 0 4mm 4mm;
          overflow: hidden;
        }
        .lk-wp-day {
          display: grid;
          grid-template-columns: 31mm 1fr;
          min-height: 30mm;
          border-bottom: .3mm solid #555;
        }
        .lk-wp-day:last-child { border-bottom: 0; }
        .lk-wp-day-name {
          display: grid;
          place-items: center;
          padding: 2mm;
          border-right: .3mm solid #555;
          font-size: 13.5pt;
          font-weight: 500;
          text-align: center;
        }
        .lk-wp-day-tasks { min-width: 0; }
        .lk-wp-task-row {
          display: grid;
          grid-template-columns: minmax(0,1fr) 22mm;
          min-height: 6.3mm;
          border-bottom: .2mm solid #b9b9b9;
        }
        .lk-wp-task-row:last-child { border-bottom: 0; }
        .lk-wp-task-row.deutsch { background: rgba(255,249,228,.55); }
        .lk-wp-task-row.lesezeit { background: rgba(232,247,237,.58); }
        .lk-wp-task-row.lernwoerter { background: rgba(244,237,250,.58); }
        .lk-wp-task-row.mathe { background: rgba(234,247,255,.62); }
        .lk-wp-task-row.extra { background: rgba(247,247,247,.72); }
        .lk-wp-task-row.starred { background: #fff6d9; }
        .lk-wp-task-row.subject-break { border-top: .58mm solid #8fa7b5; }
        .lk-wp-task-text {
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 1mm 2mm;
          line-height: 1.12;
          overflow: hidden;
        }
        .lk-wp-task-main {
          display: flex;
          align-items: center;
          gap: 1.3mm;
          min-width: 0;
          font-family: "Chalkboard SE", "Noteworthy", "Segoe Print", "Bradley Hand", Arial, sans-serif;
          font-size: 13.2pt;
          line-height: 1.08;
        }
        .lk-wp-task-main > span:last-child {
          min-width: 0;
          overflow-wrap: anywhere;
        }
        .lk-wp-task-assignment {
          display:grid;
          grid-template-columns:16mm minmax(0,1fr);
          align-items:center;
          column-gap:2.5mm;
          min-width:0;
          margin-top:.4mm;
        }
        .lk-wp-task-copy {
          display:flex;
          align-items:center;
          min-width:0;
          min-height:12mm;
        }
        .lk-wp-task-copy strong {
          font-size:16pt;
          line-height:1.03;
          font-weight:700;
          white-space:nowrap;
        }
        .lk-wp-book-cover {
          width:17mm;
          height:24mm;
          object-fit:contain;
          justify-self:center;
          align-self:center;
          flex:none;
        }
        .lk-wp-book-cover.small {
          width:13mm;
          height:18mm;
        }
        .lk-wp-book-cover-spacer {
          width:19mm;
          height:1px;
          display:block;
        }
        .lk-wp-book-cover-spacer.small {
          width:15mm;
        }
        .lk-wp-subject-badge {
          display:inline-flex;
          align-items:center;
          justify-content:center;
          gap:.35mm;
          min-width:10mm;
          height:5mm;
          padding:0 1.9mm;
          border-radius:999px;
          border:.25mm solid rgba(47,111,145,.18);
          background:#fff;
          font-family:Arial, sans-serif;
          font-size:8.5pt;
          font-weight:800;
          line-height:1;
          flex:none;
        }
        .lk-wp-subject-badge.deutsch {
          background:linear-gradient(180deg,#fffdf2 0%,#fff4c3 100%);
          border-color:rgba(220,189,85,.55);
          color:#2e608e;
        }
        .lk-wp-subject-badge.deutsch .a { color:#df5b46; }
        .lk-wp-subject-badge.deutsch .b { color:#ef9b1f; }
        .lk-wp-subject-badge.deutsch .c { color:#2e608e; }
        .lk-wp-subject-badge.lesezeit {
          background:#e5f5eb;
          border-color:rgba(83,155,112,.38);
          color:#386e4d;
          font-size:8pt;
        }
        .lk-wp-subject-badge.lernwoerter {
          background:#f1e8f8;
          border-color:rgba(130,94,170,.35);
          color:#72539b;
          font-family:Arial,sans-serif;
          font-size:7.8pt;
        }
        .lk-wp-subject-badge.mathe {
          background:linear-gradient(180deg,#f5fbff 0%,#d8f1ff 100%);
          border-color:rgba(83,180,219,.55);
          color:#1d728e;
        }
        .lk-wp-subject-badge.mathe .n1 { color:#efb52b; }
        .lk-wp-subject-badge.mathe .n2 { color:#3bb171; }
        .lk-wp-subject-badge.mathe .n3 { color:#7b63c9; }
        .lk-wp-subject-badge.extra {
          background:linear-gradient(180deg,#ffffff 0%,#f4f4f4 100%);
          border-color:rgba(0,0,0,.12);
          color:#666;
          font-size:8.2pt;
        }
        .lk-wp-task-subject-label {
          flex:none;
          font-size:7.8pt;
          font-weight:700;
          color:#31586e;
          min-width:31mm;
          white-space:nowrap;
        }
        .lk-wp-star {
          color: #c89400;
          font-size: 13pt;
          line-height: 1;
          margin-right: .4mm;
        }
        .lk-wp-task-text small {
          display: block;
          margin-top: .5mm;
          padding-left: 0;
          color: #666;
          font-family: Arial, sans-serif;
          font-size: 7.8pt;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .lk-wp-circle {
          align-self: center;
          justify-self: center;
          width: 4.3mm;
          height: 4.3mm;
          border: .35mm solid #555;
          border-radius: 50%;
        }
        .lk-wp-task-row .lk-wp-circle {
          position: relative;
        }
        .lk-wp-task-row::after {
          content: "";
          grid-column: 2;
          grid-row: 1;
          border-left: .25mm solid #777;
          align-self: stretch;
          justify-self: stretch;
          pointer-events: none;
        }
        .lk-wp-circle {
          grid-column: 2;
          grid-row: 1;
          z-index: 1;
          background: #fff;
        }

        .lk-wp-week-groups {
          display:grid;
          gap:2mm;
          margin-top:1.2mm;
        }
        .lk-wp-week-subject-block {
          display:grid;
          gap:1mm;
          break-inside:auto;
          padding:0 1.5mm 1.5mm;
          border:.4mm solid #777;
          border-radius:4mm;
          background:#fff;
          overflow:hidden;
        }
        .lk-wp-week-subject-block.deutsch-group { border-color:#d9bc59; }
        .lk-wp-week-subject-block.mathe-group { border-color:#59aeca; }
        .lk-wp-week-subject-head {
          display:flex !important;
          align-items:center;
          gap:2.2mm;
          min-height:8.5mm;
          margin:0 -1.5mm;
          padding:1mm 3mm;
          border-bottom:.35mm solid currentColor;
        }
        .lk-wp-week-subject-head .lk-wp-week-subject-copy {
          display:flex;
          align-items:baseline;
          gap:2mm;
          min-width:0;
        }
        .lk-wp-week-subject-head strong {
          display:inline-block !important;
          font-size:15pt;
          line-height:1;
          font-weight:700;
        }
        .lk-wp-week-subject-head small {
          display:inline-block !important;
          font-family:Arial,sans-serif;
          font-size:7.2pt;
          color:#666;
        }
        .lk-wp-week-subject-head.deutsch { background:#fff2a8; color:#5a4a13; }
        .lk-wp-week-subject-head.mathe { background:#d9f2ff; color:#24536a; }
        .lk-wp-week-subject-head .lk-wp-subject-badge {
          min-width:12mm;
          height:6mm;
          font-size:10.6pt;
        }
        .lk-wp-week-subsections {
          display:grid;
          gap:1mm;
        }
        .lk-wp-week-section {
          border:.35mm solid #6b6b6b;
          border-radius:3.5mm;
          overflow:hidden;
          break-inside:auto;
        }
        .lk-wp-week-section h2 {
          margin:0;
          padding:1mm 3mm;
          font-size:12.4pt;
          font-weight:600;
          border-bottom:.25mm solid #9a9a9a;
        }
        .lk-wp-week-section.deutsch h2 { background:#fff5c8; }
        .lk-wp-week-section.lesezeit h2 { background:#e5f5eb; }
        .lk-wp-week-section.lernwoerter h2 { background:#f1e8f8; }
        .lk-wp-week-section.mathe h2 { background:#dff4ff; }
        .lk-wp-week-section.star h2 { background-image:linear-gradient(90deg,rgba(255,255,255,.0),rgba(255,244,190,.55)); }
        .lk-wp-week-section.extra h2 { background:#f4f4f4; }
        .lk-wp-week-list { display:grid; }
        .lk-wp-workbook-group {
          display:grid;
          grid-template-columns:22mm minmax(0,1fr);
          border-bottom:.32mm solid #aeb8be;
        }
        .lk-wp-workbook-group:last-child { border-bottom:0; }
        .lk-wp-workbook-group.no-cover { grid-template-columns:1fr; }
        .lk-wp-workbook-cover-cell {
          display:flex;
          align-items:center;
          justify-content:center;
          align-self:stretch;
          padding:1mm;
          border-right:.2mm solid #d1d1d1;
          background:rgba(255,255,255,.56);
        }
        .lk-wp-workbook-cover-cell.blank { background:#fff; }
        .lk-wp-book-cover.grouped {
          width:17mm;
          height:24mm;
          object-fit:contain;
        }
        .lk-wp-workbook-tasks { min-width:0; }
        .lk-wp-week-row {
          min-height:7mm;
          display:grid;
          grid-template-columns:1fr 12mm;
          align-items:center;
          border-bottom:.22mm solid #d0d0d0;
        }
        .lk-wp-week-row:last-child { border-bottom:0; }
        .lk-wp-week-row > div {
          display:flex;
          align-items:center;
          gap:1.5mm;
          padding:.65mm 2.5mm;
          font-size:15.5pt;
        }
        .lk-wp-week-row-main {
          min-width:0;
          display:flex !important;
          align-items:center;
          gap:1.6mm;
        }
        .lk-wp-week-row-main .lk-wp-task-copy { min-height:0; }
        .lk-wp-week-row-main .lk-wp-task-copy strong { font-size:16pt; line-height:1.03; }
        .lk-wp-week-row .lk-wp-circle {
          position:static;
          grid-column:2;
          grid-row:auto;
        }
        .lk-wp-week-row::after { display:none; }
        .lk-wp-week-empty {
          min-height:8mm;
          display:flex;
          align-items:center;
          padding:1mm 3mm;
          color:#999;
          font-family:Arial,sans-serif;
          font-size:8pt;
        }

        .lk-wp-footer {
          display: grid;
          grid-template-columns: repeat(3, minmax(0,1fr));
          gap: 3mm;
          margin-top: 2.5mm;
        }
        .lk-wp-footer.footer-count-1 { grid-template-columns: 1fr; }
        .lk-wp-footer.footer-count-2 { grid-template-columns: 1fr 1fr; }
        .lk-wp-footer.footer-count-3 { grid-template-columns: 1fr 1fr 1fr; }
        .lk-wp-footer-box {
          min-height: 18mm;
          border: .35mm solid #555;
          border-radius: 4mm;
          overflow: hidden;
        }
        .lk-wp-footer-box h3 {
          margin: 0;
          padding: 1.8mm 2mm;
          border-bottom: .25mm solid #888;
          text-align: center;
          font-size: 10.5pt;
          font-weight: 500;
        }
        .lk-wp-footer-box.remember h3 { background: #edf8f3; }
        .lk-wp-footer-box.teacher-note h3 { background: #fff9df; }
        .lk-wp-footer-box.parent-note h3 { background: #fff0f2; }
        .lk-wp-footer-lines {
          display: grid;
          gap: 5mm;
          padding: 4mm;
        }
        .lk-wp-footer-lines span {
          border-bottom: .2mm solid #c0c0c0;
        }
        .lk-wp-footer-text {
          padding: 3.2mm 3.4mm;
          font-family: "Chalkboard SE", "Noteworthy", "Segoe Print", "Bradley Hand", Arial, sans-serif;
          font-size: 9.6pt;
          line-height: 1.35;
          white-space: normal;
          overflow-wrap: anywhere;
        }

        @media print {
          html, body {
            width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }
          .print-toolbar { display: none !important; }
          .lk-wp-page {
            margin: 0 !important;
            box-shadow: none !important;
          }
        }
      </style>

      ${targets.map((animal, index) => `
        ${index > 0 ? `<div class="page-break"></div>` : ""}
        ${options.layout === "week"
          ? printPageWeekLayout(className, plan, animal, options)
          : printPage9f(className, plan, animal, options)}
      `).join("")}
    `;
  };

  /* ---------- Gestaltung der Verwaltungs-/Druckdialoge ---------- */

  const style = document.createElement("style");
  style.id = "lk-weekly-plan-9f-style";
  style.textContent = `
    .lk-weekly-code-panel { border:2px solid rgba(47,111,145,.10); }
    .lk-code-head { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
    .lk-code-head h2 { margin-top:0; }
    .lk-code-example {
      width:38px; height:38px; display:grid; place-items:center;
      border:1px solid rgba(0,0,0,.22); border-radius:8px;
      font-family:Arial,sans-serif; font-weight:800; background:#fff;
    }
    .lk-code-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; margin:12px 0; }
    .lk-code-row {
      display:grid; grid-template-columns:minmax(0,1fr) 75px; align-items:center; gap:10px;
      padding:9px 10px; border-radius:12px; background:rgba(47,111,145,.045);
    }
    .lk-code-input { text-align:center; text-transform:uppercase; font-weight:800; }

    .lk-print9f-card { max-width:780px; }
    .lk-print9f-head h2 { margin:.2rem 0 .35rem; }
    .lk-print9f-steps { display:grid; gap:14px; margin-top:14px; }
    .lk-print9f-steps > section {
      display:grid; gap:8px; padding:13px; border:1px solid rgba(0,0,0,.08);
      border-radius:16px; background:rgba(255,255,255,.78);
    }
    .lk-print-choice {
      display:grid; grid-template-columns:auto minmax(0,1fr); gap:10px; align-items:start;
      padding:10px; border-radius:13px; background:rgba(47,111,145,.045); cursor:pointer;
    }
    .lk-print-choice span { display:grid; gap:2px; }
    .lk-print-choice small { opacity:.67; line-height:1.35; }
    .lk-print-section-head { display:flex; justify-content:space-between; gap:10px; align-items:center; }
    .lk-print-animal-grid {
      display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:7px;
      max-height:300px; overflow:auto; padding-right:3px;
    }
    .lk-print-fixed-audience {
      border:1px solid rgba(69,139,102,.18);
      border-radius:14px;
      padding:13px;
      background:rgba(237,248,243,.68);
    }
    .lk-print-fixed-summary {
      display:flex;
      align-items:center;
      gap:10px;
      margin:9px 0 11px;
      padding:10px 12px;
      border-radius:11px;
      background:#fff;
      border:1px solid rgba(69,139,102,.14);
    }
    .lk-print-fixed-summary > span,
    .lk-print-fixed-mark {
      display:grid;
      place-items:center;
      flex:none;
      width:25px;
      height:25px;
      border-radius:50%;
      background:#e0f3e8;
      color:#31704b;
      font-weight:900;
    }
    .lk-print-fixed-summary div { display:grid; gap:2px; }
    .lk-print-fixed-summary small { opacity:.68; }
    .lk-print-animal-row-fixed { cursor:default; }
    .lk-print-fixed-grid { margin-top:4px; }
    .lk-print-layout-grid {
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:9px;
    }
    .lk-print-layout-choice {
      display:grid;
      grid-template-columns:auto auto minmax(0,1fr);
      gap:9px;
      align-items:center;
      padding:11px;
      border-radius:13px;
      border:1px solid rgba(47,111,145,.14);
      background:#fff;
      cursor:pointer;
    }
    .lk-print-layout-choice:has(input:checked) {
      background:#eef8fd;
      border-color:rgba(47,111,145,.42);
      box-shadow:inset 0 0 0 1px rgba(47,111,145,.08);
    }
    .lk-print-layout-choice.disabled {
      opacity:.48;
      cursor:not-allowed;
    }
    .lk-print-layout-choice > span { font-size:1.35rem; }
    .lk-print-layout-choice > div { display:grid; gap:2px; }
    .lk-print-layout-choice small { opacity:.68; }
    .lk-print-layout-choice em {
      font-style:normal;
      font-size:.68rem;
      color:#8a5b3b;
    }
    @media (max-width:700px) {
      .lk-print-layout-grid { grid-template-columns:1fr; }
    }

    .lk-print-footer-inputs {
      display:grid;
      gap:10px;
      padding-top:2px;
    }
    .lk-print-footer-inputs-head {
      display:grid;
      gap:2px;
    }
    .lk-print-footer-inputs-head strong span {
      font-size:.72rem;
      font-weight:500;
      opacity:.58;
      margin-left:4px;
    }
    .lk-print-footer-inputs-head small { opacity:.66; }
    .lk-print-footer-input-grid {
      display:grid;
      grid-template-columns:repeat(3,minmax(0,1fr));
      gap:9px;
    }
    .lk-print-footer-input-grid .field {
      margin:0;
      min-width:0;
    }
    .lk-print-footer-text {
      width:100%;
      min-height:76px;
      resize:vertical;
      line-height:1.35;
    }
    @media (max-width:800px) {
      .lk-print-footer-input-grid { grid-template-columns:1fr; }
    }

    .lk-print-animal-row {
      display:grid; grid-template-columns:auto minmax(0,1fr) auto 52px; gap:7px; align-items:center;
      padding:8px; border-radius:12px; background:rgba(0,0,0,.03);
    }
    .lk-print-code-label { font-size:.72rem; opacity:.58; }
    .lk-print-code-input { text-align:center; text-transform:uppercase; font-weight:800; padding-inline:5px; }
    .lk-print-toggle { padding:9px 10px; border-radius:12px; background:#fff9df; }
    .lk-print9f-actions { justify-content:flex-end; }
    .lk-print-individual.hidden { display:none !important; }

    @media (max-width:720px) {
      .lk-code-grid, .lk-print-animal-grid { grid-template-columns:1fr; }
      .lk-print-animal-row { grid-template-columns:auto minmax(0,1fr) auto 48px; }
    }
  `;
  if (!document.getElementById(style.id)) document.head.appendChild(style);

  window.LKWeeklyPlan9f = {
    normalizeCode,
    ricoTopicForPage,
    migrateRicoTopics9f,
    pageText,
    detailText
  };

  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => migrateRicoTopics9f().catch((error) => {
      console.warn("Rico-Schnabel-Themen konnten nicht aktualisiert werden.", error);
    }), 1800);
  });

  const footerChoiceStyle = document.createElement("style");
  footerChoiceStyle.id = "lk-print-footer-choice-style";
  footerChoiceStyle.textContent = `
    .lk-print-footer-choice-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; margin:10px 0; }
    .lk-print-footer-choice { display:flex; align-items:center; gap:8px; padding:10px 12px; border:1px solid rgba(47,111,145,.14); border-radius:12px; background:#fff; cursor:pointer; }
    .lk-print-footer-choice input { width:18px; height:18px; }
    .lk-print-footer-field.hidden { display:none !important; }
    @media(max-width:760px){ .lk-print-footer-choice-grid { grid-template-columns:1fr; } }
  `;
  document.head.appendChild(footerChoiceStyle);
})();
