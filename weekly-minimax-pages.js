/* Paket 9j: MiniMax – einzelne Seiten im Wochenplan auswählen.
 * Lädt nach weekly-plan-9f.js und überschreibt nur die Wochenplan-Auswahl.
 */
(() => {
  if (
    typeof renderWeeklyCatalogPicker !== "function" ||
    typeof selectWeeklyCatalogItem !== "function" ||
    typeof workbookCatalogForActiveClass !== "function"
  ) {
    console.warn("MiniMax-Einzelseiten konnten nicht initialisiert werden.");
    return;
  }

  function mmUnique(values) {
    return [...new Set(values.filter((value) => value !== null && value !== undefined && String(value).trim() !== ""))];
  }

  function mmSortText(values) {
    return [...values].sort((a, b) => String(a).localeCompare(String(b), "de", { numeric: true }));
  }

  function mmStart(item) {
    return Number(item?.startPage || item?.page || 0) || 0;
  }

  function mmEnd(item) {
    return Number(item?.endPage || item?.pageEnd || item?.startPage || item?.page || 0) || mmStart(item);
  }

  function mmRangeStart(pageOrItem) {
    const page = typeof pageOrItem === "number" ? pageOrItem : mmStart(pageOrItem);
    if (!page) return 1;
    return Math.floor((page - 1) / 20) * 20 + 1;
  }

  function mmIsMiniMaxWorkbook(workbook) {
    return /mini\s*max/i.test(String(workbook || ""));
  }

  function mmCatalog(subject) {
    // Lesezeit und Lernwörter sind Wochenplan-Bereiche, aber keine eigenen
    // Fächer im Arbeitsmaterial-Katalog. Beide verwenden den Deutsch-Katalog.
    const catalogSubject = subject === "Mathe" ? "Mathe" : "Deutsch";
    const all = workbookCatalogForActiveClass()
      .filter((item) => item.active !== false && item.subject === catalogSubject);

    let activeYear = "";
    try { activeYear = activeClassSchoolYear(state.activeClassId); } catch {}
    if (!activeYear || activeYear === "none") return all;

    const matching = all.filter((item) => {
      try {
        return materialMatchesSchoolYear(item, activeYear);
      } catch {
        return !item.schoolYear || item.schoolYear === activeYear;
      }
    });
    return matching.length ? matching : all;
  }

  function mmPageLabel(page) {
    return `S. ${page}`;
  }

  function mmExactItem(items, source, page) {
    return items.find((item) =>
      item.active !== false
      && item.id !== source.id
      && item.subject === source.subject
      && item.workbook === source.workbook
      && String(item.part || "") === String(source.part || "")
      && String(item.schoolYear || "") === String(source.schoolYear || "")
      && mmStart(item) === page
      && mmEnd(item) === page
    ) || null;
  }

  function mmCandidates(items, workbook, selectedRange, rangeEnd) {
    if (!mmIsMiniMaxWorkbook(workbook)) {
      return items
        .filter((item) => {
          const page = mmStart(item);
          return page >= selectedRange && page <= rangeEnd;
        })
        .map((item) => ({
          item,
          sourceId: item.id,
          page: mmStart(item),
          exactId: item.id,
          isVirtual: false
        }));
    }

    const byPage = new Map();

    items.forEach((item) => {
      const start = mmStart(item);
      const end = Math.max(start, mmEnd(item));
      if (!start) return;

      const from = Math.max(start, selectedRange);
      const to = Math.min(end, rangeEnd);
      if (to < from) return;

      for (let page = from; page <= to; page += 1) {
        const existingExact = mmExactItem(items, item, page);
        const exactSelf = start === page && end === page ? item : null;
        const exact = exactSelf || existingExact;
        const candidate = {
          item: exact || item,
          sourceId: exact ? exact.id : item.id,
          sourceRangeId: item.id,
          page,
          exactId: exact?.id || "",
          isVirtual: !exact
        };

        const previous = byPage.get(page);
        if (!previous || (candidate.exactId && !previous.exactId)) {
          byPage.set(page, candidate);
        }
      }
    });

    return [...byPage.values()].sort((a, b) => a.page - b.page);
  }

  function mmSelectedIds() {
    if (!weeklyPickRequest) return [];
    const prefix = weeklyInputPrefix(weeklyPickRequest.scope, weeklyPickRequest.animalId);
    // Die Auswahl muss aus dem tatsächlichen Wochenplan-Bereich gelesen werden.
    // Sonst würde Lesezeit/Lernwörter fälschlich auf Mathe zeigen.
    const field = ["Deutsch", "Lesezeit", "Lernwörter", "Mathe"].includes(weeklyPickRequest.subject)
      ? weeklyPickRequest.subject
      : (weeklyPickRequest.subject === "Mathe" ? "Mathe" : "Deutsch");
    return normalizeIdArray(
      document.getElementById(`${prefix}${field}${weeklyPickRequest.dayIndex}`)?.value || ""
    );
  }

  window.lkSelectMiniMaxPage = async function lkSelectMiniMaxPage(sourceId, page) {
    const numericPage = Number(page || 0);
    if (!numericPage) return;

    const catalog = [...(state.workbookCatalog || [])];
    const source = catalog.find((item) => item.id === sourceId)
      || workbookCatalogForActiveClass().find((item) => item.id === sourceId);
    if (!source) return;

    if (mmStart(source) === numericPage && mmEnd(source) === numericPage) {
      selectWeeklyCatalogItem(source.id);
      return;
    }

    let exact = catalog.find((item) =>
      item.active !== false
      && item.classId === source.classId
      && item.subject === source.subject
      && item.workbook === source.workbook
      && String(item.part || "") === String(source.part || "")
      && String(item.schoolYear || "") === String(source.schoolYear || "")
      && mmStart(item) === numericPage
      && mmEnd(item) === numericPage
    );

    if (!exact) {
      const timestamp = typeof nowIso === "function" ? nowIso() : new Date().toISOString();
      const pageLabel = String(numericPage);
      exact = {
        ...source,
        id: makeId(),
        catalogKey: `${source.catalogKey || source.id}|single-page|${numericPage}`.toLowerCase(),
        page: numericPage,
        startPage: numericPage,
        endPage: numericPage,
        pageEnd: "",
        pageLabel,
        displayPages: typeof formatCatalogDisplayPages === "function"
          ? formatCatalogDisplayPages(pageLabel)
          : mmPageLabel(numericPage),
        pageRangeMode: "explicit",
        sourceRangeId: source.id,
        createdAt: source.createdAt || timestamp,
        updatedAt: timestamp
      };

      await persist({
        ...state,
        workbookCatalog: [...catalog, exact]
      });
    }

    selectWeeklyCatalogItem(exact.id);
  };

  renderWeeklyCatalogPicker = function renderWeeklyCatalogPickerMiniMaxPages() {
    if (!weeklyPickRequest) return "";

    const catalog = mmCatalog(weeklyPickRequest.subject)
      .sort((a, b) =>
        a.workbook.localeCompare(b.workbook, "de", { numeric: true })
        || String(a.part || "").localeCompare(String(b.part || ""), "de", { numeric: true })
        || mmStart(a) - mmStart(b)
      );

    const workbooks = mmSortText(mmUnique(catalog.map((item) => item.workbook)));
    const requestedWorkbook = weeklyPickRequest.filters?.workbook || "";
    const selectedWorkbook = workbooks.includes(requestedWorkbook) ? requestedWorkbook : workbooks[0] || "";

    const workbookItems = catalog.filter((item) => item.workbook === selectedWorkbook);
    const parts = mmUnique(workbookItems.map((item) => item.part || ""));
    const requestedPart = weeklyPickRequest.filters?.part ?? "";
    const selectedPart = parts.includes(requestedPart) ? requestedPart : parts[0] ?? "";

    const partItems = workbookItems
      .filter((item) => (item.part || "") === selectedPart)
      .sort((a, b) => mmStart(a) - mmStart(b));

    const allPages = [];
    partItems.forEach((item) => {
      const start = mmStart(item);
      const end = Math.max(start, mmEnd(item));
      for (let page = start; page <= end; page += 1) {
        if (page > 0) allPages.push(page);
      }
    });
    const rangeStarts = mmUnique(allPages.map(mmRangeStart)).sort((a, b) => a - b);
    const requestedRange = Number(weeklyPickRequest.filters?.rangeStart || 0);
    const selectedRange = rangeStarts.includes(requestedRange) ? requestedRange : rangeStarts[0] || 1;
    const rangeEnd = selectedRange + 19;

    const visibleItems = mmCandidates(partItems, selectedWorkbook, selectedRange, rangeEnd);
    const selectedIds = mmSelectedIds();
    const selectedSet = new Set(selectedIds);

    return `
      <div class="training-modal-overlay lk-weekly-picker-overlay" role="dialog" aria-modal="true" aria-labelledby="lkWeeklyPickerTitle">
        <section class="training-modal-card lk-weekly-picker-card">
          <button class="modal-close" type="button" aria-label="Schließen" onclick="closeWeeklyCatalogPicker()">×</button>

          <div class="lk-picker-head">
            <div>
              <span class="weekly-editor-badge">${escapeHtml(weeklyPickRequest.day)}</span>
              <h2 id="lkWeeklyPickerTitle">${escapeHtml(weeklyPickRequest.subject)} – Seite auswählen</h2>
            </div>
            <button class="secondary" type="button" onclick="lkOpenWorkbookManagerFromPicker()">Hefte verwalten</button>
          </div>

          ${workbooks.length ? `
            <div class="lk-picker-step">
              <strong>1. Heft</strong>
              <div class="lk-picker-tabs lk-workbook-tabs">
                ${workbooks.map((workbook) => `
                  <button
                    class="lk-picker-tab ${selectedWorkbook === workbook ? "active" : ""}"
                    type="button"
                    data-value="${escapeAttribute(workbook)}"
                    onclick="lkSetPickerWorkbook(this.dataset.value)"
                  >${escapeHtml(workbook)}</button>
                `).join("")}
              </div>
            </div>

            ${parts.length > 1 || (parts.length === 1 && parts[0]) ? `
              <div class="lk-picker-step">
                <strong>2. Teil</strong>
                <div class="lk-picker-tabs">
                  ${parts.map((part) => `
                    <button
                      class="lk-picker-tab ${selectedPart === part ? "active" : ""}"
                      type="button"
                      data-value="${escapeAttribute(part)}"
                      onclick="lkSetPickerPart(this.dataset.value)"
                    >${escapeHtml(part || "ohne Teil")}</button>
                  `).join("")}
                </div>
              </div>
            ` : ""}

            ${rangeStarts.length > 1 ? `
              <div class="lk-picker-step">
                <strong>${parts.length > 1 || parts[0] ? "3" : "2"}. Seitenbereich</strong>
                <div class="lk-picker-tabs lk-range-tabs">
                  ${rangeStarts.map((start) => `
                    <button
                      class="lk-picker-tab ${selectedRange === start ? "active" : ""}"
                      type="button"
                      onclick="lkSetPickerRange(${start})"
                    >${start}–${start + 19}</button>
                  `).join("")}
                </div>
              </div>
            ` : ""}

            <div class="lk-picker-step lk-page-step">
              <div class="lk-page-step-head">
                <strong>${rangeStarts.length > 1 ? "4. Seite" : (parts.length > 1 || parts[0] ? "3. Seite" : "2. Seite")}</strong>
                <span>${visibleItems.length} Seiten in diesem Bereich</span>
              </div>

              <div class="lk-page-grid">
                ${visibleItems.map((candidate) => {
                  const item = candidate.item;
                  const alreadySelected = candidate.exactId
                    ? selectedSet.has(candidate.exactId)
                    : false;
                  const click = candidate.isVirtual
                    ? `lkSelectMiniMaxPage('${escapeAttribute(candidate.sourceRangeId)}', ${candidate.page})`
                    : `selectWeeklyCatalogItem('${escapeAttribute(candidate.exactId || candidate.sourceId)}')`;
                  const pageLabel = mmPageLabel(candidate.page);
                  return `
                    <button
                      class="lk-page-button ${alreadySelected ? "already-selected" : ""}"
                      type="button"
                      onclick="${click}"
                      title="${escapeAttribute([pageLabel, item.title, item.area].filter(Boolean).join(" · "))}"
                    >
                      <strong>${escapeHtml(pageLabel)}</strong>
                      ${(item.title || item.area) ? `<span>${escapeHtml(item.title || item.area)}</span>` : ""}
                      ${alreadySelected ? `<small>schon gewählt · nochmals = ⭐</small>` : ""}
                    </button>
                  `;
                }).join("") || `<div class="empty">In diesem Seitenbereich sind keine Seiten hinterlegt.</div>`}
              </div>
            </div>

            <p class="message lk-picker-tip">
              ${mmIsMiniMaxWorkbook(selectedWorkbook)
                ? "Bei MiniMax kannst du jede Seite einzeln auswählen. Das Thema bleibt zur Orientierung sichtbar."
                : "Du siehst höchstens etwa 20 Seiten gleichzeitig. Eine bereits gewählte Seite kannst du noch einmal anklicken – dann wird sie als ⭐ Zusatzaufgabe eingetragen."}
            </p>
          ` : `
            <div class="empty">
              Für ${escapeHtml(weeklyPickRequest.subject)} ist noch kein Heft angelegt.
              <button class="primary lk-empty-add-book" type="button" onclick="lkOpenWorkbookManagerFromPicker()">Heft anlegen</button>
            </div>
          `}
        </section>
      </div>
    `;
  };

  window.LKMiniMaxPages = {
    isMiniMaxWorkbook: mmIsMiniMaxWorkbook,
    candidates: mmCandidates
  };
})();
