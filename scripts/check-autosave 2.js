const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
function assert(condition, message) { if (!condition) throw new Error(message); }

let currentDraft = null;
let idValue = '';
const statusEl = { textContent: '', dataset: {} };
const listeners = {};
const form = {};
const document = {
  querySelector(selector) {
    if (selector === '.weekly-plan-form') return form;
    if (selector === '#weeklyPlanId') return { get value() { return idValue; }, set value(v) { idValue = v; } };
    return null;
  },
  getElementById(id) { return id === 'weeklyAutosaveStatus' ? statusEl : null; },
  addEventListener(type, fn) { listeners[type] = fn; },
  visibilityState: 'visible'
};
const window = {
  addEventListener() {},
  lkNormalizeDeutschSectionOrder(value) { return value || ['Deutsch','Lesezeit','Lernwörter']; }
};
let state = { activeClassId: 'c1', weeklyPlans: [] };
let weeklyPlanEditorId = '';
let weeklyPlanDraft = null;
let clock = 0;
async function persist(next) {
  // Simuliere echten asynchronen lokalen Speicherzugriff.
  await new Promise((resolve) => setTimeout(resolve, 4));
  state = JSON.parse(JSON.stringify(next));
  context.state = state;
  return state;
}
const context = {
  console, window, document,
  setTimeout, clearTimeout,
  state, weeklyPlanEditorId, weeklyPlanDraft,
  persist,
  collectWeeklyPlanDraftFromDom: () => JSON.parse(JSON.stringify(currentDraft)),
  makeId: () => 'p1',
  nowIso: () => `2026-09-20T19:20:${String(++clock).padStart(2,'0')}.000Z`
};
Object.assign(window, context);
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'weekly-autosave.js'), 'utf8'), context, { filename: 'weekly-autosave.js' });

(async () => {
  currentDraft = {
    id: '', title: 'Plan A', planningMode: 'week', assignmentMode: 'all', animalIds: [],
    days: { Montag: { deutschFreeTasks: [{ id: 'f1', text: 'erste Aufgabe' }] } }, overrides: {}
  };
  // Erster Stand und unmittelbar danach zwei neue Stände. Nur der letzte darf nach Flush fehlen.
  const p1 = context.window.lkAutoSaveWeeklyPlan({ snapshot: currentDraft, reason: 'erste', immediate: true });
  currentDraft.title = 'Plan A geändert';
  currentDraft.days.Montag.deutschFreeTasks[0].text = 'zweite Fassung';
  const p2 = context.window.lkAutoSaveWeeklyPlan({ snapshot: currentDraft, reason: 'zweite', immediate: false });
  currentDraft.days.Montag.deutschFreeTasks.push({ id: 'f2', text: 'dritte Fassung' });
  await context.window.lkFlushWeeklyPlanAutosave();
  await Promise.allSettled([p1, p2]);

  const stored = context.state.weeklyPlans.find((plan) => plan.id === 'p1');
  assert(stored, 'Autosave hat keinen Wochenplan persistiert.');
  assert(stored.title === 'Plan A geändert', 'Neuester Titel ging beim schnellen Autosave verloren.');
  assert(stored.days.Montag.deutschFreeTasks.length === 2, 'Letzte Aufgabenänderung ging vor dem Wechsel verloren.');
  assert(stored.days.Montag.deutschFreeTasks[0].text === 'zweite Fassung', 'Aktueller Aufgabentext wurde nicht persistiert.');
  assert(statusEl.textContent.includes('automatisch gespeichert'), 'Autosave meldet nach erfolgreichem Flush nicht gespeichert.');

  // Direkt danach ein weiterer Stand: Flush muss exakt diesen letzten DOM-Zustand sichern.
  currentDraft.title = 'Final vor Wechsel';
  await context.window.lkFlushWeeklyPlanAutosave();
  const finalStored = context.state.weeklyPlans.find((plan) => plan.id === 'p1');
  assert(finalStored.title === 'Final vor Wechsel', 'Flush vor Planwechsel hat nicht den letzten DOM-Stand gespeichert.');
  console.log('Wochenplan-Autosave-Prüfung erfolgreich.');
})().catch((error) => { console.error(error); process.exit(1); });
