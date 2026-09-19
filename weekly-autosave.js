/* V13: Sichere Autospeicherung fuer den Wochenplan-Editor.
 * Jede inhaltliche Aenderung wird ohne Neurendern lokal persistiert.
 */
(() => {
  const DEBOUNCE_MS = 220;
  let timer = null;
  let chain = Promise.resolve();
  let saveSeq = 0;
  let lastSavedFingerprint = "";

  function clone(value) {
    try { return JSON.parse(JSON.stringify(value)); } catch { return value; }
  }

  function currentForm() {
    return document.querySelector('.weekly-plan-form');
  }

  function fingerprintPlan(plan) {
    const copy = { ...plan };
    delete copy.updatedAt;
    delete copy.createdAt;
    try { return JSON.stringify(copy); } catch { return String(Date.now()); }
  }

  function setIndicator(text, mode = "saved") {
    const el = document.getElementById('weeklyAutosaveStatus');
    if (!el) return;
    el.textContent = text;
    el.dataset.mode = mode;
  }

  function planFromDraft(draft) {
    const requestedId = draft?.id || document.querySelector('#weeklyPlanId')?.value || '';
    const existing = (state.weeklyPlans || []).find((plan) => plan.id === requestedId);
    const timestamp = typeof nowIso === 'function' ? nowIso() : new Date().toISOString();
    const id = existing?.id || requestedId || (typeof makeId === 'function' ? makeId() : `weekly-${Date.now()}`);
    const nextPlan = {
      ...(existing || {}),
      id,
      classId: state.activeClassId,
      title: draft?.title || 'Wochenplan',
      weekLabel: draft?.weekLabel || '',
      validFrom: draft?.validFrom || '',
      validTo: draft?.validTo || '',
      note: draft?.note || '',
      planningMode: draft?.planningMode === 'week' ? 'week' : 'days',
      deutschSectionOrder: typeof window.lkNormalizeDeutschSectionOrder === 'function'
        ? window.lkNormalizeDeutschSectionOrder(draft?.deutschSectionOrder)
        : (draft?.deutschSectionOrder || ['Deutsch', 'Lesezeit', 'Lernwörter']),
      assignmentMode: draft?.assignmentMode || 'all',
      animalIds: Array.isArray(draft?.animalIds) ? draft.animalIds : [],
      progressMode: draft?.progressMode || 'confirm',
      autoCreateEntries: draft?.progressMode === 'auto',
      days: clone(draft?.days || {}),
      overrides: clone(draft?.overrides || {}),
      active: true,
      createdAt: existing?.createdAt || timestamp,
      updatedAt: timestamp
    };
    return { nextPlan, existing };
  }

  async function persistSnapshot(snapshot, reason = 'Aenderung') {
    if (!snapshot || typeof persist !== 'function') return;
    const { nextPlan, existing } = planFromDraft(snapshot);
    const fp = fingerprintPlan(nextPlan);
    const existingFp = existing ? fingerprintPlan(existing) : '';
    if (fp === existingFp || fp === lastSavedFingerprint) {
      setIndicator('✓ automatisch gespeichert', 'saved');
      return;
    }

    // Die einmal erzeugte ID sofort auch im Editor/Draft festhalten.
    snapshot.id = nextPlan.id;
    weeklyPlanEditorId = nextPlan.id;
    weeklyPlanDraft = { ...snapshot, id: nextPlan.id };
    const hidden = document.querySelector('#weeklyPlanId');
    if (hidden) hidden.value = nextPlan.id;

    const seq = ++saveSeq;
    setIndicator('Speichert …', 'saving');
    const weeklyPlans = existing
      ? (state.weeklyPlans || []).map((plan) => plan.id === existing.id ? nextPlan : plan)
      : [...(state.weeklyPlans || []), nextPlan];

    // Den neuen Stand sofort auch im Arbeitsspeicher setzen. So kann ein
    // unmittelbar anschließender Plan-/Kindwechsel niemals noch den alten
    // state.weeklyPlans-Stand rendern, während IndexedDB noch schreibt.
    const nextState = { ...state, weeklyPlans };
    state = nextState;
    await persist(nextState);

    const stored = (state.weeklyPlans || []).find((plan) => plan.id === nextPlan.id);
    if (!stored || fingerprintPlan(stored) !== fp) {
      throw new Error('Wochenplan wurde nach dem Speichern nicht identisch zurückgelesen.');
    }
    lastSavedFingerprint = fp;
    if (seq === saveSeq) setIndicator('✓ automatisch gespeichert', 'saved');
  }

  function snapshotFromDom() {
    if (!currentForm() || typeof collectWeeklyPlanDraftFromDom !== 'function') return null;
    try { return clone(collectWeeklyPlanDraftFromDom()); }
    catch (error) {
      console.warn('Wochenplan-Autospeicherung: Entwurf konnte nicht gelesen werden.', error);
      setIndicator('Speichern fehlgeschlagen', 'error');
      return null;
    }
  }

  function enqueue(snapshot, reason = 'Aenderung', delay = 0) {
    if (!snapshot) return Promise.resolve();
    if (timer) clearTimeout(timer);
    return new Promise((resolve) => {
      timer = setTimeout(() => {
        timer = null;
        chain = chain
          .then(() => persistSnapshot(snapshot, reason))
          .catch((error) => {
            console.error('Wochenplan-Autospeicherung fehlgeschlagen.', error);
            setIndicator('Speichern fehlgeschlagen', 'error');
          })
          .finally(resolve);
      }, delay);
    });
  }

  window.lkAutoSaveWeeklyPlan = function lkAutoSaveWeeklyPlan(options = {}) {
    const snapshot = options.snapshot ? clone(options.snapshot) : snapshotFromDom() || clone(weeklyPlanDraft);
    return enqueue(snapshot, options.reason || 'Aenderung', options.immediate ? 0 : DEBOUNCE_MS);
  };

  window.lkFlushWeeklyPlanAutosave = function lkFlushWeeklyPlanAutosave() {
    const snapshot = snapshotFromDom() || clone(weeklyPlanDraft);
    return enqueue(snapshot, 'Wechsel', 0);
  };

  // Direkte Formularaenderungen: Tippen leicht entprellt, echte Auswahl sofort.
  document.addEventListener('input', (event) => {
    if (!event.target?.closest?.('.weekly-plan-form')) return;
    window.lkAutoSaveWeeklyPlan({ reason: 'Eingabe' });
  }, true);
  document.addEventListener('change', (event) => {
    if (!event.target?.closest?.('.weekly-plan-form')) return;
    window.lkAutoSaveWeeklyPlan({ reason: 'Auswahl', immediate: true });
  }, true);

  // Funktionen, die ihren Entwurf im Speicher veraendern und danach rendern.
  const afterMutation = [
    'selectWeeklyCatalogItem', 'clearWeeklyPick', 'clearWeeklyOverride',
    'moveDeutschSectionOrder', 'setWeeklyPlanningMode', 'toggleWeeklyTaskStar',
    'moveWeeklyTaskOccurrence', 'moveWeeklyFreeTask', 'removeWeeklyPickOccurrence',
    'addWeeklyFreeTask', 'removeWeeklyFreeTask', 'toggleWeeklyFreeTaskStar'
  ];
  afterMutation.forEach((name) => {
    const original = window[name];
    if (typeof original !== 'function' || original.__lkAutosaveWrapped) return;
    const wrapped = function(...args) {
      const result = original.apply(this, args);
      const save = () => window.lkAutoSaveWeeklyPlan({ snapshot: clone(weeklyPlanDraft), reason: name, immediate: true });
      if (result && typeof result.then === 'function') return result.finally(save);
      save();
      return result;
    };
    wrapped.__lkAutosaveWrapped = true;
    window[name] = wrapped;
  });

  // Sozialform veraendert nur das DOM und rendert nicht neu.
  if (typeof window.setWeeklySocialForm === 'function') {
    const original = window.setWeeklySocialForm;
    window.setWeeklySocialForm = function(...args) {
      const result = original.apply(this, args);
      window.lkAutoSaveWeeklyPlan({ reason: 'Sozialform', immediate: true });
      return result;
    };
  }

  // Plan-/Kindwechsel speichern jetzt direkt in app.js und warten dort
  // auf den erfolgreichen Schreibvorgang. Keine nachträglichen Wrapper mehr:
  // dadurch gibt es keine Rennen zwischen Rendern und IndexedDB-Speicherung.

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && currentForm()) window.lkFlushWeeklyPlanAutosave();
  });
  window.addEventListener('pagehide', () => {
    if (currentForm()) window.lkFlushWeeklyPlanAutosave();
  });
})();
