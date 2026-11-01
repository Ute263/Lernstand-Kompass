/* Lernstand-Kompass · Lehreransicht v8
 * Klare Trennung: Wochenplan = planen, Lernstand = dokumentieren,
 * Lernzielkontrollen = überprüfen/auswerten.
 */
(() => {
  if (typeof TEACHER_GROUPS === "undefined" || typeof renderTeacherSection !== "function") return;

  const byId = (id) => TEACHER_GROUPS.find((group) => group.id === id);

  const learning = byId("learning");
  if (learning) {
    learning.label = "Lernstand";
    learning.sections.splice(0, learning.sections.length,
      ["overview", "Klassenübersicht"],
      ["workbookDirect", "Heftseiten eintragen"],
      ["progress", "Kindübersicht"]
    );
  }

  let assessment = byId("assessmentGroup");
  if (!assessment) {
    assessment = {
      id: "assessmentGroup",
      label: "Lernzielkontrollen",
      sections: []
    };
    const learningIndex = TEACHER_GROUPS.findIndex((group) => group.id === "learning");
    TEACHER_GROUPS.splice(learningIndex >= 0 ? learningIndex + 1 : 3, 0, assessment);
  }
  assessment.label = "Lernzielkontrollen";
  assessment.sections.splice(0, assessment.sections.length,
    ["assessmentHub", "Übersicht"],
    ["abcLearningWorkbook", "ABC-Lernstandsheft"],
    ["assessmentsGerman", "Deutsch"],
    ["minimaxTests", "MiniMax · Teste dich"],
    ["assessmentsMath", "Mathematik"]
  );

  const weekly = byId("weeklyPlansGroup");
  if (weekly) {
    weekly.label = "Wochenplan";
    weekly.sections.splice(0, weekly.sections.length,
      ["weeklyPlans", "Wochenplan erstellen"]
    );
  }

  function navCard(title, text, action, icon) {
    return `<button class="teacher-home-card lk-v8-card" type="button" onclick="${action}">
      <span>${icon}</span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(text)}</small>
    </button>`;
  }

  function renderAssessmentHubV8() {
    return `
      <section class="panel lk-v8-intro">
        <h2>Lernzielkontrollen</h2>
        <p class="message">Hier wird überprüft und ausgewertet, was die Kinder können. Der laufende Heftfortschritt gehört dagegen in „Lernstand“.</p>
        <div class="teacher-home-grid">
          ${navCard("ABC-Lernstandsheft", "Lernstandsheft Deutsch öffnen.", "setTeacherTab('abcLearningWorkbook')", "📘")}
          ${navCard("Deutsch", "Deutsch-Lernzielkontrollen anlegen und Ergebnisse erfassen.", "setTeacherTab('assessmentsGerman')", "📝")}
          ${navCard("MiniMax · Teste dich", "Punkte und Kompetenzen aus den MiniMax-Teste-dich-Seiten erfassen.", "setTeacherTab('minimaxTests')", "📊")}
          ${navCard("Mathematik", "Weitere Mathematik-Lernzielkontrollen anlegen und auswerten.", "setTeacherTab('assessmentsMath')", "✅")}
        </div>
      </section>`;
  }

  function currentProgressText(animal, subject) {
    if (typeof latestWorkbookEntry !== "function") return "Noch kein Heftstand erfasst.";
    const entry = latestWorkbookEntry(animal.classId || state.activeClassId, animal.id, subject);
    return entry ? progressEntrySummary(entry) : "Noch kein Heftstand erfasst.";
  }

  function renderHeftInputForm(animal, subject) {
    const items = workbookCatalogForActiveClass()
      .filter((item) => item.subject === subject && item.active !== false)
      .sort((a, b) => a.workbook.localeCompare(b.workbook, "de", { numeric: true }) || String(a.part || "").localeCompare(String(b.part || ""), "de", { numeric: true }) || Number(a.page) - Number(b.page));
    const formId = subject === "Deutsch" ? "directDeutschProgress" : "directMatheProgress";
    const defaultItemId = defaultWorkbookCatalogIdForSubject(subject, { animalId: animal.id, classId: animal.classId || state.activeClassId });
    const defaultItem = items.find((item) => item.id === defaultItemId) || items[0] || null;
    const current = currentProgressText(animal, subject);

    return `
      <section class="panel lk-v8-progress-card">
        <div class="lk-v8-progress-head">
          <div><span>${subject === "Deutsch" ? "📘" : "🔢"}</span><h2>${escapeHtml(subject)}</h2></div>
          <small>Aktueller Stand: <strong>${escapeHtml(current)}</strong></small>
        </div>
        <form class="lk-v8-progress-form" id="${formId}" onsubmit="saveDirectWorkbookProgress(event, '${subject}', '${escapeAttribute(animal.id)}')">
          ${renderTeacherMaterialPickerControl({
            targetId: `${formId}Catalog`,
            subject,
            selectedId: defaultItem?.id || "",
            label: "Heft / Bereich auswählen",
            animalId: animal.id,
            classId: animal.classId || state.activeClassId
          })}
          <label class="field">Erledigte Seite(n)
            <input class="text-input" id="${formId}Pages" placeholder="z. B. 19 oder 19, 20" inputmode="numeric">
          </label>
          <label class="field">Status
            <select class="select-input" id="${formId}Status">
              <option value="fertig">✓ fertig</option>
              <option value="teilweise">◐ teilweise bearbeitet</option>
              <option value="offen">○ offen</option>
            </select>
          </label>
          <label class="field">Bemerkung <span class="optional-hint">optional</span>
            <input class="text-input" id="${formId}Note" placeholder="optional">
          </label>
          <button class="primary" type="submit">Heftstand speichern</button>
        </form>
      </section>`;
  }

  renderWorkbookDirectPlanning = function renderWorkbookDirectPlanningV8() {
    const classId = getProgressClassId();
    const animals = animalsForClass(classId).filter((animal) => animal.aktiv);
    const selectedAnimal = animals.find((animal) => animal.id === progressFilters.animalId) || animals[0] || null;
    if (selectedAnimal && progressFilters.animalId !== selectedAnimal.id) progressFilters.animalId = selectedAnimal.id;

    return `
      <section class="panel lk-v8-heft-head">
        <div>
          <span class="lk-v8-eyebrow">Lernstand</span>
          <h2>Heftseiten eintragen</h2>
          <p class="message">Hier trägst du ein, was ein Kind tatsächlich bearbeitet hat. Der Wochenplan bleibt davon getrennt und enthält nur die Planung.</p>
        </div>
        <label class="field lk-v8-child-select">Kind
          <select class="select-input" onchange="setProgressFilter('animalId', this.value)">
            ${animals.map((animal) => `<option value="${escapeAttribute(animal.id)}" ${selectedAnimal?.id === animal.id ? "selected" : ""}>${escapeHtml(animal.tierEmoji)} ${escapeHtml(animal.tierName)}</option>`).join("")}
          </select>
        </label>
      </section>
      ${selectedAnimal ? `
        <div class="lk-v8-progress-grid">
          ${renderHeftInputForm(selectedAnimal, "Deutsch")}
          ${renderHeftInputForm(selectedAnimal, "Mathe")}
        </div>
        <section class="panel lk-v8-progress-link">
          <span>Mehr Details zu ${escapeHtml(teacherAnimalLabel(selectedAnimal))}?</span>
          <button class="secondary" type="button" onclick="setTeacherTab('progress')">Kindübersicht öffnen</button>
        </section>
      ` : `<section class="panel"><div class="empty">Bitte lege zuerst ein aktives Kind an.</div></section>`}`;
  };

  const baseRender = renderTeacherSection;
  renderTeacherSection = function renderTeacherSectionV8(tab) {
    if (tab === "assessmentHub") return renderAssessmentHubV8();
    return baseRender(tab);
  };

  const style = document.createElement("style");
  style.id = "lk-learning-navigation-v8";
  style.textContent = `
    .lk-v8-intro > h2,.lk-v8-heft-head h2{margin-bottom:4px}
    .lk-v8-eyebrow{display:block;font-size:.7rem;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:#6b7b84;margin-bottom:3px}
    .lk-v8-heft-head{display:flex;align-items:end;justify-content:space-between;gap:18px}
    .lk-v8-heft-head>div{max-width:720px}.lk-v8-child-select{min-width:230px;margin:0}
    .lk-v8-progress-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
    .lk-v8-progress-card{margin:0}.lk-v8-progress-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:13px}
    .lk-v8-progress-head>div{display:flex;align-items:center;gap:8px}.lk-v8-progress-head h2{margin:0}.lk-v8-progress-head small{color:#66757d;text-align:right;max-width:52%}
    .lk-v8-progress-form{display:grid;gap:11px}.lk-v8-progress-form .field{margin:0}
    .lk-v8-progress-form .material-picker-control{margin:0}
    .lk-v8-progress-form .primary{justify-self:start;min-width:180px}
    .lk-v8-progress-link{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:14px}
    .lk-v8-card{text-align:left}
    @media(max-width:850px){.lk-v8-progress-grid{grid-template-columns:1fr}.lk-v8-heft-head{align-items:stretch;flex-direction:column}.lk-v8-child-select{min-width:0;width:100%}.lk-v8-progress-head{flex-direction:column}.lk-v8-progress-head small{max-width:none;text-align:left}.lk-v8-progress-link{align-items:stretch;flex-direction:column}}
  `;
  if (!document.getElementById(style.id)) document.head.appendChild(style);
})();
