/* Sichere Autospeicherung fuer den Wochenplan-Editor.
 * - jede inhaltliche Aenderung wird lokal persistiert
 * - Text-Eingaben werden kurz entprellt
 * - vor Plan-/Kind-/Ansichtswechseln wird ein ausstehender Stand zwingend geschrieben
 * - Speicherfehler werden an den aufrufenden Wechsel weitergegeben
 */
(() => {
  const DEBOUNCE_MS = 350;
  let timer = null;
  let chain = Promise.resolve();
  let pendingSnapshot = null;
  let pendingReason = "";
  let pendingSeq = 0;
  let requestedSeq = 0;
  let savedSeq = 0;
  let waiters = [];
  let saveSeq = 0;

  function clone(value) {
    try { return JSON.parse(JSON.stringify(value)); } catch { return value; }
  }

  function currentForm() {
    return document.querySelector(".weekly-plan-form");
  }

  function fingerprintPlan(plan) {
    const copy = { ...plan };
    delete copy.updatedAt;
    delete copy.createdAt;
    try { return JSON.stringify(copy); } catch { return ""; }
  }

  function setIndicator(text, mode = "saved") {
    const el = document.getElementById("weeklyAutosaveStatus");
    if (!el) return;
    el.textContent = text;
    el.dataset.mode = mode;
  }

  function planFromDraft(draft) {
    const requestedId = draft?.id || document.querySelector("#weeklyPlanId")?.value || "";
    const existing = (state.weeklyPlans || []).find((plan) => plan.id === requestedId);
    const timestamp = typeof nowIso === "function" ? nowIso() : new Date().toISOString();
    const id = existing?.id || requestedId || (typeof makeId === "function" ? makeId() : `weekly-${Date.now()}`);
    return {
      existing,
      nextPlan: {
        ...(existing || {}),
        id,
        classId: state.activeClassId,
        title: draft?.title || "Wochenplan",
        weekLabel: draft?.weekLabel || "",
        validFrom: draft?.validFrom || "",
        validTo: draft?.validTo || "",
        note: draft?.note || "",
        planningMode: draft?.planningMode === "week" ? "week" : "days",
        deutschSectionOrder: typeof window.lkNormalizeDeutschSectionOrder === "function"
          ? window.lkNormalizeDeutschSectionOrder(draft?.deutschSectionOrder)
          : (draft?.deutschSectionOrder || ["Deutsch", "Lesezeit", "Lernwörter"]),
        assignmentMode: draft?.assignmentMode || "all",
        animalIds: Array.isArray(draft?.animalIds) ? draft.animalIds : [],
        progressMode: draft?.progressMode || "confirm",
        autoCreateEntries: draft?.progressMode === "auto",
        days: clone(draft?.days || {}),
        overrides: clone(draft?.overrides || {}),
        active: true,
        createdAt: existing?.createdAt || timestamp,
        updatedAt: timestamp
      }
    };
  }

  async function persistSnapshot(snapshot, reason = "Aenderung") {
    if (!snapshot || typeof persist !== "function") return;
    const { nextPlan, existing } = planFromDraft(snapshot);
    const fp = fingerprintPlan(nextPlan);
    const existingFp = existing ? fingerprintPlan(existing) : "";
    if (existing && fp === existingFp) {
      setIndicator("✓ automatisch gespeichert", "saved");
      return;
    }

    // Die ID sofort im Entwurf festhalten, damit schnelle Folgeaktionen nicht
    // versehentlich mehrere Plaene anlegen.
    snapshot.id = nextPlan.id;
    weeklyPlanEditorId = nextPlan.id;
    weeklyPlanDraft = { ...snapshot, id: nextPlan.id };
    const hidden = document.querySelector("#weeklyPlanId");
    if (hidden) hidden.value = nextPlan.id;

    const localSaveSeq = ++saveSeq;
    setIndicator("Speichert …", "saving");
    const weeklyPlans = existing
      ? (state.weeklyPlans || []).map((plan) => plan.id === existing.id ? nextPlan : plan)
      : [...(state.weeklyPlans || []), nextPlan];

    await persist({ ...state, weeklyPlans });

    const stored = (state.weeklyPlans || []).find((plan) => plan.id === nextPlan.id);
    if (!stored || fingerprintPlan(stored) !== fp) {
      throw new Error(`Wochenplan konnte nach ${reason} nicht identisch gespeichert werden.`);
    }
    if (localSaveSeq === saveSeq) setIndicator("✓ automatisch gespeichert", "saved");
  }

  function snapshotFromDom() {
    if (!currentForm() || typeof collectWeeklyPlanDraftFromDom !== "function") return null;
    try { return clone(collectWeeklyPlanDraftFromDom()); }
    catch (error) {
      console.warn("Wochenplan-Autospeicherung: Entwurf konnte nicht gelesen werden.", error);
      setIndicator("Speichern fehlgeschlagen", "error");
      return null;
    }
  }

  function settleWaitersThrough(seq, error = null) {
    const keep = [];
    waiters.forEach((waiter) => {
      if (waiter.seq <= seq) {
        if (error) waiter.reject(error);
        else waiter.resolve();
      } else {
        keep.push(waiter);
      }
    });
    waiters = keep;
  }

  function executePending() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    const snapshot = pendingSnapshot;
    const reason = pendingReason || "Aenderung";
    const seq = pendingSeq;
    pendingSnapshot = null;
    pendingReason = "";
    pendingSeq = 0;
    if (!snapshot) return chain;

    const operation = chain.then(() => persistSnapshot(snapshot, reason));
    chain = operation.catch(() => {});
    operation.then(
      () => {
        savedSeq = Math.max(savedSeq, seq);
        settleWaitersThrough(seq);
      },
      (error) => {
        console.error("Wochenplan-Autospeicherung fehlgeschlagen.", error);
        setIndicator("Speichern fehlgeschlagen", "error");
        settleWaitersThrough(seq, error);
      }
    );
    return operation;
  }

  function enqueue(snapshot, reason = "Aenderung", delay = 0) {
    if (!snapshot) return chain;
    const seq = ++requestedSeq;
    pendingSnapshot = clone(snapshot);
    pendingReason = reason;
    pendingSeq = seq;
    if (timer) clearTimeout(timer);

    const promise = new Promise((resolve, reject) => waiters.push({ seq, resolve, reject }));
    if (delay <= 0) executePending();
    else timer = setTimeout(executePending, delay);
    return promise;
  }

  window.lkAutoSaveWeeklyPlan = function lkAutoSaveWeeklyPlan(options = {}) {
    const snapshot = options.snapshot ? clone(options.snapshot) : snapshotFromDom() || clone(weeklyPlanDraft);
    return enqueue(snapshot, options.reason || "Aenderung", options.immediate ? 0 : DEBOUNCE_MS);
  };

  window.lkFlushWeeklyPlanAutosave = async function lkFlushWeeklyPlanAutosave() {
    const snapshot = snapshotFromDom() || clone(weeklyPlanDraft);
    if (snapshot) {
      // Eine frische Momentaufnahme als eigener Auftrag garantiert, dass alles,
      // was unmittelbar vor dem Wechsel noch im DOM steht, wirklich persistiert ist.
      await enqueue(snapshot, "Wechsel", 0);
    } else if (pendingSnapshot) {
      await executePending();
    }
    await chain;
    if (savedSeq < requestedSeq && pendingSnapshot) {
      await executePending();
      await chain;
    }
  };

  document.addEventListener("input", (event) => {
    if (!event.target?.closest?.(".weekly-plan-form")) return;
    window.lkAutoSaveWeeklyPlan({ reason: "Eingabe" }).catch(() => {});
  }, true);

  document.addEventListener("change", (event) => {
    if (!event.target?.closest?.(".weekly-plan-form")) return;
    window.lkAutoSaveWeeklyPlan({ reason: "Auswahl", immediate: true }).catch(() => {});
  }, true);

  // Funktionen, die ihren Entwurf direkt veraendern. Nach jeder solchen Aktion
  // wird sofort persistiert. Wenn die Funktion selbst asynchron ist, erst danach.
  const afterMutation = [
    "selectWeeklyCatalogItem", "clearWeeklyPick", "clearWeeklyOverride",
    "moveDeutschSectionOrder", "setWeeklyPlanningMode", "toggleWeeklyTaskStar",
    "moveWeeklyTaskOccurrence", "moveWeeklyFreeTask", "removeWeeklyPickOccurrence",
    "addWeeklyFreeTask", "removeWeeklyFreeTask", "toggleWeeklyFreeTaskStar",
    "setWeeklyFreeTaskSymbol"
  ];
  afterMutation.forEach((name) => {
    const original = window[name];
    if (typeof original !== "function" || original.__lkAutosaveWrapped) return;
    const wrapped = function(...args) {
      const result = original.apply(this, args);
      const save = () => window.lkAutoSaveWeeklyPlan({ snapshot: clone(weeklyPlanDraft), reason: name, immediate: true }).catch(() => {});
      if (result && typeof result.then === "function") return result.finally(save);
      save();
      return result;
    };
    wrapped.__lkAutosaveWrapped = true;
    window[name] = wrapped;
  });

  if (typeof window.setWeeklySocialForm === "function") {
    const original = window.setWeeklySocialForm;
    window.setWeeklySocialForm = function(...args) {
      const result = original.apply(this, args);
      window.lkAutoSaveWeeklyPlan({ reason: "Sozialform", immediate: true }).catch(() => {});
      return result;
    };
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && currentForm()) window.lkFlushWeeklyPlanAutosave().catch(() => {});
  });
  window.addEventListener("pagehide", () => {
    if (currentForm()) window.lkFlushWeeklyPlanAutosave().catch(() => {});
  });
})();
