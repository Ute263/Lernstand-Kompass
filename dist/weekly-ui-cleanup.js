/* Paket 9d: Wochenplan aufräumen + Hefte sinnvoll verwalten
 *
 * Ziele:
 * - Hefte statt hunderter Seitenzeilen verwalten
 * - neues Heft mit einem einfachen Formular anlegen
 * - im Wochenplan zuerst Heft -> Teil -> Seitenbereich -> Seite wählen
 * - maximal ca. 20 Seiten auf einmal zeigen
 * - Bearbeitungsstand der Kinder standardmäßig einklappen
 * - Paket 9c (gleiche Seite mehrfach + ⭐ Zusatzaufgabe) bleibt erhalten
 */
(() => {
  if (
    typeof renderWorkbookCatalogManager !== "function" ||
    typeof renderWeeklyCatalogPicker !== "function" ||
    typeof renderWeeklyCurrent !== "function"
  ) {
    console.warn("Paket 9d konnte nicht initialisiert werden.");
    return;
  }

  let lkWorkbookAddOpen = false;
  let lkWorkbookPreset = null;

  function lkUnique(values) {
    return [...new Set(values.filter((value) => value !== null && value !== undefined && String(value).trim() !== ""))];
  }

  function lkSortText(values) {
    return [...values].sort((a, b) => String(a).localeCompare(String(b), "de", { numeric: true }));
  }

  function lkItemStart(item) {
    return Number(item.startPage || item.page || 0) || 0;
  }

  function lkItemEnd(item) {
    return Number(item.endPage || item.pageEnd || item.startPage || item.page || 0) || lkItemStart(item);
  }

  function lkPageText(item) {
    let label = "";
    try {
      label = pageRangeLabel(item);
    } catch {}
    if (!label) {
      const start = lkItemStart(item);
      const end = lkItemEnd(item);
      label = end > start ? `${start}–${end}` : String(start || "");
    }
    if (!label) return "Seite";
    return /^S(?:eite)?\.?\s/i.test(label) ? label : `S. ${label}`;
  }

  function lkWorkbookKey(item) {
    return [
      item.subject || "",
      item.schoolYear || "",
      item.workbook || ""
    ].join("|||");
  }

  function lkWorkbookGroups(items) {
    const map = new Map();
    items.forEach((item) => {
      if (!item.workbook) return;
      const key = lkWorkbookKey(item);
      if (!map.has(key)) {
        map.set(key, {
          key,
          subject: item.subject || "Deutsch",
          schoolYear: item.schoolYear || "",
          workbook: item.workbook || "Material",
          items: []
        });
      }
      map.get(key).items.push(item);
    });
    return [...map.values()].sort((a, b) =>
      a.subject.localeCompare(b.subject, "de")
      || a.workbook.localeCompare(b.workbook, "de", { numeric: true })
      || String(a.schoolYear).localeCompare(String(b.schoolYear), "de", { numeric: true })
    );
  }

  function lkGroupRange(group) {
    const starts = group.items.map(lkItemStart).filter((value) => value > 0);
    const ends = group.items.map(lkItemEnd).filter((value) => value > 0);
    if (!starts.length || !ends.length) return "ohne Seiten";
    const start = Math.min(...starts);
    const end = Math.max(...ends);
    return start === end ? `S. ${start}` : `S. ${start}–${end}`;
  }

  function lkGroupParts(group) {
    const parts = lkUnique(group.items.map((item) => item.part || ""));
    return parts.length ? parts : [""];
  }

  function lkWorkbookForm() {
    if (!lkWorkbookAddOpen) return "";

    const preset = lkWorkbookPreset || {};
    const schoolYear = preset.schoolYear || activeClassSchoolYear(state.activeClassId) || "none";
    const subject = preset.subject || "Deutsch";
    const workbook = preset.workbook || "";
    const part = preset.part || "";
    const nextPage = Number(preset.nextPage || 1) || 1;

    return `
      <section class="lk-workbook-add-card">
        <div class="lk-workbook-add-head">
          <div>
            <span class="weekly-editor-badge new">${workbook ? "Heft ergänzen" : "Neues Heft"}</span>
            <h3>${workbook ? escapeHtml(workbook) : "Arbeitsheft anlegen"}</h3>
          </div>
          <button class="modal-close lk-inline-close" type="button" aria-label="Schließen" onclick="lkCloseWorkbookAdd()">×</button>
        </div>

        <form class="lk-workbook-simple-form" onsubmit="lkSaveWorkbook(event)">
          <label class="field">Fach
            <select class="select-input" id="lkBookSubject">
              <option value="Deutsch" ${subject === "Deutsch" ? "selected" : ""}>Deutsch</option>
              <option value="Mathe" ${subject === "Mathe" ? "selected" : ""}>Mathe</option>
            </select>
          </label>

          <label class="field">Schuljahr
            <select class="select-input" id="lkBookSchoolYear">
              ${SCHOOL_YEAR_OPTIONS.map(([value, label]) => `
                <option value="${escapeAttribute(value)}" ${schoolYear === value ? "selected" : ""}>${escapeHtml(label)}</option>
              `).join("")}
            </select>
          </label>

          <label class="field lk-book-name">Name des Heftes
            <input class="text-input" id="lkBookName" value="${escapeAttribute(workbook)}" placeholder="z. B. ABC der Tiere 2" autocomplete="off" required>
          </label>

          <label class="field">Teil optional
            <input class="text-input" id="lkBookPart" value="${escapeAttribute(part)}" placeholder="z. B. Teil A" autocomplete="off">
          </label>

          <label class="field">erste Seite
            <input class="text-input" id="lkBookFrom" type="number" min="1" max="500" value="${escapeAttribute(nextPage)}" required>
          </label>

          <label class="field">letzte Seite
            <input class="text-input" id="lkBookTo" type="number" min="1" max="500" value="${escapeAttribute(nextPage)}" required>
          </label>

          <div class="lk-workbook-form-actions">
            <button class="primary" type="submit">Heft speichern</button>
            <button class="secondary" type="button" onclick="lkCloseWorkbookAdd()">Abbrechen</button>
          </div>
        </form>

        <p class="message lk-workbook-form-help">
          Du legst das Heft nur einmal an. Die App erzeugt die auswählbaren Seiten automatisch.
          Vorhandene Seiten werden nicht doppelt angelegt.
        </p>
      </section>
    `;
  }

  renderWorkbookCatalogManager = function renderWorkbookCatalogManagerCompact() {
    const items = workbookCatalogForActiveClass()
      .filter((item) => item.active !== false)
      .sort((a, b) =>
        a.subject.localeCompare(b.subject, "de")
        || a.workbook.localeCompare(b.workbook, "de", { numeric: true })
        || lkItemStart(a) - lkItemStart(b)
      );

    const groups = lkWorkbookGroups(items);
    const bySubject = {
      Deutsch: groups.filter((group) => group.subject === "Deutsch"),
      Mathe: groups.filter((group) => group.subject === "Mathe")
    };

    return `
      <section class="panel lk-workbook-manager">
        <div class="lk-workbook-manager-head">
          <div>
            <h2>Arbeitshefte</h2>
            <p class="message">Hier siehst du nur die Hefte. Die einzelnen Seiten sind eingeklappt.</p>
          </div>
          <button class="primary" type="button" onclick="lkOpenWorkbookAdd()">+ Neues Heft</button>
        </div>

        ${lkWorkbookForm()}

        <div class="lk-workbook-subject-grid">
          ${["Deutsch", "Mathe"].map((subject) => `
            <section class="lk-workbook-subject">
              <h3>${escapeHtml(subject)}</h3>
              ${bySubject[subject].length
                ? bySubject[subject].map((group) => lkRenderWorkbookCard(group)).join("")
                : `<div class="empty">Noch kein Heft für ${escapeHtml(subject)} angelegt.</div>`}
              <button class="secondary lk-add-subject-book" type="button" onclick="lkOpenWorkbookAdd('${escapeAttribute(subject)}')">+ Heft für ${escapeHtml(subject)}</button>
            </section>
          `).join("")}
        </div>
      </section>
    `;
  };

  function lkRenderWorkbookCard(group) {
    const parts = lkGroupParts(group);
    const partLabel = parts.filter(Boolean).length
      ? parts.filter(Boolean).join(", ")
      : "ohne Teil";
    const nextPage = Math.max(0, ...group.items.map(lkItemEnd)) + 1;
    const activeItems = group.items
      .filter((item) => item.active !== false)
      .sort((a, b) => String(a.part || "").localeCompare(String(b.part || ""), "de", { numeric: true }) || lkItemStart(a) - lkItemStart(b));

    return `
      <article class="lk-workbook-card">
        <div class="lk-workbook-card-main">
          <div class="lk-workbook-icon" aria-hidden="true">📘</div>
          <div class="lk-workbook-card-title">
            <strong>${escapeHtml(group.workbook)}</strong>
            <span>${escapeHtml(schoolYearLabel(group.schoolYear))} · ${escapeHtml(lkGroupRange(group))}</span>
            <small>${escapeHtml(partLabel)} · ${activeItems.length} Seiteneinträge</small>
          </div>
        </div>

        <div class="lk-workbook-card-actions">
          <button
            class="small-button"
            type="button"
            data-subject="${escapeAttribute(group.subject)}"
            data-workbook="${escapeAttribute(group.workbook)}"
            data-year="${escapeAttribute(group.schoolYear)}"
            data-next="${escapeAttribute(nextPage)}"
            onclick="lkOpenWorkbookAdd(this.dataset.subject, this.dataset.workbook, '', this.dataset.year, Number(this.dataset.next))"
          >+ Seiten / Teil ergänzen</button>

          <button
            class="danger small-button"
            type="button"
            data-subject="${escapeAttribute(group.subject)}"
            data-workbook="${escapeAttribute(group.workbook)}"
            data-year="${escapeAttribute(group.schoolYear)}"
            onclick="lkDeleteWorkbook(this.dataset.subject, this.dataset.workbook, this.dataset.year)"
          >Heft löschen</button>
        </div>

        <details class="lk-workbook-details">
          <summary>Seiten und Themen anzeigen</summary>
          ${parts.map((part) => {
            const partItems = activeItems.filter((item) => (item.part || "") === part);
            return `
              <div class="lk-workbook-part">
                ${parts.length > 1 || part ? `<strong>${escapeHtml(part || "ohne Teil")}</strong>` : ""}
                <div class="lk-workbook-page-chips">
                  ${partItems.map((item) => `
                    <button
                      class="lk-page-chip"
                      type="button"
                      title="${escapeAttribute([lkPageText(item), item.title, item.area].filter(Boolean).join(" · "))}"
                      onclick="editWorkbookCatalogItem('${escapeAttribute(item.id)}')"
                    >
                      <span>${escapeHtml(lkPageText(item))}</span>
                      ${(item.title || item.area) ? `<small>${escapeHtml(item.title || item.area)}</small>` : ""}
                    </button>
                  `).join("")}
                </div>
              </div>
            `;
          }).join("")}
          <p class="message lk-workbook-detail-help">Eine Seite anklicken, wenn du Thema oder Seitenangabe einzeln bearbeiten möchtest.</p>
        </details>
      </article>
    `;
  }

  window.lkOpenWorkbookAdd = function lkOpenWorkbookAdd(subject = "", workbook = "", part = "", schoolYear = "", nextPage = 1) {
    lkWorkbookAddOpen = true;
    lkWorkbookPreset = { subject, workbook, part, schoolYear, nextPage: Number(nextPage) || 1 };
    weeklyPlanSection = "catalog";
    render();
    requestAnimationFrame(() => document.getElementById("lkBookName")?.focus());
  };

  window.lkCloseWorkbookAdd = function lkCloseWorkbookAdd() {
    lkWorkbookAddOpen = false;
    lkWorkbookPreset = null;
    render();
  };

  function lkExistingPageCovered(items, subject, schoolYear, workbook, part, page) {
    return items.some((item) => {
      if (item.active === false) return false;
      if ((item.subject || "") !== subject) return false;
      if (String(item.schoolYear || "") !== String(schoolYear || "")) return false;
      if ((item.workbook || "") !== workbook) return false;
      if ((item.part || "") !== part) return false;
      const start = lkItemStart(item);
      const end = lkItemEnd(item) || start;
      return start > 0 && page >= start && page <= end;
    });
  }

  window.lkSaveWorkbook = async function lkSaveWorkbook(event) {
    event?.preventDefault();

    const subject = document.getElementById("lkBookSubject")?.value || "Deutsch";
    const schoolYear = normalizeSchoolYear(document.getElementById("lkBookSchoolYear")?.value || "none");
    const workbook = document.getElementById("lkBookName")?.value.trim() || "";
    const part = document.getElementById("lkBookPart")?.value.trim() || "";
    const fromPage = Number(document.getElementById("lkBookFrom")?.value || 0);
    const toPage = Number(document.getElementById("lkBookTo")?.value || 0);

    if (!workbook) {
      globalMessage = "Bitte gib einen Namen für das Heft ein.";
      render();
      return;
    }
    if (!fromPage || !toPage || fromPage < 1 || toPage < fromPage) {
      globalMessage = "Bitte gib einen gültigen Seitenbereich ein.";
      render();
      return;
    }
    if (toPage - fromPage > 250) {
      globalMessage = "Bitte lege höchstens 250 Seiten auf einmal an.";
      render();
      return;
    }

    const timestamp = nowIso();
    const current = [...(state.workbookCatalog || [])];
    const additions = [];

    for (let page = fromPage; page <= toPage; page += 1) {
      if (lkExistingPageCovered(current, subject, schoolYear, workbook, part, page)) continue;

      const pageLabel = String(page);
      additions.push({
        id: makeId(),
        classId: state.activeClassId,
        catalogKey: `manual-book|${subject}|${schoolYear}|${workbook}|${part}|${page}`.toLowerCase(),
        subject,
        schoolYear,
        workbook,
        part,
        area: "",
        category: "Arbeitsheft",
        page,
        startPage: page,
        pageEnd: "",
        endPage: page,
        pageLabel,
        displayPages: typeof formatCatalogDisplayPages === "function" ? formatCatalogDisplayPages(pageLabel) : `S. ${page}`,
        pageRangeMode: "explicit",
        title: "",
        competence: "",
        note: "",
        active: true,
        createdAt: timestamp,
        updatedAt: timestamp
      });
    }

    lkWorkbookAddOpen = false;
    lkWorkbookPreset = null;

    if (!additions.length) {
      globalMessage = `„${workbook}“ ist für diesen Seitenbereich bereits angelegt.`;
      render();
      return;
    }

    globalMessage = additions.length === 1
      ? `„${workbook}“ wurde gespeichert.`
      : `„${workbook}“ wurde gespeichert. ${additions.length} Seiten sind jetzt auswählbar.`;

    await persistAndRender({
      ...state,
      workbookCatalog: [...current, ...additions]
    });
  };

  window.lkDeleteWorkbook = async function lkDeleteWorkbook(subject, workbook, schoolYear) {
    const matches = (state.workbookCatalog || []).filter((item) =>
      (item.subject || "") === subject
      && (item.workbook || "") === workbook
      && String(item.schoolYear || "") === String(schoolYear || "")
    );
    if (!matches.length) return;
    if (!confirm(`„${workbook}“ mit allen zugehörigen Seiten aus dem Katalog löschen? Bestehende gespeicherte Wochenpläne bleiben erhalten.`)) return;

    const ids = new Set(matches.map((item) => item.id));
    await persistAndRender({
      ...state,
      workbookCatalog: (state.workbookCatalog || []).filter((item) => !ids.has(item.id))
    });
  };

  /* ---------- Kompakte Auswahl im Wochenplan ---------- */

  function lkCatalogForPicker(subject) {
    const all = workbookCatalogForActiveClass()
      .filter((item) => item.active !== false && item.subject === subject);

    const activeYear = activeClassSchoolYear(state.activeClassId);
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

  function lkPickerRangeStart(item) {
    const page = lkItemStart(item);
    if (!page) return 1;
    return Math.floor((page - 1) / 20) * 20 + 1;
  }

  function lkSelectedCatalogItem() {
    if (!weeklyPickRequest) return null;
    const prefix = weeklyInputPrefix(weeklyPickRequest.scope, weeklyPickRequest.animalId);
    const field = weeklyPickRequest.subject === "Deutsch" ? "Deutsch" : "Mathe";
    const selectedIds = normalizeIdArray(document.getElementById(`${prefix}${field}${weeklyPickRequest.dayIndex}`)?.value || "");
    const id = selectedIds[selectedIds.length - 1] || "";
    return workbookCatalogForWeeklyPlanClass(state.activeClassId).find((item) => item.id === id)
      || workbookCatalogForActiveClass().find((item) => item.id === id)
      || null;
  }

  openWeeklyCatalogPicker = function openWeeklyCatalogPickerCompact(subject, day, scope, animalId, dayIndex) {
    weeklyPlanDraft = collectWeeklyPlanDraftFromDom();
    teacherMaterialPicker = null;

    const prefix = weeklyInputPrefix(scope, animalId);
    const field = subject === "Deutsch" ? "Deutsch" : "Mathe";
    const selectedIds = normalizeIdArray(document.getElementById(`${prefix}${field}${dayIndex}`)?.value || "");
    const catalog = lkCatalogForPicker(subject);

    const selectedItem = catalog.find((item) => item.id === selectedIds[selectedIds.length - 1])
      || catalog.find((item) => item.id === defaultWorkbookCatalogIdForSubject(subject, {
        animalId: scope === "override" ? animalId : "",
        classId: state.activeClassId
      }))
      || catalog[0]
      || null;

    weeklyPickRequest = {
      subject,
      day,
      scope,
      animalId,
      dayIndex,
      filters: {
        workbook: selectedItem?.workbook || "",
        part: selectedItem?.part || "",
        rangeStart: selectedItem ? lkPickerRangeStart(selectedItem) : 1
      }
    };
    render();
  };

  renderWeeklyCatalogPicker = function renderWeeklyCatalogPickerCompact() {
    if (!weeklyPickRequest) return "";

    const catalog = lkCatalogForPicker(weeklyPickRequest.subject)
      .sort((a, b) =>
        a.workbook.localeCompare(b.workbook, "de", { numeric: true })
        || String(a.part || "").localeCompare(String(b.part || ""), "de", { numeric: true })
        || lkItemStart(a) - lkItemStart(b)
      );

    const workbooks = lkSortText(lkUnique(catalog.map((item) => item.workbook)));
    const requestedWorkbook = weeklyPickRequest.filters?.workbook || "";
    const selectedWorkbook = workbooks.includes(requestedWorkbook) ? requestedWorkbook : workbooks[0] || "";

    const workbookItems = catalog.filter((item) => item.workbook === selectedWorkbook);
    const parts = lkUnique(workbookItems.map((item) => item.part || ""));
    const requestedPart = weeklyPickRequest.filters?.part ?? "";
    const selectedPart = parts.includes(requestedPart) ? requestedPart : parts[0] ?? "";

    const partItems = workbookItems
      .filter((item) => (item.part || "") === selectedPart)
      .sort((a, b) => lkItemStart(a) - lkItemStart(b));

    const rangeStarts = lkUnique(partItems.map(lkPickerRangeStart)).sort((a, b) => a - b);
    const requestedRange = Number(weeklyPickRequest.filters?.rangeStart || 0);
    const selectedRange = rangeStarts.includes(requestedRange) ? requestedRange : rangeStarts[0] || 1;
    const rangeEnd = selectedRange + 19;

    const visibleItems = partItems.filter((item) => {
      const page = lkItemStart(item);
      return page >= selectedRange && page <= rangeEnd;
    });

    const prefix = weeklyInputPrefix(weeklyPickRequest.scope, weeklyPickRequest.animalId);
    const field = weeklyPickRequest.subject === "Deutsch" ? "Deutsch" : "Mathe";
    const selectedIds = normalizeIdArray(
      document.getElementById(`${prefix}${field}${weeklyPickRequest.dayIndex}`)?.value || ""
    );
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
                ${visibleItems.map((item) => {
                  const alreadySelected = selectedSet.has(item.id);
                  return `
                    <button
                      class="lk-page-button ${alreadySelected ? "already-selected" : ""}"
                      type="button"
                      onclick="selectWeeklyCatalogItem('${escapeAttribute(item.id)}')"
                      title="${escapeAttribute([lkPageText(item), item.title, item.area].filter(Boolean).join(" · "))}"
                    >
                      <strong>${escapeHtml(lkPageText(item))}</strong>
                      ${(item.title || item.area) ? `<span>${escapeHtml(item.title || item.area)}</span>` : ""}
                      ${alreadySelected ? `<small>schon gewählt · nochmals = ⭐</small>` : ""}
                    </button>
                  `;
                }).join("") || `<div class="empty">In diesem Seitenbereich sind keine Seiten hinterlegt.</div>`}
              </div>
            </div>

            <p class="message lk-picker-tip">
              Du siehst höchstens etwa 20 Seiten gleichzeitig. Eine bereits gewählte Seite kannst du noch einmal anklicken – dann wird sie als ⭐ Zusatzaufgabe eingetragen.
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

  window.lkSetPickerWorkbook = function lkSetPickerWorkbook(workbook) {
    if (!weeklyPickRequest) return;
    const items = lkCatalogForPicker(weeklyPickRequest.subject).filter((item) => item.workbook === workbook);
    const first = items.sort((a, b) => lkItemStart(a) - lkItemStart(b))[0] || null;
    weeklyPickRequest = {
      ...weeklyPickRequest,
      filters: {
        ...(weeklyPickRequest.filters || {}),
        workbook,
        part: first?.part || "",
        rangeStart: first ? lkPickerRangeStart(first) : 1
      }
    };
    render();
  };

  window.lkSetPickerPart = function lkSetPickerPart(part) {
    if (!weeklyPickRequest) return;
    const items = lkCatalogForPicker(weeklyPickRequest.subject)
      .filter((item) => item.workbook === (weeklyPickRequest.filters?.workbook || ""))
      .filter((item) => (item.part || "") === part)
      .sort((a, b) => lkItemStart(a) - lkItemStart(b));
    weeklyPickRequest = {
      ...weeklyPickRequest,
      filters: {
        ...(weeklyPickRequest.filters || {}),
        part,
        rangeStart: items[0] ? lkPickerRangeStart(items[0]) : 1
      }
    };
    render();
  };

  window.lkSetPickerRange = function lkSetPickerRange(start) {
    if (!weeklyPickRequest) return;
    weeklyPickRequest = {
      ...weeklyPickRequest,
      filters: {
        ...(weeklyPickRequest.filters || {}),
        rangeStart: Number(start) || 1
      }
    };
    render();
  };

  window.lkOpenWorkbookManagerFromPicker = function lkOpenWorkbookManagerFromPicker() {
    weeklyPlanDraft = collectWeeklyPlanDraftFromDom();
    weeklyPickRequest = null;
    teacherMaterialPicker = null;
    weeklyPlanSection = "catalog";
    lkWorkbookAddOpen = false;
    render();
  };

  /* ---------- Weniger Ballast auf den Wochenplan-Seiten ---------- */

  const baseRenderWeeklyPlans = typeof renderWeeklyPlans === "function" ? renderWeeklyPlans : null;
  if (baseRenderWeeklyPlans) {
    renderWeeklyPlans = function renderWeeklyPlansTidier() {
      let html = baseRenderWeeklyPlans();
      html = html
        .replace("Aktuelle Woche", "Diese Woche")
        .replace("Wochenplan erstellen", "Plan erstellen")
        .replace("Arbeitsheft-Katalog", "Hefte")
        .replace(
          "Der Wochenplan ist nur für Deutsch- und Mathe-Arbeitshefte/Lehrwerke sowie freie Aufgaben gedacht. Die Entdeckeraufgaben bleiben ein eigener Bereich.",
          "Plane hier nur die Woche. Hefte und Seiten wählst du erst direkt bei der Aufgabe aus."
        );
      return html;
    };
  }

  renderWeeklyCurrent = function renderWeeklyCurrentCompact(plans, focusAnimal = null) {
    const visiblePlans = focusAnimal
      ? plans.filter((plan) => weeklyPlanAppliesToAnimal(plan, focusAnimal.id))
      : plans;
    const currentPlans = visiblePlans.filter((plan) => weeklyPlanIsCurrent(plan));
    const title = focusAnimal
      ? `Diese Woche für ${focusAnimal.tierEmoji} ${focusAnimal.tierName}`
      : "Diese Woche";
    const statusPlans = currentPlans.length ? currentPlans : visiblePlans;

    return `
      <section class="panel">
        <h2>${escapeHtml(title)}</h2>
        ${currentPlans.length
          ? currentPlans.map((plan) => renderWeeklyPlanSummaryCard(plan)).join("")
          : `<div class="empty">Für diese Woche ist noch kein Wochenplan aktiv.</div>`}
      </section>

      <details class="panel lk-weekly-status-details">
        <summary>
          <span>Bearbeitungsstand der Kinder</span>
          <small>nur öffnen, wenn du ihn brauchst</small>
        </summary>
        ${renderWeeklyPlanStatusOverview(statusPlans)}
      </details>
    `;
  };

  const style = document.createElement("style");
  style.id = "lk-weekly-ui-cleanup-style";
  style.textContent = `
    .lk-workbook-manager-head,
    .lk-picker-head,
    .lk-workbook-add-head,
    .lk-page-step-head {
      display:flex;
      gap:14px;
      align-items:center;
      justify-content:space-between;
    }

    .lk-workbook-subject-grid {
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:18px;
      margin-top:16px;
    }

    .lk-workbook-subject {
      min-width:0;
      padding:14px;
      border:1px solid rgba(62,100,145,.15);
      border-radius:18px;
      background:rgba(255,255,255,.5);
    }

    .lk-workbook-subject > h3 {
      margin-top:0;
    }

    .lk-workbook-card {
      display:grid;
      gap:10px;
      padding:12px;
      margin:10px 0;
      border:1px solid rgba(62,100,145,.14);
      border-radius:16px;
      background:#fff;
    }

    .lk-workbook-card-main {
      display:flex;
      gap:10px;
      align-items:center;
      min-width:0;
    }

    .lk-workbook-icon {
      width:38px;
      height:38px;
      display:grid;
      place-items:center;
      border-radius:12px;
      background:rgba(74,106,211,.08);
      flex:0 0 auto;
    }

    .lk-workbook-card-title {
      display:grid;
      gap:2px;
      min-width:0;
    }

    .lk-workbook-card-title strong {
      font-size:1rem;
    }

    .lk-workbook-card-title span,
    .lk-workbook-card-title small {
      color:var(--muted, #65707d);
    }

    .lk-workbook-card-actions,
    .lk-workbook-form-actions {
      display:flex;
      gap:8px;
      flex-wrap:wrap;
    }

    .lk-workbook-details {
      border-top:1px solid rgba(0,0,0,.07);
      padding-top:8px;
    }

    .lk-workbook-details > summary {
      cursor:pointer;
      font-weight:700;
    }

    .lk-workbook-part {
      display:grid;
      gap:7px;
      margin-top:12px;
    }

    .lk-workbook-page-chips {
      display:flex;
      flex-wrap:wrap;
      gap:6px;
    }

    .lk-page-chip {
      display:grid;
      gap:2px;
      min-width:64px;
      max-width:150px;
      padding:7px 9px;
      border:1px solid rgba(62,100,145,.16);
      border-radius:10px;
      background:#fff;
      text-align:left;
      cursor:pointer;
      font:inherit;
    }

    .lk-page-chip small {
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
      color:var(--muted, #65707d);
    }

    .lk-workbook-add-card {
      position:relative;
      margin:16px 0;
      padding:16px;
      border:2px solid rgba(74,106,211,.18);
      border-radius:18px;
      background:rgba(241,245,255,.82);
    }

    .lk-inline-close {
      position:static;
      flex:0 0 auto;
    }

    .lk-workbook-simple-form {
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:12px;
      margin-top:12px;
    }

    .lk-book-name,
    .lk-workbook-form-actions {
      grid-column:1 / -1;
    }

    .lk-workbook-form-help {
      margin-bottom:0;
    }

    .lk-add-subject-book {
      width:100%;
      margin-top:8px;
    }

    .lk-weekly-picker-card {
      width:min(920px, calc(100vw - 28px));
      max-height:min(88vh, 900px);
      overflow:auto;
    }

    .lk-picker-step {
      display:grid;
      gap:8px;
      margin-top:14px;
    }

    .lk-picker-tabs {
      display:flex;
      gap:7px;
      flex-wrap:wrap;
    }

    .lk-picker-tab {
      border:1px solid rgba(74,106,211,.18);
      border-radius:999px;
      padding:8px 12px;
      background:#fff;
      cursor:pointer;
      font:inherit;
    }

    .lk-picker-tab.active {
      background:rgba(74,106,211,.12);
      border-color:rgba(74,106,211,.4);
      font-weight:800;
    }

    .lk-page-grid {
      display:grid;
      grid-template-columns:repeat(5,minmax(0,1fr));
      gap:9px;
    }

    .lk-page-button {
      min-height:72px;
      display:grid;
      align-content:center;
      gap:3px;
      padding:9px;
      border:1px solid rgba(62,100,145,.16);
      border-radius:13px;
      background:#fff;
      text-align:center;
      cursor:pointer;
      font:inherit;
    }

    .lk-page-button:hover {
      border-color:rgba(74,106,211,.45);
      background:rgba(74,106,211,.045);
    }

    .lk-page-button > span {
      display:-webkit-box;
      -webkit-line-clamp:2;
      -webkit-box-orient:vertical;
      overflow:hidden;
      font-size:.8rem;
      color:var(--muted, #65707d);
    }

    .lk-page-button > small {
      color:#9b6f00;
      font-weight:700;
    }

    .lk-page-button.already-selected {
      background:rgba(255,244,196,.5);
      border-color:rgba(204,155,34,.34);
    }

    .lk-picker-tip {
      margin-bottom:0;
    }

    .lk-empty-add-book {
      margin-top:12px;
    }

    .lk-weekly-status-details {
      padding:0;
      overflow:hidden;
    }

    .lk-weekly-status-details > summary {
      display:flex;
      justify-content:space-between;
      gap:12px;
      padding:16px 18px;
      cursor:pointer;
      font-weight:800;
      list-style:none;
    }

    .lk-weekly-status-details > summary::-webkit-details-marker {
      display:none;
    }

    .lk-weekly-status-details > summary::after {
      content:"▾";
      margin-left:auto;
    }

    .lk-weekly-status-details[open] > summary::after {
      transform:rotate(180deg);
    }

    .lk-weekly-status-details > summary small {
      font-weight:400;
      color:var(--muted, #65707d);
    }

    .lk-weekly-status-details > .panel {
      margin:0;
      border:0;
      border-top:1px solid rgba(0,0,0,.07);
      border-radius:0;
      box-shadow:none;
    }

    @media (max-width:900px) {
      .lk-workbook-subject-grid {
        grid-template-columns:1fr;
      }

      .lk-page-grid {
        grid-template-columns:repeat(4,minmax(0,1fr));
      }
    }

    @media (max-width:620px) {
      .lk-workbook-manager-head,
      .lk-picker-head,
      .lk-workbook-add-head,
      .lk-page-step-head {
        align-items:flex-start;
        flex-direction:column;
      }

      .lk-workbook-simple-form {
        grid-template-columns:1fr;
      }

      .lk-book-name,
      .lk-workbook-form-actions {
        grid-column:auto;
      }

      .lk-page-grid {
        grid-template-columns:repeat(3,minmax(0,1fr));
      }
    }
  `;
  if (!document.getElementById(style.id)) document.head.appendChild(style);

  window.LKWeeklyUICleanup = {
    workbookGroups: lkWorkbookGroups,
    itemStart: lkItemStart,
    itemEnd: lkItemEnd,
    pickerRangeStart: lkPickerRangeStart
  };
})();
