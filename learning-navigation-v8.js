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

  let quickSubject = window.lkQuickWorkbookSubject || "Deutsch";

  function currentProgressText(animal, subject) {
    if (typeof latestWorkbookEntry !== "function") return "Noch nichts eingetragen";
    const entry = latestWorkbookEntry(animal.classId || state.activeClassId, animal.id, subject);
    if (!entry) return "Noch nichts eingetragen";
    const part = entry.workbookPart ? ` · ${entry.workbookPart}` : "";
    return `${entry.materialName}${part} · bis S. ${entry.seite}`;
  }

  function workbookGroupKey(item) {
    return encodeURIComponent([item.workbook || "", item.part || "", item.bookType || ""].join("|||"));
  }

  function workbookGroups(subject) {
    const map = new Map();
    workbookCatalogForActiveClass()
      .filter((item) => item.subject === subject && item.active !== false)
      .forEach((item) => {
        const key = workbookGroupKey(item);
        if (!map.has(key)) map.set(key, { key, workbook: item.workbook || subject, part: item.part || "", bookType: item.bookType || "", items: [] });
        map.get(key).items.push(item);
      });
    return [...map.values()]
      .map((group) => ({ ...group, items: group.items.sort((a, b) => Number(a.page || 0) - Number(b.page || 0)) }))
      .sort((a, b) => a.workbook.localeCompare(b.workbook, "de", { numeric: true }) || a.part.localeCompare(b.part, "de", { numeric: true }));
  }

  function selectedWorkbookGroup(animal, subject, groups) {
    const latest = latestWorkbookEntry(animal.classId || state.activeClassId, animal.id, subject);
    if (latest) {
      const recent = groups.find((group) => group.workbook === latest.materialName && (!latest.workbookPart || group.part === latest.workbookPart));
      if (recent) return recent;
    }
    const defaultId = defaultWorkbookCatalogIdForSubject(subject, { animalId: animal.id, classId: animal.classId || state.activeClassId });
    if (defaultId) {
      const found = groups.find((group) => group.items.some((item) => item.id === defaultId));
      if (found) return found;
    }
    return groups[0] || null;
  }

  function quickPageHint(group) {
    if (!group?.items?.length) return "";
    const starts = group.items.map((item) => Number(item.page || 0)).filter(Boolean);
    const ends = group.items.map((item) => Number(item.pageEnd || item.page || 0)).filter(Boolean);
    if (!starts.length || !ends.length) return "";
    return `Seiten ${Math.min(...starts)}–${Math.max(...ends)}`;
  }

  window.setQuickWorkbookSubject = function setQuickWorkbookSubject(subject) {
    quickSubject = subject === "Mathe" ? "Mathe" : "Deutsch";
    window.lkQuickWorkbookSubject = quickSubject;
    render();
  };

  window.stepQuickProgressAnimal = function stepQuickProgressAnimal(direction) {
    const classId = getProgressClassId();
    const animals = animalsForClass(classId).filter((animal) => animal.aktiv);
    if (!animals.length) return;
    const current = Math.max(0, animals.findIndex((animal) => animal.id === progressFilters.animalId));
    const next = (current + Number(direction) + animals.length) % animals.length;
    setProgressFilter('animalId', animals[next].id);
  };

  window.saveQuickWorkbookProgress = async function saveQuickWorkbookProgress(event, subject, animalId) {
    event.preventDefault();
    const groupKey = document.querySelector('#lkQuickWorkbook')?.value || '';
    const pageText = normalizePageText(document.querySelector('#lkQuickPages')?.value || '');
    const animal = animalsForActiveClass().find((item) => item.id === animalId);
    const group = workbookGroups(subject).find((item) => item.key === groupKey);
    const pages = pageNumbersFromText(pageText);
    if (!animal || !group || !pages.length) {
      globalMessage = 'Bitte Heft und Seite eintragen.';
      render();
      return;
    }

    let nextState = state;
    const isSingleTarget = pages.length === 1 && !pageText.includes(',') && !pageText.includes('-');
    const requestedPages = isSingleTarget ? [pages[0]] : pages;
    const matchedItems = [];

    group.items.forEach((catalog) => {
      const start = Number(catalog.page || 0);
      const end = Number(catalog.pageEnd || catalog.page || 0);
      let completed = requestedPages.filter((page) => page >= start && page <= end);
      if (isSingleTarget && requestedPages[0] >= start && requestedPages[0] <= end) {
        completed = Array.from({ length: requestedPages[0] - start + 1 }, (_, index) => start + index);
      }
      if (!completed.length) return;
      matchedItems.push(catalog);
      const allCatalogPages = weeklyCatalogPages(catalog).map(Number);
      const finished = allCatalogPages.length > 0 && allCatalogPages.every((page) => completed.includes(page));
      nextState = upsertWorkbookProgressEntry(nextState, {
        classId: state.activeClassId,
        animal,
        catalog,
        status: finished ? 'fertig' : 'teilweise',
        source: 'Direkteingabe',
        completedPages: completed.map(String)
      });
    });

    if (!matchedItems.length) {
      const range = quickPageHint(group);
      globalMessage = `Diese Seite ist in ${group.workbook}${group.part ? ` · ${group.part}` : ''} nicht hinterlegt${range ? ` (${range})` : ''}.`;
      render();
      return;
    }

    globalMessage = isSingleTarget
      ? `Heftstand gespeichert: bis Seite ${requestedPages[0]}.`
      : `Erledigte Seiten gespeichert: ${pageText}.`;
    await persistAndRender(nextState);
  };

  function renderQuickWorkbookForm(animal, subject) {
    const groups = workbookGroups(subject);
    const selectedGroup = selectedWorkbookGroup(animal, subject, groups);
    const latest = latestWorkbookEntry(animal.classId || state.activeClassId, animal.id, subject);
    const latestSameBook = latest && selectedGroup && latest.materialName === selectedGroup.workbook && (!latest.workbookPart || latest.workbookPart === selectedGroup.part);
    const defaultPage = latestSameBook ? String(latest.seite || '') : '';
    return `
      <section class="panel lk-v9-quick-card">
        <div class="lk-v9-subject-tabs" role="tablist" aria-label="Fach auswählen">
          <button type="button" class="lk-v9-subject-tab ${subject === 'Deutsch' ? 'active' : ''}" onclick="setQuickWorkbookSubject('Deutsch')">📘 Deutsch</button>
          <button type="button" class="lk-v9-subject-tab ${subject === 'Mathe' ? 'active' : ''}" onclick="setQuickWorkbookSubject('Mathe')">🔢 Mathe</button>
        </div>
        <div class="lk-v9-current"><span>Aktueller Stand</span><strong>${escapeHtml(currentProgressText(animal, subject))}</strong></div>
        <form class="lk-v9-quick-form" onsubmit="saveQuickWorkbookProgress(event, '${subject}', '${escapeAttribute(animal.id)}')">
          <label class="field">Heft
            <select class="select-input" id="lkQuickWorkbook">
              ${groups.map((group) => `<option value="${escapeAttribute(group.key)}" ${selectedGroup?.key === group.key ? 'selected' : ''}>${escapeHtml(group.workbook)}${group.part ? ` · ${escapeHtml(group.part)}` : ''}</option>`).join('')}
            </select>
          </label>
          <label class="field lk-v9-page-field">Erledigt bis Seite
            <input class="text-input" id="lkQuickPages" value="${escapeAttribute(defaultPage)}" placeholder="z. B. 37" inputmode="numeric" autocomplete="off">
            <small>Normal: nur die letzte erledigte Seite eingeben. Nicht fortlaufend? Dann z. B. <strong>34, 36–38</strong>.</small>
          </label>
          <button class="primary lk-v9-save" type="submit">Speichern</button>
        </form>
      </section>`;
  }

  renderWorkbookDirectPlanning = function renderWorkbookDirectPlanningV9() {
    const classId = getProgressClassId();
    const animals = animalsForClass(classId).filter((animal) => animal.aktiv);
    const selectedAnimal = animals.find((animal) => animal.id === progressFilters.animalId) || animals[0] || null;
    if (selectedAnimal && progressFilters.animalId !== selectedAnimal.id) progressFilters.animalId = selectedAnimal.id;

    return `
      <section class="panel lk-v9-head">
        <div>
          <h2>Heftseiten eintragen</h2>
          <p class="message">Nur den tatsächlichen Heftstand eintragen. Planung, Status und Bemerkungen gehören nicht in diesen schnellen Arbeitsgang.</p>
        </div>
        ${selectedAnimal ? `<div class="lk-v9-child-nav">
          <button class="secondary small-button" type="button" onclick="stepQuickProgressAnimal(-1)" aria-label="Vorheriges Kind">←</button>
          <label class="field">Kind
            <select class="select-input" onchange="setProgressFilter('animalId', this.value)">
              ${animals.map((animal) => `<option value="${escapeAttribute(animal.id)}" ${selectedAnimal.id === animal.id ? 'selected' : ''}>${escapeHtml(animal.tierEmoji)} ${escapeHtml(animal.tierName)}</option>`).join('')}
            </select>
          </label>
          <button class="secondary small-button" type="button" onclick="stepQuickProgressAnimal(1)" aria-label="Nächstes Kind">→</button>
        </div>` : ''}
      </section>
      ${selectedAnimal ? renderQuickWorkbookForm(selectedAnimal, quickSubject) : `<section class="panel"><div class="empty">Bitte lege zuerst ein aktives Kind an.</div></section>`}`;
  };

  const baseRender = renderTeacherSection;
  renderTeacherSection = function renderTeacherSectionV8(tab) {
    if (tab === "assessmentHub") return renderAssessmentHubV8();
    return baseRender(tab);
  };

  const style = document.createElement("style");
  style.id = "lk-learning-navigation-v9";
  style.textContent = `
    .lk-v9-head{display:flex;align-items:center;justify-content:space-between;gap:20px}
    .lk-v9-head h2{margin-bottom:4px}.lk-v9-head .message{margin-bottom:0}
    .lk-v9-child-nav{display:flex;align-items:end;gap:8px;min-width:330px}.lk-v9-child-nav .field{margin:0;flex:1}.lk-v9-child-nav .small-button{height:42px;min-width:42px;padding:0}
    .lk-v9-quick-card{max-width:760px;margin-left:auto;margin-right:auto;padding:20px}
    .lk-v9-subject-tabs{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px}
    .lk-v9-subject-tab{border:1px solid #cfd9de;background:#fff;border-radius:10px;padding:12px 16px;font:inherit;font-weight:750;cursor:pointer;color:#34444d}
    .lk-v9-subject-tab.active{border-color:#53756b;background:#edf5f2;color:#23483e;box-shadow:inset 0 0 0 1px #53756b}
    .lk-v9-current{display:flex;align-items:baseline;gap:10px;padding:10px 12px;margin-bottom:16px;background:#f5f7f8;border-radius:9px}.lk-v9-current span{font-size:.8rem;color:#66757d}.lk-v9-current strong{font-size:.95rem}
    .lk-v9-quick-form{display:grid;grid-template-columns:minmax(260px,1.4fr) minmax(190px,.8fr) auto;gap:12px;align-items:end}.lk-v9-quick-form .field{margin:0}
    .lk-v9-page-field small{display:block;margin-top:5px;color:#66757d;line-height:1.35}.lk-v9-save{height:42px;min-width:112px}
    .lk-v8-card{text-align:left}
    @media(max-width:800px){.lk-v9-head{align-items:stretch;flex-direction:column}.lk-v9-child-nav{min-width:0}.lk-v9-quick-card{max-width:none}.lk-v9-quick-form{grid-template-columns:1fr}.lk-v9-save{width:100%}}
  `;
  document.getElementById("lk-learning-navigation-v8")?.remove();
  if (!document.getElementById(style.id)) document.head.appendChild(style);
})();
