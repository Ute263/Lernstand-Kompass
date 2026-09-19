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

})();
