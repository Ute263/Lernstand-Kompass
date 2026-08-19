/* Paket 9e: Wochenplan – freie Aufgaben, Stern immer möglich,
 * Rico Schnabel 2 – Rechtschreiben und kindgerechte Wochenansicht.
 *
 * Lädt NACH weekly-extra-tasks.js und weekly-ui-cleanup.js.
 */
(() => {
  if (
    typeof renderWeeklyPlannerTable !== "function" ||
    typeof renderWeeklyPickCell !== "function" ||
    typeof readWeeklyDaysFromDom !== "function" ||
    typeof setWeeklyDraftValue !== "function" ||
    typeof normalizeWeeklyPlan !== "function" ||
    typeof weeklyPlanItemsForDay !== "function"
  ) {
    console.warn("Paket 9e konnte nicht initialisiert werden.");
    return;
  }

  const baseNormalizeWeeklyPlan = normalizeWeeklyPlan;
  const baseSetWeeklyDraftValue = setWeeklyDraftValue;
  const baseWeeklyPlanItemsForDay = weeklyPlanItemsForDay;
  const baseRenderWorkbookCatalogManager = typeof renderWorkbookCatalogManager === "function"
    ? renderWorkbookCatalogManager : null;

  let lkChildWeekDay = "";
  let lkChildWeekPlanId = "";
  let lkWeeklyOpenDay = "Montag";

  const RICO_WORKBOOK = "Rico Schnabel 2 – Rechtschreiben";
  const RICO_ROWS = [
    [4, "Das Alphabet: Wörter ordnen", "Alphabet"],
    [7, "Nomen sortieren: Singular", "Nomen"],
    [9, "Nomen sortieren: Singular/Plural", "Nomen"],
    [13, "Nomen: Mehrzahl bilden", "Nomen"],
    [15, "Ableiten: Umlaute o→ö, u→ü", "Umlaute I"],
    [17, "Umlaute ö und ü", "Umlaute I"],
    [18, "Komposita: verbinden", "Komposita"],
    [20, "Komposita: trennen", "Komposita"],
    [22, "Groß- und Kleinschreibung: Nomen", "Groß- und Kleinschreibung"],
    [26, "Groß- und Kleinschreibung: Sätze", "Groß- und Kleinschreibung"],
    [28, "Groß- und Kleinschreibung: gemischte Wörter", "Groß- und Kleinschreibung"],
    [30, "Wörter mit Doppelkonsonanten: Nomen", "Wörter mit Doppelkonsonanten"],
    [31, "Wörter mit Doppelkonsonanten: Verben", "Wörter mit Doppelkonsonanten"],
    [32, "Wörter mit Doppelkonsonanten: Nomen, Einzahl/Mehrzahl", "Wörter mit Doppelkonsonanten"],
    [33, "Wörter mit Doppelkonsonanten: gemischte Wörter", "Wörter mit Doppelkonsonanten"],
    [34, "Wörter mit Doppelkonsonanten: Sätze", "Wörter mit Doppelkonsonanten"],
    [35, "Wörter mit ck/tz", "Wichtige Konsonantenverbindungen"],
    [39, "Wörter mit Pf/pf", "Wichtige Konsonantenverbindungen"],
    [41, "Wörter mit ch", "Wichtige Konsonantenverbindungen"],
    [43, "Wörter mit st/St und Sp/sp", "Wichtige Konsonantenverbindungen"],
    [44, "Wörter mit nk", "Wichtige Konsonantenverbindungen"],
    [45, "Wörter mit ng", "Wichtige Konsonantenverbindungen"],
    [47, "Wörter mit ng: Wortfamilien", "Wichtige Konsonantenverbindungen"],
    [48, "Auslautverhärtung: d/t, g/k, b/p, verlängern", "Auslautverhärtung"],
    [49, "Auslautverhärtung: d/t, g/k, verlängern", "Auslautverhärtung"],
    [50, "Auslautverhärtung: d/t, verlängern", "Auslautverhärtung"],
    [51, "Auslautverhärtung: g/k, verlängern", "Auslautverhärtung"],
    [52, "Auslautverhärtung: d/t", "Auslautverhärtung"],
    [53, "Auslautverhärtung: g/k", "Auslautverhärtung"],
    [54, "Auslautverhärtung: Sätze", "Auslautverhärtung"],
    [55, "Auslautverhärtung: Verben", "Auslautverhärtung"],
    [56, "Auslautverhärtung: Verben, Wortfamilien", "Auslautverhärtung"],
    [59, "Wörter mit ß", "Wörter mit ß"],
    [61, "Ableiten: Umlaute A/a→Ä/ä, Nomen", "Umlaute II"],
    [63, "Ableiten: Umlaute au→äu, Nomen", "Umlaute II"],
    [64, "Ableiten: Umlaute a→ä, Verben", "Umlaute II"],
    [65, "Ableiten: Umlaute a→ä, Verben, Adjektive", "Umlaute II"],
    [66, "Ableiten: Umlaute a→ä, au→äu, gemischte Wörter", "Umlaute II"],
    [67, "Ableiten: Umlaute a→ä, o→ö, au→äu, Sätze", "Umlaute II"],
    [68, "Verkleinerungsform: -chen", "Verkleinerungsform"],
    [70, "Verkleinerungsform: -lein", "Verkleinerungsform"],
    [71, "Verkleinerungsform: -chen und -lein", "Verkleinerungsform"],
    [72, "Wörter mit i und ie", "Wörter mit i und ie"],
    [73, "Wörter mit ie", "Wörter mit i und ie"],
    [74, "Wörter mit ie: Wortstamm", "Wörter mit i und ie"],
    [75, "Wörter mit ie: Sätze", "Wörter mit i und ie"],
    [76, "Fremdwörter/Merkwörter mit i", "Wörter mit i und ie"],
    [78, "Wörter mit vokalisiertem r", "Wörter mit Merkstellen/Wörter mit Besonderheiten"],
    [80, "Wörter mit vokalisiertem r: Wortstamm", "Wörter mit Merkstellen/Wörter mit Besonderheiten"],
    [81, "Wörter mit V/v", "Wörter mit Merkstellen/Wörter mit Besonderheiten"],
    [84, "Wörter mit X/x", "Wörter mit Merkstellen/Wörter mit Besonderheiten"],
    [85, "Wörter mit chs und ks", "Wörter mit Merkstellen/Wörter mit Besonderheiten"],
    [86, "Wörter mit chs, ks und x", "Wörter mit Merkstellen/Wörter mit Besonderheiten"],
    [87, "Wörter mit silbentrennendem h", "Wörter mit Merkstellen/Wörter mit Besonderheiten"],
    [89, "Wörter mit Dehnungs-h / stummem h", "Wörter mit Merkstellen/Wörter mit Besonderheiten"],
    [90, "Merkwörter mit Dehnungs-h / stummem h: Wortstamm", "Wörter mit Merkstellen/Wörter mit Besonderheiten"],
    [91, "Merkwörter mit Y/y", "Wörter mit Merkstellen/Wörter mit Besonderheiten"],
    [92, "Wörter mit Doppelvokal", "Wörter mit Merkstellen/Wörter mit Besonderheiten"],
    [94, "Merkwörter mit ä", "Wörter mit Merkstellen/Wörter mit Besonderheiten"],
    [95, "Wörter mit Eu/eu", "Wörter mit Merkstellen/Wörter mit Besonderheiten"],
    [96, "Wörter mit Eu/eu: Sätze", "Wörter mit Merkstellen/Wörter mit Besonderheiten"],
    [97, "Weitere Merkwörter", "Wörter mit Merkstellen/Wörter mit Besonderheiten"],
    [98, "Verben mit der Vorsilbe vor-", "Vorsilben"],
    [99, "Verben mit der Vorsilbe ver-", "Vorsilben"],
    [100, "Verben mit den Vorsilben vor- und ver-", "Vorsilben"],
    [101, "Verben mit den Vorsilben vor- und ver-: Sätze", "Vorsilben"],
    [102, "Verben mit den Vorsilben an-/aus-/auf-/ab-/ein-/mit-", "Vorsilben"],
    [103, "Verben mit den Vorsilben an-/aus-/ein-/auf-/mit-/weg-", "Vorsilben"],
    [104, "Verben mit den Vorsilben zu-/be-/er-/um-/zer-/ent-", "Vorsilben"],
    [105, "Verben mit den Vorsilben ent-/er-/be-/um-/zu-/ant-/zer-", "Vorsilben"],
    [106, "Satzzeichen", "Satzzeichen"],
    [108, "Unregelmäßige Verben: Präsens", "Unregelmäßige Verben"],
    [110, "Unregelmäßige Verben: Präteritum", "Unregelmäßige Verben"],
    [111, "Unregelmäßige Verben: Perfekt", "Unregelmäßige Verben"],
    [112, "Unregelmäßige Verben: Wortfamilien", "Unregelmäßige Verben"]
  ];

  function boolList(value, length, fallback = []) {
    const list = Array.isArray(value) ? value.map(Boolean) : [];
    while (list.length < length) list.push(Boolean(fallback[list.length]));
    return list.slice(0, length);
  }

  function numberList(value, legacyValue = "", length = 0) {
    let list = Array.isArray(value) ? value.map((v) => normalizeTaskNumberText(v || "")) : [];
    if (!list.length && legacyValue) list = [normalizeTaskNumberText(legacyValue)];
    while (list.length < length) list.push("");
    return list.slice(0, length);
  }

  function duplicateDefaults(ids) {
    const seen = new Map();
    return ids.map((id) => {
      const count = (seen.get(id) || 0) + 1;
      seen.set(id, count);
      return count > 1;
    });
  }

  function simpleHash(text) {
    let hash = 2166136261;
    const value = String(text || "");
    for (let i = 0; i < value.length; i += 1) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function normalizeFreeTasks(value, subject = "Extra", legacyText = "") {
    let list = Array.isArray(value) ? value : [];
    if (!list.length && legacyText) list = [{ text: legacyText, starred: false }];
    return list.map((item, index) => {
      const object = typeof item === "string" ? { text: item } : (item || {});
      const text = String(object.text || object.value || "").trim();
      return {
        id: object.id || `free-${subject.toLowerCase()}-${index}-${simpleHash(text)}`,
        text,
        starred: object.starred === true
      };
    });
  }

  function dayTarget(draft, scope, animalId, day) {
    if (scope === "override" && animalId) {
      draft.overrides = draft.overrides || {};
      draft.overrides[animalId] = draft.overrides[animalId] || { days: {} };
      draft.overrides[animalId].days = draft.overrides[animalId].days || {};
      draft.overrides[animalId].days[day] = draft.overrides[animalId].days[day] || {};
      return draft.overrides[animalId].days[day];
    }
    draft.days = draft.days || {};
    draft.days[day] = draft.days[day] || {};
    return draft.days[day];
  }

  function taskKeys(subject) {
    const low = subject === "Deutsch" ? "deutsch" : "mathe";
    return {
      ids: `${low}Ids`,
      legacyId: `${low}Id`,
      numbers: `${low}TaskNumbers`,
      legacyNumber: `${low}TaskNumber`,
      stars: `${low}TaskStars`,
      free: `${low}FreeTasks`
    };
  }

  function freeKey(subject) {
    if (subject === "Deutsch") return "deutschFreeTasks";
    if (subject === "Mathe") return "matheFreeTasks";
    return "extraFreeTasks";
  }

  function normalizeDayExtras(target, source = target) {
    ["Deutsch", "Mathe"].forEach((subject) => {
      const keys = taskKeys(subject);
      const ids = normalizeIdArray(target[keys.ids] || target[keys.legacyId]);
      target[keys.ids] = ids;
      target[keys.legacyId] = ids[0] || "";
      target[keys.numbers] = numberList(source?.[keys.numbers], source?.[keys.legacyNumber] || "", ids.length);
      target[keys.legacyNumber] = target[keys.numbers][0] || "";
      target[keys.stars] = boolList(source?.[keys.stars], ids.length, duplicateDefaults(ids));
      target[keys.free] = normalizeFreeTasks(source?.[keys.free], subject);
    });
    target.extraFreeTasks = normalizeFreeTasks(source?.extraFreeTasks, "Extra", source?.freeText || "");
    target.freeText = target.extraFreeTasks[0]?.text || source?.freeText || "";
    return target;
  }

  normalizeWeeklyPlan = function normalizeWeeklyPlan9e(item, fallbackClassId) {
    const normalized = baseNormalizeWeeklyPlan(item, fallbackClassId);
    WEEK_DAYS.forEach((day) => {
      const source = item?.days?.[day] || item?.tage?.[day] || {};
      if (normalized.days?.[day]) normalizeDayExtras(normalized.days[day], source);
    });
    Object.entries(normalized.overrides || {}).forEach(([animalId, override]) => {
      WEEK_DAYS.forEach((day) => {
        const target = override?.days?.[day];
        if (!target) return;
        const source = item?.overrides?.[animalId]?.days?.[day] || target;
        normalizeDayExtras(target, source);
      });
    });
    return normalized;
  };

  setWeeklyDraftValue = function setWeeklyDraftValue9e(draft, scope, animalId, day, field, value) {
    const keys = taskKeys(field);
    const target = dayTarget(draft, scope, animalId, day);
    const beforeIds = normalizeIdArray(target[keys.ids] || target[keys.legacyId]);
    const beforeStars = boolList(target[keys.stars], beforeIds.length, duplicateDefaults(beforeIds));
    const duplicate = value ? beforeIds.includes(String(value)) : false;

    baseSetWeeklyDraftValue(draft, scope, animalId, day, field, value);

    const afterTarget = dayTarget(draft, scope, animalId, day);
    const afterIds = normalizeIdArray(afterTarget[keys.ids] || afterTarget[keys.legacyId]);
    if (value) afterTarget[keys.stars] = [...beforeStars, duplicate];
    else afterTarget[keys.stars] = [];
    afterTarget[keys.stars] = boolList(afterTarget[keys.stars], afterIds.length, duplicateDefaults(afterIds));
  };

  /* ---------- Wochenplan-Editor ---------- */

  function readFreeTasks(prefix, subject, dayIndex) {
    const wrap = document.getElementById(`${prefix}${subject}${dayIndex}FreeList`);
    if (!wrap) return [];
    return [...wrap.querySelectorAll("[data-free-task-row]")].map((row, index) => {
      const id = row.querySelector("[data-free-id]")?.value || `free-${subject.toLowerCase()}-${index}-${Date.now()}`;
      const text = row.querySelector("[data-free-text]")?.value.trim() || "";
      const starred = row.querySelector("[data-free-star]")?.value === "1";
      return { id, text, starred };
    }).filter((item) => item.text);
  }

  readWeeklyDaysFromDom = function readWeeklyDaysFromDom9e(scope, animalId = "") {
    const prefix = weeklyInputPrefix(scope, animalId);
    const days = {};
    WEEK_DAYS.forEach((day, dayIndex) => {
      const deutschIds = normalizeIdArray(document.getElementById(`${prefix}Deutsch${dayIndex}`)?.value || "");
      const matheIds = normalizeIdArray(document.getElementById(`${prefix}Mathe${dayIndex}`)?.value || "");
      const deutschTaskNumbers = deutschIds.map((_, itemIndex) => normalizeTaskNumberText(
        document.getElementById(`${prefix}Deutsch${dayIndex}TaskNumber_${itemIndex}`)?.value || ""
      ));
      const matheTaskNumbers = matheIds.map((_, itemIndex) => normalizeTaskNumberText(
        document.getElementById(`${prefix}Mathe${dayIndex}TaskNumber_${itemIndex}`)?.value || ""
      ));
      const deutschTaskStars = deutschIds.map((_, itemIndex) =>
        document.getElementById(`${prefix}Deutsch${dayIndex}Star_${itemIndex}`)?.value === "1"
      );
      const matheTaskStars = matheIds.map((_, itemIndex) =>
        document.getElementById(`${prefix}Mathe${dayIndex}Star_${itemIndex}`)?.value === "1"
      );
      const deutschFreeTasks = readFreeTasks(prefix, "Deutsch", dayIndex);
      const matheFreeTasks = readFreeTasks(prefix, "Mathe", dayIndex);
      const extraFreeTasks = readFreeTasks(prefix, "Extra", dayIndex);

      days[day] = {
        deutschId: deutschIds[0] || "",
        deutschIds,
        deutschTaskNumber: deutschTaskNumbers[0] || "",
        deutschTaskNumbers,
        deutschTaskStars,
        deutschFreeTasks,
        matheId: matheIds[0] || "",
        matheIds,
        matheTaskNumber: matheTaskNumbers[0] || "",
        matheTaskNumbers,
        matheTaskStars,
        matheFreeTasks,
        extraFreeTasks,
        freeText: extraFreeTasks[0]?.text || ""
      };
    });
    return days;
  };

  const baseWeeklyDaysHaveContent = typeof weeklyDaysHaveContent === "function" ? weeklyDaysHaveContent : null;
  weeklyDaysHaveContent = function weeklyDaysHaveContent9e(days) {
    if (baseWeeklyDaysHaveContent?.(days)) return true;
    return Object.values(days || {}).some((day) =>
      normalizeFreeTasks(day.deutschFreeTasks, "Deutsch").length ||
      normalizeFreeTasks(day.matheFreeTasks, "Mathe").length ||
      normalizeFreeTasks(day.extraFreeTasks, "Extra").length
    );
  };

  function renderStarButton(scope, animalId, day, subject, itemIndex, starred, freeId = "") {
    const handler = freeId
      ? `toggleWeeklyFreeTaskStar('${escapeAttribute(scope)}','${escapeAttribute(animalId)}','${escapeAttribute(day)}','${escapeAttribute(subject)}','${escapeAttribute(freeId)}')`
      : `toggleWeeklyTaskStar('${escapeAttribute(scope)}','${escapeAttribute(animalId)}','${escapeAttribute(day)}','${escapeAttribute(subject)}',${itemIndex})`;
    return `
      <button
        class="lk-star-toggle ${starred ? "active" : ""}"
        type="button"
        title="${starred ? "Stern entfernen" : "Als Zusatzaufgabe markieren"}"
        aria-label="${starred ? "Stern entfernen" : "Als Zusatzaufgabe markieren"}"
        onclick="${handler}"
      >${starred ? "⭐" : "☆"}</button>
    `;
  }

  function renderFreeTaskList(tasks, prefix, subject, dayIndex, scope, animalId, day) {
    const normalized = normalizeFreeTasks(tasks, subject);
    return `
      <div class="lk-free-task-box">
        <div class="lk-free-task-head">
          <span>✏️ Ohne Heft</span>
          <button class="small-button" type="button" onclick="addWeeklyFreeTask('${escapeAttribute(scope)}','${escapeAttribute(animalId)}','${escapeAttribute(day)}','${escapeAttribute(subject)}')">+ freie Aufgabe</button>
        </div>
        <div id="${escapeAttribute(`${prefix}${subject}${dayIndex}FreeList`)}" class="lk-free-task-list">
          ${normalized.map((task) => `
            <div class="lk-free-task-row ${task.starred ? "is-extra" : ""}" data-free-task-row>
              <input type="hidden" data-free-id value="${escapeAttribute(task.id)}">
              <input type="hidden" data-free-star value="${task.starred ? "1" : "0"}">
              ${renderStarButton(scope, animalId, day, subject, 0, task.starred, task.id)}
              <input class="text-input" data-free-text value="${escapeAttribute(task.text)}" placeholder="Aufgabe frei eintragen …">
              <button class="weekly-task-remove" type="button" aria-label="Freie Aufgabe entfernen" onclick="removeWeeklyFreeTask('${escapeAttribute(scope)}','${escapeAttribute(animalId)}','${escapeAttribute(day)}','${escapeAttribute(subject)}','${escapeAttribute(task.id)}')">×</button>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  renderWeeklyPickCell = function renderWeeklyPickCell9e(
    subject, day, index, selectedIds, inputId, scope, animalId = "",
    legacyTaskNumber = "", taskNumbers = [], taskStars = []
  ) {
    const ids = normalizeIdArray(selectedIds);
    const catalog = workbookCatalogForWeeklyPlanClass(state.activeClassId);
    const items = ids.map((id) => catalog.find((entry) => entry.id === id)).filter(Boolean);
    const numbers = numberList(taskNumbers, legacyTaskNumber, ids.length);
    const stars = boolList(taskStars, ids.length, duplicateDefaults(ids));

    return `
      <div class="weekly-pick-cell weekly-pick-cell-multi lk-weekly-pick-cell">
        <input type="hidden" id="${escapeAttribute(inputId)}" value="${escapeAttribute(ids.join(","))}">
        <div id="${escapeAttribute(inputId)}Label" class="weekly-pick-label weekly-pick-label-multi ${items.length ? "" : "empty"}">
          ${items.length ? items.map((item, itemIndex) => `
            <div class="weekly-selected-task ${stars[itemIndex] ? "is-extra" : ""}">
              <input type="hidden" id="${escapeAttribute(`${inputId}Star_${itemIndex}`)}" value="${stars[itemIndex] ? "1" : "0"}">
              ${renderStarButton(scope, animalId, day, subject, itemIndex, stars[itemIndex])}
              <div class="weekly-selected-task-label">
                ${stars[itemIndex] ? `<span class="weekly-extra-star">⭐ Zusatzaufgabe</span>` : ""}
                <strong>${escapeHtml(workbookCatalogShortLabel(item))}</strong>
              </div>
              <label class="weekly-task-number-label">Nr.
                <input class="text-input weekly-task-number-input" id="${escapeAttribute(`${inputId}TaskNumber_${itemIndex}`)}" value="${escapeAttribute(numbers[itemIndex] || "")}" placeholder="z. B. 1 + 3">
              </label>
              <button class="weekly-task-remove" type="button" title="Nur diese Aufgabe entfernen" aria-label="Diese Aufgabe entfernen" onclick="removeWeeklyPickOccurrence('${escapeAttribute(scope)}','${escapeAttribute(animalId)}','${escapeAttribute(day)}','${escapeAttribute(subject)}',${itemIndex})">×</button>
            </div>
          `).join("") : `<span class="lk-no-book-task">Noch keine Heftseite gewählt.</span>`}
        </div>
        <div class="weekly-pick-actions">
          <button class="small-button" type="button" onclick="openWeeklyCatalogPicker('${escapeAttribute(subject)}','${escapeAttribute(day)}','${escapeAttribute(scope)}','${escapeAttribute(animalId)}',${index})">${items.length ? "+ Seite aus Heft" : "+ Seite aus Heft"}</button>
          ${items.length ? `<button class="small-button" type="button" onclick="clearWeeklyPick('${escapeAttribute(inputId)}')">Heftaufgaben leeren</button>` : ""}
        </div>
      </div>
    `;
  };

  renderWeeklyPlannerTable = function renderWeeklyPlannerTable9e(days, scope, animalId = "") {
    const prefix = weeklyInputPrefix(scope, animalId);
    return `
      <div class="weekly-day-editor-list lk-weekly-day-accordion">
        ${WEEK_DAYS.map((day, dayIndex) => {
          const data = normalizeDayExtras({ ...(days?.[day] || {}) }, days?.[day] || {});
          const deutschIds = normalizeIdArray(data.deutschIds || data.deutschId);
          const matheIds = normalizeIdArray(data.matheIds || data.matheId);
          const count = deutschIds.length + matheIds.length + data.deutschFreeTasks.length + data.matheFreeTasks.length + data.extraFreeTasks.length;
          return `
            <details class="weekly-day-editor-card lk-weekly-day-details" ${day === lkWeeklyOpenDay ? "open" : ""} ontoggle="if(this.open) lkRememberWeeklyDay('${escapeAttribute(day)}')">
              <summary class="lk-weekly-day-summary">
                <strong>${escapeHtml(day)}</strong>
                <span>${count ? `${count} ${count === 1 ? "Aufgabe" : "Aufgaben"}` : "noch leer"}</span>
              </summary>
              <div class="lk-weekly-day-content">
                <section class="weekly-editor-subject lk-editor-subject deutsch">
                  <div class="lk-editor-subject-head"><span>📘</span><strong>Deutsch</strong></div>
                  ${renderWeeklyPickCell("Deutsch", day, dayIndex, deutschIds, `${prefix}Deutsch${dayIndex}`, scope, animalId, data.deutschTaskNumber || "", data.deutschTaskNumbers, data.deutschTaskStars)}
                  ${renderFreeTaskList(data.deutschFreeTasks, prefix, "Deutsch", dayIndex, scope, animalId, day)}
                </section>
                <section class="weekly-editor-subject lk-editor-subject mathe">
                  <div class="lk-editor-subject-head"><span>🔢</span><strong>Mathe</strong></div>
                  ${renderWeeklyPickCell("Mathe", day, dayIndex, matheIds, `${prefix}Mathe${dayIndex}`, scope, animalId, data.matheTaskNumber || "", data.matheTaskNumbers, data.matheTaskStars)}
                  ${renderFreeTaskList(data.matheFreeTasks, prefix, "Mathe", dayIndex, scope, animalId, day)}
                </section>
                <section class="lk-editor-subject sonstiges">
                  <div class="lk-editor-subject-head"><span>✏️</span><strong>Sonstiges</strong></div>
                  ${renderFreeTaskList(data.extraFreeTasks, prefix, "Extra", dayIndex, scope, animalId, day)}
                </section>
              </div>
            </details>
          `;
        }).join("")}
      </div>
    `;
  };

  window.lkRememberWeeklyDay = function lkRememberWeeklyDay(day) {
    lkWeeklyOpenDay = day || lkWeeklyOpenDay;
  };

  window.toggleWeeklyTaskStar = function toggleWeeklyTaskStar(scope, animalId, day, subject, itemIndex) {
    weeklyPlanDraft = collectWeeklyPlanDraftFromDom();
    const target = dayTarget(weeklyPlanDraft, scope, animalId, day);
    const keys = taskKeys(subject);
    const ids = normalizeIdArray(target[keys.ids] || target[keys.legacyId]);
    const stars = boolList(target[keys.stars], ids.length, duplicateDefaults(ids));
    if (itemIndex < 0 || itemIndex >= stars.length) return;
    stars[itemIndex] = !stars[itemIndex];
    target[keys.stars] = stars;
    lkWeeklyOpenDay = day;
    render();
  };

  window.removeWeeklyPickOccurrence = function removeWeeklyPickOccurrence9e(scope, animalId, day, subject, itemIndex) {
    weeklyPlanDraft = collectWeeklyPlanDraftFromDom();
    const target = dayTarget(weeklyPlanDraft, scope, animalId, day);
    const keys = taskKeys(subject);
    const ids = normalizeIdArray(target[keys.ids] || target[keys.legacyId]);
    const numbers = numberList(target[keys.numbers], target[keys.legacyNumber], ids.length);
    const stars = boolList(target[keys.stars], ids.length, duplicateDefaults(ids));
    if (itemIndex < 0 || itemIndex >= ids.length) return;
    ids.splice(itemIndex, 1); numbers.splice(itemIndex, 1); stars.splice(itemIndex, 1);
    target[keys.ids] = ids;
    target[keys.legacyId] = ids[0] || "";
    target[keys.numbers] = numbers;
    target[keys.legacyNumber] = numbers[0] || "";
    target[keys.stars] = stars;
    lkWeeklyOpenDay = day;
    render();
  };

  window.addWeeklyFreeTask = function addWeeklyFreeTask(scope, animalId, day, subject) {
    weeklyPlanDraft = collectWeeklyPlanDraftFromDom();
    const target = dayTarget(weeklyPlanDraft, scope, animalId, day);
    const key = freeKey(subject);
    const tasks = normalizeFreeTasks(target[key], subject, subject === "Extra" ? target.freeText : "");
    tasks.push({ id: makeId(), text: "", starred: false });
    target[key] = tasks;
    if (subject === "Extra") target.freeText = tasks[0]?.text || "";
    lkWeeklyOpenDay = day;
    render();
    requestAnimationFrame(() => {
      const prefix = weeklyInputPrefix(scope, animalId);
      const dayIndex = WEEK_DAYS.indexOf(day);
      const wrap = document.getElementById(`${prefix}${subject}${dayIndex}FreeList`);
      const inputs = wrap?.querySelectorAll("[data-free-text]");
      inputs?.[inputs.length - 1]?.focus();
    });
  };

  window.removeWeeklyFreeTask = function removeWeeklyFreeTask(scope, animalId, day, subject, taskId) {
    weeklyPlanDraft = collectWeeklyPlanDraftFromDom();
    const target = dayTarget(weeklyPlanDraft, scope, animalId, day);
    const key = freeKey(subject);
    target[key] = normalizeFreeTasks(target[key], subject, subject === "Extra" ? target.freeText : "").filter((task) => task.id !== taskId);
    if (subject === "Extra") target.freeText = target[key][0]?.text || "";
    lkWeeklyOpenDay = day;
    render();
  };

  window.toggleWeeklyFreeTaskStar = function toggleWeeklyFreeTaskStar(scope, animalId, day, subject, taskId) {
    weeklyPlanDraft = collectWeeklyPlanDraftFromDom();
    const target = dayTarget(weeklyPlanDraft, scope, animalId, day);
    const key = freeKey(subject);
    target[key] = normalizeFreeTasks(target[key], subject, subject === "Extra" ? target.freeText : "").map((task) =>
      task.id === taskId ? { ...task, starred: !task.starred } : task
    );
    if (subject === "Extra") target.freeText = target[key][0]?.text || "";
    lkWeeklyOpenDay = day;
    render();
  };

  /* ---------- Aufgaben für Kinder, Status und Druck ---------- */

  function effectiveSubjectDay(plan, day, animalId, subject) {
    const base = plan?.days?.[day] || {};
    const override = animalId ? plan?.overrides?.[animalId]?.days?.[day] : null;
    if (!override) return base;
    const keys = taskKeys(subject);
    const hasWorkbook = normalizeIdArray(override[keys.ids] || override[keys.legacyId]).length;
    const hasFree = normalizeFreeTasks(override[keys.free], subject).length;
    return (hasWorkbook || hasFree) ? override : base;
  }

  function stripStar(text) {
    return String(text || "").replace(/^⭐\s*/, "");
  }

  weeklyPlanItemsForDay = function weeklyPlanItemsForDay9e(plan, day, animalId = "") {
    let restorePrintExtra = null;
    try {
      if (screen === "printView" && currentPrintType === "weeklyPlan" && currentWeeklyPrintOptions) {
        restorePrintExtra = currentWeeklyPrintOptions.showExtra;
        currentWeeklyPrintOptions.showExtra = true;
      }
    } catch {}

    let items = baseWeeklyPlanItemsForDay(plan, day, animalId);

    if (restorePrintExtra !== null) {
      try { currentWeeklyPrintOptions.showExtra = restorePrintExtra; } catch {}
    }

    // Das alte einzelne Extra-Feld wird ab jetzt über extraFreeTasks ausgegeben.
    items = items.filter((item) => item.field !== "Freie Aufgabe");

    const subjectIndexes = { Deutsch: 0, Mathe: 0 };
    items = items.map((item) => {
      if (!["Deutsch", "Mathe"].includes(item.subject)) return item;
      const subject = item.subject;
      const index = subjectIndexes[subject]++;
      const source = effectiveSubjectDay(plan, day, animalId, subject);
      const keys = taskKeys(subject);
      const ids = normalizeIdArray(source[keys.ids] || source[keys.legacyId]);
      const stars = boolList(source[keys.stars], ids.length, duplicateDefaults(ids));
      const starred = Boolean(stars[index]);
      return {
        ...item,
        text: `${starred ? "⭐ " : ""}${stripStar(item.text)}`,
        label: `${starred ? "⭐ " : ""}${stripStar(item.label || subject)}`,
        isExtraTask: starred
      };
    });

    ["Deutsch", "Mathe", "Extra"].forEach((subject) => {
      const source = subject === "Extra"
        ? (animalId && plan?.overrides?.[animalId]?.days?.[day] && (
            normalizeFreeTasks(plan.overrides[animalId].days[day].extraFreeTasks, "Extra", plan.overrides[animalId].days[day].freeText).length
          ) ? plan.overrides[animalId].days[day] : plan?.days?.[day] || {})
        : effectiveSubjectDay(plan, day, animalId, subject);
      const key = freeKey(subject);
      const tasks = normalizeFreeTasks(source?.[key], subject, subject === "Extra" ? source?.freeText : "");
      tasks.forEach((task) => {
        items.push({
          field: `FreieAufgabe:${subject}:${task.id}`,
          subject: subject === "Extra" ? "Extra" : subject,
          label: `${task.starred ? "⭐ " : ""}${subject === "Extra" ? "Freie Aufgabe" : subject}`,
          freeText: task.text,
          text: `${task.starred ? "⭐ " : ""}${task.text}`,
          detail: "",
          taskNumber: "",
          workbookCatalogId: "",
          catalogItem: null,
          isExtraTask: task.starred,
          isFreeTask: true
        });
      });
    });

    try {
      if (screen === "printView" && currentPrintType === "weeklyPlan" && currentWeeklyPrintOptions?.showExtra === false) {
        items = items.filter((item) => !item.isExtraTask);
      }
    } catch {}

    // Alte Wochenpläne können dieselbe Heftaufgabe gleichzeitig im früheren
    // Einzel-Feld und im neuen Mehrfach-Feld enthalten. Das führte dazu,
    // dass eine Aufgabe im Kinderplan/Druck doppelt erschien.
    // Bewusst doppelt gewählte Aufgaben bleiben erhalten, sobald sich
    // Sternstatus, Nummer oder Freitext unterscheiden.
    const seenWeeklyItems = new Set();
    items = items.filter((item) => {
      const subject = stripStar(item?.subject || item?.label || "").trim().toLowerCase();
      const catalogId = String(item?.catalogItem?.id || item?.workbookCatalogId || "");
      const taskNumber = String(item?.taskNumber || "").trim();
      const freeText = String(item?.freeText || "").trim();
      const text = stripStar(item?.text || "").trim();
      const star = item?.isExtraTask === true ? "star" : "normal";
      const signature = [subject, catalogId, taskNumber, freeText, text, star].join("|");
      if (seenWeeklyItems.has(signature)) return false;
      seenWeeklyItems.add(signature);
      return true;
    });

    return items;
  };

  /* ---------- Kindgerechte Wochenansicht ---------- */

  function todayGerman() {
    const names = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
    const name = names[new Date().getDay()];
    return WEEK_DAYS.includes(name) ? name : "Montag";
  }

  window.setLKChildWeekDay = function setLKChildWeekDay(day) {
    if (WEEK_DAYS.includes(day)) lkChildWeekDay = day;
    render();
  };

  window.setLKChildWeekPlan = function setLKChildWeekPlan(planId) {
    lkChildWeekPlanId = planId || "";
    render();
  };

  if (typeof renderChildWeek === "function") {
    renderChildWeek = function renderChildWeek9e() {
      const animal = selectedAnimal();
      const plans = animal ? weeklyPlansForAnimal(animal.id) : [];
      const current = plans.find((plan) => weeklyPlanIsCurrent(plan)) || plans[0] || null;
      const selected = plans.find((plan) => plan.id === lkChildWeekPlanId) || current;
      if (selected) lkChildWeekPlanId = selected.id;
      if (!lkChildWeekDay) lkChildWeekDay = todayGerman();

      return `
        <section class="step-wrap child-week-wrap lk-child-week-wrap">
          ${renderBackButton("childSubject")}
          <div class="lk-child-week-hero">
            <div class="lk-child-week-icon">🗓️</div>
            <div>
              <h2 class="child-title">Meine Woche</h2>
              <p>${animal ? `${escapeHtml(animal.tierEmoji)} ${escapeHtml(animal.tierName)} · ` : ""}${selected ? escapeHtml(weeklyPlanPeriodLabel(selected)) : "Dein Wochenplan"}</p>
            </div>
            ${selected && weeklyPlanIsCurrent(selected) ? `<span class="lk-current-pill">Diese Woche</span>` : ""}
          </div>

          ${plans.length > 1 ? `
            <label class="lk-child-plan-select">Wochenplan
              <select class="select-input" onchange="setLKChildWeekPlan(this.value)">
                ${plans.map((plan) => `<option value="${escapeAttribute(plan.id)}" ${selected?.id === plan.id ? "selected" : ""}>${escapeHtml(plan.title)} · ${escapeHtml(weeklyPlanPeriodLabel(plan))}</option>`).join("")}
              </select>
            </label>
          ` : ""}

          ${selected ? renderChildWeeklyPlan(selected, animal) : `<div class="empty lk-child-empty-week">Für dich ist noch kein Wochenplan eingetragen.</div>`}
        </section>
      `;
    };
  }

  if (typeof renderChildWeeklyPlan === "function") {
    renderChildWeeklyPlan = function renderChildWeeklyPlan9e(plan, animal) {
      const selectedDay = WEEK_DAYS.includes(lkChildWeekDay) ? lkChildWeekDay : todayGerman();
      const items = weeklyPlanItemsForDay(plan, selectedDay, animal.id);
      const actualToday = todayGerman();
      return `
        <article class="lk-child-week-plan">
          <nav class="lk-child-day-tabs" aria-label="Wochentage">
            ${WEEK_DAYS.map((day) => `
              <button class="lk-child-day-tab ${selectedDay === day ? "active" : ""} ${actualToday === day ? "today" : ""}" type="button" onclick="setLKChildWeekDay('${escapeAttribute(day)}')">
                <span class="lk-day-long">${escapeHtml(day)}</span>
                <span class="lk-day-short">${escapeHtml(day.slice(0,2))}</span>
                ${actualToday === day ? `<i></i>` : ""}
              </button>
            `).join("")}
          </nav>

          <section class="lk-child-day-panel">
            <div class="lk-child-day-heading">
              <div>
                <span>${actualToday === selectedDay ? "Heute" : "Dein Tag"}</span>
                <h3>${escapeHtml(selectedDay)}</h3>
              </div>
              <strong>${items.length} ${items.length === 1 ? "Aufgabe" : "Aufgaben"}</strong>
            </div>
            <div class="lk-child-task-list">
              ${items.length
                ? items.map((item) => renderChildWeeklyPlanItem(plan, animal, selectedDay, item)).join("")
                : `<div class="lk-child-no-tasks"><span>🎉</span><strong>Heute ist nichts eingetragen.</strong></div>`}
            </div>
          </section>
        </article>
      `;
    };
  }

  if (typeof renderChildWeeklyPlanItem === "function") {
    renderChildWeeklyPlanItem = function renderChildWeeklyPlanItem9e(plan, animal, day, item) {
      const status = normalizeSimpleWorkStatus(weeklyPlanItemStatus(plan.id, animal.id, day, item.field));
      const done = status === "fertig";
      const partial = status === "teilweise";
      const subject = item.subject === "Deutsch" ? "Deutsch" : item.subject === "Mathe" ? "Mathe" : "Freie Aufgabe";
      const icon = item.subject === "Deutsch" ? "📘" : item.subject === "Mathe" ? "🔢" : "✏️";
      let mainText = stripStar(item.text || "");
      let detail = item.detail || "";
      if (item.catalogItem) {
        const workbook = item.catalogItem.workbook || subject;
        let page = "";
        try { page = pageRangeLabel(item.catalogItem); } catch {}
        mainText = [workbook, page, item.taskNumber ? `Nr. ${item.taskNumber}` : ""].filter(Boolean).join(" · ");
        detail = item.catalogItem.title || item.catalogItem.area || detail || "";
      }
      return `
        <article class="lk-child-task ${done ? "done" : partial ? "partial" : ""} ${item.isExtraTask ? "starred" : ""}">
          <div class="lk-child-task-icon">${icon}</div>
          <div class="lk-child-task-body">
            <div class="lk-child-task-meta">
              <strong>${escapeHtml(subject)}</strong>
              ${item.isExtraTask ? `<span class="lk-child-star-badge">⭐ Zusatz</span>` : ""}
              <span class="lk-child-status ${done ? "done" : partial ? "partial" : "open"}">${done ? "✓ Fertig" : partial ? "● Angefangen" : "○ Offen"}</span>
            </div>
            <h4>${escapeHtml(mainText)}</h4>
            ${detail ? `<p>${escapeHtml(detail)}</p>` : ""}
          </div>
          <div class="lk-child-task-actions">
            ${status === "offen" ? `<button class="secondary small-button" type="button" onclick="updateChildWeeklyStatus('${escapeAttribute(plan.id)}','${escapeAttribute(day)}','${escapeAttribute(item.field)}','teilweise')">Ich bin dran</button>` : ""}
            ${!done ? `<button class="primary small-button" type="button" onclick="updateChildWeeklyStatus('${escapeAttribute(plan.id)}','${escapeAttribute(day)}','${escapeAttribute(item.field)}','fertig')">Fertig ✓</button>` : `<span class="lk-child-done-check">✓</span>`}
          </div>
        </article>
      `;
    };
  }

  /* ---------- Rico Schnabel 2 – Rechtschreiben ---------- */

  function ricoPageRows() {
    const rows = [];
    RICO_ROWS.forEach((row, index) => {
      const [start, title, area] = row;
      const nextStart = RICO_ROWS[index + 1]?.[0] || 113;
      const end = Math.max(start, nextStart - 1);
      for (let page = start; page <= end; page += 1) {
        rows.push({ page, title, area });
      }
    });
    return rows;
  }

  function activeClassIsGrade2() {
    try {
      const year = activeClassSchoolYear(state.activeClassId);
      if (String(year) === "2") return true;
    } catch {}
    const active = (state.classes || []).find((item) => item.id === state.activeClassId);
    return /^\s*2\b|klasse\s*2/i.test(String(active?.name || ""));
  }

  function ricoExistsForClass(classId = state.activeClassId) {
    return (state.workbookCatalog || []).some((item) => item.classId === classId && item.workbook === RICO_WORKBOOK && item.active !== false);
  }

  async function ensureRicoSchnabel2(force = false, rerender = false) {
    if (!state?.setupComplete || !state.activeClassId) return 0;
    if (!force && !activeClassIsGrade2()) return 0;
    const classId = state.activeClassId;
    const existing = state.workbookCatalog || [];
    const pages = ricoPageRows();
    const additions = [];
    const timestamp = nowIso();

    pages.forEach(({ page, title, area }) => {
      const covered = existing.some((item) => {
        if (item.classId !== classId || item.workbook !== RICO_WORKBOOK || item.active === false) return false;
        const start = Number(item.startPage || item.page || 0);
        const end = Number(item.endPage || item.pageEnd || start || 0);
        return start && page >= start && page <= end;
      });
      if (covered) return;
      const pageLabel = String(page);
      additions.push({
        id: makeId(),
        classId,
        catalogKey: `rico-schnabel-2-rechtschreiben|${page}`,
        subject: "Deutsch",
        schoolYear: "2",
        workbook: RICO_WORKBOOK,
        part: "Rechtschreiben",
        area,
        category: "Rechtschreiben",
        page,
        startPage: page,
        pageEnd: "",
        endPage: page,
        pageLabel,
        displayPages: typeof formatCatalogDisplayPages === "function" ? formatCatalogDisplayPages(pageLabel) : `S. ${page}`,
        pageRangeMode: "explicit",
        title,
        competence: "Rechtschreiben",
        note: "",
        active: true,
        createdAt: timestamp,
        updatedAt: timestamp
      });
    });

    if (!additions.length) return 0;
    await persist({ ...state, workbookCatalog: [...existing, ...additions] });
    if (rerender) render();
    return additions.length;
  }

  window.addRicoSchnabel2ToActiveClass = async function addRicoSchnabel2ToActiveClass() {
    const count = await ensureRicoSchnabel2(true, false);
    globalMessage = count
      ? `${RICO_WORKBOOK} wurde mit ${count} Seiten ergänzt.`
      : `${RICO_WORKBOOK} ist bereits vollständig vorhanden.`;
    render();
  };

  if (baseRenderWorkbookCatalogManager) {
    renderWorkbookCatalogManager = function renderWorkbookCatalogManager9e() {
      let html = baseRenderWorkbookCatalogManager();
      const exists = ricoExistsForClass();
      const oldButton = `<button class="primary" type="button" onclick="lkOpenWorkbookAdd()">+ Neues Heft</button>`;
      const newButtons = `
        <div class="lk-workbook-head-actions">
          <button class="secondary" type="button" onclick="addRicoSchnabel2ToActiveClass()" ${exists ? "disabled" : ""}>${exists ? "✓ Rico Schnabel 2 vorhanden" : "+ Rico Schnabel 2 – Rechtschreiben"}</button>
          ${oldButton}
        </div>`;
      if (html.includes(oldButton)) html = html.replace(oldButton, newButtons);
      return html;
    };
  }

  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => ensureRicoSchnabel2(false, false).catch((error) => {
      console.warn("Rico Schnabel 2 konnte nicht automatisch ergänzt werden.", error);
    }), 1400);
  });

  /* ---------- Gestaltung ---------- */
  const style = document.createElement("style");
  style.id = "lk-weekly-plan-9e-style";
  style.textContent = `
    .lk-weekly-day-accordion { display:grid; gap:10px; }
    .lk-weekly-day-details { padding:0 !important; overflow:hidden; }
    .lk-weekly-day-summary {
      list-style:none; cursor:pointer; display:flex; justify-content:space-between; align-items:center;
      gap:12px; padding:14px 16px; background:rgba(255,255,255,.76);
    }
    .lk-weekly-day-summary::-webkit-details-marker { display:none; }
    .lk-weekly-day-summary strong { font-size:1.05rem; }
    .lk-weekly-day-summary span { font-size:.8rem; opacity:.65; }
    .lk-weekly-day-details[open] .lk-weekly-day-summary { background:rgba(77,111,220,.07); }
    .lk-weekly-day-content {
      display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; padding:12px;
      border-top:1px solid rgba(0,0,0,.06);
    }
    .lk-editor-subject {
      min-width:0; padding:12px; border:1px solid rgba(0,0,0,.07); border-radius:16px; background:#fff;
    }
    .lk-editor-subject.sonstiges { grid-column:1 / -1; }
    .lk-editor-subject-head { display:flex; align-items:center; gap:7px; margin-bottom:9px; }
    .lk-editor-subject-head span { font-size:1.15rem; }
    .lk-weekly-pick-cell .weekly-selected-task {
      grid-template-columns:auto minmax(0,1fr) auto auto;
    }
    .lk-star-toggle {
      width:34px; height:34px; padding:0; border:1px solid rgba(0,0,0,.1); border-radius:10px;
      background:#fff; display:grid; place-items:center; cursor:pointer; font-size:1.12rem;
    }
    .lk-star-toggle.active { background:#fff3bd; border-color:#e2b73f; }
    .lk-no-book-task { opacity:.58; font-size:.85rem; }
    .lk-free-task-box { margin-top:10px; padding-top:9px; border-top:1px dashed rgba(0,0,0,.12); }
    .lk-free-task-head { display:flex; justify-content:space-between; gap:8px; align-items:center; margin-bottom:7px; }
    .lk-free-task-head > span { font-size:.78rem; font-weight:750; opacity:.7; }
    .lk-free-task-list { display:grid; gap:7px; }
    .lk-free-task-row {
      display:grid; grid-template-columns:auto minmax(0,1fr) auto; gap:7px; align-items:center;
      padding:7px; border-radius:12px; background:rgba(47,111,145,.045);
    }
    .lk-free-task-row.is-extra { background:#fff6d2; }
    .lk-workbook-head-actions { display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end; }

    .lk-child-week-wrap { max-width:980px; margin-inline:auto; width:100%; min-width:0; }
    .lk-child-week-hero {
      display:grid; grid-template-columns:auto minmax(0,1fr) auto; gap:12px; align-items:center;
      padding:16px 18px; border-radius:22px; background:linear-gradient(135deg,#e8f5ff,#fff7d9);
      margin-bottom:12px; overflow:hidden;
    }
    .lk-child-week-icon { width:52px; height:52px; border-radius:16px; display:grid; place-items:center; background:#fff; font-size:1.55rem; }
    .lk-child-week-hero .child-title { margin:0; }
    .lk-child-week-hero p { margin:4px 0 0; opacity:.72; }
    .lk-current-pill { padding:6px 10px; border-radius:999px; background:#fff; font-size:.78rem; font-weight:800; white-space:nowrap; }
    .lk-child-plan-select { display:grid; gap:5px; margin:0 0 12px; font-size:.82rem; font-weight:700; }
    .lk-child-week-plan { width:100%; min-width:0; overflow:hidden; }
    .lk-child-day-tabs {
      display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:7px; margin-bottom:10px;
    }
    .lk-child-day-tab {
      position:relative; min-width:0; padding:10px 5px; border:1px solid rgba(47,83,170,.15); border-radius:14px;
      background:#fff; color:inherit; font:inherit; font-weight:750; cursor:pointer;
    }
    .lk-child-day-tab.active { background:#536fe0; color:#fff; border-color:#536fe0; box-shadow:0 5px 12px rgba(83,111,224,.2); }
    .lk-child-day-tab i { position:absolute; width:6px; height:6px; border-radius:50%; background:#efb633; right:7px; top:6px; }
    .lk-day-short { display:none; }
    .lk-child-day-panel { padding:14px; border:1px solid rgba(47,83,170,.11); border-radius:20px; background:#fff; min-width:0; }
    .lk-child-day-heading { display:flex; justify-content:space-between; align-items:end; gap:10px; margin-bottom:12px; }
    .lk-child-day-heading span { font-size:.76rem; font-weight:750; opacity:.55; text-transform:uppercase; letter-spacing:.06em; }
    .lk-child-day-heading h3 { margin:2px 0 0; font-size:1.35rem; }
    .lk-child-day-heading > strong { padding:5px 9px; border-radius:999px; background:rgba(47,111,145,.07); font-size:.78rem; white-space:nowrap; }
    .lk-child-task-list { display:grid; gap:9px; min-width:0; }
    .lk-child-task {
      width:100%; min-width:0; box-sizing:border-box; display:grid;
      grid-template-columns:auto minmax(0,1fr) auto; gap:11px; align-items:center;
      padding:12px; border:1px solid rgba(0,0,0,.07); border-radius:17px; background:#fbfcfe;
    }
    .lk-child-task.starred { background:#fff9df; border-color:rgba(218,173,45,.25); }
    .lk-child-task.done { background:#eef9f0; opacity:.86; }
    .lk-child-task.partial { background:#f4f7ff; }
    .lk-child-task-icon { width:43px; height:43px; display:grid; place-items:center; border-radius:13px; background:#fff; font-size:1.25rem; }
    .lk-child-task-body { min-width:0; }
    .lk-child-task-meta { display:flex; gap:6px; align-items:center; flex-wrap:wrap; }
    .lk-child-task-meta > strong { font-size:.78rem; }
    .lk-child-star-badge { padding:3px 6px; border-radius:999px; background:#ffe99b; font-size:.7rem; font-weight:800; }
    .lk-child-status { margin-left:auto; font-size:.7rem; font-weight:750; }
    .lk-child-status.done { color:#337549; }
    .lk-child-status.partial { color:#5067b0; }
    .lk-child-status.open { opacity:.55; }
    .lk-child-task-body h4 { margin:5px 0 0; font-size:1rem; line-height:1.3; overflow-wrap:anywhere; }
    .lk-child-task-body p { margin:4px 0 0; font-size:.79rem; opacity:.65; line-height:1.3; }
    .lk-child-task-actions { display:flex; gap:6px; align-items:center; flex-wrap:wrap; justify-content:flex-end; }
    .lk-child-done-check { width:34px; height:34px; border-radius:50%; display:grid; place-items:center; background:#53a869; color:#fff; font-weight:900; }
    .lk-child-no-tasks { display:grid; justify-items:center; gap:6px; padding:24px; text-align:center; background:#f7fbf7; border-radius:16px; }
    .lk-child-no-tasks span { font-size:2rem; }
    .lk-child-empty-week { padding:24px; border-radius:18px; }

    /* Alte breite Wochenplan-Regeln neutralisieren. */
    .lk-child-week-wrap .weekly-child-plan,
    .lk-child-week-wrap .weekly-child-days,
    .lk-child-week-wrap .weekly-day-card { min-width:0 !important; max-width:100% !important; }

    @media (max-width:820px) {
      .lk-weekly-day-content { grid-template-columns:1fr; }
      .lk-editor-subject.sonstiges { grid-column:auto; }
      .lk-weekly-pick-cell .weekly-selected-task { grid-template-columns:auto minmax(0,1fr) auto; }
      .lk-weekly-pick-cell .weekly-task-number-label { grid-column:2; }
      .lk-workbook-head-actions { justify-content:flex-start; }
    }
    @media (max-width:620px) {
      .lk-child-week-hero { grid-template-columns:auto minmax(0,1fr); padding:13px; }
      .lk-current-pill { grid-column:2; justify-self:start; }
      .lk-day-long { display:none; }
      .lk-day-short { display:inline; }
      .lk-child-day-tab { padding:10px 3px; }
      .lk-child-day-panel { padding:10px; }
      .lk-child-task { grid-template-columns:auto minmax(0,1fr); align-items:start; }
      .lk-child-task-actions { grid-column:1 / -1; justify-content:flex-end; }
      .lk-child-task-actions button { min-height:38px; }
      .lk-child-status { margin-left:0; }
      .lk-free-task-row { grid-template-columns:auto minmax(0,1fr) auto; }
    }
  `;
  if (!document.getElementById(style.id)) document.head.appendChild(style);

  window.LKWeeklyPlan9e = {
    RICO_WORKBOOK,
    RICO_ROWS,
    ricoPageRows,
    normalizeFreeTasks,
    duplicateDefaults,
    boolList,
    numberList
  };
})();
