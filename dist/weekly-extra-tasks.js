/* Paket 9c: Wochenplan – gleiche Seite mehrfach + ⭐ Zusatzaufgabe
 *
 * Verhalten:
 * - dieselbe Katalogseite darf im selben Fach/Tag mehrfach ausgewählt werden
 * - erste Auswahl = normale Aufgabe
 * - zweite und jede weitere Auswahl derselben Seite = ⭐ Zusatzaufgabe
 * - jede Auswahl hat eine eigene Nr.-Angabe
 * - einzelne Vorkommen können separat entfernt werden
 * - Zusatzaufgaben erhalten im Kinder-/Druckbereich ein ⭐
 * - Statusschlüssel werden für Duplikate getrennt, damit beide Aufgaben
 *   unabhängig abgehakt werden können
 * - alte Wochenpläne bleiben vollständig kompatibel
 */
(() => {
  if (
    typeof renderWeeklyPlannerTable !== "function" ||
    typeof renderWeeklyPickCell !== "function" ||
    typeof readWeeklyDaysFromDom !== "function" ||
    typeof setWeeklyDraftValue !== "function" ||
    typeof normalizeWeeklyPlan !== "function"
  ) {
    console.warn("Paket 9c konnte nicht initialisiert werden.");
    return;
  }

  const baseNormalizeWeeklyPlan = normalizeWeeklyPlan;
  const baseRenderWeeklyCatalogPicker =
    typeof renderWeeklyCatalogPicker === "function" ? renderWeeklyCatalogPicker : null;
  const baseWeeklyPlanItemsForDay =
    typeof weeklyPlanItemsForDay === "function" ? weeklyPlanItemsForDay : null;

  function normalizeNumbers(value, legacyValue = "", length = 0) {
    let list = Array.isArray(value)
      ? value.map((item) => normalizeTaskNumberText(item || ""))
      : [];

    if (!list.length && legacyValue) {
      list = [normalizeTaskNumberText(legacyValue)];
    }

    while (list.length < length) list.push("");
    if (length >= 0 && list.length > length) list = list.slice(0, length);
    return list;
  }

  function dayTarget(draft, scope, animalId, day) {
    if (scope === "override" && animalId) {
      draft.overrides = draft.overrides || {};
      draft.overrides[animalId] = draft.overrides[animalId] || { days: {} };
      draft.overrides[animalId].days = draft.overrides[animalId].days || {};
      draft.overrides[animalId].days[day] =
        draft.overrides[animalId].days[day] || {
          deutschId: "",
          deutschIds: [],
          deutschTaskNumber: "",
          deutschTaskNumbers: [],
          matheId: "",
          matheIds: [],
          matheTaskNumber: "",
          matheTaskNumbers: [],
          freeText: ""
        };
      return draft.overrides[animalId].days[day];
    }

    draft.days = draft.days || {};
    draft.days[day] =
      draft.days[day] || {
        deutschId: "",
        deutschIds: [],
        deutschTaskNumber: "",
        deutschTaskNumbers: [],
        matheId: "",
        matheIds: [],
        matheTaskNumber: "",
        matheTaskNumbers: [],
        freeText: ""
      };
    return draft.days[day];
  }

  function taskKeys(field) {
    return field === "Deutsch"
      ? {
          ids: "deutschIds",
          legacyId: "deutschId",
          numbers: "deutschTaskNumbers",
          legacyNumber: "deutschTaskNumber"
        }
      : {
          ids: "matheIds",
          legacyId: "matheId",
          numbers: "matheTaskNumbers",
          legacyNumber: "matheTaskNumber"
        };
  }

  function duplicateFlags(ids) {
    const seen = new Map();
    return ids.map((id) => {
      const count = (seen.get(id) || 0) + 1;
      seen.set(id, count);
      return { occurrence: count, extra: count > 1 };
    });
  }

  /* ---------- Speichern / Normalisieren ---------- */

  normalizeWeeklyPlan = function normalizeWeeklyPlanWithExtraTasks(item, fallbackClassId) {
    const normalized = baseNormalizeWeeklyPlan(item, fallbackClassId);

    WEEK_DAYS.forEach((day) => {
      const source = item?.days?.[day] || item?.tage?.[day] || {};
      const target = normalized.days?.[day];
      if (!target) return;

      target.deutschTaskNumbers = normalizeNumbers(
        source.deutschTaskNumbers,
        source.deutschTaskNumber || source.deutschNumbers || source.deutschNr || "",
        normalizeIdArray(target.deutschIds || target.deutschId).length
      );
      target.matheTaskNumbers = normalizeNumbers(
        source.matheTaskNumbers,
        source.matheTaskNumber || source.matheNumbers || source.matheNr || "",
        normalizeIdArray(target.matheIds || target.matheId).length
      );

      target.deutschTaskNumber = target.deutschTaskNumbers[0] || target.deutschTaskNumber || "";
      target.matheTaskNumber = target.matheTaskNumbers[0] || target.matheTaskNumber || "";
    });

    // Overrides werden im bisherigen Normalizer bewusst unverändert übernommen.
    // Hier ergänzen wir nur die neuen Nummern-Arrays.
    Object.values(normalized.overrides || {}).forEach((override) => {
      WEEK_DAYS.forEach((day) => {
        const source = override?.days?.[day];
        if (!source) return;

        const deutschIds = normalizeIdArray(source.deutschIds || source.deutschId || "");
        const matheIds = normalizeIdArray(source.matheIds || source.matheId || "");

        source.deutschIds = deutschIds;
        source.deutschId = deutschIds[0] || "";
        source.matheIds = matheIds;
        source.matheId = matheIds[0] || "";

        source.deutschTaskNumbers = normalizeNumbers(
          source.deutschTaskNumbers,
          source.deutschTaskNumber || "",
          deutschIds.length
        );
        source.matheTaskNumbers = normalizeNumbers(
          source.matheTaskNumbers,
          source.matheTaskNumber || "",
          matheIds.length
        );
        source.deutschTaskNumber = source.deutschTaskNumbers[0] || "";
        source.matheTaskNumber = source.matheTaskNumbers[0] || "";
      });
    });

    return normalized;
  };

  setWeeklyDraftValue = function setWeeklyDraftValueAllowDuplicates(
    draft,
    scope,
    animalId,
    day,
    field,
    value
  ) {
    const keys = taskKeys(field);
    const target = dayTarget(draft, scope, animalId, day);
    const ids = normalizeIdArray(target[keys.ids] || target[keys.legacyId]);
    const numbers = normalizeNumbers(
      target[keys.numbers],
      target[keys.legacyNumber],
      ids.length
    );

    if (value) {
      // Absichtlich KEIN Set: dieselbe Seite darf ein zweites Mal vorkommen.
      ids.push(String(value));
      numbers.push("");
    } else {
      ids.splice(0, ids.length);
      numbers.splice(0, numbers.length);
    }

    target[keys.ids] = ids;
    target[keys.legacyId] = ids[0] || "";
    target[keys.numbers] = numbers;
    target[keys.legacyNumber] = numbers[0] || "";
  };

  readWeeklyDaysFromDom = function readWeeklyDaysFromDomWithExtraTasks(scope, animalId = "") {
    const prefix = weeklyInputPrefix(scope, animalId);
    const days = {};

    WEEK_DAYS.forEach((day, index) => {
      const deutschIds = normalizeIdArray(
        document.getElementById(`${prefix}Deutsch${index}`)?.value || ""
      );
      const matheIds = normalizeIdArray(
        document.getElementById(`${prefix}Mathe${index}`)?.value || ""
      );

      const deutschTaskNumbers = deutschIds.map((_, itemIndex) =>
        normalizeTaskNumberText(
          document.getElementById(`${prefix}Deutsch${index}TaskNumber_${itemIndex}`)?.value || ""
        )
      );
      const matheTaskNumbers = matheIds.map((_, itemIndex) =>
        normalizeTaskNumberText(
          document.getElementById(`${prefix}Mathe${index}TaskNumber_${itemIndex}`)?.value || ""
        )
      );

      days[day] = {
        deutschId: deutschIds[0] || "",
        deutschIds,
        deutschTaskNumber: deutschTaskNumbers[0] || "",
        deutschTaskNumbers,
        matheId: matheIds[0] || "",
        matheIds,
        matheTaskNumber: matheTaskNumbers[0] || "",
        matheTaskNumbers,
        freeText: document.getElementById(`${prefix}Free${index}`)?.value.trim() || ""
      };
    });

    return days;
  };

  /* ---------- Editor ---------- */

  renderWeeklyPlannerTable = function renderWeeklyPlannerTableWithExtraTasks(
    days,
    scope,
    animalId = ""
  ) {
    const prefix = weeklyInputPrefix(scope, animalId);

    return `
      <div class="weekly-day-editor-list">
        ${WEEK_DAYS.map((day, index) => {
          const dayData = days?.[day] || {};
          const deutschIds = normalizeIdArray(dayData.deutschIds || dayData.deutschId);
          const matheIds = normalizeIdArray(dayData.matheIds || dayData.matheId);

          return `
            <section class="weekly-day-editor-card">
              <h4>${escapeHtml(day)}</h4>
              <div class="weekly-day-editor-fields">
                <div class="weekly-editor-subject">
                  <strong>Deutsch</strong>
                  ${renderWeeklyPickCell(
                    "Deutsch",
                    day,
                    index,
                    deutschIds,
                    `${prefix}Deutsch${index}`,
                    scope,
                    animalId,
                    dayData.deutschTaskNumber || "",
                    normalizeNumbers(
                      dayData.deutschTaskNumbers,
                      dayData.deutschTaskNumber || "",
                      deutschIds.length
                    )
                  )}
                </div>

                <div class="weekly-editor-subject">
                  <strong>Mathe</strong>
                  ${renderWeeklyPickCell(
                    "Mathe",
                    day,
                    index,
                    matheIds,
                    `${prefix}Mathe${index}`,
                    scope,
                    animalId,
                    dayData.matheTaskNumber || "",
                    normalizeNumbers(
                      dayData.matheTaskNumbers,
                      dayData.matheTaskNumber || "",
                      matheIds.length
                    )
                  )}
                </div>

                <label class="field weekly-editor-extra"><strong>Extra</strong>
                  <input
                    class="text-input"
                    id="${escapeAttribute(`${prefix}Free${index}`)}"
                    value="${escapeAttribute(dayData.freeText || "")}"
                    placeholder="z. B. Lies 10 Minuten."
                  >
                </label>
              </div>
            </section>
          `;
        }).join("")}
      </div>
    `;
  };

  renderWeeklyPickCell = function renderWeeklyPickCellWithExtraTasks(
    subject,
    day,
    index,
    selectedIds,
    inputId,
    scope,
    animalId = "",
    legacyTaskNumber = "",
    taskNumbers = []
  ) {
    const ids = normalizeIdArray(selectedIds);
    const catalog = workbookCatalogForWeeklyPlanClass(state.activeClassId);
    const items = ids.map((id) => catalog.find((entry) => entry.id === id)).filter(Boolean);
    const numbers = normalizeNumbers(taskNumbers, legacyTaskNumber, ids.length);
    const flags = duplicateFlags(ids);

    return `
      <div class="weekly-pick-cell weekly-pick-cell-multi">
        <input
          type="hidden"
          id="${escapeAttribute(inputId)}"
          value="${escapeAttribute(ids.join(","))}"
        >

        <div
          id="${escapeAttribute(inputId)}Label"
          class="weekly-pick-label weekly-pick-label-multi ${items.length ? "" : "empty"}"
        >
          ${items.length
            ? items.map((item, itemIndex) => {
                const flag = flags[itemIndex] || { occurrence: 1, extra: false };
                return `
                  <div class="weekly-selected-task ${flag.extra ? "is-extra" : ""}">
                    <div class="weekly-selected-task-label">
                      ${flag.extra ? `<span class="weekly-extra-star">⭐ Zusatzaufgabe</span>` : ""}
                      <strong>${escapeHtml(workbookCatalogShortLabel(item))}</strong>
                    </div>

                    <label class="weekly-task-number-label">
                      Nr.
                      <input
                        class="text-input weekly-task-number-input"
                        id="${escapeAttribute(`${inputId}TaskNumber_${itemIndex}`)}"
                        value="${escapeAttribute(numbers[itemIndex] || "")}"
                        placeholder="z. B. 1 + 3"
                      >
                    </label>

                    <button
                      class="weekly-task-remove"
                      type="button"
                      title="Nur diese Aufgabe entfernen"
                      aria-label="Diese Aufgabe entfernen"
                      onclick="removeWeeklyPickOccurrence(
                        '${escapeAttribute(scope)}',
                        '${escapeAttribute(animalId)}',
                        '${escapeAttribute(day)}',
                        '${escapeAttribute(subject)}',
                        ${itemIndex}
                      )"
                    >×</button>
                  </div>
                `;
              }).join("")
            : "keine Auswahl"}
        </div>

        <div class="weekly-pick-actions">
          <button
            class="small-button"
            type="button"
            onclick="openWeeklyCatalogPicker(
              '${escapeAttribute(subject)}',
              '${escapeAttribute(day)}',
              '${escapeAttribute(scope)}',
              '${escapeAttribute(animalId)}',
              ${index}
            )"
          >${items.length ? "+ weitere Aufgabe" : "+ auswählen"}</button>

          ${items.length
            ? `<button class="link-button" type="button" onclick="showWorkbookCatalogInfo('${escapeAttribute(items[0].id)}')">Info</button>`
            : ""}

          ${items.length
            ? `<button class="small-button" type="button" onclick="clearWeeklyPick('${escapeAttribute(inputId)}')">alle leeren</button>`
            : ""}
        </div>
      </div>
    `;
  };

  window.removeWeeklyPickOccurrence = function removeWeeklyPickOccurrence(
    scope,
    animalId,
    day,
    field,
    itemIndex
  ) {
    weeklyPlanDraft = collectWeeklyPlanDraftFromDom();
    const target = dayTarget(weeklyPlanDraft, scope, animalId, day);
    const keys = taskKeys(field);

    const ids = normalizeIdArray(target[keys.ids] || target[keys.legacyId]);
    const numbers = normalizeNumbers(
      target[keys.numbers],
      target[keys.legacyNumber],
      ids.length
    );

    if (itemIndex < 0 || itemIndex >= ids.length) return;

    ids.splice(itemIndex, 1);
    numbers.splice(itemIndex, 1);

    target[keys.ids] = ids;
    target[keys.legacyId] = ids[0] || "";
    target[keys.numbers] = numbers;
    target[keys.legacyNumber] = numbers[0] || "";

    render();
  };

  if (baseRenderWeeklyCatalogPicker) {
    renderWeeklyCatalogPicker = function renderWeeklyCatalogPickerWithExtraHint() {
      const html = baseRenderWeeklyCatalogPicker();
      if (!weeklyPickRequest) return html;

      return html.replace(
        /(<h2 id="weeklyPickerTitle">[\s\S]*?<\/h2>)/,
        `$1
         <p class="message weekly-extra-picker-hint">
           ⭐ Tipp: Wählst du eine bereits eingetragene Seite noch einmal aus,
           wird die zweite Auswahl automatisch als <strong>Zusatzaufgabe</strong> markiert.
         </p>`
      );
    };
  }

  /* ---------- Kinderansicht / Druck / Status ---------- */

  function effectiveDayForSubject(plan, day, animalId, subject) {
    const base = plan?.days?.[day] || {};
    const override = animalId ? plan?.overrides?.[animalId]?.days?.[day] : null;
    if (!override) return base;

    const keys = taskKeys(subject);
    const overrideIds = normalizeIdArray(override[keys.ids] || override[keys.legacyId]);
    return overrideIds.length ? override : base;
  }

  if (baseWeeklyPlanItemsForDay) {
    weeklyPlanItemsForDay = function weeklyPlanItemsForDayWithExtraTasks(
      plan,
      day,
      animalId = ""
    ) {
      let items = baseWeeklyPlanItemsForDay(plan, day, animalId);
      const subjectIndexes = { Deutsch: 0, Mathe: 0 };
      const seenFields = new Map();

      items = items.map((item) => {
        if (!["Deutsch", "Mathe"].includes(item.subject)) return item;

        const subject = item.subject;
        const index = subjectIndexes[subject]++;
        const effectiveDay = effectiveDayForSubject(plan, day, animalId, subject);
        const keys = taskKeys(subject);
        const ids = normalizeIdArray(effectiveDay[keys.ids] || effectiveDay[keys.legacyId]);
        const numbers = normalizeNumbers(
          effectiveDay[keys.numbers],
          effectiveDay[keys.legacyNumber],
          ids.length
        );

        const baseField = item.field || `${subject}:${index}`;
        const occurrence = (seenFields.get(baseField) || 0) + 1;
        seenFields.set(baseField, occurrence);
        const isExtra = occurrence > 1;

        return {
          ...item,
          field: isExtra ? `${baseField}:extra:${occurrence}` : baseField,
          taskNumber: numbers[index] || item.taskNumber || "",
          text: isExtra && !String(item.text || "").startsWith("⭐")
            ? `⭐ ${item.text || ""}`
            : item.text,
          label: isExtra && !String(item.label || "").startsWith("⭐")
            ? `⭐ ${item.label || subject}`
            : item.label,
          isExtraTask: isExtra
        };
      });

      // Die bestehende Druckoption „mit Extra-Aufgabe“ gilt nun auch
      // für die mit ⭐ markierten Zusatzaufgaben.
      try {
        if (
          screen === "printView" &&
          currentPrintType === "weeklyPlan" &&
          currentWeeklyPrintOptions?.showExtra === false
        ) {
          items = items.filter((item) => !item.isExtraTask);
        }
      } catch {}

      return items;
    };
  }

  const style = document.createElement("style");
  style.id = "lk-weekly-extra-tasks-style";
  style.textContent = `
    .weekly-pick-label-multi {
      display:grid;
      gap:7px;
    }

    .weekly-selected-task {
      display:grid;
      grid-template-columns:minmax(0,1fr) auto auto;
      gap:8px;
      align-items:center;
      padding:9px 10px;
      border:1px solid rgba(0,0,0,.08);
      border-radius:13px;
      background:rgba(255,255,255,.76);
    }

    .weekly-selected-task.is-extra {
      background:rgba(255,244,196,.48);
      border-color:rgba(204,155,34,.26);
    }

    .weekly-selected-task-label {
      display:grid;
      gap:3px;
      min-width:0;
    }

    .weekly-extra-star {
      display:inline-flex;
      width:max-content;
      max-width:100%;
      padding:3px 7px;
      border-radius:999px;
      background:#fff0b8;
      font-size:.72rem;
      font-weight:800;
    }

    .weekly-selected-task .weekly-task-number-label {
      margin:0;
      white-space:nowrap;
    }

    .weekly-selected-task .weekly-task-number-input {
      width:92px;
      min-width:72px;
    }

    .weekly-task-remove {
      width:32px;
      height:32px;
      display:grid;
      place-items:center;
      padding:0;
      border:0;
      border-radius:50%;
      background:rgba(0,0,0,.055);
      cursor:pointer;
      font:inherit;
      font-size:1.1rem;
    }

    .weekly-task-remove:hover {
      background:rgba(180,65,65,.12);
    }

    .weekly-extra-picker-hint {
      padding:9px 11px;
      border-radius:12px;
      background:#fff7d7;
    }

    @media (max-width:700px) {
      .weekly-selected-task {
        grid-template-columns:minmax(0,1fr) auto;
      }

      .weekly-selected-task .weekly-task-number-label {
        grid-column:1;
      }

      .weekly-task-remove {
        grid-column:2;
        grid-row:1;
      }
    }
  `;
  if (!document.getElementById(style.id)) document.head.appendChild(style);

  window.LKWeeklyExtraTasks = {
    normalizeNumbers,
    duplicateFlags,
    taskKeys
  };
})();
