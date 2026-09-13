/* v172 – stabile Mehrfachauswahl + Druck-Reparatur
 * - Seitenwahl bleibt im geöffneten Heft und rendert nicht nach jedem Klick neu
 * - ausgewählte Seiten werden direkt im Entwurf UND im versteckten Editorfeld geführt
 * - Druck kann auch Seiten auflösen, die aus einem Seitenbereich erzeugt wurden
 */
(() => {
  if (typeof normalizeIdArray !== "function" || typeof weeklyInputPrefix !== "function") return;

  function pickerField() {
    if (!weeklyPickRequest) return "Deutsch";
    return ["Deutsch", "Lesezeit", "Lernwörter", "Mathe"].includes(weeklyPickRequest.subject)
      ? weeklyPickRequest.subject
      : (weeklyPickRequest.subject === "Mathe" ? "Mathe" : "Deutsch");
  }

  function pickerInput() {
    if (!weeklyPickRequest) return null;
    const prefix = weeklyInputPrefix(weeklyPickRequest.scope, weeklyPickRequest.animalId);
    return document.getElementById(`${prefix}${pickerField()}${weeklyPickRequest.dayIndex}`);
  }

  function selectedIdsNow() {
    const input = pickerInput();
    if (input) return normalizeIdArray(input.value || "");
    if (!weeklyPickRequest || !weeklyPlanDraft) return [];
    const field = pickerField();
    const low = field === "Deutsch" ? "deutsch"
      : field === "Lesezeit" ? "lesezeit"
        : field === "Lernwörter" ? "lernwoerter" : "mathe";
    const day = weeklyPickRequest.day;
    const target = weeklyPickRequest.scope === "override" && weeklyPickRequest.animalId
      ? weeklyPlanDraft.overrides?.[weeklyPickRequest.animalId]?.days?.[day]
      : weeklyPlanDraft.days?.[day];
    return normalizeIdArray(target?.[`${low}Ids`] || target?.[`${low}Id`] || "");
  }

  function markButton(button, selected = true) {
    if (!button) return;
    button.classList.toggle("already-selected", selected);
    if (selected) {
      let small = button.querySelector("small");
      if (!small) {
        small = document.createElement("small");
        button.appendChild(small);
      }
      const used = button.classList.contains("used-before");
      small.textContent = used ? "schon gewählt · bereits verwendet" : "schon gewählt";
    }
  }

  function appendSelection(catalogId, button) {
    if (!weeklyPickRequest || !catalogId) return;

    // Vor dem ersten Klick den aktuellen Editorzustand übernehmen.
    if (!weeklyPlanDraft) weeklyPlanDraft = collectWeeklyPlanDraftFromDom();

    const field = pickerField();
    setWeeklyDraftValue(
      weeklyPlanDraft,
      weeklyPickRequest.scope,
      weeklyPickRequest.animalId,
      weeklyPickRequest.day,
      field,
      String(catalogId)
    );

    // Das versteckte Feld des Editors wird parallel aktualisiert. Dadurch bleiben
    // die Seiten beim Schließen, Speichern und Drucken sicher erhalten – ganz ohne
    // Neurendern des Auswahlfensters.
    const input = pickerInput();
    if (input) {
      const ids = normalizeIdArray(input.value || "");
      ids.push(String(catalogId));
      input.value = ids.join(",");
    }

    markButton(button, true);
  }

  // Kein render() mehr nach jedem Seitenklick. Das beseitigt das Zurückspringen.
  window.selectWeeklyCatalogItem = function selectWeeklyCatalogItemStable(catalogId, button = null) {
    appendSelection(catalogId, button || null);
  };

  window.lkSelectMiniMaxPage = async function lkSelectMiniMaxPageStable(sourceId, page, button = null) {
    if (!weeklyPickRequest) return;
    const numericPage = Number(page || 0);
    if (!numericPage) return;

    const catalog = [...(state.workbookCatalog || [])];
    const source = catalog.find((item) => item.id === sourceId)
      || workbookCatalogForActiveClass().find((item) => item.id === sourceId);
    if (!source) return;

    const start = Number(source.startPage || source.page || 0) || 0;
    const end = Number(source.endPage || source.pageEnd || source.startPage || source.page || 0) || start;
    if (start === numericPage && end === numericPage) {
      appendSelection(source.id, button);
      return;
    }

    let exact = catalog.find((item) =>
      item.active !== false
      && item.classId === source.classId
      && item.subject === source.subject
      && item.workbook === source.workbook
      && String(item.part || "") === String(source.part || "")
      && String(item.schoolYear || "") === String(source.schoolYear || "")
      && Number(item.startPage || item.page || 0) === numericPage
      && Number(item.endPage || item.pageEnd || item.startPage || item.page || 0) === numericPage
    );

    if (!exact) {
      const timestamp = typeof nowIso === "function" ? nowIso() : new Date().toISOString();
      exact = {
        ...source,
        id: makeId(),
        catalogKey: `${source.catalogKey || source.id}|single-page|${numericPage}`.toLowerCase(),
        page: numericPage,
        startPage: numericPage,
        endPage: numericPage,
        pageEnd: numericPage,
        pageLabel: String(numericPage),
        displayPages: `S. ${numericPage}`,
        pageRangeMode: "explicit",
        sourceRangeId: source.id,
        createdAt: source.createdAt || timestamp,
        updatedAt: timestamp
      };
      await persist({ ...state, workbookCatalog: [...catalog, exact] });
    }

    if (button) {
      button.dataset.catalogId = exact.id;
      button.setAttribute("onclick", `selectWeeklyCatalogItem('${String(exact.id).replace(/'/g, "\\'")}', this)`);
    }
    appendSelection(exact.id, button);
  };

  // Beim Schließen nur einmal vollständig rendern; Auswahlposition während der
  // Bearbeitung bleibt unangetastet.
  window.closeWeeklyCatalogPicker = function closeWeeklyCatalogPickerStable() {
    if (weeklyPickRequest) {
      const input = pickerInput();
      if (input && weeklyPlanDraft) {
        // Der Entwurf ist bereits aktuell; collect übernimmt zusätzlich freie Texte
        // und Nummern, ohne die gerade gewählten IDs zu verlieren.
        const collected = collectWeeklyPlanDraftFromDom();
        weeklyPlanDraft = collected;
      }
    }
    weeklyPickRequest = null;
    render();
  };

  // ---- Druck: fehlende Katalogseiten robust nachladen ----------------------
  const baseWeeklyPlanItemsForDay172 = typeof weeklyPlanItemsForDay === "function" ? weeklyPlanItemsForDay : null;

  function subjectKeys(subject) {
    const low = subject === "Deutsch" ? "deutsch"
      : subject === "Lesezeit" ? "lesezeit"
        : subject === "Lernwörter" ? "lernwoerter" : "mathe";
    return { ids: `${low}Ids`, legacy: `${low}Id` };
  }

  function effectiveDayForSubject(plan, day, animalId, subject) {
    const base = plan?.days?.[day] || {};
    const override = animalId ? plan?.overrides?.[animalId]?.days?.[day] || null : null;
    if (!override) return base;
    const keys = subjectKeys(subject);
    return normalizeIdArray(override[keys.ids] || override[keys.legacy]).length ? override : base;
  }

  function resolveCatalogId(id, planClassId) {
    const direct = (state.workbookCatalog || []).find((item) => item.id === id);
    if (direct) return direct;
    try {
      const expanded = workbookCatalogForWeeklyPlanClass(planClassId || state.activeClassId)
        .find((item) => item.id === id);
      if (expanded) return expanded;
    } catch {}

    const match = String(id || "").match(/^(.*)__page_(\d+)$/);
    if (!match) return null;
    const source = (state.workbookCatalog || []).find((item) => item.id === match[1]);
    if (!source) return null;
    const page = Number(match[2]);
    return {
      ...source,
      id,
      sourceCatalogId: source.id,
      page,
      startPage: page,
      endPage: page,
      pageEnd: page,
      pageLabel: String(page),
      displayPages: `S. ${page}`,
      pageRangeMode: "single"
    };
  }

  if (baseWeeklyPlanItemsForDay172) {
    weeklyPlanItemsForDay = function weeklyPlanItemsForDay172(plan, day, animalId = "") {
      const items = baseWeeklyPlanItemsForDay172(plan, day, animalId) || [];
      const represented = new Map();
      items.forEach((item) => {
        const id = String(item?.workbookCatalogId || item?.catalogItem?.id || "");
        const section = item?.weeklySection || (item?.subject === "Mathe" || item?.label === "Mathe" ? "Mathe" : "Deutsch");
        if (id) represented.set(`${section}:${id}`, (represented.get(`${section}:${id}`) || 0) + 1);
      });

      ["Deutsch", "Lesezeit", "Mathe"].forEach((subject) => {
        const source = effectiveDayForSubject(plan, day, animalId, subject);
        const keys = subjectKeys(subject);
        const ids = normalizeIdArray(source?.[keys.ids] || source?.[keys.legacy] || "");
        const seen = new Map();
        ids.forEach((id, index) => {
          const key = `${subject}:${id}`;
          const occurrence = (seen.get(key) || 0) + 1;
          seen.set(key, occurrence);
          if ((represented.get(key) || 0) >= occurrence) return;
          const catalogItem = resolveCatalogId(id, plan?.classId);
          if (!catalogItem) return;
          const page = typeof pageRangeLabel === "function" ? pageRangeLabel(catalogItem) : `S. ${catalogItem.page || ""}`;
          items.push({
            field: `${subject}:${id}:${index}`,
            subject: subject === "Mathe" ? "Mathe" : "Deutsch",
            weeklySection: subject === "Deutsch" || subject === "Mathe" ? "" : subject,
            label: subject,
            workbookCatalogId: id,
            catalogItem,
            taskNumber: "",
            text: page,
            detail: typeof workbookCatalogFullLabel === "function" ? workbookCatalogFullLabel(catalogItem) : "",
            isExtraTask: false
          });
        });
      });
      return items;
    };
  }

  // Druck aus dem Editor nimmt immer den gerade sichtbaren Entwurf mit allen
  // gewählten Seiten; vorheriges Speichern ist nicht nötig.
  window.openWeeklyPrintDialogFromEditor = function openWeeklyPrintDialogFromEditor172() {
    weeklyPlanDraft = collectWeeklyPlanDraftFromDom();
    weeklyPrintDraft = weeklyPlanDraft;
    weeklyPrintPlanId = weeklyPlanDraft.id || "";
    weeklyPrintDialogOpen = true;
    render();
  };

  // Kleine optische Rückmeldung für bereits gewählte Seiten.
  const style = document.createElement("style");
  style.id = "lk-weekly-fix-172-style";
  style.textContent = `
    .lk-page-button.already-selected {
      border:2px solid #2f8f68 !important;
      background:linear-gradient(180deg,#f0fff7 0%,#e3f7ed 100%) !important;
      box-shadow:inset 0 0 0 1px rgba(47,143,104,.12) !important;
    }
    .lk-page-button.already-selected::before {
      content:"✓";
      position:absolute;
      top:7px;
      left:8px;
      width:22px;
      height:22px;
      display:grid;
      place-items:center;
      border-radius:999px;
      background:#cfeedd;
      color:#236b4f;
      font-family:Arial,sans-serif;
      font-weight:800;
      font-size:.82rem;
    }
  `;
  if (!document.getElementById(style.id)) document.head.appendChild(style);
})();
