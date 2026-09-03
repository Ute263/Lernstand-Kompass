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

              <section>
                <strong>Inhalt</strong>
                <label class="toggle-label lk-print-toggle">
                  <input id="weeklyPrintExtra" type="checkbox" checked>
                  ⭐ Zusatzaufgaben mitdrucken
                </label>
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
      codes
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

  function printableItems(plan, day, animal, options) {
    let items = weeklyPlanItemsForDay(plan, day, animal?.id || "");
    if (options?.showExtra === false) items = items.filter((item) => !item.isExtraTask);

    // Für Kinder immer die gleiche, leicht erkennbare Reihenfolge:
    // Deutsch → Mathe → freie/sonstige Aufgaben.
    const rank = { Deutsch: 1, Mathe: 2, Extra: 3 };
    return items
      .map((item, index) => ({ item, index }))
      .sort((a, b) => (
        (rank[printSubject(a.item)] || 9) - (rank[printSubject(b.item)] || 9)
        || a.index - b.index
      ))
      .map(({ item }) => item);
  }

  function pageText(item) {
    if (item.isFreeTask || !item.catalogItem) {
      return String(item.freeText || item.text || "").replace(/^⭐\s*/, "").trim();
    }
    const catalog = item.catalogItem;
    let page = "";
    try { page = pageRangeLabel(catalog); } catch {}
    const bits = [
      catalog.workbook || item.subject || "",
      page,
      item.taskNumber ? `Nr. ${item.taskNumber}` : ""
    ].filter(Boolean);
    return bits.join(" · ");
  }

  function detailText(item) {
    if (!item.catalogItem) return "";
    const title = String(item.catalogItem.title || "").trim();
    if (!title) return "";
    return title;
  }

  function printSubjectClass(subject) {
    if (subject === "Deutsch") return "deutsch";
    if (subject === "Mathe") return "mathe";
    return "extra";
  }

  function printSubjectBadge(subject) {
    if (subject === "Deutsch") {
      return `<span class="lk-wp-subject-badge deutsch" aria-hidden="true"><span class="a">A</span><span class="b">B</span><span class="c">C</span></span>`;
    }
    if (subject === "Mathe") {
      return `<span class="lk-wp-subject-badge mathe" aria-hidden="true"><span class="n1">1</span><span class="n2">2</span><span class="n3">3</span></span>`;
    }
    return `<span class="lk-wp-subject-badge extra" aria-hidden="true">✏️</span>`;
  }

  function printTaskRow(item = null, previousSubject = "") {
    if (!item) {
      return `
        <div class="lk-wp-task-row blank">
          <div class="lk-wp-task-text"><span>&nbsp;</span></div>
          <span class="lk-wp-circle"></span>
        </div>
      `;
    }

    const subject = printSubject(item);
    const subjectClass = printSubjectClass(subject);
    return `
      <div class="lk-wp-task-row ${subjectClass} ${item.isExtraTask ? "starred" : ""} ${previousSubject && previousSubject !== subject ? "subject-break" : ""}">
        <div class="lk-wp-task-text">
          <span class="lk-wp-task-main">
            ${item.isExtraTask ? `<b class="lk-wp-star" aria-label="Zusatzaufgabe">★</b>` : ""}
            ${printSubjectBadge(subject)}
            <span class="lk-wp-task-subject-label">${escapeHtml(subject)}</span>
            <span>${escapeHtml(pageText(item))}</span>
          </span>
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

    items.forEach((item) => {
      rows.push(printTaskRow(item, previousSubject));
      previousSubject = printSubject(item);
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

  function renderFooterBox(title, kind = "") {
    return `
      <section class="lk-wp-footer-box ${escapeAttribute(kind)}">
        <h3>${escapeHtml(title)}</h3>
        <div class="lk-wp-footer-lines">
          <span></span><span></span><span></span>
        </div>
      </section>
    `;
  }

  function printPage9f(className, plan, animal, options) {
    const code = codeForAnimal(animal, options);
    return `
      <section class="lk-wp-page">
        <header class="lk-wp-header">
          <div class="lk-wp-title-wrap">
            <h1>Mein Wochenplan</h1>
            <div class="lk-wp-wave" aria-hidden="true">~~~~~~~</div>
          </div>
          <div class="lk-wp-code-box">${escapeHtml(code)}</div>
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

        <footer class="lk-wp-footer">
          ${renderFooterBox("Daran denke ich", "remember")}
          ${renderFooterBox("Mitteilung Lehrkraft", "teacher-note")}
          ${renderFooterBox("Mitteilung Eltern", "parent-note")}
        </footer>
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
          padding: 9mm 10mm 8mm;
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
          gap: 3mm 6mm;
          margin-bottom: 4mm;
        }
        .lk-wp-title-wrap {
          grid-column: 1 / -1;
          text-align: center;
          padding-right: 12mm;
        }
        .lk-wp-title-wrap h1 {
          margin: 0;
          font-size: 26pt;
          font-weight: 500;
          line-height: 1;
          letter-spacing: .2mm;
        }
        .lk-wp-wave {
          margin-top: -1mm;
          color: #9fcfbc;
          font-size: 16pt;
          letter-spacing: 1.2mm;
          height: 5mm;
          overflow: hidden;
        }
        .lk-wp-code-box {
          position: absolute;
          right: 0;
          top: 0;
          width: 9mm;
          height: 9mm;
          border: .35mm solid #555;
          display: grid;
          place-items: center;
          font-family: Arial, sans-serif;
          font-size: 10pt;
          font-weight: 700;
        }
        .lk-wp-meta {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: 1fr 1.15fr;
          gap: 8mm;
          align-items: end;
          font-size: 11pt;
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
          font-size: 9.5pt;
          padding-bottom: .5mm;
        }
        .lk-wp-small-meta {
          grid-column: 1 / -1;
          display: flex;
          justify-content: center;
          gap: 5mm;
          font-family: Arial, sans-serif;
          font-size: 8.3pt;
          color: #666;
          min-height: 3mm;
        }

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
        .lk-wp-task-row.mathe { background: rgba(234,247,255,.62); }
        .lk-wp-task-row.extra { background: rgba(247,247,247,.72); }
        .lk-wp-task-row.starred { background: #fff6d9; }
        .lk-wp-task-row.subject-break { border-top: .42mm solid #9bb8c8; }
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
          font-size: 10.1pt;
          line-height: 1.1;
        }
        .lk-wp-task-main > span:last-child {
          min-width: 0;
          overflow-wrap: anywhere;
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
          font-size:8.6pt;
          font-weight:700;
          color:#31586e;
          min-width:11mm;
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
          font-size: 6.7pt;
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

        .lk-wp-footer {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 3mm;
          margin-top: 4mm;
        }
        .lk-wp-footer-box {
          min-height: 28mm;
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
        ${printPage9f(className, plan, animal, options)}
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
})();
