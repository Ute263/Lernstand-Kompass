const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const index = read("index.html");
const extra = read("weekly-extra-tasks.js");
const weekly = read("weekly-plan-9e.js");
const print = read("weekly-plan-9f.js");
const serviceWorker = read("service-worker.js");
const app = read("app.js");

const orderedScripts = [
  "weekly-extra-tasks.js",
  "weekly-ui-cleanup.js",
  "weekly-plan-9e.js",
  "weekly-plan-9f.js",
  "weekly-minimax-pages.js",
  "weekly-calendar-overview.js",
  "weekly-editor-compact.js",
  "weekly-fix-172.js"
];

let lastIndex = -1;
orderedScripts.forEach((file) => {
  const position = index.indexOf(`src="${file}`);
  assert(position >= 0, `Wochenplan-Script fehlt in index.html: ${file}`);
  assert(position > lastIndex, `Falsche Wochenplan-Ladereihenfolge bei ${file}`);
  lastIndex = position;
});

[
  "readWeeklyDaysFromDom = function",
  "renderWeeklyPlannerTable = function",
  "renderWeeklyPickCell = function",
  "window.removeWeeklyPickOccurrence = function"
].forEach((obsoleteOverride) => {
  assert(!extra.includes(obsoleteOverride), `Veraltete Zwischenfassung erneut vorhanden: ${obsoleteOverride}`);
});

[
  "readWeeklyDaysFromDom = function readWeeklyDaysFromDom9e",
  "renderWeeklyPlannerTable = function renderWeeklyPlannerTable9e",
  "renderWeeklyPickCell = function renderWeeklyPickCell9e",
  "window.removeWeeklyPickOccurrence = function removeWeeklyPickOccurrence9e",
  "socialForm: normalizeSocialForm",
  "isMicrophoneTask: task.isMicrophone === true",
  "window.setWeeklyFreeTaskSymbol",
  ".lk-free-task-row > [data-free-text] { grid-column:3; grid-row:1;"
].forEach((requiredPart) => {
  assert(weekly.includes(requiredPart), `Aktive Wochenplan-Logik fehlt: ${requiredPart}`);
});

[
  "item.isMicrophoneTask",
  "weeklySocialFormIconHtml",
  "./materials/icon-microphone.png"
].forEach((requiredPart) => {
  assert(print.includes(requiredPart), `Druckunterstützung fehlt: ${requiredPart}`);
});

[
  "./materials/icon-microphone.png",
  "./materials/socialform-icons.png"
].forEach((asset) => {
  assert(serviceWorker.includes(asset), `Offline-Datei fehlt im Service Worker: ${asset}`);
});

assert(
  app.includes("overrides: { ...(weeklyPlanDraft?.overrides || existing.overrides || {}) }"),
  "Individuelle Kinderpläne müssen beim Wechsel aus dem aktuellen Entwurf übernommen werden."
);
assert(
  !app.includes("overrides: { ...(existing.overrides || weeklyPlanDraft?.overrides || {}) }"),
  "Der gespeicherte Altstand darf den aktuellen Kinderplan-Entwurf nicht überschreiben."
);

console.log("Wochenplan-Strukturprüfung erfolgreich.");
