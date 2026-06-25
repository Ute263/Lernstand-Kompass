const storage = new AppStorage();
const app = document.querySelector("#app");

let state = emptyState();
let screen = "loading";
let teacherTab = "overview";
let childDraft = {};
let loginError = "";
let globalMessage = "";
let childMessage = "";
let qrErrorMessage = "";
let pendingRecoveryKey = "";
let securityMessage = "";
let resetMessage = "";
let scannerMode = "child";
let scannerStream = null;
let scannerTimer = null;
let barcodeDetector = null;
let progressDetailAnimalId = "";
let currentPrintType = "";
let printReturnTab = "printPdf";
let assessmentEditorId = "";
let assessmentFormOpen = false;
let pendingBackup = null;
let lastMergeReport = null;
let factoryResetMessage = "";
let syncAssistantVisible = false;
let syncAssistantSnoozedUntil = 0;
let syncGuideStep = 0;
let syncAssistantTimer = null;
let progressFilters = {
  classId: "",
  fach: "",
  material: "",
  animalId: "",
  period: "week",
  sort: "animal",
  comparison: "both"
};
let progressAnimalTab = "overview";

const TEACHER_GROUPS = [
  {
    id: "learning",
    label: "Kinder & Fortschritt",
    sections: [
      ["progress", "Kinder & Fortschritt"],
      ["overview", "Tierübersicht"],
      ["today", "Heute"],
      ["help", "Hilfe/Kontrolle"],
      ["history", "Verlauf"],
      ["classes", "Klassen & Gruppen"],
      ["animalMapping", "Tier-Zuordnung"]
    ]
  },
  {
    id: "workbooksGroup",
    label: "Arbeitshefte & Wochenplan",
    sections: [
      ["weeklyPlans", "Wochenplan"],
      ["workbookDirect", "Deutsch & Mathe direkt planen"]
    ]
  },
  {
    id: "trainingGroup",
    label: "Trainingszeit",
    sections: [["training", "Trainingszeit"]]
  },
  {
    id: "assessmentGroup",
    label: "Lernzielkontrollen",
    sections: [["assessments", "Lernzielkontrollen"]]
  },
  {
    id: "materialsGroup",
    label: "Materialien & Druck",
    sections: [
      ["resources", "Tiere & Materialien"],
      ["materialPrint", "Material drucken"],
      ["printPdf", "Druckvorschau"]
    ]
  },
  {
    id: "settingsGroup",
    label: "Geräte, Backup & Einstellungen",
    sections: [
      ["qrCards", "Tier-QR"],
      ["excelExport", "Import / Export"],
      ["backup", "Backup / Wiederherstellung"],
      ["security", "PIN & Sicherheit"],
      ["storageStatus", "Speicherstatus"],
      ["privacy", "Datenschutz & Zweck"]
    ]
  }
];

const STICKER_SHEETS = [
  {
    title: "Stickerbogen 1 – Deutsch und Mathe 1",
    description: "D-01 bis D-15 und M-01 bis M-09",
    href: "materials/stickerbogen-1-deutsch-mathe-1.png"
  },
  {
    title: "Stickerbogen 2 – Mathe 2 und Forscher",
    description: "M-10 bis M-15 und F-01 bis F-15",
    href: "materials/stickerbogen-2-mathe-forscher.png"
  }
];

const CLEAN_DISTRIBUTION_FILES = [
  "index.html",
  "styles.css",
  "models.js",
  "storage.js",
  "exceljs.min.js",
  "exceljs-LICENSE.txt",
  "export.js",
  "qrcode.js",
  "app.js",
  "pwa.js",
  "manifest.json",
  "service-worker.js",
  ".nojekyll",
  "README.md",
  "materials/stickerbogen-1-deutsch-mathe-1.png",
  "materials/stickerbogen-2-mathe-forscher.png",
  "icons/icon-192.svg",
  "icons/icon-512.svg"
];

let trainingFilters = {
  animalId: "",
  subject: "",
  area: "",
  subcategory: "",
  status: "bearbeitet",
  date: ""
};
let pendingTrainingTaskCode = "";
let weeklyPlanEditorId = "";
let weeklyPlanSection = "current";
let weeklyPickRequest = null;
let weeklyOverrideAnimalId = "";
let weeklyPlanDraft = null;
let weeklyPrintDialogOpen = false;
let weeklyPrintPlanId = "";
let weeklyPrintDraft = null;
let currentWeeklyPrintPlan = null;
let currentWeeklyPrintOptions = null;
let weeklyStatusFilter = "all";

document.addEventListener("DOMContentLoaded", initApp);

async function initApp() {
  state = await storage.load();
  await migrateSecurityState();
  if (state.setupComplete) {
    await persist(state);
  }
  if (pendingRecoveryKey) {
    screen = "recoveryReveal";
    render();
    return;
  }
  screen = state.setupComplete ? "start" : "setup";
  render();
  startMultiDeviceReminderTimer();
}

async function migrateSecurityState() {
  if (!state.setupComplete) return;
  let changed = false;
  if (!state.pinHash && state.pin) {
    state.pinHash = await hashSecret(state.pin, "pin");
    delete state.pin;
    changed = true;
  }
  if (!state.recoveryKeyHash) {
    pendingRecoveryKey = makeRecoveryKey();
    state.recoveryKeyHash = await hashSecret(pendingRecoveryKey, "recovery");
    changed = true;
  }
  if (changed) {
    state = await storage.save(state);
  }
}

async function persist(nextState = state) {
  state = await storage.save(nextState);
}

async function persistAndRender(nextState = state) {
  await persist(nextState);
  render();
}

function render() {
  document.body.classList.toggle("print-doc-mode", screen === "printView");
  if (screen === "loading") {
    app.innerHTML = `<main class="app-shell"><div class="empty">App wird geladen...</div></main>`;
    return;
  }
  if (!state.setupComplete || screen === "setup") {
    app.innerHTML = renderSetup();
    return;
  }
  if (screen === "recoveryReveal") {
    app.innerHTML = renderRecoveryReveal();
    return;
  }
  if (screen === "qrInvalid") {
    app.innerHTML = renderQrInvalid();
    return;
  }
  if (screen === "forgotPin") {
    app.innerHTML = `<main class="app-shell">${renderTopbar("PIN zurücksetzen")}${renderForgotPin()}</main>`;
    return;
  }
  if (screen === "childStart") {
    app.innerHTML = `<main class="app-shell child">${renderTopbar(CHILD_AREA_NAME)}${renderChildStart()}</main>`;
    return;
  }
  if (screen === "qrScanner") {
    app.innerHTML = `<main class="app-shell child">${renderTopbar(CHILD_AREA_NAME)}${renderQrScanner()}</main>`;
    startQrScanner();
    return;
  }
  if (screen.startsWith("child")) {
    app.innerHTML = `<main class="app-shell child">${renderTopbar(CHILD_AREA_NAME)}${renderChildScreen()}</main>`;
    return;
  }
  if (screen === "login") {
    app.innerHTML = `<main class="app-shell">${renderTopbar(TEACHER_AREA_NAME)}${renderLogin()}</main>`;
    return;
  }
  if (screen === "teacher") {
    app.innerHTML = `<main class="app-shell">${renderTopbar(TEACHER_AREA_NAME)}${renderTeacher()}</main>`;
    appendSyncAssistant();
    return;
  }
  if (screen === "printView") {
    app.innerHTML = renderPrintScreen();
    return;
  }
  app.innerHTML = renderStart();
  appendSyncAssistant();
}

function renderTopbar(subtitle) {
  return `
    <header class="topbar">
      <div class="brand">
        <h1 class="brand-title">${APP_NAME}</h1>
        <p class="brand-subtitle">${escapeHtml(subtitle)} · Aktive Klasse: ${escapeHtml(activeClass()?.name || "keine")}</p>
      </div>
      <button class="secondary" type="button" onclick="goHome()">Start</button>
    </header>
  `;
}

function renderSetup() {
  return `
    <main class="app-shell setup-shell">
      <section class="setup-card">
        <h1 class="brand-title">${APP_NAME} einrichten</h1>
        <p class="privacy-text">Richte die App einmalig für deine Klasse oder Lerngruppe ein. Der Kinderbereich arbeitet nur mit Tieren. Die Daten bleiben lokal auf diesem iPad/in diesem Browser.</p>
        <form class="setup-form" onsubmit="completeSetup(event)">
          <label class="field">Lehrkraft-PIN festlegen
            <input class="text-input" id="setupPin" type="password" autocomplete="new-password" inputmode="numeric">
          </label>
          <label class="field">PIN wiederholen
            <input class="text-input" id="setupPinRepeat" type="password" autocomplete="new-password" inputmode="numeric">
          </label>
          <label class="field">Name der ersten Klasse oder Lerngruppe
            <input class="text-input" id="setupClassName" placeholder="Klasse 1a" autocomplete="off">
          </label>
          <label class="field">Optionale Beschreibung
            <input class="text-input" id="setupDescription" placeholder="Deutsch und Mathe" autocomplete="off">
          </label>
          <p class="message error" id="setupError"></p>
          <button class="primary" type="submit">Einrichtung abschließen</button>
        </form>
      </section>
    </main>
  `;
}

async function completeSetup(event) {
  event.preventDefault();
  const pin = document.querySelector("#setupPin").value.trim();
  const pinRepeat = document.querySelector("#setupPinRepeat").value.trim();
  const className = document.querySelector("#setupClassName").value.trim();
  const description = document.querySelector("#setupDescription").value.trim();
  const error = document.querySelector("#setupError");

  if (pin.length < 4) {
    error.textContent = "Die PIN muss mindestens 4 Zeichen haben.";
    return;
  }
  if (pin !== pinRepeat) {
    error.textContent = "Die PINs stimmen nicht überein.";
    return;
  }
  if (!className) {
    error.textContent = "Bitte gib einen Namen für die Klasse oder Lerngruppe ein.";
    return;
  }

  pendingRecoveryKey = makeRecoveryKey();
  state = createInitialState({
    pinHash: await hashSecret(pin, "pin"),
    recoveryKeyHash: await hashSecret(pendingRecoveryKey, "recovery"),
    className,
    description
  });
  await persist(state);
  screen = "recoveryReveal";
  render();
}

function renderRecoveryReveal() {
  return `
    <main class="app-shell setup-shell">
      <section class="setup-card">
        <h1 class="brand-title">Wiederherstellungsschlüssel</h1>
        <p class="privacy-text">Bitte notiere diesen Wiederherstellungsschlüssel. Mit ihm kannst du deine PIN zurücksetzen, falls du sie vergisst. Der Schlüssel wird aus Sicherheitsgründen nicht im Klartext gespeichert.</p>
        <div class="recovery-key-box">${escapeHtml(pendingRecoveryKey)}</div>
        <button class="primary" type="button" onclick="finishRecoveryReveal()">Ich habe den Schlüssel notiert</button>
      </section>
    </main>
  `;
}

function finishRecoveryReveal() {
  pendingRecoveryKey = "";
  screen = "start";
  render();
}

function renderStart() {
  return `
    <main class="app-shell">
      <section class="center-stage">
        <div>
          <div class="brand start-brand">
            <h1 class="brand-title">Lernstand-Kompass</h1>
            <p class="brand-subtitle">${APP_SUBTITLE}</p>
            <p class="active-note">Aktive Klasse: ${escapeHtml(activeClass()?.name || "keine")}</p>
          </div>
          <div class="start-grid">
            <button class="start-card" type="button" onclick="startChildFlow()">
              <span class="icon">🧭</span>
              <strong>${CHILD_AREA_NAME}</strong>
            </button>
            <button class="start-card" type="button" onclick="openLogin()">
              <span class="icon">🔒</span>
              <strong>${TEACHER_AREA_NAME} 🔒</strong>
            </button>
          </div>
        </div>
      </section>
    </main>
  `;
}

function startChildFlow() {
  stopQrScanner();
  childDraft = {};
  pendingTrainingTaskCode = "";
  screen = "childStart";
  render();
}

async function startQrFlow(qrToken) {
  const animal = state.animals.find((item) => item.aktiv && item.qrToken === qrToken);
  if (!animal || !state.classes.some((item) => item.id === animal.classId)) {
    qrErrorMessage = "Dieser Zugang wurde nicht erkannt. Bitte wende dich an die Lehrkraft.";
    screen = "qrInvalid";
    render();
    return;
  }
  childDraft = { animalId: animal.id, fromQr: true };
  if (state.activeClassId !== animal.classId) {
    await persist({ ...state, activeClassId: animal.classId });
  }
  screen = "childSubject";
  render();
}

function openLogin() {
  loginError = "";
  screen = "login";
  render();
}

function goHome() {
  stopQrScanner();
  childDraft = {};
  pendingTrainingTaskCode = "";
  loginError = "";
  qrErrorMessage = "";
  screen = "start";
  render();
}

function renderQrInvalid() {
  return `
    <main class="app-shell child">
      <section class="center-stage">
        <div class="setup-card qr-error-card">
          <h1 class="brand-title">Zugang</h1>
          <p class="privacy-text">${escapeHtml(qrErrorMessage || "Dieser Zugang wurde nicht erkannt. Bitte wende dich an die Lehrkraft.")}</p>
          <button class="primary" type="button" onclick="goHome()">Zur Startseite</button>
        </div>
      </section>
    </main>
  `;
}

function renderChildScreen() {
  if (screen === "childAnimal") return renderAnimalSelection();
  if (screen === "childSubject") return renderSubjectSelection();
  if (screen === "childMaterial") return renderMaterialSelection();
  if (screen === "childPage") return renderPageInput();
  if (screen === "childStatus") return renderStatusSelection();
  if (screen === "childConfirm") return renderConfirmation();
  if (screen === "childTraining") return renderTrainingStart();
  if (screen === "childTrainingSubcategory") return renderTrainingSubcategorySelection();
  if (screen === "childTrainingArea") return renderTrainingArea();
  if (screen === "childTrainingConfirm") return renderTrainingConfirmation();
  if (screen === "childWeek") return renderChildWeek();
  return "";
}

function renderChildStart() {
  return `
    <section class="step-wrap child-start-wrap">
      <h2 class="child-title">${CHILD_AREA_NAME}</h2>
      <div class="start-grid child-choice-grid">
        <button class="start-card primary-child-card" type="button" onclick="openQrScanner('child')">
          <span class="icon">📷</span>
          <strong>QR-Code scannen</strong>
        </button>
        <button class="start-card primary-child-card" type="button" onclick="setChildScreen('childAnimal')">
          <span class="icon">🐾</span>
          <strong>Tier auswählen</strong>
        </button>
      </div>
      <div class="child-quiet-actions">
        <button class="lernpost-button" type="button" onclick="exportLernpost()">✉️ Lernpost</button>
        ${childMessage ? `<p class="message success">${escapeHtml(childMessage)}</p>` : ""}
      </div>
    </section>
  `;
}

function renderBackButton(target) {
  return `<div class="step-actions"><button class="secondary" type="button" onclick="setChildScreen('${target}')">Zurück</button></div>`;
}

function setChildScreen(nextScreen) {
  screen = nextScreen;
  render();
}

function renderAnimalSelection() {
  const animals = animalsForActiveClass().filter((animal) => animal.aktiv);
  return `
    <section class="step-wrap">
      <h2 class="child-title">Wer bist du?</h2>
      <div class="animal-grid">
        ${animals.map((animal) => `
          <button class="animal-button" type="button" onclick="selectAnimal('${animal.id}')">
            <span class="animal-emoji">${escapeHtml(animal.tierEmoji)}</span>
            <span class="animal-name">${escapeHtml(animal.tierName)}</span>
          </button>
        `).join("")}
      </div>
    </section>
  `;
}

function selectAnimal(animalId) {
  childDraft.animalId = animalId;
  screen = "childSubject";
  render();
}

function renderSubjectSelection() {
  const animal = selectedAnimal();
  const qrGreeting = childDraft.fromQr && animal
    ? `<p class="qr-greeting">Hallo, <strong>${escapeHtml(animal.tierEmoji)} ${escapeHtml(animal.tierName)}</strong>!</p>`
    : "";
  return `
    <section class="step-wrap">
      ${childDraft.fromQr ? "" : renderBackButton("childAnimal")}
      ${qrGreeting}
      <h2 class="child-title">${CHILD_AREA_NAME}</h2>
      <div class="subject-grid">
        <button class="subject-button" type="button" onclick="selectSubject('Deutsch')"><span class="subject-icon">📘</span>Deutsch</button>
        <button class="subject-button" type="button" onclick="selectSubject('Mathe')"><span class="subject-icon">🔢</span>Mathe</button>
        <button class="subject-button week-subject-button" type="button" onclick="openChildWeek()"><span class="subject-icon">🗓️</span>Meine Woche</button>
        <button class="subject-button training-subject-button" type="button" onclick="openTrainingStart()"><span class="subject-icon">⭐</span>Trainingszeit</button>
      </div>
    </section>
  `;
}

function selectSubject(subject) {
  childDraft.fach = subject;
  screen = "childMaterial";
  render();
}

function openTrainingStart() {
  childDraft.trainingArea = "";
  childDraft.trainingSubcategory = "";
  pendingTrainingTaskCode = "";
  screen = "childTraining";
  render();
}

function openChildWeek() {
  screen = "childWeek";
  render();
}

function renderTrainingStart() {
  return `
    <section class="step-wrap">
      ${renderBackButton("childSubject")}
      <h2 class="child-title">Trainingszeit</h2>
      <div class="subject-grid training-area-grid">
        <button class="subject-button training-area-button" type="button" onclick="selectTrainingArea('Schule')">
          <span class="subject-icon">🏫</span>Schule
        </button>
        <button class="subject-button training-area-button" type="button" onclick="selectTrainingArea('OGS/Zuhause')">
          <span class="subject-icon">🏡</span>OGS / Zuhause
        </button>
      </div>
    </section>
  `;
}

function selectTrainingArea(area) {
  childDraft.trainingArea = area;
  childDraft.trainingSubcategory = "";
  pendingTrainingTaskCode = "";
  screen = area === "OGS/Zuhause" ? "childTrainingSubcategory" : "childTrainingArea";
  render();
}

function renderTrainingSubcategorySelection() {
  return `
    <section class="step-wrap">
      ${renderBackButton("childTraining")}
      <h2 class="child-title">OGS / Zuhause</h2>
      <div class="subject-grid training-area-grid">
        <button class="subject-button training-area-button" type="button" onclick="selectTrainingSubcategory('Deutsch-Entdecker')">
          <span class="subject-icon">📘</span>Deutsch-Entdecker
        </button>
        <button class="subject-button training-area-button" type="button" onclick="selectTrainingSubcategory('Mathe-Entdecker')">
          <span class="subject-icon">🔢</span>Mathe-Entdecker
        </button>
        <button class="subject-button training-area-button" type="button" onclick="selectTrainingSubcategory('Forscher')">
          <span class="subject-icon">🔎</span>Forscher
        </button>
      </div>
    </section>
  `;
}

function selectTrainingSubcategory(subcategory) {
  childDraft.trainingSubcategory = subcategory;
  pendingTrainingTaskCode = "";
  screen = "childTrainingArea";
  render();
}

function renderTrainingArea() {
  const area = childDraft.trainingArea || "OGS/Zuhause";
  const animal = selectedAnimal();
  const subcategory = childDraft.trainingSubcategory || "";
  const tasks = trainingTasksForArea(area)
    .filter((task) => !subcategory || task.subcategory === subcategory);
  if (area === "Schule") {
    return `
      <section class="step-wrap">
        ${renderBackButton("childTraining")}
        <h2 class="child-title">Trainingszeit Schule</h2>
        <div class="empty">Hier kommen später Trainingsaufgaben für die Schule hinzu.</div>
      </section>
    `;
  }
  return `
    <section class="step-wrap">
      ${renderBackButton("childTrainingSubcategory")}
      <h2 class="child-title">${escapeHtml(subcategory || "OGS / Zuhause")}</h2>
      <div class="training-task-grid">
        ${tasks.map((task) => {
          const completed = animal ? isTrainingTaskCompleted(animal.id, task.code) : false;
          return `
            <button class="training-task-card ${completed ? "completed" : ""}" type="button" ${completed ? "disabled" : `onclick="openTrainingTaskModal('${escapeAttribute(task.code)}')"`}>
              <span class="training-task-symbol">${escapeHtml(task.symbol || "⭐")}</span>
              <strong>${escapeHtml(task.code)}</strong>
              <span>${escapeHtml(task.shortText || task.text || task.title)}</span>
              <small>${escapeHtml(task.subject)} · ${escapeHtml(task.subcategory || "")}</small>
              <em>${completed ? "bearbeitet" : "Aufgabe ansehen"}</em>
            </button>
          `;
        }).join("")}
      </div>
      ${tasks.length ? "" : `<div class="empty">Keine Entdeckeraufgaben vorhanden.</div>`}
      ${renderTrainingTaskModal()}
    </section>
  `;
}

function renderTrainingTaskModal() {
  if (!pendingTrainingTaskCode) return "";
  const area = childDraft.trainingArea || "OGS/Zuhause";
  const task = (state.trainingTasks || []).find((item) => item.code === pendingTrainingTaskCode && item.area === area);
  if (!task) return "";
  const tips = Array.isArray(task.tips) ? task.tips : [task.tip].filter(Boolean);
  const material = Array.isArray(task.material) ? task.material : String(task.material || "Lerntagebuch, Stift").split(/[,;\n]/).map((item) => item.trim()).filter(Boolean);
  const steps = Array.isArray(task.steps) && task.steps.length ? task.steps : task.instructions || [];
  return `
    <div class="training-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="trainingModalTitle">
      <section class="training-modal-card">
        <button class="modal-close" type="button" aria-label="Schließen" onclick="closeTrainingTaskModal()">×</button>
        <p class="task-code">${escapeHtml(task.code)}</p>
        <h2 id="trainingModalTitle">${escapeHtml(task.text)}</h2>
        ${task.researchQuestion ? `
          <div class="modal-task-section">
            <strong>Forscherfrage:</strong>
            <p>${escapeHtml(task.researchQuestion)}</p>
          </div>
        ` : ""}
        <div class="modal-task-section">
          <strong>So gehst du vor:</strong>
          <ol>${steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>
        </div>
        <div class="modal-task-grid">
          <div><strong>Tipp:</strong>${tips.length ? `<ul>${tips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}</ul>` : `<p>Arbeite Schritt für Schritt.</p>`}</div>
          <div><strong>Material:</strong><ul>${material.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>
        </div>
        <div class="confirm-actions">
          <button class="primary" type="button" onclick="startTrainingTask('${escapeAttribute(task.code)}')">Aufgabe starten</button>
          <button class="secondary" type="button" onclick="closeTrainingTaskModal()">Abbrechen</button>
        </div>
      </section>
    </div>
  `;
}

function openTrainingTaskModal(taskCode) {
  pendingTrainingTaskCode = taskCode;
  render();
}

function closeTrainingTaskModal() {
  pendingTrainingTaskCode = "";
  render();
}

async function startTrainingTask(taskCode) {
  pendingTrainingTaskCode = "";
  await completeTrainingTask(taskCode);
}

async function completeTrainingTask(taskCode) {
  const animal = selectedAnimal();
  const task = (state.trainingTasks || []).find((item) => item.code === taskCode && item.area === (childDraft.trainingArea || "OGS/Zuhause"));
  if (!animal || !task || isTrainingTaskCompleted(animal.id, task.code)) return;
  const timestamp = nowIso();
  const completion = {
    id: makeId(),
    classId: state.activeClassId,
    animalId: animal.id,
    tierNameSnapshot: animal.tierName,
    tierEmojiSnapshot: animal.tierEmoji,
    taskCode: task.code,
    trainingArea: task.area,
    subcategory: task.subcategory || "",
    subject: task.subject,
    taskTitle: task.title,
    taskText: task.text,
    completedAt: timestamp,
    updatedAt: timestamp,
    status: "bearbeitet"
  };
  await persist({ ...state, trainingCompletions: [...(state.trainingCompletions || []), completion] });
  screen = "childTrainingConfirm";
  render();
}

function renderTrainingConfirmation() {
  return `
    <section class="confirm-box">
      <div class="confirm-icon">✅</div>
      <h2 class="confirm-title">Trainingsaufgabe gespeichert.</h2>
      <div class="confirm-actions">
        <button class="primary" type="button" onclick="setChildScreen('childTrainingArea')">Weitere Aufgabe ansehen</button>
        <button class="secondary" type="button" onclick="goHome()">Zur Startseite</button>
      </div>
    </section>
  `;
}

function renderChildWeek() {
  const animal = selectedAnimal();
  const plans = animal ? weeklyPlansForAnimal(animal.id) : [];
  return `
    <section class="step-wrap child-week-wrap">
      ${renderBackButton("childSubject")}
      <h2 class="child-title">Meine Woche</h2>
      <p class="message">Hier siehst du deinen Wochenplan mit Deutsch, Mathe und Extra-Aufgaben.</p>
      ${plans.length ? plans.map((plan) => renderChildWeeklyPlan(plan, animal)).join("") : `<div class="empty">Für diese Woche ist noch kein Wochenplan eingetragen.</div>`}
    </section>
  `;
}

function renderChildWeeklyPlan(plan, animal) {
  return `
    <article class="weekly-child-plan">
      <h3>${escapeHtml(plan.title)}</h3>
      <p>${escapeHtml(weeklyPlanPeriodLabel(plan))}</p>
      ${WEEK_DAYS.map((day) => {
        const items = weeklyPlanItemsForDay(plan, day, animal.id);
        return `
          <section class="weekly-day-card">
            <h4>${escapeHtml(day)}</h4>
            ${items.length ? items.map((item) => renderChildWeeklyPlanItem(plan, animal, day, item)).join("") : `<p class="message">Heute ist nichts eingetragen.</p>`}
          </section>
        `;
      }).join("")}
    </article>
  `;
}

function renderChildWeeklyPlanItem(plan, animal, day, item) {
  const status = normalizeSimpleWorkStatus(weeklyPlanItemStatus(plan.id, animal.id, day, item.field));
  const done = status === "fertig";
  return `
    <div class="weekly-child-item ${done ? "completed" : ""}">
      <strong>${escapeHtml(item.label)}</strong>
      <span>${escapeHtml(item.text)}</span>
      ${item.detail ? `<small>${escapeHtml(item.detail)}</small>` : ""}
      <em>${escapeHtml(status)}</em>
      <div class="weekly-status-actions">
        ${status === "offen" ? `<button class="small-button" type="button" onclick="updateChildWeeklyStatus('${plan.id}', '${escapeAttribute(day)}', '${escapeAttribute(item.field)}', 'teilweise')">teilweise</button>` : ""}
        ${!done ? `<button class="primary small-button" type="button" onclick="updateChildWeeklyStatus('${plan.id}', '${escapeAttribute(day)}', '${escapeAttribute(item.field)}', 'fertig')">fertig</button>` : ""}
      </div>
    </div>
  `;
}

async function updateChildWeeklyStatus(planId, day, field, status) {
  const animal = selectedAnimal();
  const plan = (state.weeklyPlans || []).find((item) => item.id === planId);
  if (!animal || !plan || !WEEKLY_PLAN_STATUSES.includes(status)) return;
  const timestamp = nowIso();
  const item = weeklyPlanItemsForDay(plan, day, animal.id).find((entry) => entry.field === field);
  const pages = item?.catalogItem ? weeklyCatalogPages(item.catalogItem).map(String) : [];
  const childCompletedPages = status === "fertig" ? pages : status === "teilweise" && pages.length === 1 ? pages : [];
  const existing = (state.weeklyPlanStatuses || []).find((entry) => (
    entry.planId === planId && entry.animalId === animal.id && entry.day === day && entry.field === field
  ));
  const nextStatus = {
    ...(existing || {}),
    id: existing?.id || makeId(),
    classId: state.activeClassId,
    planId,
    animalId: animal.id,
    day,
    field,
    workbookCatalogId: item?.workbookCatalogId || "",
    freeText: item?.freeText || "",
    status,
    completedPages: childCompletedPages,
    openPages: pages.filter((page) => !childCompletedPages.includes(page)),
    completedAt: status === "fertig" ? timestamp : existing?.completedAt || "",
    createdAt: existing?.createdAt || timestamp,
    updatedAt: timestamp
  };
  let nextState = {
    ...state,
    weeklyPlanStatuses: existing
      ? (state.weeklyPlanStatuses || []).map((entry) => entry.id === existing.id ? nextStatus : entry)
      : [...(state.weeklyPlanStatuses || []), nextStatus]
  };

  if (status === "fertig" && weeklyPlanProgressMode(plan) === "auto" && item?.catalogItem) {
    nextState = linkWeeklyStatusToProgress(nextState, nextStatus.id, { confirmed: true });
  }

  await persist(nextState);
  render();
}

function renderMaterialSelection() {
  const materials = materialsForActiveClass().filter((material) => material.aktiv && material.fach === childDraft.fach);
  return `
    <section class="step-wrap">
      ${renderBackButton("childSubject")}
      <h2 class="child-title">Was hast du bearbeitet?</h2>
      <div class="material-grid">
        ${materials.map((material) => `
          <button class="material-button" type="button" onclick="selectMaterial('${material.id}')">${escapeHtml(childMaterialLabel(material))}</button>
        `).join("")}
      </div>
    </section>
  `;
}

function childMaterialLabel(material) {
  if (material.fach === "Deutsch" && isExtraMaterialName(material.materialName)) return "Meine Notizen";
  return material.materialName;
}

function selectMaterial(materialId) {
  const material = state.materials.find((item) => item.id === materialId && item.classId === state.activeClassId);
  if (!material) return;
  childDraft.materialName = childMaterialLabel(material);
  childDraft.seite = null;
  childDraft.zusatzText = "";
  childDraft.sprachweltTaskId = "";
  screen = "childPage";
  render();
}

function renderPageInput() {
  if (isExtraMaterialName(childDraft.materialName)) return renderExtraTextInput();
  return `
    <section class="step-wrap">
      ${renderBackButton("childMaterial")}
      <h2 class="child-title">Welche Seite?</h2>
      <form class="page-form" onsubmit="savePage(event)">
        <input class="page-input" id="pageInput" type="text" inputmode="numeric" pattern="[0-9]*" aria-label="Seite" placeholder="Seite" autocomplete="off" oninput="this.value=this.value.replace(/[^0-9]/g,'')">
        <button class="primary" type="submit">Weiter</button>
        <p class="message error" id="pageMessage"></p>
      </form>
    </section>
  `;
}

function renderExtraTextInput() {
  return `
    <section class="step-wrap">
      ${renderBackButton("childMaterial")}
      <h2 class="child-title">Meine Notizen</h2>
      <form class="page-form" onsubmit="saveExtraText(event)">
        <textarea class="page-input free-text-input lined-note-input" id="extraTextInput" rows="6" aria-label="Meine Notizen" placeholder="Schreibe Wörter, Sätze, Notizen oder Ideen auf." autocomplete="off"></textarea>
        <button class="primary" type="submit">Weiter</button>
        <p class="message error" id="pageMessage"></p>
      </form>
    </section>
  `;
}

function savePage(event) {
  event.preventDefault();
  const page = Number(document.querySelector("#pageInput").value);
  if (!page || page < 1) {
    document.querySelector("#pageMessage").textContent = "Bitte gib eine Seitenzahl größer als 0 ein.";
    return;
  }
  childDraft.seite = page;
  screen = "childStatus";
  render();
}

function saveExtraText(event) {
  event.preventDefault();
  const text = document.querySelector("#extraTextInput").value.trim();
  if (!text) {
    document.querySelector("#pageMessage").textContent = "Bitte schreibe kurz auf, was du gemacht hast.";
    return;
  }
  childDraft.seite = 0;
  childDraft.zusatzText = text;
  screen = "childStatus";
  render();
}

function renderStatusSelection() {
  return `
    <section class="step-wrap">
      ${renderBackButton("childPage")}
      <h2 class="child-title">Wie ist dein Stand?</h2>
      <div class="status-list">
        ${STATUSES.map((status) => `
          <button class="status-button" type="button" onclick="saveEntry('${status}')">
            <span class="status-icon">${STATUS_META[status].icon}</span>${STATUS_META[status].childLabel}
          </button>
        `).join("")}
      </div>
    </section>
  `;
}

async function saveEntry(status) {
  const animal = state.animals.find((item) => item.id === childDraft.animalId && item.classId === state.activeClassId);
  if (!animal || !childDraft.fach || !childDraft.materialName) return;
  if (!isExtraMaterialName(childDraft.materialName) && !childDraft.seite) return;
  if (isExtraMaterialName(childDraft.materialName) && !childDraft.zusatzText) return;

  const entry = {
    id: makeId(),
    classId: state.activeClassId,
    tierID: animal.id,
    tierNameSnapshot: animal.tierName,
    tierEmojiSnapshot: animal.tierEmoji,
    fach: childDraft.fach,
    materialName: childDraft.materialName,
    seite: childDraft.seite || 0,
    zusatzText: childDraft.zusatzText || "",
    sprachweltTaskId: childDraft.sprachweltTaskId || "",
    status,
    datumUhrzeit: nowIso(),
    erledigt: false
  };

  await persist({ ...state, entries: [...state.entries, entry] });
  screen = "childConfirm";
  render();
  if (!childDraft.fromQr) {
    window.setTimeout(() => {
      if (screen === "childConfirm") startChildFlow();
    }, 2000);
  }
}

function renderConfirmation() {
  if (childDraft.fromQr) {
    return `
      <section class="confirm-box">
        <div class="confirm-icon">✅</div>
        <h2 class="confirm-title">Danke! Dein Stand ist gespeichert.</h2>
        <p class="message">Alles ist auf diesem iPad gesichert.</p>
        ${childMessage ? `<p class="message success">${escapeHtml(childMessage)}</p>` : ""}
        <div class="confirm-actions">
          <button class="primary" type="button" onclick="startQrAgain()">Noch etwas eintragen</button>
          <button class="secondary lernpost-button" type="button" onclick="exportLernpost()">✉️ Lernpost</button>
          <button class="secondary" type="button" onclick="goHome()">Zur Startseite</button>
        </div>
      </section>
    `;
  }
  return `
    <section class="confirm-box">
      <div class="confirm-icon">✅</div>
      <h2 class="confirm-title">Danke! Dein Stand ist gespeichert.</h2>
      <p class="message">Alles ist auf diesem iPad gesichert.</p>
      ${childMessage ? `<p class="message success">${escapeHtml(childMessage)}</p>` : ""}
      <div class="confirm-actions">
        <button class="primary" type="button" onclick="startChildFlow()">Nächstes Kind</button>
        <button class="secondary lernpost-button" type="button" onclick="exportLernpost()">✉️ Lernpost</button>
      </div>
    </section>
  `;
}

function startQrAgain() {
  childDraft = { animalId: childDraft.animalId, fromQr: true };
  screen = "childSubject";
  render();
}

async function exportLernpost() {
  try {
    const packageData = makeLernpostPackage(state, state.activeClassId);
    const filename = `lernpost-${safeFilePart(activeClass()?.name || "klasse")}-${formatFileDate(new Date())}-${formatTimeForFilename(new Date())}.json`;
    const content = JSON.stringify(packageData, null, 2);
    childMessage = await shareOrSaveLernpost(filename, content);
  } catch (error) {
    childMessage = error?.name === "AbortError"
      ? "Lernpost wurde nicht verschickt."
      : "Die Lernpost konnte gerade nicht erstellt werden.";
  }
  render();
}

async function shareOrSaveLernpost(filename, content) {
  const mimeType = "application/json";
  if (typeof File !== "undefined" && navigator.share) {
    const file = new File([content], filename, { type: mimeType });
    if (!navigator.canShare || navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: "Lernpost",
        text: "Lernpost an die Lehrkraft",
        files: [file]
      });
      return "Lernpost ist bereit.";
    }
  }
  await saveFileWithPickerOrDownload(filename, mimeType, content);
  return "Lernpost wurde erstellt.";
}

function formatTimeForFilename(value) {
  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}`;
}

function renderLogin() {
  const loginMessageClass = loginError.includes("zurückgesetzt") ? "success" : "error";
  return `
    <section class="center-stage">
      <form class="login-box big-card" onsubmit="checkPin(event)">
        <div class="lock-icon">🔒</div>
        <h2 class="child-title compact-title">${TEACHER_AREA_NAME}</h2>
        <input class="pin-input" id="pinInput" type="password" inputmode="numeric" placeholder="PIN" autocomplete="off">
        ${loginError ? `<p class="message ${loginMessageClass}">${escapeHtml(loginError)}</p>` : ""}
        <button class="primary" type="submit">Öffnen</button>
        <button class="link-button" type="button" onclick="openForgotPin()">PIN vergessen?</button>
      </form>
    </section>
  `;
}

async function checkPin(event) {
  event.preventDefault();
  const pin = document.querySelector("#pinInput").value.trim();
  if ((await hashSecret(pin, "pin")) === state.pinHash) {
    teacherTab = "overview";
    loginError = "";
    screen = "teacher";
  } else {
    loginError = "Die PIN stimmt nicht.";
  }
  render();
}

function openForgotPin() {
  resetMessage = "";
  screen = "forgotPin";
  render();
}

function openQrScanner(mode = "child") {
  stopQrScanner();
  scannerMode = mode;
  globalMessage = "";
  screen = "qrScanner";
  render();
}

function renderQrScanner() {
  return `
    <section class="step-wrap">
      <div class="step-actions">
        <button class="secondary" type="button" onclick="closeQrScanner()">Zurück</button>
      </div>
      <h2 class="child-title">Tier-Zugang scannen</h2>
      <div class="scanner-panel">
        <video id="qrVideo" class="qr-video" autoplay playsinline muted></video>
        <canvas id="qrCanvas" class="qr-canvas"></canvas>
        <p class="message" id="scannerMessage">Kamera wird geöffnet...</p>
      </div>
      <form class="inline-form qr-manual-form" onsubmit="submitManualQrCode(event)">
        <label class="field">Tier-ID manuell eingeben
          <input class="text-input" id="manualQrInput" placeholder="animalId=..." autocomplete="off">
        </label>
        <button class="secondary" type="submit">Tier öffnen</button>
      </form>
      <p class="privacy-text">Die Erkennung läuft lokal im Browser. Es werden keine Fotos gespeichert und keine Daten übertragen. Der Code enthält nur eine anonyme Tier-ID.</p>
    </section>
  `;
}

async function startQrScanner() {
  const message = document.querySelector("#scannerMessage");
  const video = document.querySelector("#qrVideo");
  if (!message || !video) return;
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("no-camera");
    scannerStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
    video.srcObject = scannerStream;
    await video.play();
    message.textContent = "Halte die Karte vor die Kamera.";
    if ("BarcodeDetector" in window) {
      try {
        barcodeDetector = new BarcodeDetector({ formats: ["qr_code"] });
      } catch {
        barcodeDetector = null;
      }
    }
    scanQrFrame();
  } catch {
    message.textContent = "Die Kamera konnte nicht geöffnet werden. Bitte prüfe die Berechtigung oder wähle dein Tier über die Tierauswahl.";
  }
}

async function scanQrFrame() {
  if (screen !== "qrScanner") return;
  const video = document.querySelector("#qrVideo");
  const canvas = document.querySelector("#qrCanvas");
  const message = document.querySelector("#scannerMessage");
  if (!video || !canvas || !message) return;

  try {
    let token = "";
    if (barcodeDetector && video.readyState >= 2) {
      const codes = await barcodeDetector.detect(video);
      token = codes[0]?.rawValue || "";
    } else if (!("BarcodeDetector" in window)) {
      message.textContent = "Die automatische Erkennung ist in diesem Browser nicht verfügbar. Bitte gib die Tier-ID ein oder wähle dein Tier über die Tierauswahl.";
    }

    if (token) {
      await handleScannedQrToken(token.trim());
      return;
    }
  } catch {
    message.textContent = "Der Code konnte nicht gelesen werden. Bitte erneut versuchen.";
  }
  scannerTimer = window.setTimeout(scanQrFrame, 350);
}

async function handleScannedQrToken(token) {
  const animal = findAnimalForQrValue(token);
  stopQrScanner();
  if (scannerMode === "test") {
    globalMessage = animal
      ? `Tier-Code erkannt: ${animal.tierEmoji} ${animal.tierName}`
      : "Der Code wurde erkannt, gehört aber zu keinem Tier der gespeicherten Klassen.";
    screen = "teacher";
    teacherTab = "qrCards";
    render();
    return;
  }
  if (!animal) {
    qrErrorMessage = "Dieser Zugang wurde nicht gefunden. Bitte frage deine Lehrkraft.";
    screen = "qrInvalid";
    render();
    return;
  }
  childDraft = { animalId: animal.id, fromQr: true };
  if (state.activeClassId !== animal.classId) {
    await persist({ ...state, activeClassId: animal.classId });
  }
  screen = "childSubject";
  render();
}

async function submitManualQrCode(event) {
  event.preventDefault();
  const value = document.querySelector("#manualQrInput")?.value || "";
  await handleScannedQrToken(value);
}

function closeQrScanner() {
  stopQrScanner();
  if (scannerMode === "test") {
    screen = "teacher";
    teacherTab = "qrCards";
  } else {
    screen = "childStart";
  }
  render();
}

function stopQrScanner() {
  if (scannerTimer) {
    window.clearTimeout(scannerTimer);
    scannerTimer = null;
  }
  if (scannerStream) {
    scannerStream.getTracks().forEach((track) => track.stop());
    scannerStream = null;
  }
  barcodeDetector = null;
}

function renderForgotPin() {
  return `
    <section class="center-stage">
      <form class="setup-card setup-form" onsubmit="resetPinWithRecovery(event)">
        <h2 class="child-title compact-title">PIN zurücksetzen</h2>
        <p class="privacy-text">Gib deinen Wiederherstellungsschlüssel ein, um eine neue PIN festzulegen.</p>
        <label class="field">Wiederherstellungsschlüssel
          <input class="text-input" id="recoveryInput" autocomplete="off">
        </label>
        <label class="field">Neue PIN
          <input class="text-input" id="resetPin" type="password" autocomplete="new-password">
        </label>
        <label class="field">Neue PIN wiederholen
          <input class="text-input" id="resetPinRepeat" type="password" autocomplete="new-password">
        </label>
        ${resetMessage ? `<p class="message ${resetMessage.includes("nicht") || resetMessage.includes("prüfen") ? "error" : "success"}">${escapeHtml(resetMessage)}</p>` : ""}
        <button class="primary" type="submit">PIN zurücksetzen</button>
        <button class="secondary" type="button" onclick="openLogin()">Zur PIN-Anmeldung</button>
        <div class="danger-zone">
          <p class="message">Nutze diese Funktion nur, wenn du kein Backup und keinen Wiederherstellungsschlüssel mehr hast.</p>
          <button class="danger" type="button" onclick="resetWholeAppFromLogin()">App zurücksetzen</button>
        </div>
      </form>
    </section>
  `;
}

async function resetPinWithRecovery(event) {
  event.preventDefault();
  const recovery = document.querySelector("#recoveryInput").value;
  const newPin = document.querySelector("#resetPin").value.trim();
  const repeat = document.querySelector("#resetPinRepeat").value.trim();
  if ((await hashSecret(recovery, "recovery")) !== state.recoveryKeyHash) {
    resetMessage = "Der Wiederherstellungsschlüssel wurde nicht erkannt.";
    render();
    return;
  }
  if (newPin.length < 4 || newPin !== repeat) {
    resetMessage = "Bitte neue PIN prüfen.";
    render();
    return;
  }
  await persist({ ...state, pinHash: await hashSecret(newPin, "pin") });
  screen = "login";
  loginError = "PIN wurde zurückgesetzt.";
  render();
}

async function resetWholeAppFromLogin() {
  if (!confirm("Dadurch werden alle lokal gespeicherten Klassen, Tiere, Materialien und Lernstände gelöscht. Fortfahren?")) return;
  if (!confirm("Bitte bestätige: App wirklich zurücksetzen.")) return;
  await storage.clear();
  state = emptyState();
  pendingRecoveryKey = "";
  screen = "setup";
  render();
}

function renderTeacher() {
  const activeGroup = teacherGroupForTab(teacherTab);

  return `
    <section class="teacher-layout">
      <nav class="tabs" aria-label="${TEACHER_AREA_NAME}">
        ${TEACHER_GROUPS.map((group) => `
          <button class="tab-button ${activeGroup.id === group.id ? "active" : ""}" type="button" onclick="setTeacherGroup('${group.id}')">${escapeHtml(group.label)}</button>
        `).join("")}
      </nav>
      <div>
        <div class="active-class-banner">Aktive Klasse: <strong>${escapeHtml(activeClass()?.name || "keine")}</strong></div>
        ${globalMessage ? `<div class="toast">${escapeHtml(globalMessage)}</div>` : ""}
        ${renderTeacherTab()}
      </div>
    </section>
  `;
}

function teacherGroupForTab(tab) {
  return TEACHER_GROUPS.find((group) => group.sections.some(([id]) => id === tab)) || TEACHER_GROUPS[0];
}

function setTeacherGroup(groupId) {
  const group = TEACHER_GROUPS.find((item) => item.id === groupId) || TEACHER_GROUPS[0];
  setTeacherTab(group.sections[0][0]);
}

function setTeacherTab(tab) {
  stopQrScanner();
  teacherTab = tab;
  globalMessage = "";
  factoryResetMessage = "";
  render();
}

function renderTeacherTab() {
  const group = teacherGroupForTab(teacherTab);
  const activeSection = group.sections.some(([id]) => id === teacherTab) ? teacherTab : group.sections[0][0];
  return `
    <section class="panel teacher-group-panel">
      <h2>${escapeHtml(group.label)}</h2>
      <div class="section-tabs">
        ${group.sections.map(([id, label]) => `
          <button class="small-button ${activeSection === id ? "active" : ""}" type="button" onclick="setTeacherTab('${id}')">${escapeHtml(label)}</button>
        `).join("")}
      </div>
    </section>
    ${renderTeacherSection(activeSection)}
  `;
}

function renderTeacherSection(tab) {
  if (tab === "overview") return renderOverview();
  if (tab === "progress") return renderProgress();
  if (tab === "assessments") return renderAssessments();
  if (tab === "training") return renderTrainingOverview();
  if (tab === "weeklyPlans") return renderWeeklyPlans();
  if (tab === "workbookDirect") return renderWorkbookDirectPlanning();
  if (tab === "today") return renderToday();
  if (tab === "help") return renderHelp();
  if (tab === "history") return renderHistory();
  if (tab === "classes") return renderClasses();
  if (tab === "resources") return renderResources();
  if (tab === "materialPrint") return renderMaterialPrint();
  if (tab === "animalMapping") return renderAnimalMapping();
  if (tab === "qrCards") return renderQrCards();
  if (tab === "security") return renderSecurity();
  if (tab === "storageStatus") return renderStorageStatus();
  if (tab === "excelExport") return renderExcelExport();
  if (tab === "printPdf") return renderPrintPdf();
  if (tab === "backup") return renderBackup();
  if (tab === "privacy") return renderPrivacy();
  return "";
}

function renderOverview() {
  const rows = animalsForActiveClass().filter((animal) => animal.aktiv).map((animal) => {
    const deutsch = latestEntry(animal.id, "Deutsch");
    const mathe = latestEntry(animal.id, "Mathe");
    const latest = latestEntry(animal.id);
    const open = entriesForActiveClass()
      .filter((entry) => entry.tierID === animal.id && !entry.erledigt && entry.status !== "fertig")
      .sort(sortNewest)[0];
    const statusEntry = open || latest;
    return `
      <tr>
        <td><strong>${teacherAnimalLabel(animal)}</strong></td>
        <td>${deutsch ? escapeHtml(entryStandLabel(deutsch)) : "noch kein Eintrag"}</td>
        <td>${mathe ? escapeHtml(entryStandLabel(mathe)) : "noch kein Eintrag"}</td>
        <td>${latest ? formatSmartDate(latest.datumUhrzeit) : "noch kein Eintrag"}</td>
        <td>${statusEntry ? statusBadge(statusEntry.status, statusEntry.erledigt) : "noch kein Eintrag"}</td>
      </tr>
    `;
  }).join("");

  return `
    <section class="panel">
      <h2>Übersicht</h2>
      <div class="table-scroll">
        <table>
          <thead><tr><th>Tier</th><th>Deutsch: letzter Stand</th><th>Mathe: letzter Stand</th><th>letzter Eintrag</th><th>offener Status</th></tr></thead>
          <tbody>${rows || `<tr><td colspan="5">noch kein Eintrag</td></tr>`}</tbody>
        </table>
      </div>
    </section>
  `;
}

function renderProgress() {
  const classId = getProgressClassId();
  const classOptions = state.classes.map((item) => `<option value="${item.id}" ${item.id === classId ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("");
  const animals = animalsForClass(classId).filter((animal) => animal.aktiv);
  const selectedAnimal = animals.find((animal) => animal.id === progressFilters.animalId) || animals[0] || null;
  if (selectedAnimal && progressFilters.animalId !== selectedAnimal.id) progressFilters.animalId = selectedAnimal.id;
  return `
    <section class="panel">
      <h2>Kinder & Fortschritt</h2>
      <p class="message">Einfacher Ablauf: Tier auswählen, dann Wochenplan abhaken oder Deutsch/Mathe direkt erfassen. Beide Wege landen im selben Fortschritt.</p>
      <form class="filters" onsubmit="event.preventDefault();">
        <label class="field">Klasse
          <select class="select-input" onchange="setProgressFilter('classId', this.value)">${classOptions}</select>
        </label>
        <label class="field">Tier auswählen
          <select class="select-input" onchange="setProgressFilter('animalId', this.value)">
            ${animals.map((animal) => `<option value="${animal.id}" ${selectedAnimal?.id === animal.id ? "selected" : ""}>${escapeHtml(animal.tierEmoji)} ${escapeHtml(animal.tierName)}</option>`).join("")}
          </select>
        </label>
      </form>
    </section>
    ${selectedAnimal ? renderAnimalProgressWorkspace(classId, selectedAnimal) : `<section class="panel"><div class="empty">Bitte lege zuerst ein aktives Tier an.</div></section>`}
  `;
}

function renderAnimalProgressWorkspace(classId, animal) {
  const tabs = [
    ["overview", "Überblick"],
    ["weekly", "Wochenplan"],
    ["deutsch", "Deutsch"],
    ["mathe", "Mathe"],
    ["note", "Notiz"]
  ];
  const activeTab = tabs.some(([id]) => id === progressAnimalTab) ? progressAnimalTab : "overview";
  return `
    <section class="panel animal-progress-header">
      <h2>${teacherAnimalLabel(animal)} – Fortschritt</h2>
      <div class="section-tabs">
        ${tabs.map(([id, label]) => `<button class="small-button ${activeTab === id ? "active" : ""}" type="button" onclick="setProgressAnimalTab('${id}')">${escapeHtml(label)}</button>`).join("")}
      </div>
    </section>
    ${activeTab === "overview" ? renderAnimalProgressOverview(classId, animal) : ""}
    ${activeTab === "weekly" ? renderAnimalWeeklyProgressEditor(classId, animal) : ""}
    ${activeTab === "deutsch" ? renderDirectWorkbookProgressForm(animal, "Deutsch") : ""}
    ${activeTab === "mathe" ? renderDirectWorkbookProgressForm(animal, "Mathe") : ""}
    ${activeTab === "note" ? renderAnimalProgressNote(animal) : ""}
  `;
}

function renderAnimalProgressOverview(classId, animal) {
  const entries = entriesForAnimalProgress(classId, animal.id);
  const latestDeutsch = latestWorkbookEntry(classId, animal.id, "Deutsch");
  const latestMathe = latestWorkbookEntry(classId, animal.id, "Mathe");
  const weeklyRows = buildWeeklyProgressRows(classId).filter((row) => row.animal.id === animal.id);
  const thisWeekRows = weeklyRows.map((row) => `${row.day}: ${row.subject} ${simpleWorkStatusLabel(row.status)}`);
  const detailRows = entries.slice(0, 12);
  return `
    <section class="panel">
      <h2>Aktueller Stand</h2>
      <div class="summary-grid">
        <div>Deutsch</div><strong>${latestDeutsch ? escapeHtml(progressEntrySummary(latestDeutsch)) : "noch kein Stand"}</strong>
        <div>Mathe</div><strong>${latestMathe ? escapeHtml(progressEntrySummary(latestMathe)) : "noch kein Stand"}</strong>
        <div>Diese Woche</div><strong>${thisWeekRows.length ? escapeHtml(thisWeekRows.slice(0, 4).join(" · ")) : "kein aktueller Wochenplan"}</strong>
      </div>
    </section>
    <section class="panel">
      <h2>Details</h2>
      <p class="message">Kurzansicht zuerst: Deutsch und Mathe zeigen den neuesten erfassten Arbeitsheftstand. Unten stehen die letzten Fortschrittseinträge aus Wochenplan und Direkteingabe.</p>
      <div class="table-scroll">
        <table>
          <thead><tr><th>Fach</th><th>Material</th><th>Bereich</th><th>Seite</th><th>Thema</th><th>Status</th><th>Quelle</th></tr></thead>
          <tbody>
            ${detailRows.map((entry) => `
              <tr>
                <td>${escapeHtml(entry.fach)}</td>
                <td>${escapeHtml(entry.materialName || "–")}</td>
                <td>${escapeHtml(entry.workbookPart || entry.workbookCategory || "–")}</td>
                <td>${escapeHtml(entryWorkLabel(entry))}</td>
                <td>${escapeHtml(entry.zusatzText || "–")}</td>
                <td>${simpleWorkStatusBadge(entry.workStatus || entry.status)}</td>
                <td>${escapeHtml(entry.source || entry.weeklyPlanSource || "Direkteingabe")}</td>
              </tr>
            `).join("") || `<tr><td colspan="7">Noch keine Fortschrittseinträge vorhanden.</td></tr>`}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderAnimalWeeklyProgressEditor(classId, animal) {
  const rows = buildWeeklyProgressRows(classId).filter((row) => row.animal.id === animal.id);
  return `
    <section class="panel">
      <h2>Wochenplan abhaken</h2>
      <p class="message">Hier wird der Arbeitsheft-Wochenplan für ${teacherAnimalLabel(animal)} erfasst. Trainingszeit-Aufgaben erscheinen hier bewusst nicht.</p>
      <div class="table-scroll">
        <table>
          <thead><tr><th>Tag</th><th>Fach</th><th>Aufgabe</th><th>Status</th><th>Aktion</th></tr></thead>
          <tbody>
            ${rows.map((row) => `
              <tr>
                <td>${escapeHtml(row.day)}</td>
                <td>${escapeHtml(row.subject)}</td>
                <td><strong>${escapeHtml(row.pagesLabel)}</strong><br><span class="muted">${escapeHtml(row.topic || row.workbookLabel)}</span></td>
                <td>${simpleWorkStatusBadge(row.status)}</td>
                <td class="status-action-cell">
                  ${["offen", "teilweise", "fertig"].map((status) => `<button class="small-button ${normalizeSimpleWorkStatus(row.status) === status ? "active" : ""}" type="button" onclick="setWeeklyPlanSimpleStatus('${escapeAttribute(row.plan.id)}','${escapeAttribute(row.animal.id)}','${escapeAttribute(row.day)}','${escapeAttribute(row.item.field)}','${status}')">${status}</button>`).join(" ")}
                </td>
              </tr>
            `).join("") || `<tr><td colspan="5">Für dieses Tier gibt es aktuell keinen Wochenplan.</td></tr>`}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderDirectWorkbookProgressForm(animal, subject) {
  const items = workbookCatalogForActiveClass()
    .filter((item) => item.subject === subject && item.active !== false)
    .sort((a, b) => a.workbook.localeCompare(b.workbook, "de", { numeric: true }) || String(a.part || "").localeCompare(String(b.part || ""), "de", { numeric: true }) || Number(a.page) - Number(b.page));
  const formId = subject === "Deutsch" ? "directDeutschProgress" : "directMatheProgress";
  const subjectLabel = subject === "Deutsch" ? "Deutsch-Material" : "Mathe-Material";
  return `
    <section class="panel">
      <h2>${escapeHtml(subject)} direkt erfassen</h2>
      <p class="message">${escapeHtml(subjectLabel)} unabhängig vom Wochenplan auswählen und mit offen, teilweise oder fertig speichern.</p>
      <form class="inline-form direct-progress-form" id="${formId}" onsubmit="saveDirectWorkbookProgress(event, '${subject}', '${escapeAttribute(animal.id)}')">
        <label class="field">${escapeHtml(subjectLabel)} auswählen
          <select class="select-input" id="${formId}Catalog">
            ${renderWorkbookCatalogSelectOptions(items)}
          </select>
        </label>
        <label class="field">Status
          <select class="select-input" id="${formId}Status">
            <option value="offen">offen</option>
            <option value="teilweise">teilweise</option>
            <option value="fertig">fertig</option>
          </select>
        </label>
        <label class="field">Bearbeitete Seiten optional
          <input class="text-input" id="${formId}Pages" placeholder="z. B. 19, 20">
        </label>
        <label class="field">Bemerkung optional
          <input class="text-input" id="${formId}Note" placeholder="kurz und sachlich">
        </label>
        <button class="primary" type="submit">Fortschritt speichern</button>
      </form>
      <button class="secondary" type="button" onclick="openWorkbookCatalogManager()">+ Material hinzufügen</button>
    </section>
  `;
}

function renderWorkbookCatalogSelectOptions(items) {
  const workbooks = [...new Set(items.map((item) => item.workbook).filter(Boolean))];
  return workbooks.map((workbook) => {
    const groupItems = items.filter((item) => item.workbook === workbook);
    return `
      <optgroup label="${escapeAttribute(workbook)}">
        ${groupItems.map((item) => `<option value="${item.id}">${escapeHtml(workbookCatalogFullLabel(item))}</option>`).join("")}
      </optgroup>
    `;
  }).join("");
}

function renderAnimalProgressNote(animal) {
  return `
    <section class="panel">
      <h2>Notiz</h2>
      <p class="message">Kurze interne Lehrkraftnotiz zu diesem Tier. Im Kinderbereich wird diese Notiz nicht angezeigt.</p>
      <form onsubmit="saveAnimalProgressNote(event, '${escapeAttribute(animal.id)}')">
        <label class="field">Notiz
          <textarea class="text-input free-text-input" id="animalProgressNote">${escapeHtml(animal.progressNote || "")}</textarea>
        </label>
        <button class="primary" type="submit">Notiz speichern</button>
      </form>
    </section>
  `;
}

function renderWorkbookDirectPlanning() {
  const classId = getProgressClassId();
  const animals = animalsForClass(classId).filter((animal) => animal.aktiv);
  const selectedAnimal = animals.find((animal) => animal.id === progressFilters.animalId) || animals[0] || null;
  if (selectedAnimal && progressFilters.animalId !== selectedAnimal.id) progressFilters.animalId = selectedAnimal.id;
  return `
    <section class="panel">
      <h2>Deutsch & Mathe direkt planen / auswählen</h2>
      <p class="message">Dieser Bereich nutzt den Arbeitsheft-Katalog. Wähle zuerst ein Tier und trage dann Deutsch- oder Mathe-Fortschritt direkt ein.</p>
      <label class="field">Tier
        <select class="select-input" onchange="setProgressFilter('animalId', this.value)">
          ${animals.map((animal) => `<option value="${animal.id}" ${selectedAnimal?.id === animal.id ? "selected" : ""}>${escapeHtml(animal.tierEmoji)} ${escapeHtml(animal.tierName)}</option>`).join("")}
        </select>
      </label>
    </section>
    ${selectedAnimal ? renderDirectWorkbookProgressForm(selectedAnimal, "Deutsch") + renderDirectWorkbookProgressForm(selectedAnimal, "Mathe") : `<section class="panel"><div class="empty">Bitte lege zuerst ein aktives Tier an.</div></section>`}
  `;
}

function renderProgressTable(rows) {
  if (!rows.length) return `<div class="empty">Für diese Auswahl gibt es noch keine Einträge.</div>`;
  const showGroup = shouldShowGroupComparison();
  const showGoal = shouldShowGoalComparison();
  return `
    <div class="table-scroll">
      <table class="progress-table">
        <thead>
          <tr>
            <th>Tier</th><th>Fach</th><th>Material</th><th>erster Eintrag im Zeitraum</th><th>letzter Eintrag im Zeitraum</th>
            <th>niedrigste Seite</th><th>höchste Seite</th><th>Fortschritt</th><th>letzte Aktivität</th><th>offener Status</th>
            ${showGroup ? `<th>Vergleich zur Gruppe</th>` : ""}
            ${showGoal ? `<th>Soll-Seite</th><th>Abstand zum Soll</th>` : ""}
            <th>Hinweis</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              <td><button class="link-button" type="button" onclick="openProgressDetail('${row.animal.id}')">${teacherAnimalLabel(row.animal)}</button></td>
              <td>${escapeHtml(row.fach)}</td>
              <td>${escapeHtml(row.material)}</td>
              <td>${row.firstEntry ? escapeHtml(entryWorkLabel(row.firstEntry)) : "kein Eintrag"}</td>
              <td>${row.lastEntry ? escapeHtml(entryWorkLabel(row.lastEntry)) : "kein Eintrag"}</td>
              <td>${row.minPage == null ? "kein Eintrag" : `S. ${row.minPage}`}</td>
              <td>${row.maxPage == null ? "kein Eintrag" : `S. ${row.maxPage}`}</td>
              <td>${row.entryCount > 1 ? `+${row.progressPages}` : row.entryCount === 1 ? "nur ein Eintrag" : "kein Eintrag"}</td>
              <td>${row.lastActivity ? relativeActivity(row.lastActivity) : "kein Eintrag"}</td>
              <td>${progressStatusBadge(row)}</td>
              ${showGroup ? `<td>${escapeHtml(row.groupLabel)}</td>` : ""}
              ${showGoal ? `<td>${row.goal ? `S. ${row.goal.sollSeite}` : "kein Soll festgelegt"}</td><td>${escapeHtml(row.goalDistanceLabel)}</td>` : ""}
              <td>${renderHintBadges(row.hints)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderAssessments() {
  const items = assessmentsForActiveClass().sort((a, b) => String(b.datum || "").localeCompare(String(a.datum || "")));
  const selected = items.find((item) => item.id === assessmentEditorId) || null;
  return `
    <section class="panel">
      <h2>Tests & Lernzielkontrollen</h2>
      <p class="message">Die Ergebnisse werden in der Kinderansicht nur den Tier-Pseudonymen zugeordnet. Optional hinterlegte Vornamen erscheinen ausschließlich im geschützten Lehrkraftbereich.</p>
      <div class="backup-actions">
        <button class="primary" type="button" onclick="openAssessmentForm()">Neue Lernzielkontrolle anlegen</button>
        <button class="secondary" type="button" onclick="renderAssessmentSummaryPrintView()">Gesamtübersicht als PDF</button>
        <button class="secondary" type="button" onclick="exportBeautifulExcel('active')">Excel-Export</button>
      </div>
    </section>
    ${assessmentFormOpen ? renderAssessmentForm() : ""}
    ${selected ? renderAssessmentResultsEditor(selected) : ""}
    <section class="panel">
      <h2>Übersicht aller angelegten Tests/Lernzielkontrollen</h2>
      ${items.length ? items.map((item) => `
        <article class="assessment-card">
          <div class="assessment-head">
            <strong>${escapeHtml(item.titel)}</strong>
            <span class="subject-chip ${subjectChipClass(item.fach)}">${escapeHtml(item.fach)}</span>
            <span>${item.datum ? formatGermanDate(item.datum) : "ohne Datum"}</span>
            <span>${escapeHtml(item.typ)}</span>
          </div>
          <p class="message">${escapeHtml(item.bereich || "ohne Bereich")} · ${escapeHtml(item.bewertungsart)}${assessmentMaxPoints(item) ? ` · max. ${escapeHtml(assessmentMaxPoints(item))} Punkte` : ""} · ${assessmentTasksFor(item.id).length} Aufgaben</p>
          ${item.notizKurz ? `<p class="message">${escapeHtml(item.notizKurz)}</p>` : ""}
          <p class="message">Eingetragene Ergebnisse: <strong>${assessmentResultsFor(item.id).filter((result) => result.status === "eingetragen").length}</strong></p>
          <div class="backup-actions">
            <button class="primary" type="button" onclick="openAssessmentResults('${item.id}')">Ergebnisse bearbeiten</button>
            <button class="secondary" type="button" onclick="renderAssessmentPrintView('${item.id}')">PDF erstellen</button>
            <button class="danger" type="button" onclick="deleteAssessment('${item.id}')">Löschen</button>
          </div>
        </article>
      `).join("") : `<div class="empty">Noch keine Lernzielkontrolle oder kein Test angelegt.</div>`}
    </section>
  `;
}

function renderTrainingOverview() {
  const animals = animalsForActiveClass().filter((animal) => animal.aktiv);
  const tasks = (state.trainingTasks || []).filter((task) => task.active !== false && task.area !== "Schule");
  const subcategories = [...new Set(tasks.map((task) => task.subcategory).filter(Boolean))];
  const rows = buildTrainingRowsForClass(state.activeClassId)
    .filter((row) => !trainingFilters.animalId || row.animalId === trainingFilters.animalId)
    .filter((row) => !trainingFilters.subject || row.subject === trainingFilters.subject)
    .filter((row) => !trainingFilters.area || row.trainingArea === trainingFilters.area)
    .filter((row) => !trainingFilters.subcategory || row.subcategory === trainingFilters.subcategory)
    .filter((row) => !trainingFilters.status || row.status === trainingFilters.status)
    .filter((row) => !trainingFilters.date || (row.completedAt && formatFileDate(new Date(row.completedAt)) === trainingFilters.date))
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "bearbeitet" ? -1 : 1;
      if (a.completedAt && b.completedAt) return new Date(b.completedAt) - new Date(a.completedAt);
      return a.tierName.localeCompare(b.tierName, "de") || a.taskCode.localeCompare(b.taskCode, "de");
    });
  return `
    <section class="panel">
      <h2>Trainingszeit – Übersicht</h2>
      <p class="message">Hier sieht die Lehrkraft, welche Entdeckeraufgaben bereits bearbeitet wurden. Es werden nur Tier-Pseudonyme angezeigt.</p>
      <form class="filters" onsubmit="event.preventDefault();">
        <label class="field">Tier
          <select class="select-input" onchange="setTrainingFilter('animalId', this.value)">
            <option value="">alle Tiere</option>
            ${animals.map((animal) => `<option value="${animal.id}" ${trainingFilters.animalId === animal.id ? "selected" : ""}>${escapeHtml(animal.tierEmoji)} ${escapeHtml(animal.tierName)}</option>`).join("")}
          </select>
        </label>
        <label class="field">Fach
          <select class="select-input" onchange="setTrainingFilter('subject', this.value)">
            <option value="">alle Fächer</option>
            ${["Deutsch", "Mathe", "Forscher"].map((subject) => `<option value="${subject}" ${trainingFilters.subject === subject ? "selected" : ""}>${subject}</option>`).join("")}
          </select>
        </label>
        <label class="field">Bereich
          <select class="select-input" onchange="setTrainingFilter('area', this.value)">
            <option value="">alle Bereiche</option>
            ${["Schule", "OGS/Zuhause"].map((area) => `<option value="${area}" ${trainingFilters.area === area ? "selected" : ""}>${area}</option>`).join("")}
          </select>
        </label>
        <label class="field">Unterbereich
          <select class="select-input" onchange="setTrainingFilter('subcategory', this.value)">
            <option value="">alle Unterbereiche</option>
            ${subcategories.map((subcategory) => `<option value="${escapeAttribute(subcategory)}" ${trainingFilters.subcategory === subcategory ? "selected" : ""}>${escapeHtml(subcategory)}</option>`).join("")}
          </select>
        </label>
        <label class="field">Status
          <select class="select-input" onchange="setTrainingFilter('status', this.value)">
            ${["bearbeitet", "offen", ""].map((status) => `<option value="${status}" ${trainingFilters.status === status ? "selected" : ""}>${status || "alle"}</option>`).join("")}
          </select>
        </label>
        <label class="field">Datum
          <input class="text-input" type="date" value="${escapeAttribute(trainingFilters.date)}" onchange="setTrainingFilter('date', this.value)">
        </label>
      </form>
    </section>
    <section class="panel">
      <h2>Entdeckeraufgaben</h2>
      <p class="message">${rows.filter((row) => row.status === "bearbeitet").length} bearbeitet · ${rows.filter((row) => row.status === "offen").length} offen · ${tasks.length} Aufgaben</p>
      <div class="table-scroll">
        <table class="training-overview-table">
          <thead>
            <tr><th>Tier</th><th>Bereich</th><th>Unterbereich</th><th>Aufgaben-Code</th><th>Fach</th><th>Aufgabentext</th><th>Datum</th><th>Uhrzeit</th><th>Status</th><th>Aktion</th></tr>
          </thead>
          <tbody>
            ${rows.map((row) => `
              <tr class="${row.status === "offen" ? "muted-row" : ""}">
                <td><strong>${teacherAnimalLabel(row)}</strong></td>
                <td>${escapeHtml(row.trainingArea)}</td>
                <td>${escapeHtml(row.subcategory || "–")}</td>
                <td>${escapeHtml(row.taskCode)}</td>
                <td>${escapeHtml(row.subject)}</td>
                <td>${escapeHtml(row.taskText)}</td>
                <td>${row.completedAt ? formatGermanDate(row.completedAt) : "–"}</td>
                <td>${row.completedAt ? formatTime(row.completedAt) : "–"}</td>
                <td>${row.status === "bearbeitet" ? `<span class="badge done">bearbeitet</span>` : `<span class="badge stale">offen</span>`}</td>
                <td>${row.status === "bearbeitet" ? `<button class="small-button" type="button" onclick="resetTrainingCompletion('${row.animalId}', '${escapeAttribute(row.taskCode)}')">Aufgabe zurücksetzen</button>` : "–"}</td>
              </tr>
            `).join("") || `<tr><td colspan="10">Keine passenden Trainingsaufgaben gefunden.</td></tr>`}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function setTrainingFilter(field, value) {
  trainingFilters = { ...trainingFilters, [field]: value };
  render();
}

function renderWeeklyPlans() {
  const plans = weeklyPlansForActiveClass().sort((a, b) => String(b.validFrom || b.createdAt || "").localeCompare(String(a.validFrom || a.createdAt || "")));
  const editorPlan = weeklyPlanEditorId ? plans.find((plan) => plan.id === weeklyPlanEditorId) : null;
  const section = weeklyPlanSection || "current";
  return `
    <section class="panel">
      <h2>Wochenpläne</h2>
      <p class="message">Der Wochenplan ist nur für Deutsch- und Mathe-Arbeitshefte/Lehrwerke sowie freie Aufgaben gedacht. Trainingszeit, Deutsch-Entdecker, Mathe-Entdecker und Forscher bleiben eigene Bereiche.</p>
      <div class="section-tabs weekly-section-tabs">
        ${[
          ["current", "Aktuelle Woche"],
          ["create", "Wochenplan erstellen"],
          ["templates", "Vorlagen"],
          ["catalog", "Arbeitsheft-Katalog"]
        ].map(([id, label]) => `<button class="small-button ${section === id ? "active" : ""}" type="button" onclick="setWeeklyPlanSection('${id}')">${label}</button>`).join("")}
      </div>
    </section>
    ${section === "current" ? renderWeeklyCurrent(plans) : ""}
    ${section === "create" ? renderWeeklyPlanEditor(editorPlan) : ""}
    ${section === "templates" ? renderWeeklyTemplates(plans) : ""}
    ${section === "catalog" ? renderWorkbookCatalogManager() : ""}
    ${renderWeeklyCatalogPicker()}
    ${renderWeeklyPrintDialog()}
  `;
}

function setWeeklyPlanSection(section) {
  weeklyPlanSection = section;
  if (section === "create" && !weeklyPlanEditorId) weeklyPlanEditorId = "";
  render();
}

function renderWeeklyCurrent(plans) {
  const currentPlans = plans.filter((plan) => weeklyPlanIsCurrent(plan));
  return `
    <section class="panel">
      <h2>Aktuelle Woche</h2>
      ${currentPlans.length ? currentPlans.map((plan) => renderWeeklyPlanSummaryCard(plan)).join("") : `<div class="empty">Für diese Woche ist noch kein Wochenplan aktiv.</div>`}
    </section>
    ${renderWeeklyPlanStatusOverview(currentPlans.length ? currentPlans : plans)}
  `;
}

function renderWeeklyTemplates(plans) {
  return `
    <section class="panel">
      <h2>Vorlagen</h2>
      <p class="message">Kopiere eine vorhandene Woche und passe sie für die nächste Woche an.</p>
      <div class="backup-actions">
        <button class="primary" type="button" onclick="newWeeklyPlan()">Neuen Wochenplan erstellen</button>
      </div>
      ${plans.length ? plans.map(renderWeeklyPlanSummaryCard).join("") : `<div class="empty">Noch kein Wochenplan angelegt.</div>`}
    </section>
  `;
}

function renderWeeklyPlanSummaryCard(plan) {
  return `
    <article class="weekly-plan-card">
      <div>
        <h3>${escapeHtml(plan.title)}</h3>
        <p class="message">${escapeHtml(weeklyPlanPeriodLabel(plan))} · ${plan.assignmentMode === "all" ? "Standard für alle Tiere" : `${plan.animalIds.length} ausgewählte Tiere`} · Abweichungen: ${Object.keys(plan.overrides || {}).length}</p>
        ${plan.note ? `<p class="message">${escapeHtml(plan.note)}</p>` : ""}
      </div>
      <div class="backup-actions">
        <button class="primary" type="button" onclick="editWeeklyPlan('${plan.id}')">Bearbeiten</button>
        <button class="primary" type="button" onclick="openWeeklyPrintDialog('${plan.id}')">Wochenplan drucken</button>
        <button class="secondary" type="button" onclick="copyWeeklyPlan('${plan.id}')">Wochenplan kopieren</button>
        <button class="danger" type="button" onclick="deleteWeeklyPlan('${plan.id}')">Löschen</button>
      </div>
    </article>
  `;
}

function renderWorkbookCatalogManager() {
  const items = workbookCatalogForActiveClass().sort((a, b) => a.subject.localeCompare(b.subject, "de") || a.workbook.localeCompare(b.workbook, "de", { numeric: true }) || String(a.part || "").localeCompare(String(b.part || ""), "de", { numeric: true }) || Number(a.page) - Number(b.page));
  return `
    <section class="panel">
      <h2>Arbeitshefte / Lehrwerke verwalten</h2>
      <p class="message">Hier werden nur Seitenzahl, Thema, Kompetenz und kurze Hinweise hinterlegt, keine Arbeitsheftseiten.</p>
      ${renderWorkbookCatalogOverview(items)}
      <form class="weekly-catalog-form" onsubmit="addWorkbookCatalogItem(event)">
        <label class="field">Fach
          <select class="select-input" id="catalogSubject">
            <option>Deutsch</option>
            <option>Mathe</option>
          </select>
        </label>
        <label class="field">Lehrwerk / Arbeitsheft
          <input class="text-input" id="catalogWorkbook" placeholder="ABC der Tiere">
        </label>
        <label class="field">Teil
          <input class="text-input" id="catalogPart" placeholder="Teil A / Teil 1">
        </label>
        <label class="field">Bereich / Thema
          <input class="text-input" id="catalogArea" placeholder="Wir sind in Klasse 2">
        </label>
        <label class="field">Art
          <input class="text-input" id="catalogCategory" placeholder="optional, z. B. Arbeitsheft oder Thema">
        </label>
        <label class="field">Seite
          <input class="text-input" id="catalogPage" inputmode="numeric" placeholder="15" oninput="this.value=this.value.replace(/[^0-9]/g,'')">
        </label>
        <label class="field">bis Seite optional
          <input class="text-input" id="catalogPageEnd" inputmode="numeric" placeholder="22" oninput="this.value=this.value.replace(/[^0-9]/g,'')">
        </label>
        <label class="field">Thema / kurzer Inhalt
          <input class="text-input" id="catalogTitle" placeholder="Eine Infotafel gestalten">
        </label>
        <label class="field">Kompetenz optional
          <input class="text-input" id="catalogCompetence" placeholder="Lesen / Schreiben">
        </label>
        <label class="field">Bemerkung optional
          <input class="text-input" id="catalogNote">
        </label>
        <button class="primary" type="submit">Eintrag hinzufügen</button>
      </form>
      <div class="table-scroll">
        <table>
          <thead><tr><th>Fach</th><th>Lehrwerk</th><th>Teil</th><th>Bereich</th><th>Art</th><th>Seite</th><th>Thema</th><th>Aktion</th></tr></thead>
          <tbody>
            ${items.map((item) => `
              <tr>
                <td>${escapeHtml(item.subject)}</td>
                <td>${escapeHtml(item.workbook)}</td>
                <td>${escapeHtml(item.part || "–")}</td>
                <td>${escapeHtml(item.area || "–")}</td>
                <td>${escapeHtml(item.category || "–")}</td>
                <td>${escapeHtml(pageRangeLabel(item))}</td>
                <td>${escapeHtml(item.title || "–")}</td>
                <td><button class="small-button" type="button" onclick="deleteWorkbookCatalogItem('${item.id}')">löschen</button></td>
              </tr>
            `).join("") || `<tr><td colspan="8">Noch keine Einträge vorhanden.</td></tr>`}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderWorkbookCatalogOverview(items) {
  const subjects = ["Deutsch", "Mathe"];
  return `
    <div class="catalog-overview-grid">
      ${subjects.map((subject) => {
        const subjectItems = items.filter((item) => item.subject === subject && item.active !== false);
        const workbooks = [...new Set(subjectItems.map((item) => item.workbook).filter(Boolean))];
        return `
          <div class="catalog-overview">
            <h3>${escapeHtml(subject)}</h3>
            ${workbooks.map((workbook) => renderWorkbookAccordion(workbook, subjectItems.filter((item) => item.workbook === workbook))).join("") || `<p class="empty">Noch kein Material hinterlegt.</p>`}
            <button class="secondary" type="button" onclick="focusWorkbookCatalogForm('${subject}')">+ Material hinzufügen</button>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderWorkbookAccordion(workbook, items) {
  const parts = [...new Set(items.map((item) => item.part || "Ohne Teil"))];
  return `
    <details class="catalog-accordion" open>
      <summary>${escapeHtml(workbook)}</summary>
      ${parts.map((part) => {
        const partItems = items.filter((item) => (item.part || "Ohne Teil") === part);
        const areas = [...new Set(partItems.map((item) => item.area || item.title || "Ohne Bereich"))];
        return `
          <details class="catalog-accordion nested">
            <summary>${escapeHtml(part)}</summary>
            ${areas.map((area) => {
              const areaItems = partItems.filter((item) => (item.area || item.title || "Ohne Bereich") === area);
              return `
                <details class="catalog-accordion nested">
                  <summary>${escapeHtml(area)}</summary>
                  <ul class="catalog-item-list">
                    ${areaItems.map((item) => `
                      <li>
                        <strong>${escapeHtml(pageRangeLabel(item))}</strong>
                        <span>${escapeHtml(item.title || item.competence || item.category || "Eintrag")}</span>
                      </li>
                    `).join("")}
                  </ul>
                </details>
              `;
            }).join("")}
          </details>
        `;
      }).join("")}
    </details>
  `;
}

function renderWeeklyPlanEditor(plan) {
  const draft = weeklyPlanDraft || plan || {};
  const title = draft.title || "Wochenplan";
  const weekLabel = draft.weekLabel || "";
  const validFrom = draft.validFrom || "";
  const validTo = draft.validTo || "";
  const note = draft.note || "";
  const progressMode = weeklyPlanProgressMode(draft);
  const assignmentMode = draft.assignmentMode || "all";
  const selectedAnimals = new Set(draft.animalIds || []);
  const animals = animalsForActiveClass().filter((animal) => animal.aktiv);
  const overrideAnimal = animals.find((animal) => animal.id === weeklyOverrideAnimalId) || animals[0] || null;
  if (!weeklyOverrideAnimalId && overrideAnimal) weeklyOverrideAnimalId = overrideAnimal.id;
  return `
    <section class="panel">
      <h2>Wochenplan erstellen</h2>
      <form class="weekly-plan-form" onsubmit="saveWeeklyPlan(event)">
        <input type="hidden" id="weeklyPlanId" value="${escapeAttribute(draft.id || plan?.id || "")}">
        <div class="weekly-plan-meta">
          <label class="field">Titel
            <input class="text-input" id="weeklyTitle" value="${escapeAttribute(title)}" placeholder="Wochenplan 1">
          </label>
          <label class="field">Kalenderwoche / Zeitraum
            <input class="text-input" id="weeklyLabel" value="${escapeAttribute(weekLabel)}" placeholder="KW 24">
          </label>
          <label class="field">Gültig von
            <input class="text-input" type="date" id="weeklyFrom" value="${escapeAttribute(validFrom)}">
          </label>
          <label class="field">Gültig bis
            <input class="text-input" type="date" id="weeklyTo" value="${escapeAttribute(validTo)}">
          </label>
        </div>
        <h3>Standard-Wochenplan für alle</h3>
        ${renderWeeklyPlannerTable(draft.days || {}, "standard")}
        <label class="field">Bemerkung optional
          <input class="text-input" id="weeklyNote" value="${escapeAttribute(note)}">
        </label>
        <label class="field">Wochenplan-Aufgaben in Fortschritt übernehmen
          <select class="select-input" id="weeklyProgressMode">
            <option value="confirm" ${progressMode !== "auto" ? "selected" : ""}>Erst nach Bestätigung durch Lehrkraft übernehmen</option>
            <option value="auto" ${progressMode === "auto" ? "selected" : ""}>Automatisch übernehmen</option>
          </select>
        </label>
        <div class="weekly-assignment">
          <strong>Zuordnung</strong>
          <label class="toggle-label"><input type="radio" name="weeklyAssignmentMode" value="all" ${assignmentMode === "all" ? "checked" : ""}> für alle Tiere</label>
          <label class="toggle-label"><input type="radio" name="weeklyAssignmentMode" value="selected" ${assignmentMode !== "all" ? "checked" : ""}> für einzelne Tiere / Gruppe</label>
          <div class="animal-checkbox-grid">
            ${animals.map((animal) => `
              <label class="toggle-label"><input class="weeklyAnimalCheckbox" type="checkbox" value="${animal.id}" ${selectedAnimals.has(animal.id) ? "checked" : ""}> ${escapeHtml(animal.tierEmoji)} ${escapeHtml(animal.tierName)}</label>
            `).join("")}
          </div>
        </div>
        <div class="weekly-assignment">
          <strong>Individuelle Abweichungen</strong>
          <p class="message">Wähle ein Tier aus und trage nur dort etwas ein, wo es vom Standardplan abweichen soll.</p>
          <label class="field">Tier für Abweichung
            <select class="select-input" id="weeklyOverrideAnimal" onchange="setWeeklyOverrideAnimal(this.value)">
              ${animals.map((animal) => `<option value="${animal.id}" ${overrideAnimal?.id === animal.id ? "selected" : ""}>${escapeHtml(animal.tierEmoji)} ${escapeHtml(animal.tierName)}</option>`).join("")}
            </select>
          </label>
          ${overrideAnimal ? renderWeeklyPlannerTable(draft.overrides?.[overrideAnimal.id]?.days || {}, "override", overrideAnimal.id) : `<p class="message">Noch kein Tier vorhanden.</p>`}
          <button class="secondary" type="button" onclick="clearWeeklyOverride('${escapeAttribute(overrideAnimal?.id || "")}')">Abweichung für dieses Tier leeren</button>
        </div>
        <div class="backup-actions">
          <button class="primary" type="button" onclick="saveWeeklyPlan(event)">Wochenplan speichern</button>
          <button class="secondary" type="button" onclick="openWeeklyPrintDialogFromEditor()">Wochenplan drucken</button>
          <button class="secondary" type="button" onclick="newWeeklyPlan()">Formular leeren</button>
        </div>
      </form>
    </section>
  `;
}

function renderWeeklyPlannerTable(days, scope, animalId = "") {
  const prefix = weeklyInputPrefix(scope, animalId);
  return `
    <div class="weekly-grid-editor weekly-simple-grid">
      <div class="weekly-grid-head">Tag</div>
      <div class="weekly-grid-head">Deutsch</div>
      <div class="weekly-grid-head">Mathe</div>
      <div class="weekly-grid-head">Extra</div>
      ${WEEK_DAYS.map((day, index) => {
        const dayData = days?.[day] || {};
        return `
          <strong>${escapeHtml(day)}</strong>
          ${renderWeeklyPickCell("Deutsch", day, index, normalizeIdArray(dayData.deutschIds || dayData.deutschId), `${prefix}Deutsch${index}`, scope, animalId)}
          ${renderWeeklyPickCell("Mathe", day, index, normalizeIdArray(dayData.matheIds || dayData.matheId), `${prefix}Mathe${index}`, scope, animalId)}
          <input class="text-input" id="${escapeAttribute(`${prefix}Free${index}`)}" value="${escapeAttribute(dayData.freeText || "")}" placeholder="z. B. Lies 10 Minuten.">
        `;
      }).join("")}
    </div>
  `;
}

function renderWeeklyPickCell(subject, day, index, selectedIds, inputId, scope, animalId = "") {
  const ids = normalizeIdArray(selectedIds);
  const items = ids.map((id) => workbookCatalogForActiveClass().find((entry) => entry.id === id)).filter(Boolean);
  return `
    <div class="weekly-pick-cell">
      <input type="hidden" id="${escapeAttribute(inputId)}" value="${escapeAttribute(ids.join(","))}">
      <div id="${escapeAttribute(inputId)}Label" class="weekly-pick-label ${items.length ? "" : "empty"}">
        ${items.length ? items.map((item) => `<span>${escapeHtml(workbookCatalogShortLabel(item))}</span>`).join("") : "keine Auswahl"}
      </div>
      ${items.length ? `<button class="link-button" type="button" onclick="showWorkbookCatalogInfo('${escapeAttribute(items[0].id)}')">Info</button>` : ""}
      <button class="small-button" type="button" onclick="openWeeklyCatalogPicker('${subject}', '${escapeAttribute(day)}', '${scope}', '${escapeAttribute(animalId)}', ${index})">+ auswählen</button>
      ${items.length ? `<button class="small-button" type="button" onclick="clearWeeklyPick('${escapeAttribute(inputId)}')">leeren</button>` : ""}
    </div>
  `;
}

function renderWeeklyCatalogPicker() {
  if (!weeklyPickRequest) return "";
  const items = workbookCatalogForActiveClass()
    .filter((item) => item.subject === weeklyPickRequest.subject && item.active !== false)
    .sort((a, b) => a.workbook.localeCompare(b.workbook, "de", { numeric: true }) || String(a.part || "").localeCompare(String(b.part || ""), "de", { numeric: true }) || Number(a.page) - Number(b.page));
  const workbooks = [...new Set(items.map((item) => item.workbook).filter(Boolean))];
  const categories = [...new Set(items.map((item) => item.category).filter(Boolean))];
  return `
    <div class="training-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="weeklyPickerTitle">
      <section class="training-modal-card weekly-picker-card">
        <button class="modal-close" type="button" aria-label="Schließen" onclick="closeWeeklyCatalogPicker()">×</button>
        <h2 id="weeklyPickerTitle">${escapeHtml(weeklyPickRequest.subject)} auswählen</h2>
        <p class="message">${escapeHtml(weeklyPickRequest.day)} · Kompakte Auswahl aus den aktuell hinterlegten Materialien.</p>
        <div class="weekly-picker-filters">
          <label class="field compact-field">Suche
            <input class="text-input" id="weeklyPickerSearch" placeholder="Thema, Seite oder Bereich" oninput="filterWeeklyPicker()">
          </label>
          <label class="field compact-field">Material
            <select class="select-input" id="weeklyPickerWorkbook" onchange="filterWeeklyPicker()">
              <option value="">Alle Materialien</option>
              ${workbooks.map((workbook) => `<option value="${escapeAttribute(workbook)}">${escapeHtml(workbook)}</option>`).join("")}
            </select>
          </label>
          <label class="field compact-field">Teil
            <select class="select-input" id="weeklyPickerPart" onchange="filterWeeklyPicker()">
              <option value="">Alle Teile</option>
              ${[...new Set(items.map((item) => item.part).filter(Boolean))].map((part) => `<option value="${escapeAttribute(part)}">${escapeHtml(part)}</option>`).join("")}
            </select>
          </label>
          ${categories.length > 1 ? `
            <label class="field compact-field">Art
              <select class="select-input" id="weeklyPickerCategory" onchange="filterWeeklyPicker()">
                <option value="">Alle Arten</option>
                ${categories.map((category) => `<option value="${escapeAttribute(category)}">${escapeHtml(category)}</option>`).join("")}
              </select>
            </label>
          ` : ""}
          <button class="secondary" type="button" onclick="resetWeeklyPickerFilters()">Filter zurücksetzen</button>
        </div>
        <p class="message" id="weeklyPickerResultCount">${items.length} Einträge sichtbar</p>
        <div class="weekly-picker-list">
          ${items.map((item) => `
            <button class="weekly-picker-item ${escapeAttribute(workbookCssClass(item.workbook))}" type="button" data-workbook="${escapeAttribute(item.workbook || "")}" data-part="${escapeAttribute(item.part || "")}" data-category="${escapeAttribute(item.category || "")}" data-search="${escapeAttribute(workbookCatalogFullLabel(item).toLowerCase())}" onclick="selectWeeklyCatalogItem('${item.id}')">
              <em>${escapeHtml(item.workbook || "Material")}</em>
              <strong>${escapeHtml(workbookCatalogShortLabel(item))}</strong>
              <span>${escapeHtml(workbookCatalogFullLabel(item))}</span>
            </button>
          `).join("") || `<div class="empty">Noch keine Katalogeinträge für ${escapeHtml(weeklyPickRequest.subject)} vorhanden. Lege sie über + Material hinzufügen im Arbeitsheft-Katalog an.</div>`}
        </div>
      </section>
    </div>
  `;
}

function openWeeklyCatalogPicker(subject, day, scope, animalId, dayIndex) {
  weeklyPlanDraft = collectWeeklyPlanDraftFromDom();
  weeklyPickRequest = { subject, day, scope, animalId, dayIndex };
  render();
}

function closeWeeklyCatalogPicker() {
  weeklyPlanDraft = collectWeeklyPlanDraftFromDom();
  weeklyPickRequest = null;
  render();
}

function selectWeeklyCatalogItem(catalogId) {
  if (!weeklyPickRequest) return;
  const field = weeklyPickRequest.subject === "Deutsch" ? "Deutsch" : "Mathe";
  weeklyPlanDraft = weeklyPlanDraft || collectWeeklyPlanDraftFromDom();
  setWeeklyDraftValue(weeklyPlanDraft, weeklyPickRequest.scope, weeklyPickRequest.animalId, weeklyPickRequest.day, field, catalogId);
  weeklyPickRequest = null;
  render();
}

function clearWeeklyPick(inputId) {
  weeklyPlanDraft = collectWeeklyPlanDraftFromDom();
  const match = inputId.match(/^(weekly(?:Override_([^_]+)_)?)(Deutsch|Mathe)(\d)$/);
  if (match) {
    const animalId = match[2] || "";
    const field = match[3];
    const day = WEEK_DAYS[Number(match[4])];
    setWeeklyDraftValue(weeklyPlanDraft, animalId ? "override" : "standard", animalId, day, field, "");
  }
  render();
}

function showWorkbookCatalogInfo(itemId) {
  const item = workbookCatalogForActiveClass().find((entry) => entry.id === itemId);
  if (item) alert(workbookCatalogFullLabel(item));
}

function openWorkbookCatalogManager() {
  teacherTab = "weeklyPlans";
  weeklyPlanSection = "catalog";
  weeklyPickRequest = null;
  render();
}

function filterWeeklyPicker() {
  syncWeeklyPickerFilterOptions();
  const query = (document.querySelector("#weeklyPickerSearch")?.value || "").trim().toLowerCase();
  const workbook = document.querySelector("#weeklyPickerWorkbook")?.value || "";
  const part = document.querySelector("#weeklyPickerPart")?.value || "";
  const category = document.querySelector("#weeklyPickerCategory")?.value || "";
  let visibleCount = 0;
  document.querySelectorAll(".weekly-picker-item").forEach((item) => {
    const matchesQuery = !query || item.dataset.search?.includes(query);
    const matchesWorkbook = !workbook || item.dataset.workbook === workbook;
    const matchesPart = !part || item.dataset.part === part;
    const matchesCategory = !category || item.dataset.category === category;
    const isVisible = matchesQuery && matchesWorkbook && matchesPart && matchesCategory;
    item.hidden = !isVisible;
    if (isVisible) visibleCount += 1;
  });
  const countLabel = document.querySelector("#weeklyPickerResultCount");
  if (countLabel) countLabel.textContent = `${visibleCount} ${visibleCount === 1 ? "Eintrag" : "Einträge"} sichtbar`;
}

function syncWeeklyPickerFilterOptions() {
  const workbook = document.querySelector("#weeklyPickerWorkbook")?.value || "";
  const part = document.querySelector("#weeklyPickerPart")?.value || "";
  const category = document.querySelector("#weeklyPickerCategory")?.value || "";
  const items = Array.from(document.querySelectorAll(".weekly-picker-item"));
  const workbookItems = items.filter((item) => !workbook || item.dataset.workbook === workbook);
  updateWeeklyPickerSelect("#weeklyPickerPart", "Alle Teile", [...new Set(workbookItems.map((item) => item.dataset.part).filter(Boolean))], part);

  const partAfterSync = document.querySelector("#weeklyPickerPart")?.value || "";
  const categoryItems = workbookItems.filter((item) => !partAfterSync || item.dataset.part === partAfterSync);
  updateWeeklyPickerSelect("#weeklyPickerCategory", "Alle Arten", [...new Set(categoryItems.map((item) => item.dataset.category).filter(Boolean))], category);
}

function updateWeeklyPickerSelect(selector, emptyLabel, values, currentValue) {
  const select = document.querySelector(selector);
  if (!select) return;
  const sortedValues = values.sort((a, b) => a.localeCompare(b, "de", { numeric: true }));
  const nextValue = currentValue && sortedValues.includes(currentValue) ? currentValue : "";
  select.innerHTML = [
    `<option value="">${escapeHtml(emptyLabel)}</option>`,
    ...sortedValues.map((value) => `<option value="${escapeAttribute(value)}">${escapeHtml(value)}</option>`)
  ].join("");
  select.value = nextValue;
}

function resetWeeklyPickerFilters() {
  const search = document.querySelector("#weeklyPickerSearch");
  const workbook = document.querySelector("#weeklyPickerWorkbook");
  const part = document.querySelector("#weeklyPickerPart");
  const category = document.querySelector("#weeklyPickerCategory");
  if (search) search.value = "";
  if (workbook) workbook.value = "";
  if (part) part.value = "";
  if (category) category.value = "";
  filterWeeklyPicker();
}

function openWeeklyPrintDialog(planId) {
  weeklyPrintPlanId = planId;
  weeklyPrintDraft = null;
  weeklyPrintDialogOpen = true;
  render();
}

function openWeeklyPrintDialogFromEditor() {
  weeklyPrintDraft = collectWeeklyPlanDraftFromDom();
  weeklyPrintPlanId = weeklyPrintDraft.id || "";
  weeklyPrintDialogOpen = true;
  render();
}

function closeWeeklyPrintDialog() {
  weeklyPrintDialogOpen = false;
  weeklyPrintPlanId = "";
  weeklyPrintDraft = null;
  render();
}

function renderWeeklyPrintDialog() {
  if (!weeklyPrintDialogOpen) return "";
  const plan = weeklyPrintDraft || (state.weeklyPlans || []).find((item) => item.id === weeklyPrintPlanId);
  const animals = animalsForActiveClass().filter((animal) => animal.aktiv);
  return `
    <div class="training-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="weeklyPrintTitle">
      <section class="training-modal-card weekly-print-card">
        <button class="modal-close" type="button" aria-label="Schließen" onclick="closeWeeklyPrintDialog()">×</button>
        <h2 id="weeklyPrintTitle">Wochenplan drucken</h2>
        <p class="message">Der Ausdruck enthält nur Wochenplan-Inhalte. Vornamen, Bewertungen, Noten und interne Bemerkungen werden standardmäßig nicht gedruckt.</p>
        ${plan ? `
          <div class="weekly-print-options">
            <label class="field">Variante
              <select class="select-input" id="weeklyPrintVariant">
                <option value="short">Kurzfassung</option>
                <option value="detail">Ausführliche Fassung</option>
                <option value="compact">Kompakter Wochenplan</option>
              </select>
            </label>
            <label class="field">Ziel
              <select class="select-input" id="weeklyPrintTarget" onchange="toggleWeeklyPrintTarget()">
                <option value="all">für alle gleich</option>
                <option value="single">ein einzelnes Tier</option>
                <option value="selected">ausgewählte Tiere</option>
              </select>
            </label>
            <label class="field weekly-print-animal-select hidden" id="weeklyPrintSingleWrap">Tier
              <select class="select-input" id="weeklyPrintSingleAnimal">
                ${animals.map((animal) => `<option value="${animal.id}">${escapeHtml(animal.tierEmoji)} ${escapeHtml(animal.tierName)}</option>`).join("")}
              </select>
            </label>
            <div class="weekly-print-animal-grid hidden" id="weeklyPrintSelectedWrap">
              ${animals.map((animal) => `<label class="toggle-label"><input class="weeklyPrintAnimalCheckbox" type="checkbox" value="${animal.id}"> ${escapeHtml(animal.tierEmoji)} ${escapeHtml(animal.tierName)}</label>`).join("")}
            </div>
          </div>
          <div class="weekly-print-options">
            <fieldset class="option-fieldset">
              <legend>Tage</legend>
              ${WEEK_DAYS.map((day) => `<label class="toggle-label"><input class="weeklyPrintDayCheckbox" type="checkbox" value="${day}" checked> ${escapeHtml(day)}</label>`).join("")}
            </fieldset>
            <fieldset class="option-fieldset">
              <legend>Darstellung</legend>
              <label class="toggle-label"><input id="weeklyPrintTheme" type="checkbox" checked> mit Thema</label>
              <label class="toggle-label"><input id="weeklyPrintExtra" type="checkbox" checked> mit Extra-Aufgabe</label>
              <label class="toggle-label"><input id="weeklyPrintCheckboxes" type="checkbox" checked> mit Ankreuzfeldern</label>
              <label class="toggle-label"><input id="weeklyPrintFirstNames" type="checkbox"> Vornamen anzeigen (nur interner Ausdruck)</label>
            </fieldset>
          </div>
          <div class="backup-actions">
            <button class="primary" type="button" onclick="startWeeklyPlanPrint()">Druckvorschau öffnen</button>
            <button class="secondary" type="button" onclick="closeWeeklyPrintDialog()">Abbrechen</button>
          </div>
        ` : `<div class="empty">Bitte speichere oder öffne zuerst einen Wochenplan.</div>`}
      </section>
    </div>
  `;
}

function toggleWeeklyPrintTarget() {
  const target = document.querySelector("#weeklyPrintTarget")?.value || "all";
  document.querySelector("#weeklyPrintSingleWrap")?.classList.toggle("hidden", target !== "single");
  document.querySelector("#weeklyPrintSelectedWrap")?.classList.toggle("hidden", target !== "selected");
}

function startWeeklyPlanPrint() {
  const plan = weeklyPrintDraft || (state.weeklyPlans || []).find((item) => item.id === weeklyPrintPlanId);
  if (!plan) return;
  const target = document.querySelector("#weeklyPrintTarget")?.value || "all";
  const selectedDays = [...document.querySelectorAll(".weeklyPrintDayCheckbox:checked")].map((input) => input.value);
  const selectedAnimals = target === "single"
    ? [document.querySelector("#weeklyPrintSingleAnimal")?.value].filter(Boolean)
    : target === "selected"
      ? [...document.querySelectorAll(".weeklyPrintAnimalCheckbox:checked")].map((input) => input.value)
      : [];
  currentWeeklyPrintPlan = plan;
  currentWeeklyPrintOptions = {
    variant: document.querySelector("#weeklyPrintVariant")?.value || "short",
    target,
    animalIds: selectedAnimals,
    days: selectedDays.length ? selectedDays : [...WEEK_DAYS],
    showTheme: document.querySelector("#weeklyPrintTheme")?.checked !== false,
    showExtra: document.querySelector("#weeklyPrintExtra")?.checked !== false,
    showCheckboxes: document.querySelector("#weeklyPrintCheckboxes")?.checked === true,
    showFirstNames: document.querySelector("#weeklyPrintFirstNames")?.checked === true
  };
  weeklyPrintDialogOpen = false;
  currentPrintType = "weeklyPlan";
  printReturnTab = "weeklyPlans";
  screen = "printView";
  render();
}

function setWeeklyOverrideAnimal(animalId) {
  weeklyPlanDraft = collectWeeklyPlanDraftFromDom();
  weeklyOverrideAnimalId = animalId;
  render();
}

function clearWeeklyOverride(animalId) {
  if (!animalId) return;
  weeklyPlanDraft = collectWeeklyPlanDraftFromDom();
  if (weeklyPlanDraft.overrides) delete weeklyPlanDraft.overrides[animalId];
  render();
}

function collectWeeklyPlanDraftFromDom() {
  const existing = (state.weeklyPlans || []).find((plan) => plan.id === (document.querySelector("#weeklyPlanId")?.value || "")) || {};
  const draft = {
    ...existing,
    id: document.querySelector("#weeklyPlanId")?.value || existing.id || "",
    title: document.querySelector("#weeklyTitle")?.value.trim() || "Wochenplan",
    weekLabel: document.querySelector("#weeklyLabel")?.value.trim() || "",
    validFrom: document.querySelector("#weeklyFrom")?.value || "",
    validTo: document.querySelector("#weeklyTo")?.value || "",
    note: document.querySelector("#weeklyNote")?.value.trim() || "",
    assignmentMode: document.querySelector("input[name='weeklyAssignmentMode']:checked")?.value || existing.assignmentMode || "all",
    animalIds: [...document.querySelectorAll(".weeklyAnimalCheckbox:checked")].map((item) => item.value),
    progressMode: document.querySelector("#weeklyProgressMode")?.value || existing.progressMode || "confirm",
    autoCreateEntries: (document.querySelector("#weeklyProgressMode")?.value || existing.progressMode) === "auto",
    days: readWeeklyDaysFromDom("standard"),
    overrides: { ...(existing.overrides || weeklyPlanDraft?.overrides || {}) }
  };
  if (weeklyOverrideAnimalId) {
    const overrideDays = readWeeklyDaysFromDom("override", weeklyOverrideAnimalId);
    if (weeklyDaysHaveContent(overrideDays)) {
      draft.overrides[weeklyOverrideAnimalId] = { days: overrideDays };
    }
  }
  return draft;
}

function readWeeklyDaysFromDom(scope, animalId = "") {
  const prefix = weeklyInputPrefix(scope, animalId);
  const days = {};
  WEEK_DAYS.forEach((day, index) => {
    const deutschIds = normalizeIdArray(document.getElementById(`${prefix}Deutsch${index}`)?.value || "");
    const matheIds = normalizeIdArray(document.getElementById(`${prefix}Mathe${index}`)?.value || "");
    days[day] = {
      deutschId: deutschIds[0] || "",
      deutschIds,
      matheId: matheIds[0] || "",
      matheIds,
      freeText: document.getElementById(`${prefix}Free${index}`)?.value.trim() || ""
    };
  });
  return days;
}

function weeklyDaysHaveContent(days) {
  return Object.values(days || {}).some((day) => normalizeIdArray(day.deutschIds || day.deutschId).length || normalizeIdArray(day.matheIds || day.matheId).length || day.freeText);
}

function setWeeklyDraftValue(draft, scope, animalId, day, field, value) {
  const key = field === "Deutsch" ? "deutschIds" : "matheIds";
  const legacyKey = field === "Deutsch" ? "deutschId" : "matheId";
  const updateDay = (target) => {
    const current = normalizeIdArray(target[key] || target[legacyKey]);
    const next = value ? [...new Set([...current, value])] : [];
    target[key] = next;
    target[legacyKey] = next[0] || "";
  };
  if (scope === "override" && animalId) {
    draft.overrides = draft.overrides || {};
    draft.overrides[animalId] = draft.overrides[animalId] || { days: {} };
    draft.overrides[animalId].days[day] = draft.overrides[animalId].days[day] || { deutschId: "", matheId: "", freeText: "" };
    updateDay(draft.overrides[animalId].days[day]);
  } else {
    draft.days = draft.days || {};
    draft.days[day] = draft.days[day] || { deutschId: "", matheId: "", freeText: "" };
    updateDay(draft.days[day]);
  }
}

function renderWeeklyPlanStatusOverview(plans = weeklyPlansForActiveClass()) {
  const animals = animalsForActiveClass().filter((animal) => animal.aktiv);
  const allRows = plans.flatMap((plan) => animals
    .filter((animal) => weeklyPlanAppliesToAnimal(plan, animal.id))
    .flatMap((animal) => WEEK_DAYS.flatMap((day) => weeklyPlanItemsForDay(plan, day, animal.id).map((item) => ({
      plan,
      animal,
      day,
      item,
      statusRecord: weeklyPlanStatusRecord(plan.id, animal.id, day, item.field)
    })))));
  const rows = allRows
    .map((row) => ({ ...row, status: normalizeSimpleWorkStatus(row.statusRecord?.status || "offen") }))
    .filter((row) => weeklyStatusFilterMatches(row, weeklyStatusFilter));
  return `
    <section class="panel">
      <h2>Wochenplan-Status</h2>
      <p class="message">Hier sieht die Lehrkraft, welches Tier welche Arbeitsheft-Aufgabe aus dem Wochenplan offen, teilweise oder fertig hat und ob sie schon im Fortschritt steht.</p>
      <label class="field compact-filter">Filter
        <select class="select-input" onchange="setWeeklyStatusFilter(this.value)">
          ${[
            ["all", "alle"],
            ["offen", "offen"],
            ["teilweise", "teilweise"],
            ["fertig", "fertig"],
            ["linked", "in Fortschritt übernommen"]
          ].map(([value, label]) => `<option value="${value}" ${weeklyStatusFilter === value ? "selected" : ""}>${label}</option>`).join("")}
        </select>
      </label>
      <div class="table-scroll">
        <table>
          <thead><tr><th>Wochenplan</th><th>Tier</th><th>Tag</th><th>Bereich</th><th>Aufgabe</th><th>Seiten</th><th>Status</th><th>Fortschritt</th><th>Aktion</th></tr></thead>
          <tbody>
            ${rows.map((row) => `
              <tr class="${row.statusRecord?.progressLinked ? "" : "muted-row"}">
                <td>${escapeHtml(row.plan.title)}</td>
                <td><strong>${teacherAnimalLabel(row.animal)}</strong></td>
                <td>${escapeHtml(row.day)}</td>
                <td>${escapeHtml(row.item.label)}</td>
                <td>${escapeHtml(row.item.text)}</td>
                <td>${escapeHtml(weeklyItemPageSummary(row.item))}</td>
                <td>${weeklyStatusBadge(row.status)}</td>
                <td>${weeklyProgressLinkBadge(row.statusRecord)}</td>
                <td>${weeklyStatusActions(row)}</td>
              </tr>
            `).join("") || `<tr><td colspan="9">Noch keine passenden Wochenplan-Aufgaben vorhanden.</td></tr>`}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

async function addWorkbookCatalogItem(event) {
  event.preventDefault();
  const subject = document.querySelector("#catalogSubject")?.value || "Deutsch";
  const workbook = document.querySelector("#catalogWorkbook")?.value.trim() || "";
  const part = document.querySelector("#catalogPart")?.value.trim() || "";
  const area = document.querySelector("#catalogArea")?.value.trim() || "";
  const category = document.querySelector("#catalogCategory")?.value.trim() || "";
  const page = Number(document.querySelector("#catalogPage")?.value || 0);
  const pageEnd = Number(document.querySelector("#catalogPageEnd")?.value || 0);
  const title = document.querySelector("#catalogTitle")?.value.trim() || "";
  const competence = document.querySelector("#catalogCompetence")?.value.trim() || "";
  const note = document.querySelector("#catalogNote")?.value.trim() || "";
  if (!workbook || !page) {
    globalMessage = "Bitte gib Lehrwerk und Seite ein.";
    render();
    return;
  }
  const timestamp = nowIso();
  await persistAndRender({
    ...state,
    workbookCatalog: [...(state.workbookCatalog || []), {
      id: makeId(),
      classId: state.activeClassId,
      subject,
      workbook,
      part,
      area,
      category,
      page,
      pageEnd: pageEnd > page ? pageEnd : "",
      title,
      competence,
      note,
      active: true,
      createdAt: timestamp,
      updatedAt: timestamp
    }]
  });
}

function focusWorkbookCatalogForm(subject) {
  const subjectSelect = document.querySelector("#catalogSubject");
  if (subjectSelect) subjectSelect.value = subject;
  document.querySelector("#catalogWorkbook")?.focus();
}

async function deleteWorkbookCatalogItem(itemId) {
  if (!confirm("Diesen Lehrwerk-Eintrag wirklich löschen?")) return;
  await persistAndRender({ ...state, workbookCatalog: (state.workbookCatalog || []).filter((item) => item.id !== itemId) });
}

function newWeeklyPlan() {
  weeklyPlanEditorId = "";
  weeklyPlanDraft = null;
  weeklyPickRequest = null;
  weeklyPlanSection = "create";
  render();
}

function editWeeklyPlan(planId) {
  weeklyPlanEditorId = planId;
  weeklyPlanDraft = null;
  weeklyPickRequest = null;
  weeklyPlanSection = "create";
  render();
}

async function copyWeeklyPlan(planId) {
  const plan = (state.weeklyPlans || []).find((item) => item.id === planId);
  if (!plan) return;
  const timestamp = nowIso();
  const copy = {
    ...plan,
    id: makeId(),
    title: `${plan.title} Kopie`,
    weekLabel: "",
    validFrom: "",
    validTo: "",
    days: JSON.parse(JSON.stringify(plan.days || {})),
    overrides: JSON.parse(JSON.stringify(plan.overrides || {})),
    createdAt: timestamp,
    updatedAt: timestamp
  };
  weeklyPlanEditorId = copy.id;
  weeklyPlanDraft = null;
  weeklyPickRequest = null;
  weeklyPlanSection = "create";
  await persistAndRender({ ...state, weeklyPlans: [...(state.weeklyPlans || []), copy] });
}

async function deleteWeeklyPlan(planId) {
  if (!confirm("Diesen Wochenplan wirklich löschen? Status-Einträge zu diesem Wochenplan werden ebenfalls entfernt.")) return;
  await persistAndRender({
    ...state,
    weeklyPlans: (state.weeklyPlans || []).filter((plan) => plan.id !== planId),
    weeklyPlanStatuses: (state.weeklyPlanStatuses || []).filter((item) => item.planId !== planId)
  });
}

async function saveWeeklyPlan(event) {
  event?.preventDefault();
  const draft = collectWeeklyPlanDraftFromDom();
  const planId = draft.id || "";
  const timestamp = nowIso();
  const existing = (state.weeklyPlans || []).find((plan) => plan.id === planId);
  const nextPlan = {
    ...(existing || {}),
    id: existing?.id || makeId(),
    classId: state.activeClassId,
    title: draft.title || "Wochenplan",
    weekLabel: draft.weekLabel || "",
    validFrom: draft.validFrom || "",
    validTo: draft.validTo || "",
    note: draft.note || "",
    assignmentMode: draft.assignmentMode || "all",
    animalIds: draft.animalIds || [],
    progressMode: draft.progressMode || "confirm",
    autoCreateEntries: draft.progressMode === "auto",
    days: draft.days || {},
    overrides: draft.overrides || {},
    active: true,
    createdAt: existing?.createdAt || timestamp,
    updatedAt: timestamp
  };
  weeklyPlanEditorId = nextPlan.id;
  weeklyPlanDraft = null;
  weeklyPickRequest = null;
  const weeklyPlans = existing
    ? (state.weeklyPlans || []).map((plan) => plan.id === existing.id ? nextPlan : plan)
    : [...(state.weeklyPlans || []), nextPlan];
  await persistAndRender({ ...state, weeklyPlans });
}

async function resetTrainingCompletion(animalId, taskCode) {
  if (!confirm("Möchtest du diese Aufgabe wirklich für dieses Tier zurücksetzen?")) return;
  const completion = (state.trainingCompletions || []).find((item) => (
    item.classId === state.activeClassId
    && item.animalId === animalId
    && item.taskCode === taskCode
    && item.status === "bearbeitet"
  ));
  if (!completion) return;
  const timestamp = nowIso();
  const trainingCompletions = (state.trainingCompletions || []).map((item) => (
    item.id === completion.id
      ? { ...item, status: "offen", updatedAt: timestamp, resetAt: timestamp, resetNote: "durch Lehrkraft zurückgesetzt" }
      : item
  ));
  const trainingHistory = [
    ...(state.trainingHistory || []),
    {
      id: makeId(),
      classId: completion.classId,
      animalId: completion.animalId,
      taskCode: completion.taskCode,
      subcategory: completion.subcategory || defaultTrainingSubcategory(completion.taskCode),
      oldStatus: "bearbeitet",
      newStatus: "offen",
      changedAt: timestamp,
      note: "durch Lehrkraft zurückgesetzt"
    }
  ];
  await persistAndRender({ ...state, trainingCompletions, trainingHistory });
}

function renderAssessmentForm() {
  return `
    <section class="panel">
      <h2>Neue Lernzielkontrolle anlegen</h2>
      <form class="assessment-form" onsubmit="addAssessment(event)">
        <label class="field">Titel
          <input class="text-input" id="newAssessmentTitle" placeholder="Lernzielkontrolle Plus und Minus bis 20" autocomplete="off">
        </label>
        <label class="field">Fach
          <select class="select-input" id="newAssessmentSubject">${ASSESSMENT_SUBJECTS.map((subject) => `<option>${escapeHtml(subject)}</option>`).join("")}</select>
        </label>
        <label class="field">Bereich
          <input class="text-input" id="newAssessmentArea" placeholder="Zahlenraum bis 20" autocomplete="off">
        </label>
        <label class="field">Datum
          <input class="text-input" id="newAssessmentDate" type="date" value="${formatFileDate(new Date())}">
        </label>
        <label class="field">Typ
          <select class="select-input" id="newAssessmentType">${ASSESSMENT_TYPES.map((type) => `<option>${escapeHtml(type)}</option>`).join("")}</select>
        </label>
        <label class="field">Bewertungsart
          <select class="select-input" id="newAssessmentGrading" onchange="toggleAssessmentMaxPoints(this.value)">
            ${ASSESSMENT_GRADING_TYPES.map((type) => `<option>${escapeHtml(type)}</option>`).join("")}
          </select>
        </label>
        <label class="field" id="newAssessmentMaxWrap">Maximale Punktzahl
          <input class="text-input" id="newAssessmentMaxPoints" type="number" min="1" step="0.5" placeholder="20">
        </label>
        <label class="field assessment-wide">Kurze Inhaltsbeschreibung
          <input class="text-input" id="newAssessmentNote" maxlength="120" placeholder="Plusaufgaben bis 20" autocomplete="off">
        </label>
        <label class="field assessment-wide">Aufgabenliste
          <textarea class="text-input assessment-task-input" id="newAssessmentTasks" rows="5" placeholder="Aufgabe 1; Zahlen ordnen; 4; Zahlverständnis&#10;Aufgabe 2; Plusaufgaben; 6; Rechnen&#10;Aufgabe 3; Sachaufgabe; 5; Modellieren"></textarea>
          <span class="field-help">Eine Aufgabe pro Zeile: Nummer; kurzer Aufgabenname; Maximalpunkte; Kompetenz optional.</span>
        </label>
        <div class="backup-actions assessment-wide">
          <button class="primary" type="submit">Speichern</button>
          <button class="secondary" type="button" onclick="closeAssessmentForm()">Abbrechen</button>
        </div>
      </form>
    </section>
  `;
}

function renderAssessmentResultsEditor(assessment) {
  const animals = animalsForActiveClass().filter((animal) => animal.aktiv);
  const tasks = assessmentTasksFor(assessment.id);
  const showPoints = assessmentUsesPoints(assessment);
  const showNote = assessmentUsesNote(assessment);
  const showSymbol = assessmentUsesSymbol(assessment);
  const maxPoints = assessmentMaxPoints(assessment);
  return `
    <section class="panel">
      <button class="secondary" type="button" onclick="closeAssessmentResults()">Zur Übersicht</button>
      <h2>Ergebnisse eintragen</h2>
      <p class="message"><strong>${escapeHtml(assessment.titel)}</strong> · ${escapeHtml(assessment.fach)} · ${escapeHtml(assessment.bereich || "ohne Bereich")} · ${assessment.datum ? formatGermanDate(assessment.datum) : "ohne Datum"}${maxPoints ? ` · max. ${escapeHtml(maxPoints)} Punkte` : ""}</p>
      <div class="table-scroll">
        <table class="assessment-result-table">
          <thead>
            <tr>
              <th>Tier</th>
              ${showPoints && tasks.length ? tasks.map((task) => `<th>${escapeHtml(task.number)}<br><small>${escapeHtml(task.title)}<br>/${escapeHtml(task.maxPoints)}</small></th>`).join("") : ""}
              ${showPoints && !tasks.length ? "<th>Punkte</th>" : ""}
              ${showPoints ? "<th>Gesamt</th><th>%</th><th>Vorschlag</th>" : ""}
              ${showPoints ? "<th>Endgültige Bewertung</th>" : ""}
              ${showNote ? "<th>Note</th>" : ""}
              ${showPoints ? "<th>Endgültige Note</th>" : ""}
              ${showSymbol ? "<th>Symbol</th>" : ""}
              <th>Status</th>
              <th>Bemerkung</th>
            </tr>
          </thead>
          <tbody>
            ${animals.map((animal) => {
              const result = assessmentResultFor(assessment.id, animal.id);
              const summary = calculateAssessmentResultSummary(assessment, result);
              return `
                <tr>
                  <td><strong>${teacherAnimalLabel(animal)}</strong></td>
                  ${showPoints && tasks.length ? tasks.map((task) => `<td><input class="text-input small-input" type="number" min="0" max="${escapeAttribute(task.maxPoints)}" step="0.5" value="${escapeAttribute(result?.taskPoints?.[task.id] ?? "")}" onchange="updateAssessmentTaskPoint('${assessment.id}', '${animal.id}', '${task.id}', this.value)"></td>`).join("") : ""}
                  ${showPoints && !tasks.length ? `<td><input class="text-input small-input" type="number" min="0" step="0.5" value="${escapeAttribute(result?.punkte ?? "")}" onchange="updateAssessmentResult('${assessment.id}', '${animal.id}', 'punkte', this.value)"></td>` : ""}
                  ${showPoints ? `<td>${escapeHtml(summary.pointsLabel)}</td><td>${escapeHtml(summary.percentLabel)}</td><td>${escapeHtml(summary.rating || "–")}</td>` : ""}
                  ${showPoints ? `<td><select class="select-input small-input" onchange="updateAssessmentResult('${assessment.id}', '${animal.id}', 'finalRating', this.value)">${["", "sehr gut", "gut", "befriedigend", "ausreichend", "mangelhaft", "ungenügend"].map((rating) => `<option value="${rating}" ${String(result?.finalRating || "") === rating ? "selected" : ""}>${rating || "–"}</option>`).join("")}</select></td>` : ""}
                  ${showNote ? `<td><select class="select-input small-input" onchange="updateAssessmentResult('${assessment.id}', '${animal.id}', 'note', this.value)">${["", "1", "2", "3", "4", "5", "6"].map((note) => `<option value="${note}" ${String(result?.note || "") === note ? "selected" : ""}>${note || "–"}</option>`).join("")}</select></td>` : ""}
                  ${showPoints ? `<td><select class="select-input small-input" onchange="updateAssessmentResult('${assessment.id}', '${animal.id}', 'finalNote', this.value)">${["", "1", "2", "3", "4", "5", "6"].map((note) => `<option value="${note}" ${String(result?.finalNote || "") === note ? "selected" : ""}>${note || "–"}</option>`).join("")}</select></td>` : ""}
                  ${showSymbol ? `<td><select class="select-input small-input" onchange="updateAssessmentResult('${assessment.id}', '${animal.id}', 'symbol', this.value)">${["", ...ASSESSMENT_SYMBOLS].map((symbol) => `<option value="${escapeAttribute(symbol)}" ${String(result?.symbol || "") === symbol ? "selected" : ""}>${symbol || "–"}</option>`).join("")}</select></td>` : ""}
                  <td><select class="select-input" onchange="updateAssessmentResult('${assessment.id}', '${animal.id}', 'status', this.value)">${ASSESSMENT_RESULT_STATUSES.map((status) => `<option value="${escapeAttribute(status)}" ${String(result?.status || "eingetragen") === status ? "selected" : ""}>${escapeHtml(status)}</option>`).join("")}</select></td>
                  <td><input class="text-input" maxlength="120" value="${escapeAttribute(result?.remark || "")}" onchange="updateAssessmentResult('${assessment.id}', '${animal.id}', 'remark', this.value)" placeholder="kurz und sachlich"></td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
      <div class="backup-actions">
        <button class="primary" type="button" onclick="confirmAssessmentResultsSaved()">Ergebnisse speichern</button>
        <button class="secondary" type="button" onclick="renderAssessmentPrintView('${assessment.id}')">PDF im Querformat öffnen</button>
      </div>
    </section>
  `;
}

function renderProgressDetail(classId, classOptions, materialOptions) {
  const animal = state.animals.find((item) => item.id === progressDetailAnimalId && item.classId === classId);
  if (!animal) {
    progressDetailAnimalId = "";
    return renderProgress();
  }
  const entries = filterEntriesForProgress(state.entries.filter((entry) => entry.classId === classId && entry.tierID === animal.id), {
    classId,
    fach: progressFilters.fach,
    material: progressFilters.material,
    period: progressFilters.period
  }).sort((a, b) => new Date(a.datumUhrzeit) - new Date(b.datumUhrzeit));
  const rows = buildProgressRows({
    classId,
    fach: progressFilters.fach,
    material: progressFilters.material,
    animalId: animal.id,
    period: progressFilters.period
  });
  const latestDeutsch = latestEntryForAnimalClass(classId, animal.id, "Deutsch");
  const latestMathe = latestEntryForAnimalClass(classId, animal.id, "Mathe");
  const openItems = state.entries.filter((entry) => entry.classId === classId && entry.tierID === animal.id && !entry.erledigt && entry.status !== "fertig");
  const lastActivity = state.entries.filter((entry) => entry.classId === classId && entry.tierID === animal.id).sort(sortNewest)[0];

  return `
    <section class="panel">
      <button class="secondary" type="button" onclick="closeProgressDetail()">Zur Fortschrittstabelle</button>
      <h2>Verlauf von ${teacherAnimalLabel(animal)}</h2>
      <form class="filters" onsubmit="event.preventDefault();">
        <label class="field">Klasse
          <select class="select-input" onchange="setProgressFilter('classId', this.value)">${classOptions}</select>
        </label>
        <label class="field">Fach
          <select class="select-input" onchange="setProgressFilter('fach', this.value)">
            <option value="">Alle Fächer</option>
            ${SUBJECTS.map((subject) => `<option value="${subject}" ${progressFilters.fach === subject ? "selected" : ""}>${subject}</option>`).join("")}
          </select>
        </label>
        <label class="field">Material
          <select class="select-input" onchange="setProgressFilter('material', this.value)">
            <option value="">Alle Materialien</option>${materialOptions}
          </select>
        </label>
        <label class="field">Zeitraum
          <select class="select-input" onchange="setProgressFilter('period', this.value)">${progressPeriodOptions()}</select>
        </label>
      </form>
    </section>
    <section class="panel">
      <h2>Zusammenfassung</h2>
      <div class="summary-grid">
        <div>letzter Stand Deutsch</div><strong>${latestDeutsch ? escapeHtml(entryStandLabel(latestDeutsch)) : "kein Eintrag"}</strong>
        <div>letzter Stand Mathe</div><strong>${latestMathe ? escapeHtml(entryStandLabel(latestMathe)) : "kein Eintrag"}</strong>
        <div>Fortschritt im Zeitraum</div><strong>${rows.reduce((sum, row) => sum + row.progressPages, 0)} Seiten</strong>
        <div>letzte Aktivität</div><strong>${lastActivity ? relativeActivity(lastActivity.datumUhrzeit) : "kein Eintrag"}</strong>
        <div>offene Hilfe/Kontrolle</div><strong>${openItems.length ? `${openItems.length} offen` : "keine offen"}</strong>
        <div>Vergleich zur Gruppe</div><strong>${escapeHtml(rows.find((row) => row.groupLabel !== "kein Vergleich möglich")?.groupLabel || "kein Vergleich möglich")}</strong>
        <div>Abstand zur Soll-Seite</div><strong>${escapeHtml(rows.find((row) => row.goalDistanceLabel !== "kein Soll festgelegt")?.goalDistanceLabel || "kein Soll festgelegt")}</strong>
      </div>
    </section>
    <section class="panel">
      <h2>Chronologische Liste</h2>
      ${entries.length ? `
        <div class="table-scroll">
          <table>
            <thead><tr><th>Datum</th><th>Uhrzeit</th><th>Fach</th><th>Material</th><th>Seite/Aufgabe</th><th>Status</th></tr></thead>
            <tbody>
              ${entries.map((entry) => `
                <tr>
                  <td>${formatGermanDate(entry.datumUhrzeit)}</td>
                  <td>${formatTime(entry.datumUhrzeit)}</td>
                  <td>${escapeHtml(entry.fach)}</td>
                  <td>${escapeHtml(entry.materialName)}</td>
                  <td>${escapeHtml(entryWorkLabel(entry))}</td>
                  <td>${statusBadge(entry.status, entry.erledigt)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      ` : `<div class="empty">Für diese Auswahl gibt es noch keine Einträge.</div>`}
    </section>
    ${renderWeeklyProgressForAnimal(classId, animal.id)}
  `;
}

function renderWeeklyProgressOverview(classId) {
  const rows = buildWeeklyProgressRows(classId);
  if (!rows.length) return "";
  const animals = animalsForClass(classId).filter((animal) => animal.aktiv);
  const summaryRows = animals.map((animal) => {
    const animalRows = rows.filter((row) => row.animal.id === animal.id);
    return {
      animal,
      deutschPlanned: weeklyPagesForSummary(animalRows, "Deutsch", "planned"),
      deutschDone: weeklyPagesForSummary(animalRows, "Deutsch", "done"),
      mathePlanned: weeklyPagesForSummary(animalRows, "Mathe", "planned"),
      matheDone: weeklyPagesForSummary(animalRows, "Mathe", "done"),
      openCount: animalRows.filter((row) => normalizeSimpleWorkStatus(row.status) === "offen").length,
      partialCount: animalRows.filter((row) => normalizeSimpleWorkStatus(row.status) === "teilweise").length
    };
  });
  return `
    <section class="panel">
      <h2>Wochenplan-Fortschritt</h2>
      <p class="message">Hier werden die geplanten Arbeitsheftseiten aus dem aktuellen Wochenplan mit dem Fortschritt der Tiere verbunden.</p>
      <div class="table-scroll">
        <table>
          <thead><tr><th>Tier</th><th>Deutsch geplant</th><th>Deutsch fertig</th><th>Mathe geplant</th><th>Mathe fertig</th><th>offen</th><th>teilweise</th></tr></thead>
          <tbody>
            ${summaryRows.map((row) => `
              <tr>
                <td><button class="link-button" type="button" onclick="openProgressDetail('${row.animal.id}')">${teacherAnimalLabel(row.animal)}</button></td>
                <td>${escapeHtml(row.deutschPlanned || "–")}</td>
                <td>${escapeHtml(row.deutschDone || "–")}</td>
                <td>${escapeHtml(row.mathePlanned || "–")}</td>
                <td>${escapeHtml(row.matheDone || "–")}</td>
                <td>${row.openCount}</td>
                <td>${row.partialCount}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderWeeklyProgressForAnimal(classId, animalId) {
  const rows = buildWeeklyProgressRows(classId).filter((row) => row.animal.id === animalId);
  if (!rows.length) return "";
  return `
    <section class="panel">
      <h2>Wochenplan-Seiten</h2>
      <div class="table-scroll">
        <table>
          <thead><tr><th>Fach</th><th>Lehrwerk</th><th>Seite</th><th>Thema</th><th>Quelle</th><th>Status</th><th>Fortschritt</th></tr></thead>
          <tbody>
            ${rows.map((row) => `
              <tr>
                <td>${escapeHtml(row.subject)}</td>
                <td>${escapeHtml(row.workbookLabel)}</td>
                <td>${escapeHtml(row.pagesLabel)}</td>
                <td>${escapeHtml(row.topic || "–")}</td>
                <td>${escapeHtml(row.source)}</td>
                <td>${weeklyStatusBadge(row.status)}</td>
                <td>${row.progressLinked ? `<span class="badge done">übernommen</span>` : simpleWorkStatusBadge(row.status)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function buildWeeklyProgressRows(classId) {
  const plans = (state.weeklyPlans || []).filter((plan) => plan.classId === classId && plan.active !== false && weeklyPlanIsCurrent(plan));
  const animals = animalsForClass(classId).filter((animal) => animal.aktiv);
  return plans.flatMap((plan) => animals
    .filter((animal) => weeklyPlanAppliesToAnimal(plan, animal.id))
    .flatMap((animal) => WEEK_DAYS.flatMap((day) => weeklyPlanItemsForDay(plan, day, animal.id)
      .filter((item) => item.catalogItem)
      .map((item) => {
        const statusRecord = weeklyPlanStatusRecord(plan.id, animal.id, day, item.field);
        const catalog = item.catalogItem;
        return {
          plan,
          animal,
          day,
          item,
          subject: catalog.subject,
          workbookLabel: [catalog.workbook, String(catalog.part || "").replace("Teil ", "")].filter(Boolean).join(" "),
          pagesLabel: pageRangeLabel(catalog),
          topic: catalog.title || catalog.area || "",
          source: plan.weekLabel || plan.title,
          status: normalizeSimpleWorkStatus(statusRecord?.status || "offen"),
          progressLinked: statusRecord?.progressLinked === true,
          progressEntryId: statusRecord?.progressEntryId || ""
        };
      }))));
}

function weeklyPagesForSummary(rows, subject, mode) {
  const selected = rows.filter((row) => row.subject === subject && (mode === "planned" || row.progressLinked || normalizeSimpleWorkStatus(row.status) === "fertig"));
  return [...new Set(selected.map((row) => row.pagesLabel).filter(Boolean))].join(", ");
}

function renderToday() {
  const today = new Date().toDateString();
  const entries = entriesForActiveClass().filter((entry) => new Date(entry.datumUhrzeit).toDateString() === today).sort(sortNewest);
  return renderEntryTable("Heute", entries, false);
}

function renderHelp() {
  const entries = entriesForActiveClass()
    .filter((entry) => !entry.erledigt && (entry.status === "brauche Hilfe" || entry.status === "bitte kontrollieren"))
    .sort(sortNewest);
  if (!entries.length) {
    return `<section class="panel"><h2>Hilfe/Kontrolle</h2><div class="empty">Keine offenen Hilfe- oder Kontrollwünsche.</div></section>`;
  }

  return `
    <section class="panel">
      <h2>Hilfe/Kontrolle</h2>
      <div class="table-scroll">
        <table>
          <thead><tr><th>Zeit</th><th>Tier</th><th>Fach</th><th>Material</th><th>Seite/Aufgabe</th><th>Status</th><th>Aktion</th></tr></thead>
          <tbody>
            ${entries.map((entry) => `
              <tr>
                <td>${formatDateTime(entry.datumUhrzeit)}</td>
                <td>${entryAnimal(entry)}</td>
                <td>${escapeHtml(entry.fach)}</td>
                <td>${escapeHtml(entry.materialName)}</td>
                <td>${escapeHtml(entryWorkLabel(entry))}</td>
                <td>${statusBadge(entry.status, entry.erledigt)}</td>
                <td><button class="small-button" type="button" onclick="markEntryDone('${entry.id}')">als erledigt markieren</button></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

async function markEntryDone(entryId) {
  const entries = state.entries.map((entry) => entry.id === entryId ? { ...entry, erledigt: true } : entry);
  await persistAndRender({ ...state, entries });
}

function renderHistory() {
  const animalOptions = animalsForActiveClass().map((animal) => `<option value="${animal.id}">${escapeHtml(animal.tierEmoji)} ${escapeHtml(animal.tierName)}</option>`).join("");
  const materialOptions = [...new Set(materialsForActiveClass().map((material) => material.materialName))]
    .sort((a, b) => a.localeCompare(b, "de"))
    .map((name) => `<option value="${escapeAttribute(name)}">${escapeHtml(name)}</option>`)
    .join("");

  return `
    <section class="panel">
      <h2>Verlauf</h2>
      <form class="filters" onsubmit="event.preventDefault(); renderHistoryResults();">
        <label class="field">Tier<select class="select-input" id="filterAnimal"><option value="">Alle Tiere</option>${animalOptions}</select></label>
        <label class="field">Fach<select class="select-input" id="filterSubject"><option value="">Alle Fächer</option><option>Deutsch</option><option>Mathe</option></select></label>
        <label class="field">Material<select class="select-input" id="filterMaterial"><option value="">Alle Materialien</option>${materialOptions}</select></label>
        <label class="field">Status<select class="select-input" id="filterStatus"><option value="">Alle Status</option>${STATUSES.map((status) => `<option>${status}</option>`).join("")}</select></label>
        <label class="field">Zeitraum<select class="select-input" id="filterPeriod"><option value="all">alle</option><option value="today">heute</option><option value="week">diese Woche</option></select></label>
        <button class="primary" type="submit">Anzeigen</button>
      </form>
    </section>
    <section class="panel" id="historyResults">${renderHistoryRows(entriesForActiveClass().sort(sortNewest))}</section>
  `;
}

function renderHistoryResults() {
  const animal = document.querySelector("#filterAnimal").value;
  const subject = document.querySelector("#filterSubject").value;
  const material = document.querySelector("#filterMaterial").value;
  const status = document.querySelector("#filterStatus").value;
  const period = document.querySelector("#filterPeriod").value;
  const now = new Date();
  const entries = entriesForActiveClass().filter((entry) => {
    const date = new Date(entry.datumUhrzeit);
    if (animal && entry.tierID !== animal) return false;
    if (subject && entry.fach !== subject) return false;
    if (material && entry.materialName !== material) return false;
    if (status && entry.status !== status) return false;
    if (period === "today" && date.toDateString() !== now.toDateString()) return false;
    if (period === "week" && !sameWeek(date, now)) return false;
    return true;
  }).sort(sortNewest);
  document.querySelector("#historyResults").innerHTML = renderHistoryRows(entries);
}

function renderHistoryRows(entries) {
  if (!entries.length) return `<div class="empty">Für diese Auswahl gibt es keine Einträge.</div>`;
  return `
    <div class="table-scroll">
      <table>
        <thead><tr><th>Datum</th><th>Tier</th><th>Fach</th><th>Material</th><th>Seite/Aufgabe</th><th>Status</th></tr></thead>
        <tbody>
          ${entries.map((entry) => `
            <tr>
              <td>${formatDateTime(entry.datumUhrzeit)}</td>
              <td>${entryAnimal(entry)}</td>
              <td>${escapeHtml(entry.fach)}</td>
              <td>${escapeHtml(entry.materialName)}</td>
              <td>${escapeHtml(entryWorkLabel(entry))}</td>
              <td>${statusBadge(entry.status, entry.erledigt)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderEntryTable(title, entries, showDate) {
  if (!entries.length) return `<section class="panel"><h2>${title}</h2><div class="empty">Keine Einträge vorhanden.</div></section>`;
  return `
    <section class="panel">
      <h2>${title}</h2>
      <div class="table-scroll">
        <table>
          <thead><tr><th>${showDate ? "Datum" : "Uhrzeit"}</th><th>Tier</th><th>Fach</th><th>Material</th><th>Seite/Aufgabe</th><th>Status</th></tr></thead>
          <tbody>
            ${entries.map((entry) => `
              <tr>
                <td>${showDate ? formatDateTime(entry.datumUhrzeit) : formatTime(entry.datumUhrzeit)}</td>
                <td>${entryAnimal(entry)}</td>
                <td>${escapeHtml(entry.fach)}</td>
                <td>${escapeHtml(entry.materialName)}</td>
                <td>${escapeHtml(entryWorkLabel(entry))}</td>
                <td>${statusBadge(entry.status, entry.erledigt)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderClasses() {
  return `
    <section class="panel">
      <h2>Klassen & Gruppen</h2>
      <p class="message">Aktive Klasse für ${CHILD_AREA_NAME}: <strong>${escapeHtml(activeClass()?.name || "keine")}</strong></p>
      <div class="class-list">
        ${state.classes.map((classItem) => `
          <div class="manage-row">
            <input class="text-input" value="${escapeAttribute(classItem.name)}" aria-label="Name" onchange="updateClassItem('${classItem.id}', 'name', this.value)">
            <input class="text-input" value="${escapeAttribute(classItem.beschreibung || "")}" aria-label="Beschreibung" placeholder="Beschreibung optional" onchange="updateClassItem('${classItem.id}', 'beschreibung', this.value)">
            <button class="small-button" type="button" onclick="useClass('${classItem.id}')" ${classItem.id === state.activeClassId ? "disabled" : ""}>Als aktive Klasse verwenden</button>
            <button class="danger" type="button" onclick="deleteEntriesForClass('${classItem.id}')">Lernstände dieser Klasse löschen</button>
            <button class="danger" type="button" onclick="deleteClassItem('${classItem.id}')">Klasse löschen</button>
          </div>
        `).join("")}
      </div>
    </section>
    <section class="panel">
      <h2>Neue Klasse/Lerngruppe anlegen</h2>
      <form class="inline-form" onsubmit="addClassItem(event)">
        <label class="field">Name<input class="text-input" id="newClassName" autocomplete="off"></label>
        <label class="field">Beschreibung optional<input class="text-input" id="newClassDescription" autocomplete="off"></label>
        <button class="primary" type="submit">Anlegen</button>
      </form>
    </section>
  `;
}

async function useClass(classId) {
  await persistAndRender({ ...state, activeClassId: classId });
}

async function addClassItem(event) {
  event.preventDefault();
  const name = document.querySelector("#newClassName").value.trim();
  const beschreibung = document.querySelector("#newClassDescription").value.trim();
  if (!name) return;
  const classItem = createClassItem(name, beschreibung);
  await persistAndRender({
    ...state,
    activeClassId: classItem.id,
    classes: [...state.classes, classItem],
    animals: [...state.animals, ...createDefaultAnimals(classItem.id)],
    materials: [...state.materials, ...createDefaultMaterials(classItem.id)],
    workbookCatalog: [...(state.workbookCatalog || []), ...createDefaultWorkbookCatalog(classItem.id)]
  });
}

async function updateClassItem(classId, field, value) {
  const cleanValue = String(value).trim();
  if (field === "name" && !cleanValue) return render();
  const classes = state.classes.map((item) => item.id === classId ? { ...item, [field]: cleanValue } : item);
  await persist({ ...state, classes });
}

async function deleteEntriesForClass(classId) {
  if (!confirm("Alle Lernstände dieser Klasse löschen? Tiere und Materialien bleiben erhalten.")) return;
  await persistAndRender({ ...state, entries: state.entries.filter((entry) => entry.classId !== classId) });
}

async function deleteClassItem(classId) {
  if (state.classes.length <= 1) {
    alert("Die letzte Klasse kann nicht gelöscht werden.");
    return;
  }
  if (!confirm("Diese Klasse und alle dazugehörigen Lernstände werden gelöscht. Fortfahren?")) return;
  if (!confirm("Bitte bestätige: Klasse wirklich löschen.")) return;
  const classes = state.classes.filter((item) => item.id !== classId);
  const activeClassId = state.activeClassId === classId ? classes[0]?.id || null : state.activeClassId;
  await persistAndRender({
    ...state,
    activeClassId,
    classes,
    animals: state.animals.filter((item) => item.classId !== classId),
    materials: state.materials.filter((item) => item.classId !== classId),
    entries: state.entries.filter((item) => item.classId !== classId),
    goals: state.goals.filter((item) => item.classId !== classId),
    assessments: (state.assessments || []).filter((item) => item.classId !== classId),
    assessmentTasks: (state.assessmentTasks || []).filter((item) => item.classId !== classId),
    assessmentResults: (state.assessmentResults || []).filter((item) => item.classId !== classId),
    trainingCompletions: (state.trainingCompletions || []).filter((item) => item.classId !== classId),
    trainingHistory: (state.trainingHistory || []).filter((item) => item.classId !== classId),
    workbookCatalog: (state.workbookCatalog || []).filter((item) => item.classId !== classId),
    weeklyPlans: (state.weeklyPlans || []).filter((item) => item.classId !== classId),
    weeklyPlanStatuses: (state.weeklyPlanStatuses || []).filter((item) => item.classId !== classId)
  });
}

function renderResources() {
  const animals = animalsForActiveClass();
  return `
    <section class="panel">
      <h2>Tiere verwalten</h2>
      <p class="message">Bitte keine Kindernamen verwenden. Die Zuordnung Tier zu Kind bleibt analog.</p>
      ${animals.map((animal) => `
        <div class="editor-row">
          <input class="text-input emoji-input" value="${escapeAttribute(animal.tierEmoji)}" aria-label="Tier-Emoji" onchange="updateAnimal('${animal.id}', 'tierEmoji', this.value)">
          <input class="text-input" value="${escapeAttribute(animal.tierName)}" aria-label="Tiername" onchange="updateAnimal('${animal.id}', 'tierName', this.value)">
          <label class="toggle-label"><input type="checkbox" ${animal.aktiv ? "checked" : ""} onchange="updateAnimal('${animal.id}', 'aktiv', this.checked)"> aktiv</label>
          <button class="danger" type="button" onclick="deleteAnimal('${animal.id}')">löschen</button>
        </div>
      `).join("")}
      <form class="inline-form" onsubmit="addAnimal(event)">
        <input class="text-input emoji-input" id="newAnimalEmoji" placeholder="Emoji" aria-label="Neues Tier-Emoji">
        <input class="text-input" id="newAnimalName" placeholder="Neues Tier" aria-label="Neues Tier">
        <button class="primary" type="submit">Tier hinzufügen</button>
      </form>
    </section>
    <section class="panel">
      <h2>Materialien verwalten</h2>
      ${SUBJECTS.map((subject) => renderMaterialGroup(subject)).join("")}
    </section>
    ${renderGoalSettings()}
    ${renderProgressSettings()}
  `;
}

function renderMaterialPrint() {
  const tasks = printableTrainingTasks();
  const groups = ["Deutsch-Entdecker", "Mathe-Entdecker", "Forscher"];
  return `
    <section class="panel">
      <h2>Stickerbögen</h2>
      <p class="privacy-text">Die fertigen Stickerbögen sind als feste Vorlagen hinterlegt. Sie enthalten keine Vornamen, keine Tier-Zuordnung, keine Bewertungen und keine Punkte.</p>
      <p class="message"><strong>Druckhinweis:</strong> Bitte mit 100 % / tatsächliche Größe drucken. Nicht an Seite anpassen.</p>
      <div class="file-card-grid">
        ${STICKER_SHEETS.map((sheet) => `
          <article class="file-card">
            <h3>${escapeHtml(sheet.title)}</h3>
            <p>${escapeHtml(sheet.description)}</p>
            <div class="backup-actions">
              <a class="primary file-button" href="${escapeAttribute(sheet.href)}" target="_blank" rel="noopener">öffnen</a>
              <a class="secondary file-button" href="${escapeAttribute(sheet.href)}" download>herunterladen</a>
            </div>
          </article>
        `).join("")}
      </div>
      <div class="backup-actions">
        <button class="secondary" type="button" onclick="openAllStickerSheets()">Alle Stickerbögen öffnen</button>
      </div>
    </section>
    <section class="panel">
      <h2>Bearbeitbare Vorlagen</h2>
      <p class="message">Noch keine bearbeitbare Word-Vorlage hinterlegt. Die verbindlichen Druckvorlagen sind die festen Stickerbögen oben.</p>
    </section>
    <section class="panel">
      <h2>Aufgabenübersicht</h2>
      <p class="privacy-text">Digitale Liste der 45 aktiven Aufgaben. Diese Texte sind die Grundlage für Kinderbereich, Aufgabenfenster, Druckübersicht und Stickerbögen.</p>
      <div class="backup-actions">
        <button class="primary" type="button" onclick="printTrainingMaterial('all', 'overview')">Aufgabenüberblick drucken</button>
      </div>
      ${groups.map((group) => {
        const groupTasks = tasks.filter((task) => task.subcategory === group);
        return `
          <div class="material-task-overview">
            <h3>${escapeHtml(group)}</h3>
            ${groupTasks.map((task) => `
              <div class="material-task-line">
                <strong>${escapeHtml(task.code)}</strong>
                <span>${escapeHtml(stickerText(task))}</span>
              </div>
            `).join("")}
          </div>
        `;
      }).join("")}
    </section>
    <section class="panel">
      <details class="fallback-export">
        <summary>Erweiterte Druckoptionen</summary>
        <p class="message">Diese dynamische Druckfunktion ist nur eine Notlösung. Für Etiketten bitte die festen Stickerbögen verwenden, weil Browser-Ränder Etikettenpositionen verändern können.</p>
        <div class="material-print-mode">
          <label><input type="radio" name="materialPrintMode" value="overview" checked> Übersichtsliste</label>
          <label><input type="radio" name="materialPrintMode" value="stickers"> dynamischer Stickerbogen</label>
          <label><input type="radio" name="materialPrintMode" value="both"> beides</label>
        </div>
        <div class="sticker-select-tools">
          <button class="small-button" type="button" onclick="setStickerSelection('all')">alle auswählen</button>
          <button class="small-button" type="button" onclick="setStickerSelection('none')">Auswahl löschen</button>
          ${groups.map((group) => `<button class="small-button" type="button" onclick="setStickerSelection('${escapeAttribute(group)}')">${escapeHtml(group)}</button>`).join("")}
        </div>
        <div class="backup-actions material-print-actions">
          <button class="primary" type="button" onclick="printTrainingMaterial('all')">Alle Aufgaben dynamisch drucken</button>
          ${groups.map((group) => `<button class="secondary" type="button" onclick="printTrainingMaterial('${escapeAttribute(group)}')">Nur ${escapeHtml(group)}</button>`).join("")}
          <button class="secondary" type="button" onclick="printSelectedTrainingMaterial()">Ausgewählte Aufgaben dynamisch drucken</button>
        </div>
        <div class="sticker-task-select-grid">
          ${tasks.map((task) => `
            <label class="sticker-task-select">
              <input type="checkbox" class="sticker-task-checkbox" value="${escapeAttribute(task.code)}">
              <span class="sticker-select-icon">${escapeHtml(stickerIconForTask(task))}</span>
              <strong>${escapeHtml(task.code)}</strong>
              <span>${escapeHtml(stickerText(task))}</span>
              <em>${escapeHtml(task.subcategory || "")}</em>
            </label>
          `).join("")}
        </div>
      </details>
      <div id="printArea" class="print-area" aria-hidden="true"></div>
    </section>
  `;
}

function openAllStickerSheets() {
  STICKER_SHEETS.forEach((sheet) => window.open(sheet.href, "_blank", "noopener"));
}

function printableTrainingTasks() {
  return (state.trainingTasks || [])
    .filter((task) => task.active !== false && task.area === "OGS/Zuhause" && ["Deutsch-Entdecker", "Mathe-Entdecker", "Forscher"].includes(task.subcategory))
    .sort((a, b) => String(a.subcategory || "").localeCompare(String(b.subcategory || ""), "de") || String(a.code || "").localeCompare(String(b.code || ""), "de", { numeric: true }));
}

function setStickerSelection(mode) {
  document.querySelectorAll(".sticker-task-checkbox").forEach((checkbox) => {
    const task = (state.trainingTasks || []).find((item) => item.code === checkbox.value);
    checkbox.checked = mode === "all" || (task && task.subcategory === mode);
  });
}

function selectedMaterialPrintMode() {
  return document.querySelector("input[name='materialPrintMode']:checked")?.value || "overview";
}

function printSelectedTrainingMaterial() {
  const selectedCodes = [...document.querySelectorAll(".sticker-task-checkbox:checked")].map((item) => item.value);
  const tasks = printableTrainingTasks().filter((task) => selectedCodes.includes(task.code));
  if (!tasks.length) {
    globalMessage = "Bitte wähle mindestens eine Aufgabe aus.";
    render();
    return;
  }
  printTrainingMaterialTasks(tasks, selectedMaterialPrintMode());
}

function printTrainingMaterial(group, mode = selectedMaterialPrintMode()) {
  const tasks = printableTrainingTasks().filter((task) => group === "all" || task.subcategory === group);
  printTrainingMaterialTasks(tasks, mode);
}

function printTrainingMaterialTasks(tasks, mode) {
  const printArea = document.querySelector("#printArea");
  if (!printArea) return;
  if (!tasks.length) {
    globalMessage = "Für diese Auswahl gibt es keine Aufgaben.";
    render();
    return;
  }
  const normalizedMode = ["overview", "stickers", "both"].includes(mode) ? mode : "overview";
  const sections = [];
  if (normalizedMode === "overview" || normalizedMode === "both") sections.push(renderTrainingOverviewPrint(tasks));
  if (normalizedMode === "stickers" || normalizedMode === "both") sections.push(renderTrainingStickerPrint(tasks));
  printArea.innerHTML = sections.join("");
  window.print();
}

function printSelectedTrainingStickers() {
  const selectedCodes = [...document.querySelectorAll(".sticker-task-checkbox:checked")].map((item) => item.value);
  const tasks = printableTrainingTasks().filter((task) => selectedCodes.includes(task.code));
  if (!tasks.length) {
    globalMessage = "Bitte wähle mindestens eine Aufgabe aus.";
    render();
    return;
  }
  printTrainingStickerTasks(tasks);
}

function printTrainingStickers(group) {
  const tasks = printableTrainingTasks().filter((task) => group === "all" || task.subcategory === group);
  printTrainingStickerTasks(tasks);
}

function printTrainingStickerTasks(tasks) {
  printTrainingMaterialTasks(tasks, "stickers");
}

function renderTrainingOverviewPrint(tasks) {
  const groups = ["Deutsch-Entdecker", "Mathe-Entdecker", "Forscher"];
  return `
    <section class="training-overview-print-page">
      <header class="training-print-header">
        <h1>Meine Trainingsaufgaben</h1>
        <p>Aufgabenüberblick für dein Lerntagebuch</p>
      </header>
      ${groups.map((group) => {
        const groupTasks = tasks.filter((task) => task.subcategory === group);
        if (!groupTasks.length) return "";
        return `
          <section class="training-print-group ${stickerClassForTask({ subcategory: group })}">
            <h2>${escapeHtml(group)}</h2>
            <div class="training-overview-list">
              ${groupTasks.map((task) => `
                <div class="training-overview-row">
                  <strong>${escapeHtml(task.code)}</strong>
                  <span>${escapeHtml(stickerText(task))}</span>
                  <span class="overview-check" aria-hidden="true">☐</span>
                </div>
              `).join("")}
            </div>
          </section>
        `;
      }).join("")}
    </section>
  `;
}

function renderTrainingStickerPrint(tasks) {
  return `
    <div class="sticker-print-page">
      ${tasks.map((task) => `
        <article class="task-sticker ${stickerClassForTask(task)}">
          <div class="task-sticker-code">${escapeHtml(task.code)}</div>
          <div class="task-sticker-text">${escapeHtml(stickerText(task))}</div>
          <div class="task-sticker-icon" aria-hidden="true">${escapeHtml(stickerIconForTask(task))}</div>
          <div class="task-sticker-area">${escapeHtml(task.subcategory || "")}</div>
        </article>
      `).join("")}
    </div>
  `;
}

function stickerText(task) {
  return String(task.analogText || task.shortText || task.text || task.title || "").trim();
}

function stickerClassForTask(task) {
  if (task.subcategory === "Deutsch-Entdecker") return "deutsch-sticker";
  if (task.subcategory === "Mathe-Entdecker") return "mathe-sticker";
  return "forscher-sticker";
}

function stickerIconForTask(task) {
  if (task.symbol) return task.symbol;
  const code = String(task.code || "");
  const title = `${task.title || ""} ${task.text || ""}`.toLowerCase();
  if (code.startsWith("D-10") || title.includes("buch") || title.includes("les")) return "📖";
  if (code.startsWith("D-")) return "✏️";
  if (code === "M-02") return "➕";
  if (code === "M-03") return "➖";
  if (code === "M-05") return "🔷";
  if (code.startsWith("M-")) return "🔢";
  if (code === "F-03") return "💧";
  if (code === "F-04") return "🧲";
  if (code === "F-05") return "👂";
  if (code === "F-06" || code === "F-07") return "🌿";
  if (code === "F-11") return "🌦️";
  if (code === "F-12") return "☀️";
  if (code === "F-14") return "🧍";
  if (code.startsWith("F-")) return "🔎";
  return task.symbol || "⭐";
}

function renderAnimalMapping() {
  const animals = animalsForActiveClass().filter((animal) => animal.aktiv);
  return `
    <section class="panel">
      <h2>Tier-Zuordnung</h2>
      <p class="privacy-text">Optional kann die Lehrkraft hier einen Vornamen zum Tier hinterlegen. Diese Zuordnung ist nur im PIN-geschützten Bereich sichtbar. Im Kinderbereich, in QR-Codes und in anonymisierten Exporten erscheinen weiterhin nur Tiere.</p>
      <label class="toggle-label mapping-toggle">
        <input type="checkbox" ${state.teacherShowFirstNames ? "checked" : ""} onchange="updateTeacherNameVisibility(this.checked)">
        Vornamen im Lehrkraftbereich anzeigen
      </label>
    </section>
    <section class="panel">
      <h2>Vornamen verwalten</h2>
      <div class="table-scroll">
        <table>
          <thead><tr><th>Tier</th><th>Vorname optional</th><th>Anzeige im Lehrkraftbereich</th></tr></thead>
          <tbody>
            ${animals.map((animal) => `
              <tr>
                <td><strong>${escapeHtml(animal.tierEmoji)} ${escapeHtml(animal.tierName)}</strong></td>
                <td><input class="text-input" value="${escapeAttribute(animal.firstName || "")}" autocomplete="off" placeholder="Vorname optional" onchange="updateAnimalFirstName('${animal.id}', this.value)"></td>
                <td>${state.teacherShowFirstNames && animal.firstName ? `${escapeHtml(animal.tierEmoji)} ${escapeHtml(animal.tierName)} · ${escapeHtml(animal.firstName)}` : `${escapeHtml(animal.tierEmoji)} ${escapeHtml(animal.tierName)}`}</td>
              </tr>
            `).join("") || `<tr><td colspan="3">Keine aktiven Tiere vorhanden.</td></tr>`}
          </tbody>
        </table>
      </div>
      <p class="message">Backups enthalten die lokal gespeicherte Zuordnung, damit sie auf einem Hauptgerät wiederhergestellt werden kann. QR-Codes enthalten weiterhin nur die anonyme Tier-ID.</p>
    </section>
  `;
}

async function updateTeacherNameVisibility(showNames) {
  await persistAndRender({ ...state, teacherShowFirstNames: Boolean(showNames) });
}

async function updateAnimalFirstName(animalId, value) {
  const firstName = String(value || "").trim();
  const animals = state.animals.map((animal) => animal.id === animalId ? { ...animal, firstName } : animal);
  await persist({ ...state, animals });
}

function renderGoalSettings() {
  const goals = goalsForActiveClass().sort((a, b) => a.fach.localeCompare(b.fach, "de") || a.material.localeCompare(b.material, "de"));
  return `
    <section class="panel">
      <h2>Soll-Seiten</h2>
      <p class="message">Lege pro Fach und Material eine aktuelle Soll-Seite fest. Diese Werte werden nur in der ${TEACHER_AREA_NAME} angezeigt.</p>
      ${goals.map((goal) => `
        <div class="editor-row goal-row">
          <select class="select-input" onchange="updateGoal('${goal.id}', 'fach', this.value)">
            ${SUBJECTS.map((subject) => `<option value="${subject}" ${goal.fach === subject ? "selected" : ""}>${subject}</option>`).join("")}
          </select>
          <select class="select-input" aria-label="Material" onchange="updateGoal('${goal.id}', 'material', this.value)">
            ${goalMaterialOptions(goal.fach, goal.material)}
          </select>
          <input class="text-input number-input" type="number" min="1" value="${goal.sollSeite}" aria-label="Soll-Seite" onchange="updateGoal('${goal.id}', 'sollSeite', this.value)">
          <input class="text-input" type="date" value="${escapeAttribute(goal.gueltigAbDatum || formatFileDate(new Date()))}" aria-label="gültig ab" onchange="updateGoal('${goal.id}', 'gueltigAbDatum', this.value)">
          <input class="text-input" value="${escapeAttribute(goal.notiz || "")}" aria-label="Notiz optional" placeholder="Notiz optional" onchange="updateGoal('${goal.id}', 'notiz', this.value)">
          <button class="danger" type="button" onclick="deleteGoal('${goal.id}')">löschen</button>
        </div>
      `).join("") || `<p class="message">Noch keine Soll-Seite festgelegt.</p>`}
      <form class="inline-form" onsubmit="addGoal(event)">
        <label class="field">Fach
          <select class="select-input" id="newGoalSubject" onchange="refreshNewGoalMaterialOptions()">${SUBJECTS.map((subject) => `<option>${subject}</option>`).join("")}</select>
        </label>
        <label class="field">Material
          <select class="select-input" id="newGoalMaterial">${goalMaterialOptions(SUBJECTS[0])}</select>
        </label>
        <label class="field">Soll-Seite
          <input class="text-input" id="newGoalPage" type="number" min="1" inputmode="numeric">
        </label>
        <label class="field">gültig ab
          <input class="text-input" id="newGoalDate" type="date" value="${formatFileDate(new Date())}">
        </label>
        <label class="field">Notiz optional
          <input class="text-input" id="newGoalNote" autocomplete="off">
        </label>
        <button class="primary" type="submit">Soll-Seite speichern</button>
      </form>
    </section>
  `;
}

function renderProgressSettings() {
  const settings = state.progressSettings || DEFAULT_PROGRESS_SETTINGS;
  return `
    <section class="panel">
      <h2>Fortschritts-Einstellungen</h2>
      <form class="filters" onsubmit="event.preventDefault();">
        <label class="field">Tage bis „länger kein Eintrag“
          <input class="text-input" type="number" min="1" value="${settings.staleDays}" onchange="updateProgressSetting('staleDays', this.value)">
        </label>
        <label class="field">„braucht Blick“ unter Gruppenschnitt
          <input class="text-input" type="number" min="1" value="${settings.groupLookThreshold}" onchange="updateProgressSetting('groupLookThreshold', this.value)">
        </label>
        <label class="field">„deutlicher Abstand“ unter Gruppenschnitt
          <input class="text-input" type="number" min="1" value="${settings.groupFarThreshold}" onchange="updateProgressSetting('groupFarThreshold', this.value)">
        </label>
        <label class="field">„weiter voraus“ über Gruppenschnitt
          <input class="text-input" type="number" min="1" value="${settings.aheadThreshold}" onchange="updateProgressSetting('aheadThreshold', this.value)">
        </label>
        <label class="toggle-label"><input type="checkbox" ${settings.showGroupComparison ? "checked" : ""} onchange="updateProgressSetting('showGroupComparison', this.checked)"> Gruppenschnitt anzeigen</label>
        <label class="toggle-label"><input type="checkbox" ${settings.showGoalComparison ? "checked" : ""} onchange="updateProgressSetting('showGoalComparison', this.checked)"> Soll-Seite anzeigen</label>
      </form>
    </section>
  `;
}

function renderMaterialGroup(subject) {
  const materials = materialsForActiveClass().filter((material) => material.fach === subject);
  return `
    <div class="resource-group">
      <h3>${subject}</h3>
      ${materials.map((material) => `
        <div class="editor-row material-row">
          <input class="text-input" value="${escapeAttribute(material.materialName)}" aria-label="Material" onchange="updateMaterial('${material.id}', 'materialName', this.value)">
          <label class="toggle-label"><input type="checkbox" ${material.aktiv ? "checked" : ""} onchange="updateMaterial('${material.id}', 'aktiv', this.checked)"> aktiv</label>
          <button class="danger" type="button" onclick="deleteMaterial('${material.id}')">löschen</button>
        </div>
      `).join("")}
      <form class="inline-form" onsubmit="addMaterial(event, '${subject}')">
        <input class="text-input" id="newMaterial${subject}" placeholder="Neues Material" aria-label="Neues Material">
        <button class="primary" type="submit">Material hinzufügen</button>
      </form>
    </div>
  `;
}

async function updateAnimal(animalId, field, value) {
  const animals = state.animals.map((animal) => {
    if (animal.id !== animalId) return animal;
    if (field === "aktiv") return { ...animal, aktiv: Boolean(value) };
    const cleanValue = String(value).trim();
    return cleanValue ? { ...animal, [field]: cleanValue } : animal;
  });
  await persist({ ...state, animals });
}

async function addAnimal(event) {
  event.preventDefault();
  const tierEmoji = document.querySelector("#newAnimalEmoji").value.trim();
  const tierName = document.querySelector("#newAnimalName").value.trim();
  if (!tierEmoji || !tierName) return;
  await persistAndRender({
    ...state,
    animals: [...state.animals, { id: makeId(), classId: state.activeClassId, tierName, tierEmoji, aktiv: true, qrToken: makeUniqueQrToken() }]
  });
}

async function deleteAnimal(animalId) {
  if (!confirm("Dieses Tier löschen? Bestehende Einträge bleiben im Verlauf mit dem gespeicherten Tier-Pseudonym erhalten.")) return;
  await persistAndRender({ ...state, animals: state.animals.filter((animal) => animal.id !== animalId) });
}

async function updateMaterial(materialId, field, value) {
  const materials = state.materials.map((material) => {
    if (material.id !== materialId) return material;
    if (field === "aktiv") return { ...material, aktiv: Boolean(value) };
    const cleanValue = String(value).trim();
    return cleanValue ? { ...material, [field]: cleanValue } : material;
  });
  await persist({ ...state, materials });
}

async function addMaterial(event, subject) {
  event.preventDefault();
  const input = document.querySelector(`#newMaterial${subject}`);
  const materialName = input.value.trim();
  if (!materialName) return;
  await persistAndRender({
    ...state,
    materials: [...state.materials, { id: makeId(), classId: state.activeClassId, fach: subject, materialName, aktiv: true }]
  });
}

async function deleteMaterial(materialId) {
  if (!confirm("Dieses Material löschen? Bestehende Einträge bleiben im Verlauf erhalten.")) return;
  await persistAndRender({ ...state, materials: state.materials.filter((material) => material.id !== materialId) });
}

async function addGoal(event) {
  event.preventDefault();
  const fach = document.querySelector("#newGoalSubject").value;
  const material = document.querySelector("#newGoalMaterial").value.trim();
  const sollSeite = Number(document.querySelector("#newGoalPage").value);
  const gueltigAbDatum = document.querySelector("#newGoalDate").value || formatFileDate(new Date());
  const notiz = document.querySelector("#newGoalNote").value.trim();
  if (!material || !Number.isInteger(sollSeite) || sollSeite <= 0) return;
  await persistAndRender({
    ...state,
    goals: [...state.goals, { id: makeId(), classId: state.activeClassId, fach, material, sollSeite, gueltigAbDatum, notiz }]
  });
}

async function updateGoal(goalId, field, value) {
  const goals = state.goals.map((goal) => {
    if (goal.id !== goalId) return goal;
    if (field === "fach") {
      const cleanSubject = String(value).trim();
      const firstMaterial = materialsForActiveClass().find((material) => material.fach === cleanSubject && material.aktiv)?.materialName || goal.material;
      return cleanSubject ? { ...goal, fach: cleanSubject, material: firstMaterial } : goal;
    }
    if (field === "sollSeite") {
      const sollSeite = Number(value);
      return Number.isInteger(sollSeite) && sollSeite > 0 ? { ...goal, sollSeite } : goal;
    }
    const cleanValue = String(value).trim();
    if (field === "material" && !cleanValue) return goal;
    return { ...goal, [field]: cleanValue };
  });
  if (field === "fach") {
    await persistAndRender({ ...state, goals });
  } else {
    await persist({ ...state, goals });
  }
}

async function deleteGoal(goalId) {
  if (!confirm("Diese Soll-Seite löschen?")) return;
  await persistAndRender({ ...state, goals: state.goals.filter((goal) => goal.id !== goalId) });
}

function goalMaterialOptions(subject, selected = "") {
  const materials = materialsForActiveClass()
    .filter((material) => material.fach === subject && material.aktiv)
    .map((material) => material.materialName)
    .sort((a, b) => a.localeCompare(b, "de"));
  const options = materials.length ? materials : [selected].filter(Boolean);
  return options.map((name) => `<option value="${escapeAttribute(name)}" ${name === selected ? "selected" : ""}>${escapeHtml(name)}</option>`).join("");
}

function refreshNewGoalMaterialOptions() {
  const subject = document.querySelector("#newGoalSubject")?.value || SUBJECTS[0];
  const select = document.querySelector("#newGoalMaterial");
  if (!select) return;
  select.innerHTML = goalMaterialOptions(subject);
}

async function updateProgressSetting(field, value) {
  const current = state.progressSettings || DEFAULT_PROGRESS_SETTINGS;
  const progressSettings = { ...current };
  if (typeof value === "boolean") {
    progressSettings[field] = value;
  } else {
    const number = Number(value);
    if (!Number.isFinite(number) || number < 1) return;
    progressSettings[field] = Math.round(number);
  }
  await persist({ ...state, progressSettings });
}

async function addAssessment(event) {
  event.preventDefault();
  const titel = document.querySelector("#newAssessmentTitle").value.trim();
  const fach = document.querySelector("#newAssessmentSubject").value;
  const bereich = document.querySelector("#newAssessmentArea").value.trim();
  const datum = document.querySelector("#newAssessmentDate").value || formatFileDate(new Date());
  const typ = document.querySelector("#newAssessmentType").value;
  const bewertungsart = document.querySelector("#newAssessmentGrading").value;
  const maxPunkteValue = Number(document.querySelector("#newAssessmentMaxPoints")?.value || 0);
  const notizKurz = document.querySelector("#newAssessmentNote").value.trim();
  const tasks = parseAssessmentTasksInput(document.querySelector("#newAssessmentTasks")?.value || "");
  if (!titel) return;
  const timestamp = nowIso();
  const taskMaxPoints = tasks.reduce((sum, task) => sum + Number(task.maxPoints || 0), 0);
  const item = {
    id: makeId(),
    classId: state.activeClassId,
    titel,
    fach,
    bereich,
    datum,
    typ,
    bewertungsart,
    maxPunkte: assessmentGradingNeedsPoints(bewertungsart) ? (taskMaxPoints || (maxPunkteValue > 0 ? maxPunkteValue : "")) : "",
    notizKurz,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  const assessmentTasks = tasks.map((task, index) => ({
    ...task,
    id: makeId(),
    assessmentId: item.id,
    classId: state.activeClassId,
    number: task.number || String(index + 1),
    createdAt: timestamp,
    updatedAt: timestamp
  }));
  assessmentFormOpen = false;
  assessmentEditorId = item.id;
  await persistAndRender({
    ...state,
    assessments: [...(state.assessments || []), item],
    assessmentTasks: [...(state.assessmentTasks || []), ...assessmentTasks]
  });
}

async function updateAssessment(assessmentId, field, value) {
  const timestamp = nowIso();
  const assessments = (state.assessments || []).map((item) => (
    item.id === assessmentId ? { ...item, [field]: String(value).trim(), updatedAt: timestamp } : item
  ));
  await persist({ ...state, assessments });
}

async function deleteAssessment(assessmentId) {
  if (!confirm("Diese Lernzielkontrolle und alle zugehörigen Ergebnisse werden gelöscht. Fortfahren?")) return;
  if (assessmentEditorId === assessmentId) assessmentEditorId = "";
  await persistAndRender({
    ...state,
    assessments: (state.assessments || []).filter((item) => item.id !== assessmentId),
    assessmentTasks: (state.assessmentTasks || []).filter((item) => item.assessmentId !== assessmentId),
    assessmentResults: (state.assessmentResults || []).filter((item) => item.assessmentId !== assessmentId)
  });
}

function openAssessmentForm() {
  assessmentFormOpen = true;
  assessmentEditorId = "";
  render();
}

function closeAssessmentForm() {
  assessmentFormOpen = false;
  render();
}

function openAssessmentResults(assessmentId) {
  assessmentFormOpen = false;
  assessmentEditorId = assessmentId;
  render();
}

function closeAssessmentResults() {
  assessmentEditorId = "";
  render();
}

function toggleAssessmentMaxPoints(gradingType) {
  const wrapper = document.querySelector("#newAssessmentMaxWrap");
  if (wrapper) wrapper.hidden = !assessmentGradingNeedsPoints(gradingType);
}

async function updateAssessmentResult(assessmentId, animalId, field, value) {
  const assessment = (state.assessments || []).find((item) => item.id === assessmentId);
  const animal = state.animals.find((item) => item.id === animalId);
  if (!assessment || !animal) return;
  const timestamp = nowIso();
  const existing = assessmentResultFor(assessmentId, animalId);
  const cleanValue = cleanAssessmentResultValue(field, value);
  const result = enrichAssessmentResult(assessment, {
    ...(existing || {
      id: makeId(),
      assessmentId,
      classId: assessment.classId,
      animalId,
      tierNameSnapshot: animal.tierName,
      tierEmojiSnapshot: animal.tierEmoji,
      punkte: "",
      maxPunkteSnapshot: assessment.maxPunkte || "",
      note: "",
      symbol: "",
      status: "eingetragen",
      createdAt: timestamp
    }),
    [field]: cleanValue,
    maxPunkteSnapshot: assessmentMaxPoints(assessment) || existing?.maxPunkteSnapshot || "",
    updatedAt: timestamp
  });
  const others = (state.assessmentResults || []).filter((item) => !(item.assessmentId === assessmentId && item.animalId === animalId));
  await persist({ ...state, assessmentResults: withAssessmentPercentiles(assessmentId, [...others, result]) });
}

async function updateAssessmentTaskPoint(assessmentId, animalId, taskId, value) {
  const assessment = (state.assessments || []).find((item) => item.id === assessmentId);
  const animal = state.animals.find((item) => item.id === animalId);
  if (!assessment || !animal) return;
  const timestamp = nowIso();
  const existing = assessmentResultFor(assessmentId, animalId);
  const cleanValue = cleanAssessmentResultValue("punkte", value);
  const taskPoints = { ...(existing?.taskPoints || {}) };
  if (cleanValue === "") delete taskPoints[taskId];
  else taskPoints[taskId] = cleanValue;
  const result = enrichAssessmentResult(assessment, {
    ...(existing || {
      id: makeId(),
      assessmentId,
      classId: assessment.classId,
      animalId,
      tierNameSnapshot: animal.tierName,
      tierEmojiSnapshot: animal.tierEmoji,
      note: "",
      symbol: "",
      status: "eingetragen",
      createdAt: timestamp
    }),
    taskPoints,
    updatedAt: timestamp
  });
  const others = (state.assessmentResults || []).filter((item) => !(item.assessmentId === assessmentId && item.animalId === animalId));
  await persist({ ...state, assessmentResults: withAssessmentPercentiles(assessmentId, [...others, result]) });
}

function cleanAssessmentResultValue(field, value) {
  if (field === "punkte") {
    if (String(value).trim() === "") return "";
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : "";
  }
  if (field === "status") return ASSESSMENT_RESULT_STATUSES.includes(value) ? value : "eingetragen";
  if (field === "symbol") return ASSESSMENT_SYMBOLS.includes(value) ? value : "";
  if (field === "finalNote" || field === "note") return ["", "1", "2", "3", "4", "5", "6"].includes(String(value)) ? String(value) : "";
  if (field === "finalRating") return ["", "sehr gut", "gut", "befriedigend", "ausreichend", "mangelhaft", "ungenügend"].includes(String(value)) ? String(value) : "";
  return String(value || "").trim();
}

function confirmAssessmentResultsSaved() {
  globalMessage = "Ergebnisse wurden gespeichert.";
  render();
}

function renderAssessmentPrintView(assessmentId) {
  currentPrintType = `assessment:${assessmentId}`;
  printReturnTab = "assessments";
  screen = "printView";
  render();
}

function renderAssessmentSummaryPrintView() {
  currentPrintType = "assessmentSummary";
  printReturnTab = "assessments";
  screen = "printView";
  render();
}

function renderBackup() {
  const settings = {
    enabled: state.multiDeviceReminderEnabled !== false,
    time: state.multiDeviceReminderTime || "13:00"
  };
  return `
    <section class="panel">
      <h2>Datensicherung</h2>
      <p class="privacy-text">Die Lernstände werden lokal auf diesem iPad/in diesem Browser gespeichert. GitHub speichert nur die App-Dateien, nicht die Einträge. Erstelle regelmäßig ein Backup und speichere es an einem geschützten Ort.</p>
      <div class="backup-actions">
        <button class="primary" type="button" onclick="exportActiveClassBackup()">Backup aktive Klasse speichern</button>
        <button class="primary" type="button" onclick="exportFullBackup()">Gesamtbackup speichern</button>
        <button class="secondary" type="button" onclick="exportActiveClassCsv()">CSV aktive Klasse speichern</button>
      </div>
      <p class="message">Letzte lokale Speicherung: ${state.lastSavedAt ? formatDateTime(state.lastSavedAt) : "noch nicht gespeichert"}</p>
    </section>
    <section class="panel">
      <h2>Saubere Weitergabeversion</h2>
      <p class="privacy-text">Erstellt eine eigenständige ZIP der App für andere Lehrkräfte. Diese ZIP enthält nur App-Struktur, Aufgabenlisten, Arbeitsheft-Kataloge und Druckmaterialien. Lokale Klassen, Tiere, Vornamen, Fortschritte, Wochenpläne, Lernzielkontrollen und Bewertungen werden nicht hineingeschrieben.</p>
      <p class="message"><strong>Wichtig:</strong> Persönliche Daten werden nur über ein separates Backup weitergegeben oder importiert. Die Weitergabeversion startet bei einer anderen Lehrkraft mit dem Einrichtungsassistenten.</p>
      <div class="backup-actions">
        <button class="primary" type="button" onclick="exportCleanDistributionVersion()">Saubere Weitergabeversion erstellen</button>
      </div>
    </section>
    <section class="panel">
      <h2>Mehrere Geräte verwenden</h2>
      <p class="privacy-text">Du kannst mehrere iPads verwenden. Die Geräte synchronisieren sich nicht automatisch. Nutze regelmäßig den Backup-Export und die Funktion „Backup zusammenführen“. Beim Zusammenführen werden neue Einträge ergänzt. Vorhandene Einträge bleiben erhalten.</p>
      <p class="message"><strong>Wichtig:</strong> Die Geräte synchronisieren sich nicht von allein. Der Abgleich funktioniert über Backup-Dateien. Nutze auf dem Hauptgerät immer „Backup zusammenführen“, nicht „Backup wiederherstellen“, damit keine Einträge verloren gehen.</p>
      <div class="backup-actions">
        <button class="primary" type="button" onclick="exportFullBackup()">Backup exportieren</button>
        <button class="primary recommended-action" type="button" onclick="openBackupFilePicker()">Lernpost zusammenführen</button>
        <button class="primary recommended-action" type="button" onclick="openBackupFilePicker()">Backup zusammenführen</button>
        <button class="danger" type="button" onclick="openBackupFilePicker()">Backup wiederherstellen</button>
        <button class="secondary" type="button" onclick="startMultiDeviceSyncGuide()">Mehrgeräte-Abgleich starten</button>
      </div>
      <input class="visually-hidden" id="backupFile" type="file" accept="application/json,.json" onchange="handleBackupFileSelected(event)">
      <p class="message">Automatische Erinnerung um ${escapeHtml(settings.time)} Uhr bedeutet: Die App erinnert dich an den Abgleich. Sie kann ohne Cloud-Anbindung keine Dateien von anderen iPads automatisch holen.</p>
      ${renderPendingBackupChoice()}
      ${renderMergeReport()}
      ${renderSyncGuide()}
    </section>
    <section class="panel">
      <h2>Täglicher Mehrgeräte-Hinweis</h2>
      <form class="filters" onsubmit="event.preventDefault();">
        <label class="toggle-label"><input type="checkbox" ${settings.enabled ? "checked" : ""} onchange="updateMultiDeviceReminderSetting('multiDeviceReminderEnabled', this.checked)"> aktiv</label>
        <label class="field">Uhrzeit
          <input class="text-input" type="time" value="${escapeAttribute(settings.time)}" onchange="updateMultiDeviceReminderSetting('multiDeviceReminderTime', this.value)">
        </label>
      </form>
    </section>
    ${renderFactoryResetPanel()}
  `;
}

function renderFactoryResetPanel() {
  return `
    <section class="panel danger-panel">
      <h2>App zurücksetzen</h2>
      <p class="privacy-text"><strong>Achtung:</strong> Dadurch werden alle lokal gespeicherten Daten auf diesem Gerät gelöscht. Bitte erstelle vorher ein Backup. Diese Aktion kann nicht rückgängig gemacht werden.</p>
      <div class="backup-actions">
        <button class="primary" type="button" onclick="exportFullBackup()">Backup jetzt erstellen</button>
      </div>
      <div class="reset-form">
        <label class="toggle-label">
          <input id="factoryResetBackupDone" type="checkbox">
          Ich habe vorher ein Backup erstellt oder möchte trotz Warnung zurücksetzen.
        </label>
        <label class="field">Lehrkraft-PIN
          <input id="factoryResetPin" class="text-input" type="password" inputmode="numeric" autocomplete="current-password" placeholder="PIN eingeben">
        </label>
        <label class="field">Bestätigungswort
          <input id="factoryResetWord" class="text-input" autocomplete="off" placeholder="ZURÜCKSETZEN">
        </label>
        <p class="message">Möchtest du die App wirklich auf Werkseinstellung zurücksetzen? Gib zur Sicherheit die Lehrkraft-PIN und das Wort <strong>ZURÜCKSETZEN</strong> ein.</p>
        <button class="danger" type="button" onclick="factoryResetApp()">Alle lokalen Daten zurücksetzen</button>
        ${factoryResetMessage ? `<p class="message warning-message">${escapeHtml(factoryResetMessage)}</p>` : ""}
      </div>
    </section>
  `;
}

async function factoryResetApp() {
  const backupConfirmed = document.querySelector("#factoryResetBackupDone")?.checked;
  const pin = document.querySelector("#factoryResetPin")?.value || "";
  const confirmationWord = (document.querySelector("#factoryResetWord")?.value || "").trim();

  if (!backupConfirmed) {
    factoryResetMessage = "Bitte bestätige zuerst, dass du ein Backup erstellt hast oder bewusst ohne Backup zurücksetzt.";
    render();
    return;
  }
  if ((await hashSecret(pin, "pin")) !== state.pinHash) {
    factoryResetMessage = "Die Lehrkraft-PIN stimmt nicht.";
    render();
    return;
  }
  if (confirmationWord !== "ZURÜCKSETZEN") {
    factoryResetMessage = "Bitte gib das Bestätigungswort ZURÜCKSETZEN ein.";
    render();
    return;
  }
  if (!confirm("Möchtest du die App wirklich auf Werkseinstellung zurücksetzen?")) return;
  if (!confirm("Letzte Warnung: Alle lokalen Daten auf diesem Gerät werden gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.")) return;

  await storage.clear();
  state = emptyState();
  screen = "setup";
  teacherTab = "overview";
  childDraft = {};
  pendingBackup = null;
  lastMergeReport = null;
  factoryResetMessage = "";
  globalMessage = "";
  pendingRecoveryKey = "";
  syncGuideStep = 0;
  stopScanner();
  render();
}

function renderPendingBackupChoice() {
  if (!pendingBackup) return "";
  const type = pendingBackupType();
  const isLernpost = type === "lernpost";
  return `
    <div class="backup-decision">
      <h3>${isLernpost ? "Lernpost gefunden" : "Was möchtest du tun?"}</h3>
      <p class="message">Ausgewählte Datei: <strong>${escapeHtml(pendingBackup.name)}</strong></p>
      <div class="backup-actions">
        <button class="primary recommended-action" type="button" onclick="finishBackupImport('merge')">${isLernpost ? "Lernpost zusammenführen" : "Backup zusammenführen"}</button>
        ${isLernpost ? "" : `<button class="danger" type="button" onclick="finishBackupImport('restore')">Backup wiederherstellen</button>`}
        <button class="secondary" type="button" onclick="cancelPendingBackup()">Abbrechen</button>
      </div>
      <p class="message">${isLernpost ? "Die Lernpost ergänzt nur neue Kindereingaben. Vorhandene Daten bleiben erhalten." : "Empfohlen ist „Backup zusammenführen“. Dabei werden nur neue Daten ergänzt; vorhandene Daten bleiben erhalten."}</p>
    </div>
  `;
}

function pendingBackupType() {
  try {
    return JSON.parse(pendingBackup?.content || "{}")?.type || "";
  } catch {
    return "";
  }
}

function renderMergeReport() {
  if (!lastMergeReport) return "";
  return `
    <div class="merge-report">
      <h3>Backup wurde zusammengeführt.</h3>
      <div class="status-grid">
        <div>neu ergänzte Klassen</div><strong>${lastMergeReport.addedClasses}</strong>
        <div>neu ergänzte Tiere</div><strong>${lastMergeReport.addedAnimals}</strong>
        <div>neu ergänzte Materialien</div><strong>${lastMergeReport.addedMaterials}</strong>
        <div>neu ergänzte Arbeitsstand-Einträge</div><strong>${lastMergeReport.addedEntries}</strong>
        <div>neu ergänzte Lernzielkontrollen</div><strong>${lastMergeReport.addedAssessments || 0}</strong>
        <div>neu ergänzte LZK-Aufgaben</div><strong>${lastMergeReport.addedAssessmentTasks || 0}</strong>
        <div>neu ergänzte Testergebnisse</div><strong>${lastMergeReport.addedAssessmentResults || 0}</strong>
        <div>neu ergänzte Trainingsaufgaben</div><strong>${lastMergeReport.addedTrainingTasks || 0}</strong>
        <div>neu ergänzte Trainings-Bearbeitungen</div><strong>${lastMergeReport.addedTrainingCompletions || 0}</strong>
        <div>neu ergänzte Trainings-Änderungen</div><strong>${lastMergeReport.addedTrainingHistory || 0}</strong>
        <div>neu ergänzte Lehrwerk-Einträge</div><strong>${lastMergeReport.addedWorkbookCatalog || 0}</strong>
        <div>neu ergänzte Wochenpläne</div><strong>${lastMergeReport.addedWeeklyPlans || 0}</strong>
        <div>neu ergänzte Wochenplan-Status</div><strong>${lastMergeReport.addedWeeklyPlanStatuses || 0}</strong>
        <div>übersprungene doppelte Einträge</div><strong>${lastMergeReport.skippedDuplicateEntries}</strong>
        <div>übersprungene doppelte Lernzielkontrollen</div><strong>${lastMergeReport.skippedDuplicateAssessments || 0}</strong>
        <div>übersprungene doppelte LZK-Aufgaben</div><strong>${lastMergeReport.skippedDuplicateAssessmentTasks || 0}</strong>
        <div>übersprungene doppelte Testergebnisse</div><strong>${lastMergeReport.skippedDuplicateAssessmentResults || 0}</strong>
        <div>übersprungene doppelte Trainings-Bearbeitungen</div><strong>${lastMergeReport.skippedDuplicateTrainingCompletions || 0}</strong>
        <div>übersprungene doppelte Trainings-Änderungen</div><strong>${lastMergeReport.skippedDuplicateTrainingHistory || 0}</strong>
        <div>übersprungene doppelte Lehrwerk-Einträge</div><strong>${lastMergeReport.skippedDuplicateWorkbookCatalog || 0}</strong>
        <div>übersprungene doppelte Wochenpläne</div><strong>${lastMergeReport.skippedDuplicateWeeklyPlans || 0}</strong>
        <div>übersprungene doppelte Wochenplan-Status</div><strong>${lastMergeReport.skippedDuplicateWeeklyPlanStatuses || 0}</strong>
        <div>Konflikte</div><strong>${lastMergeReport.conflicts.length}</strong>
        <div>Zeitpunkt</div><strong>${formatDateTime(lastMergeReport.mergedAt)}</strong>
      </div>
      ${lastMergeReport.conflicts.length ? `<p class="message">${lastMergeReport.conflicts.map(escapeHtml).join("<br>")}</p>` : ""}
    </div>
  `;
}

function renderSyncGuide() {
  if (!syncGuideStep) return "";
  const steps = [
    "Sammle die Backups der anderen iPads.",
    "Importiere jedes Backup einzeln mit „Backup zusammenführen“.",
    "Erstelle danach auf dem Hauptgerät ein neues Gesamtbackup."
  ];
  return `
    <div class="sync-guide">
      <h3>Mehrgeräte-Abgleich</h3>
      <div class="sync-steps">
        ${steps.map((step, index) => `<div class="${syncGuideStep === index + 1 ? "active" : ""}"><strong>Schritt ${index + 1}</strong><span>${escapeHtml(step)}</span></div>`).join("")}
      </div>
      <div class="backup-actions">
        <button class="primary recommended-action" type="button" onclick="openBackupFilePicker()">${syncGuideStep === 2 ? "Nächstes Backup zusammenführen" : "Backup zusammenführen"}</button>
        <button class="secondary" type="button" onclick="advanceSyncGuide()">Weiter</button>
        <button class="primary" type="button" onclick="exportFullBackup()">Gesamtbackup exportieren</button>
        <button class="secondary" type="button" onclick="finishSyncGuide()">Fertig</button>
      </div>
    </div>
  `;
}

function openBackupFilePicker() {
  const input = document.querySelector("#backupFile");
  if (input) {
    input.value = "";
    input.click();
  }
}

async function handleBackupFileSelected(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    pendingBackup = { name: file.name, content: await file.text() };
    globalMessage = "";
  } catch {
    globalMessage = "Backup-Datei konnte nicht gelesen werden.";
  }
  render();
}

function cancelPendingBackup() {
  pendingBackup = null;
  render();
}

async function finishBackupImport(mode) {
  if (!pendingBackup) return;
  try {
    const backup = JSON.parse(pendingBackup.content);
    if (mode === "restore") {
      if (!confirm("Alle aktuellen lokalen Daten werden durch die Backup-Datei ersetzt. Das kann nicht rückgängig gemacht werden. Fortfahren?")) return;
      await persist(restoreFullBackup(backup));
      lastMergeReport = null;
      globalMessage = "Backup wurde wiederhergestellt.";
    } else {
      const result = mergeBackupData(state, backup);
      await persist(result.state);
      lastMergeReport = result.report;
      globalMessage = backup.type === "lernpost" ? "Lernpost wurde zusammengeführt." : "Backup wurde zusammengeführt.";
    }
    pendingBackup = null;
  } catch (error) {
    globalMessage = error.message || "Backup konnte nicht importiert werden.";
  }
  render();
}

async function updateMultiDeviceReminderSetting(field, value) {
  await persist({
    ...state,
    [field]: field === "multiDeviceReminderEnabled" ? Boolean(value) : String(value || "13:00")
  });
  render();
}

function startMultiDeviceSyncGuide() {
  syncGuideStep = 1;
  teacherTab = "backup";
  screen = "teacher";
  render();
}

function advanceSyncGuide() {
  syncGuideStep = Math.min(3, syncGuideStep + 1);
  render();
}

function finishSyncGuide() {
  syncGuideStep = 0;
  render();
}

function startMultiDeviceReminderTimer() {
  if (syncAssistantTimer) window.clearInterval(syncAssistantTimer);
  checkMultiDeviceReminder();
  syncAssistantTimer = window.setInterval(checkMultiDeviceReminder, 60 * 1000);
}

function checkMultiDeviceReminder() {
  if (!state.setupComplete || syncAssistantVisible) return;
  if (!shouldShowMultiDeviceReminder()) return;
  syncAssistantVisible = true;
  render();
}

function shouldShowMultiDeviceReminder() {
  if (state.multiDeviceReminderEnabled === false) return false;
  if (screen !== "start" && screen !== "teacher") return false;
  if (Date.now() < syncAssistantSnoozedUntil) return false;
  const today = formatFileDate(new Date());
  if (state.multiDeviceReminderLastDismissedDate === today) return false;
  const reminderMinutes = parseReminderTime(state.multiDeviceReminderTime || "13:00");
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return currentMinutes >= reminderMinutes;
}

function parseReminderTime(value) {
  const match = String(value || "13:00").match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return 13 * 60;
  const hours = Math.min(23, Math.max(0, Number(match[1])));
  const minutes = Math.min(59, Math.max(0, Number(match[2])));
  return hours * 60 + minutes;
}

function appendSyncAssistant() {
  if (!syncAssistantVisible) return;
  app.insertAdjacentHTML("beforeend", renderSyncAssistantOverlay());
}

function renderSyncAssistantOverlay() {
  return `
    <div class="sync-assistant-overlay" role="dialog" aria-modal="true" aria-labelledby="syncAssistantTitle">
      <section class="sync-assistant-card">
        <h2 id="syncAssistantTitle">Mehrgeräte-Abgleich</h2>
        <p class="privacy-text">Es ist ${escapeHtml(state.multiDeviceReminderTime || "13:00")} Uhr. Wenn du heute mehrere iPads benutzt hast, führe jetzt den Backup-Abgleich durch. Exportiere zuerst die Backups der anderen Geräte und importiere sie auf dem Hauptgerät mit „Backup zusammenführen“. Dadurch werden neue Einträge ergänzt, ohne vorhandene Daten zu überschreiben.</p>
        <div class="backup-actions">
          <button class="primary recommended-action" type="button" onclick="assistantMergeBackup()">Backup zusammenführen</button>
          <button class="secondary" type="button" onclick="assistantExportBackup()">Backup exportieren</button>
          <button class="secondary" type="button" onclick="dismissSyncAssistantToday()">Heute nicht mehr erinnern</button>
          <button class="secondary" type="button" onclick="snoozeSyncAssistant()">Später erinnern</button>
        </div>
      </section>
    </div>
  `;
}

function assistantMergeBackup() {
  syncAssistantVisible = false;
  screen = "teacher";
  teacherTab = "backup";
  render();
  window.setTimeout(openBackupFilePicker, 0);
}

function assistantExportBackup() {
  syncAssistantVisible = false;
  screen = "teacher";
  teacherTab = "backup";
  render();
  exportFullBackup();
}

async function dismissSyncAssistantToday() {
  syncAssistantVisible = false;
  await persist({
    ...state,
    multiDeviceReminderLastDismissedDate: formatFileDate(new Date())
  });
  render();
}

function snoozeSyncAssistant() {
  syncAssistantVisible = false;
  syncAssistantSnoozedUntil = Date.now() + 30 * 60 * 1000;
  render();
}

function renderExcelExport() {
  return `
    <section class="panel">
      <h2>Excel-Export</h2>
      <p class="privacy-text">Erstellt eine gestaltete Excel-Datei als Lernstands-Planer. Standardmäßig werden nur Tier-Pseudonyme exportiert. Interne Exporte mit Vornamen müssen bewusst gewählt werden.</p>
      <div class="backup-actions">
        <button class="primary" type="button" onclick="exportBeautifulExcel('active')">Schöne Excel-Datei aktive Klasse</button>
        <button class="primary" type="button" onclick="exportBeautifulExcel('all')">Schöne Excel-Datei alle Klassen</button>
        <button class="secondary" type="button" onclick="exportBeautifulExcel('today')">Schöne Tagesliste</button>
        <button class="secondary" type="button" onclick="exportBeautifulExcel('help')">Schöne Hilfe-/Kontrollliste</button>
      </div>
      <details class="fallback-export">
        <summary>Interner Export mit Vornamen</summary>
        <p class="message">Nur für die interne Arbeit der Lehrkraft. Diese Dateien enthalten die optional gespeicherten Vornamen und sollten geschützt abgelegt werden.</p>
        <div class="backup-actions">
          <button class="primary" type="button" onclick="exportBeautifulExcel('active', true)">Interne Excel-Datei aktive Klasse</button>
          <button class="primary" type="button" onclick="exportBeautifulExcel('all', true)">Interne Excel-Datei alle Klassen</button>
          <button class="secondary" type="button" onclick="exportExcelActiveClass(true)">Interne CSV aktive Klasse</button>
          <button class="secondary" type="button" onclick="exportExcelAllClasses(true)">Interne CSV alle Klassen</button>
        </div>
      </details>
      <p class="message">Die Datei wird lokal im Browser als echte .xlsx-Arbeitsmappe erzeugt. Falls das nicht klappt, erscheint ein Hinweis für den einfachen CSV-Export.</p>
      <details class="fallback-export">
        <summary>Einfache CSV-Dateien als Fallback</summary>
        <div class="backup-actions">
          <button class="secondary" type="button" onclick="exportExcelActiveClass()">CSV aktive Klasse</button>
          <button class="secondary" type="button" onclick="exportExcelAllClasses()">CSV alle Klassen</button>
          <button class="secondary" type="button" onclick="exportExcelToday()">CSV heute</button>
          <button class="secondary" type="button" onclick="exportExcelHelpControl()">CSV Hilfe/Kontrolle</button>
        </div>
      </details>
    </section>
  `;
}

function renderPrintPdf() {
  return `
    <section class="panel">
      <h2>Druckansicht / PDF</h2>
      <p class="privacy-text">Öffnet eine gestaltete Druckansicht direkt aus der App. Im Druckdialog kann die Übersicht auch als PDF gespeichert werden. Es werden keine Kindernamen, Fotos oder KI-Daten angezeigt.</p>
      <div class="backup-actions">
        <button class="primary" type="button" onclick="renderPrintView('today')">Tagesübersicht drucken</button>
        <button class="primary" type="button" onclick="renderPrintView('week')">Wochenübersicht drucken</button>
        <button class="secondary" type="button" onclick="renderPrintView('helpControl')">Hilfe & Kontrolle drucken</button>
        <button class="secondary" type="button" onclick="renderPrintView('progress')">Fortschritt drucken</button>
        <button class="secondary" type="button" onclick="renderPrintView('training')">Trainingszeit drucken</button>
        <button class="primary" type="button" onclick="renderPrintView('report')">Gesamtbericht drucken</button>
      </div>
      <p class="message">Die Druckansicht liest nur die lokal gespeicherten Daten und verändert keine Lernstände.</p>
    </section>
  `;
}

function renderPrintView(type) {
  currentPrintType = type;
  printReturnTab = "printPdf";
  screen = "printView";
  render();
}

function closePrintView() {
  currentPrintType = "";
  screen = "teacher";
  teacherTab = printReturnTab || "printPdf";
  printReturnTab = "printPdf";
  render();
}

function renderPrintScreen() {
  const classItem = activeClass();
  const className = classItem?.name || "keine aktive Klasse";
  const generatedAt = new Date();
  const context = buildPrintContext(classItem, generatedAt);
  const titles = {
    today: "Lernstand-Kompass – Tagesübersicht",
    week: "Lernstand-Kompass – Wochenübersicht",
    helpControl: "Offene Hilfe und Kontrolle",
    progress: "Fortschritt und Arbeitstempo",
    training: "Trainingszeit",
    report: "Lernstand-Kompass – Gesamtbericht",
    weeklyPlan: "Mein Wochenplan",
    assessmentSummary: "Tests & Lernzielkontrollen – Gesamtübersicht"
  };
  const type = currentPrintType || "today";
  const assessmentId = type.startsWith("assessment:") ? type.split(":")[1] : "";
  const assessment = assessmentId ? (state.assessments || []).find((item) => item.id === assessmentId) : null;
  return `
    <style>${printViewCss(type !== "weeklyPlan")}</style>
    <div class="print-toolbar" aria-label="Druckwerkzeuge">
      <strong>${escapeHtml(assessment ? assessment.titel : titles[type] || "Druckansicht")}</strong>
      <button type="button" onclick="window.print()">Drucken / Als PDF speichern</button>
      <button type="button" onclick="closePrintView()">Zurück</button>
      <button type="button" onclick="closePrintView()">Fenster schließen</button>
    </div>
    <main class="print-page">
      ${type === "today" ? renderPrintToday(context, className, generatedAt) : ""}
      ${type === "week" ? renderPrintWeek(context, className, generatedAt) : ""}
      ${type === "helpControl" ? renderPrintHelpControl(context, className, generatedAt) : ""}
      ${type === "progress" ? renderPrintProgress(context, className, generatedAt) : ""}
      ${type === "training" ? renderPrintTraining(context, className, generatedAt) : ""}
      ${type === "report" ? renderPrintReport(context, className, generatedAt) : ""}
      ${type === "weeklyPlan" ? renderPrintWeeklyPlan(className, generatedAt) : ""}
      ${assessment ? renderPrintAssessment(assessment, className, generatedAt) : ""}
      ${type === "assessmentSummary" ? renderPrintAssessmentSummary(className, generatedAt) : ""}
    </main>
  `;
}

function buildPrintContext(classItem, generatedAt) {
  const classId = classItem?.id || state.activeClassId;
  const animals = state.animals.filter((animal) => animal.classId === classId && animal.aktiv);
  const entries = state.entries.filter((entry) => entry.classId === classId);
  const todayStart = new Date(generatedAt);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = addDays(todayStart, 1);
  const weekStart = startOfWeek(generatedAt);
  const weekEnd = addDays(weekStart, 7);
  const todayEntries = entries.filter((entry) => {
    const date = new Date(entry.datumUhrzeit);
    return date >= todayStart && date < todayEnd;
  }).sort(sortNewest);
  const weekEntries = entries.filter((entry) => {
    const date = new Date(entry.datumUhrzeit);
    return date >= weekStart && date < weekEnd;
  }).sort(sortNewest);
  const openEntries = entries
    .filter((entry) => !entry.erledigt && (entry.status === "brauche Hilfe" || entry.status === "bitte kontrollieren"))
    .sort(sortNewest);
  const staleAnimals = animals.filter((animal) => {
    const latest = entries.filter((entry) => entry.tierID === animal.id).sort(sortNewest)[0];
    return !latest || daysSince(latest.datumUhrzeit) >= (state.progressSettings || DEFAULT_PROGRESS_SETTINGS).staleDays;
  });
  const progressRows = sortProgressRows(buildProgressRows({
    classId,
    fach: "",
    material: "",
    animalId: "",
    period: "week"
  }), "animal");
  const overviewRows = buildBeautifulOverviewRows(animals, entries);
  const trainingRows = buildTrainingRowsForClass(classId).filter((row) => row.status === "bearbeitet");
  return {
    classId,
    animals,
    entries,
    todayEntries,
    weekEntries,
    openEntries,
    staleAnimals,
    progressRows,
    overviewRows,
    trainingRows
  };
}

function renderPrintToday(context, className, generatedAt) {
  return `
    ${printHero("Lernstand-Kompass – Tagesübersicht", `Klasse: ${className} · Datum: ${formatGermanDate(generatedAt)}`)}
    ${renderPrintKpis([
      ["Einträge heute", context.todayEntries.length, "neutral"],
      ["Offene Hilfe", context.openEntries.filter((entry) => entry.status === "brauche Hilfe").length, "help"],
      ["Offene Kontrolle", context.openEntries.filter((entry) => entry.status === "bitte kontrollieren").length, "check"],
      ["Länger kein Eintrag", context.staleAnimals.length, "stale"]
    ])}
    <section class="print-section">
      <h2>Heute bearbeitet</h2>
      ${context.todayEntries.length ? renderPrintEntryTable(context.todayEntries, ["Uhrzeit", "Tier", "Fach", "Material", "Seite/Aufgabe", "Status"], false) : printEmpty("Heute wurden noch keine Lernstände eingetragen.")}
    </section>
  `;
}

function renderPrintWeek(context, className, generatedAt) {
  return `
    ${printHero("Lernstand-Kompass – Wochenübersicht", `Klasse: ${className} · erstellt am ${formatGermanDate(generatedAt)} um ${formatTime(generatedAt)} Uhr`)}
    ${renderPrintKpis([
      ["Tiere mit Eintrag", new Set(context.weekEntries.map((entry) => entry.tierID)).size, "neutral"],
      ["Einträge diese Woche", context.weekEntries.length, "neutral"],
      ["Offene Hilfe", context.openEntries.filter((entry) => entry.status === "brauche Hilfe").length, "help"],
      ["Offene Kontrolle", context.openEntries.filter((entry) => entry.status === "bitte kontrollieren").length, "check"],
      ["Deutsch Durchschnitt", formatAverage(latestPagesByAnimalSubject(context.entries, "Deutsch")), "deutsch"],
      ["Mathe Durchschnitt", formatAverage(latestPagesByAnimalSubject(context.entries, "Mathe")), "mathe"]
    ])}
    ${renderPrintOverviewSection(context.overviewRows)}
  `;
}

function renderPrintHelpControl(context, className, generatedAt) {
  return `
    ${printHero("Offene Hilfe und Kontrolle", `Klasse: ${className} · erstellt am ${formatGermanDate(generatedAt)} um ${formatTime(generatedAt)} Uhr`)}
    <section class="print-section">
      ${context.openEntries.length ? renderPrintHelpCards(context.openEntries) : printEmpty("Keine offenen Hilfe- oder Kontrollwünsche.")}
    </section>
  `;
}

function renderPrintProgress(context, className, generatedAt) {
  return `
    ${printHero("Fortschritt und Arbeitstempo", `Klasse: ${className} · Zeitraum: diese Woche · erstellt am ${formatGermanDate(generatedAt)} um ${formatTime(generatedAt)} Uhr`)}
    <section class="print-section">
      ${renderPrintProgressTable(context.progressRows)}
    </section>
  `;
}

function renderPrintTraining(context, className, generatedAt) {
  const rows = context.trainingRows.sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0));
  return `
    ${printHero("Trainingszeit", `Klasse: ${className} · erstellt am ${formatGermanDate(generatedAt)} um ${formatTime(generatedAt)} Uhr`)}
    <section class="print-section">
      ${rows.length ? `
        <table class="planner-table training-print-table">
          <thead>
            <tr><th>Tier</th><th>Bereich</th><th>Unterbereich</th><th>Aufgaben-Code</th><th>Fach</th><th>Aufgabentext</th><th>Datum</th><th>Uhrzeit</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${rows.map((row) => `
              <tr>
                <td class="print-animal">${teacherAnimalLabel(row)}</td>
                <td>${escapeHtml(row.trainingArea)}</td>
                <td>${escapeHtml(row.subcategory || "–")}</td>
                <td>${escapeHtml(row.taskCode)}</td>
                <td>${escapeHtml(row.subject)}</td>
                <td>${escapeHtml(row.taskText)}</td>
                <td>${row.completedAt ? formatGermanDate(row.completedAt) : "–"}</td>
                <td>${row.completedAt ? formatTime(row.completedAt) : "–"}</td>
                <td>${printStatusPill("bearbeitet")}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      ` : printEmpty("Noch keine Trainingsaufgaben bearbeitet.")}
    </section>
  `;
}

function renderPrintReport(context, className, generatedAt) {
  const dataRows = context.entries.slice().sort(sortNewest).slice(0, 20);
  return `
    ${printHero("Lernstand-Kompass – Gesamtbericht", `Klasse: ${className} · erstellt am ${formatGermanDate(generatedAt)} um ${formatTime(generatedAt)} Uhr`)}
    ${renderPrintKpis([
      ["Aktive Tiere", context.animals.length, "neutral"],
      ["Einträge diese Woche", context.weekEntries.length, "neutral"],
      ["Einträge heute", context.todayEntries.length, "neutral"],
      ["Offene Hilfe", context.openEntries.filter((entry) => entry.status === "brauche Hilfe").length, "help"],
      ["Offene Kontrolle", context.openEntries.filter((entry) => entry.status === "bitte kontrollieren").length, "check"],
      ["Länger kein Eintrag", context.staleAnimals.length, "stale"]
    ])}
    ${renderPrintOverviewSection(context.overviewRows)}
    <div class="page-break"></div>
    ${printSectionTitle("Hilfe & Kontrolle")}
    ${context.openEntries.length ? renderPrintHelpCards(context.openEntries) : printEmpty("Keine offenen Hilfe- oder Kontrollwünsche.")}
    <div class="page-break"></div>
    ${printSectionTitle("Fortschritt")}
    ${renderPrintProgressTable(context.progressRows)}
    ${dataRows.length ? `
      <div class="page-break"></div>
      ${printSectionTitle("Kurze Rohdatenübersicht")}
      ${renderPrintEntryTable(dataRows, ["Datum", "Tier", "Fach", "Material", "Seite/Aufgabe", "Status"], true)}
    ` : ""}
  `;
}

function renderPrintAssessment(assessment, className, generatedAt) {
  const animals = state.animals.filter((animal) => animal.classId === assessment.classId && animal.aktiv).sort((a, b) => a.tierName.localeCompare(b.tierName, "de"));
  const results = animals.map((animal) => assessmentResultFor(assessment.id, animal.id) || {
    assessmentId: assessment.id,
    classId: assessment.classId,
    animalId: animal.id,
    tierNameSnapshot: animal.tierName,
    tierEmojiSnapshot: animal.tierEmoji,
    punkte: "",
    maxPunkteSnapshot: assessment.maxPunkte || "",
    note: "",
    symbol: "",
    status: ""
  });
  const counts = assessmentResultCounts(results.filter((result) => result.status));
  return `
    ${printHero("Tests & Lernzielkontrollen", `Klasse/Lerngruppe: ${className} · erstellt am ${formatGermanDate(generatedAt)} um ${formatTime(generatedAt)} Uhr`)}
    <section class="print-section">
      <h2>${escapeHtml(assessment.titel)}</h2>
      <div class="assessment-print-meta">
        <span><strong>Fach:</strong> ${escapeHtml(assessment.fach)}</span>
        <span><strong>Bereich:</strong> ${escapeHtml(assessment.bereich || "–")}</span>
        <span><strong>Datum:</strong> ${assessment.datum ? formatGermanDate(assessment.datum) : "–"}</span>
        <span><strong>Typ:</strong> ${escapeHtml(assessment.typ)}</span>
        <span><strong>Bewertungsart:</strong> ${escapeHtml(assessment.bewertungsart)}</span>
        ${assessment.maxPunkte ? `<span><strong>Max. Punkte:</strong> ${escapeHtml(assessment.maxPunkte)}</span>` : ""}
      </div>
    </section>
    <section class="print-section">
      ${renderAssessmentResultPrintTable(assessment, results)}
    </section>
    ${renderPrintKpis([
      ["eingetragen", counts.eingetragen, "neutral"],
      ["fehlt", counts.fehlt, "stale"],
      ["nachschreiben", counts.nachschreiben, "help"],
      ["nicht teilgenommen", counts["nicht teilgenommen"], "check"]
    ])}
  `;
}

function renderAssessmentResultPrintTable(assessment, results) {
  const showPoints = assessmentUsesPoints(assessment);
  const showNote = assessmentUsesNote(assessment);
  const showSymbol = assessmentUsesSymbol(assessment);
  const headers = ["Tier"];
  if (showPoints) headers.push("Punkte", "Prozent", "Bewertungsvorschlag", "Endgültige Bewertung", "Notenvorschlag", "Endgültige Note");
  if (showNote) headers.push("Note");
  if (showSymbol) headers.push("Symbol");
  headers.push("Status", "Bemerkung");
  return `
    <table class="planner-table assessment-print-table">
      <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
      <tbody>
        ${results.length ? results.map((result) => `
          <tr>
            <td class="print-animal">${escapeHtml(assessmentAnimalLabel(result))}</td>
            ${showPoints ? `<td>${escapeHtml(formatAssessmentPoints(result))}</td><td>${escapeHtml(formatAssessmentPercent(result))}</td><td>${escapeHtml(result.suggestedRating || "–")}</td><td>${escapeHtml(result.finalRating || "–")}</td><td>${escapeHtml(result.suggestedNote || "–")}</td><td>${escapeHtml(result.finalNote || "–")}</td>` : ""}
            ${showNote ? `<td>${escapeHtml(result.note || "–")}</td>` : ""}
            ${showSymbol ? `<td>${escapeHtml(result.symbol || "–")}</td>` : ""}
            <td>${escapeHtml(result.status || "–")}</td>
            <td>${escapeHtml(result.remark || "–")}</td>
          </tr>
        `).join("") : `<tr><td colspan="${headers.length}">Noch keine Ergebnisse eingetragen.</td></tr>`}
      </tbody>
    </table>
  `;
}

function renderPrintAssessmentSummary(className, generatedAt) {
  const assessments = assessmentsForActiveClass().sort((a, b) => String(a.datum || "").localeCompare(String(b.datum || "")));
  const animals = animalsForActiveClass().filter((animal) => animal.aktiv).sort((a, b) => a.tierName.localeCompare(b.tierName, "de"));
  return `
    ${printHero("Tests & Lernzielkontrollen – Gesamtübersicht", `Klasse/Lerngruppe: ${className} · erstellt am ${formatGermanDate(generatedAt)} um ${formatTime(generatedAt)} Uhr`)}
    <section class="print-section">
      ${assessments.length ? `
        <table class="planner-table assessment-summary-table">
          <thead>
            <tr>
              <th>Tier</th>
              ${assessments.map((assessment) => `<th>${escapeHtml(assessmentMatrixHeader(assessment))}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${animals.map((animal) => `
              <tr>
                <td class="print-animal">${teacherAnimalLabel(animal)}</td>
                ${assessments.map((assessment) => `<td>${escapeHtml(formatAssessmentMatrixValue(assessment, assessmentResultFor(assessment.id, animal.id)))}</td>`).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
      ` : printEmpty("Noch keine Tests oder Lernzielkontrollen angelegt.")}
    </section>
  `;
}

function renderPrintWeeklyPlan(className) {
  const plan = currentWeeklyPrintPlan;
  const options = currentWeeklyPrintOptions || {};
  if (!plan) return printEmpty("Es ist kein Wochenplan für den Druck ausgewählt.");
  const animalIds = options.target === "all" ? [] : options.animalIds || [];
  const animals = animalIds.map((id) => animalsForActiveClass().find((animal) => animal.id === id)).filter(Boolean);
  const printTargets = options.target === "all" || !animals.length ? [{ animal: null }] : animals.map((animal) => ({ animal }));
  return printTargets.map(({ animal }, index) => `
    ${index > 0 ? `<div class="page-break"></div>` : ""}
    <section class="weekly-print-page ${options.variant === "compact" ? "compact" : ""}">
      ${printHero("Mein Wochenplan", [
        `Klasse: ${className}`,
        weeklyPlanPeriodLabel(plan),
        animal ? `Mein Tier: ${animal.tierEmoji} ${animal.tierName}${options.showFirstNames && animal.firstName ? ` · ${animal.firstName}` : ""}` : ""
      ].filter(Boolean).join(" · "))}
      <div class="weekly-print-days">
        ${(options.days || WEEK_DAYS).map((day) => renderWeeklyPrintDay(plan, day, animal, options)).join("")}
      </div>
      <p class="weekly-print-note">Dieser Ausdruck enthält keine Bewertungen, Noten oder internen Bemerkungen.</p>
    </section>
  `).join("");
}

function renderWeeklyPrintDay(plan, day, animal, options) {
  const items = weeklyPlanItemsForDay(plan, day, animal?.id || "");
  const grouped = {
    Deutsch: items.filter((item) => item.label === "Deutsch"),
    Mathe: items.filter((item) => item.label === "Mathe"),
    Extra: options.showExtra === false ? [] : items.filter((item) => item.label === "Extra")
  };
  return `
    <article class="weekly-print-day">
      <h2>${escapeHtml(day)}</h2>
      ${renderWeeklyPrintSubject("📘", "Deutsch", grouped.Deutsch, options)}
      ${renderWeeklyPrintSubject("🔢", "Mathe", grouped.Mathe, options)}
      ${options.showExtra !== false ? renderWeeklyPrintSubject("⭐", "Extra", grouped.Extra, options) : ""}
    </article>
  `;
}

function renderWeeklyPrintSubject(icon, label, items, options) {
  const checkbox = options.showCheckboxes ? `<span class="weekly-print-checkbox">☐</span>` : "";
  return `
    <div class="weekly-print-subject">
      <h3>${icon} ${escapeHtml(label)}</h3>
      ${items.length ? items.map((item) => `
        <div class="weekly-print-task">
          ${checkbox}
          <div>
            <strong>${escapeHtml(item.text)}</strong>
            ${options.variant !== "short" && options.showTheme !== false && item.detail ? `<span>${escapeHtml(item.detail)}</span>` : ""}
          </div>
        </div>
      `).join("") : `<p>–</p>`}
    </div>
  `;
}

function renderPrintOverviewSection(rows) {
  return `
    <section class="print-section">
      <h2>Übersicht pro Tier</h2>
      <table class="planner-table">
        <thead>
          <tr><th>Tier</th><th>Deutsch letzter Stand</th><th>Mathe letzter Stand</th><th>letzte Aktivität</th><th>offener Status</th><th>Hinweis</th></tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              <td class="print-animal">${teacherAnimalLabel(row.animal)}</td>
              <td>${escapeHtml(row.deutsch)}</td>
              <td>${escapeHtml(row.mathe)}</td>
              <td>${escapeHtml(row.latestActivity)}</td>
              <td>${printStatusPill(row.status)}</td>
              <td>${printHintPill(row.hint)}</td>
            </tr>
          `).join("") || `<tr><td colspan="6">Noch keine Tiere vorhanden.</td></tr>`}
        </tbody>
      </table>
    </section>
  `;
}

function renderPrintProgressTable(rows) {
  const visibleRows = rows.filter((row) => row.entryCount || row.openEntry || row.hints.some((hint) => hint !== "kein Eintrag"));
  if (!visibleRows.length) return printEmpty("Für diese Woche gibt es noch keine Fortschrittseinträge.");
  return `
    <table class="planner-table progress-print-table">
      <thead>
        <tr>
          <th>Tier</th><th>Fach</th><th>Material</th><th>erste Seite</th><th>aktuelle Seite</th><th>Fortschritt</th>
          <th>Gruppenschnitt</th><th>Abstand zur Gruppe</th><th>letzte Aktivität</th><th>Hinweis</th>
        </tr>
      </thead>
      <tbody>
        ${visibleRows.map((row) => `
          <tr>
            <td class="print-animal">${teacherAnimalLabel(row.animal)}</td>
            <td><span class="subject-chip ${row.fach === "Deutsch" ? "deutsch" : "mathe"}">${escapeHtml(row.fach)}</span></td>
            <td>${escapeHtml(row.material)}</td>
            <td>${row.firstEntry ? escapeHtml(entryWorkLabel(row.firstEntry)) : "–"}</td>
            <td>${row.lastEntry ? escapeHtml(entryWorkLabel(row.lastEntry)) : "–"}</td>
            <td>${row.entryCount > 1 ? `+${row.progressPages}` : row.entryCount === 1 ? "nur ein Eintrag" : "–"}</td>
            <td>${row.groupAverage == null ? "–" : `S. ${formatDecimal(row.groupAverage)}`}</td>
            <td>${row.groupDistance == null ? "–" : signedNumber(row.groupDistance)}</td>
            <td>${row.lastActivity ? relativeActivity(row.lastActivity) : "–"}</td>
            <td>${row.hints.map((hint) => printHintPill(hint)).join(" ")}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function renderPrintHelpCards(entries) {
  return `
    <div class="print-card-list">
      ${entries.map((entry) => {
        const isHelp = entry.status === "brauche Hilfe";
        return `
          <article class="help-card ${isHelp ? "help" : "check"}">
            <div>
              <strong>${escapeHtml(entry.tierEmojiSnapshot)} ${escapeHtml(entry.tierNameSnapshot)}</strong>
              <span>${escapeHtml(entry.fach)} · ${escapeHtml(entry.materialName)} · ${escapeHtml(entryWorkLabel(entry))}</span>
            </div>
            <div>${printStatusPill(entry.status)}</div>
            <p>${isHelp ? "Hilfewunsch offen" : "Kontrolle offen"} · ${formatDateTime(entry.datumUhrzeit)}</p>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function renderPrintEntryTable(entries, headers, showDate) {
  return `
    <table class="planner-table">
      <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
      <tbody>
        ${entries.map((entry) => `
          <tr>
            <td>${showDate ? formatGermanDate(entry.datumUhrzeit) : formatTime(entry.datumUhrzeit)}</td>
            <td class="print-animal">${escapeHtml(entry.tierEmojiSnapshot)} ${escapeHtml(entry.tierNameSnapshot)}</td>
            <td><span class="subject-chip ${entry.fach === "Deutsch" ? "deutsch" : "mathe"}">${escapeHtml(entry.fach)}</span></td>
            <td>${escapeHtml(entry.materialName)}</td>
            <td>${escapeHtml(entryWorkLabel(entry))}</td>
            <td>${printStatusPill(entry.status)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function printHero(title, subtitle) {
  return `
    <header class="print-hero">
      <p>Lernstand-Kompass</p>
      <h1>${escapeHtml(title)}</h1>
      <span>${escapeHtml(subtitle)}</span>
    </header>
  `;
}

function renderPrintKpis(items) {
  return `
    <section class="kpi-grid">
      ${items.map(([label, value, tone]) => `
        <article class="kpi-card ${tone}">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
        </article>
      `).join("")}
    </section>
  `;
}

function printSectionTitle(title) {
  return `<section class="print-section section-heading"><h2>${escapeHtml(title)}</h2></section>`;
}

function printEmpty(text) {
  return `<div class="print-empty">${escapeHtml(text)}</div>`;
}

function printStatusPill(status) {
  const safeStatus = status && status !== "–" ? status : "fertig";
  const className = safeStatus === "brauche Hilfe" ? "help" : safeStatus === "bitte kontrollieren" ? "check" : safeStatus === "offen" ? "stale" : "done";
  return `<span class="print-pill ${className}">${escapeHtml(status || "–")}</span>`;
}

function printHintPill(hint) {
  const className = hint.includes("offen") || hint.includes("Blick") || hint.includes("Unterstützung")
    ? "help"
    : hint.includes("länger")
      ? "stale"
      : hint.includes("voraus") || hint.includes("Zusatz")
        ? "ahead"
        : "done";
  return `<span class="print-pill ${className}">${escapeHtml(hint)}</span>`;
}

function formatDecimal(value) {
  return String(Math.round(value * 10) / 10).replace(".", ",");
}

function formatGermanDate(value) {
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

function printViewCss(landscape = false) {
  return `
    :root {
      --aubergine: #452143;
      --cream: #faf7ef;
      --ink: #2e3038;
      --muted: #686e7a;
      --line: #ded8cf;
      --blue-soft: #dff0ff;
      --green-soft: #def6df;
      --orange-soft: #fff0c5;
      --check-soft: #dfefff;
      --red-soft: #ffe4e7;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Grundschrift", "Trebuchet MS", "Segoe UI", Arial, sans-serif;
      color: var(--ink);
      background: #eee9df;
    }
    .print-toolbar {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      gap: 10px;
      justify-content: center;
      padding: 12px;
      background: rgba(255, 255, 255, 0.96);
      border-bottom: 1px solid #ddd;
    }
    .print-toolbar button {
      border: 0;
      border-radius: 8px;
      padding: 10px 14px;
      color: white;
      background: var(--aubergine);
      font: inherit;
      font-weight: 800;
      cursor: pointer;
    }
    .print-toolbar button + button {
      color: var(--aubergine);
      background: #f2edf4;
    }
    .print-page {
      width: min(100%, 210mm);
      min-height: 297mm;
      margin: 18px auto;
      padding: 12mm;
      background: var(--cream);
      box-shadow: 0 20px 50px rgba(43, 34, 24, 0.18);
    }
    .print-hero {
      margin-bottom: 16px;
      padding: 18px 20px;
      border-radius: 14px;
      color: white;
      background: var(--aubergine);
    }
    .print-hero p {
      margin: 0 0 4px;
      font-size: 0.92rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      opacity: 0.82;
    }
    .print-hero h1 {
      margin: 0;
      font-size: 1.9rem;
      line-height: 1.15;
      letter-spacing: 0;
    }
    .print-hero span {
      display: block;
      margin-top: 8px;
      opacity: 0.9;
      font-weight: 700;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin: 0 0 16px;
    }
    .kpi-card {
      min-height: 82px;
      padding: 13px 14px;
      border: 1px solid var(--line);
      border-radius: 12px;
      background: #fffdf8;
      page-break-inside: avoid;
    }
    .kpi-card span {
      display: block;
      color: var(--muted);
      font-weight: 800;
      font-size: 0.92rem;
    }
    .kpi-card strong {
      display: block;
      margin-top: 8px;
      color: var(--aubergine);
      font-size: 1.85rem;
      line-height: 1;
    }
    .kpi-card.deutsch { background: var(--blue-soft); }
    .kpi-card.mathe,
    .kpi-card.neutral { background: #fffdf8; }
    .kpi-card.help { background: var(--orange-soft); }
    .kpi-card.check { background: var(--check-soft); }
    .kpi-card.stale { background: var(--red-soft); }
    .print-section {
      margin-top: 14px;
      page-break-inside: avoid;
    }
    .print-section h2 {
      margin: 0 0 10px;
      color: var(--aubergine);
      font-size: 1.28rem;
      letter-spacing: 0;
      page-break-after: avoid;
    }
    .section-heading {
      padding-top: 10px;
    }
    .planner-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      overflow: hidden;
      border: 1px solid var(--line);
      border-radius: 12px;
      background: white;
      font-size: 0.9rem;
    }
    .planner-table th,
    .planner-table td {
      padding: 9px 10px;
      border-bottom: 1px solid #ece5da;
      text-align: left;
      vertical-align: top;
    }
    .planner-table th {
      color: white;
      background: var(--aubergine);
      font-weight: 850;
    }
    .planner-table tbody tr:nth-child(even) td {
      background: #fbf8f1;
    }
    .planner-table tbody tr:last-child td {
      border-bottom: 0;
    }
    .print-animal {
      font-weight: 850;
      white-space: nowrap;
    }
    .subject-chip,
    .print-pill {
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      margin: 1px 2px 1px 0;
      padding: 3px 8px;
      border-radius: 999px;
      font-weight: 850;
      white-space: nowrap;
    }
    .subject-chip.deutsch { background: var(--blue-soft); color: #1e5b91; }
    .subject-chip.mathe { background: var(--green-soft); color: #24763a; }
    .print-pill.done { background: var(--green-soft); color: #24763a; }
    .print-pill.help { background: var(--orange-soft); color: #9b6100; }
    .print-pill.check { background: var(--check-soft); color: #235d9f; }
    .print-pill.stale { background: var(--red-soft); color: #9a3a46; }
    .print-pill.ahead { background: #e9f0ff; color: #4253a4; }
    .print-card-list {
      display: grid;
      gap: 10px;
    }
    .help-card {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8px 12px;
      padding: 14px 16px;
      border: 1px solid var(--line);
      border-radius: 14px;
      page-break-inside: avoid;
    }
    .help-card.help { background: var(--orange-soft); }
    .help-card.check { background: var(--check-soft); }
    .help-card strong {
      display: block;
      margin-bottom: 4px;
      font-size: 1.12rem;
    }
    .help-card span,
    .help-card p {
      margin: 0;
      color: var(--muted);
      font-weight: 750;
    }
    .help-card p {
      grid-column: 1 / -1;
    }
    .print-empty {
      padding: 24px;
      border: 1px dashed var(--line);
      border-radius: 14px;
      color: var(--muted);
      background: #fffdf8;
      font-weight: 800;
      text-align: center;
    }
    .progress-print-table {
      font-size: 0.82rem;
    }
    .assessment-print-meta {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      padding: 12px;
      border: 1px solid var(--line);
      border-radius: 12px;
      background: #fffdf8;
      font-weight: 750;
    }
    .assessment-print-table,
    .assessment-summary-table {
      font-size: 0.82rem;
    }
    .assessment-summary-table th,
    .assessment-summary-table td {
      padding: 7px 8px;
    }
    .page-break {
      break-before: page;
      page-break-before: always;
      height: 1px;
    }
    .weekly-print-page .print-hero {
      margin-bottom: 14px;
    }
    .weekly-print-days {
      display: grid;
      gap: 10px;
    }
    .weekly-print-day {
      padding: 12px;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: #fffdf8;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .weekly-print-day h2 {
      margin: 0 0 8px;
      color: var(--aubergine);
      font-size: 1.25rem;
    }
    .weekly-print-subject {
      display: grid;
      grid-template-columns: 110px 1fr;
      gap: 8px;
      padding: 8px 0;
      border-top: 1px solid #eee5d8;
    }
    .weekly-print-subject h3 {
      margin: 0;
      font-size: 1rem;
      color: var(--ink);
    }
    .weekly-print-subject p {
      margin: 0;
      color: var(--muted);
      font-weight: 800;
    }
    .weekly-print-task {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 8px;
      align-items: start;
      margin-bottom: 5px;
    }
    .weekly-print-task strong,
    .weekly-print-task span {
      display: block;
    }
    .weekly-print-task span {
      margin-top: 2px;
      color: var(--muted);
      font-size: 0.9rem;
      font-weight: 750;
    }
    .weekly-print-checkbox {
      color: var(--aubergine);
      font-size: 1.2rem;
      line-height: 1;
    }
    .weekly-print-note {
      margin: 12px 0 0;
      color: var(--muted);
      font-size: 0.85rem;
      font-weight: 750;
      text-align: center;
    }
    .weekly-print-page.compact .print-hero {
      padding: 12px 14px;
    }
    .weekly-print-page.compact .print-hero h1 {
      font-size: 1.55rem;
    }
    .weekly-print-page.compact .weekly-print-day {
      padding: 9px 10px;
    }
    .weekly-print-page.compact .weekly-print-subject {
      grid-template-columns: 94px 1fr;
      padding: 5px 0;
    }
    @page {
      size: A4 ${landscape ? "landscape" : "portrait"};
      margin: 12mm;
    }
    @media print {
      body {
        background: white;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .print-toolbar {
        display: none;
      }
      .print-page {
        width: auto;
        min-height: auto;
        margin: 0;
        padding: 0;
        box-shadow: none;
        background: white;
      }
      .print-hero,
      .kpi-card,
      .help-card,
      .print-empty {
        break-inside: avoid;
        page-break-inside: avoid;
      }
      thead {
        display: table-header-group;
      }
      tr {
        break-inside: avoid;
        page-break-inside: avoid;
      }
    }
  `;
}

function renderQrCards() {
  const animals = animalsForActiveClass().filter((animal) => animal.aktiv);
  return `
    <section class="panel">
      <h2>Tier-QR-Codes</h2>
      <p class="message">Die QR-Codes enthalten keine Vornamen und keine Lernstände. Sie enthalten nur eine anonyme Tier-ID.</p>
      <div class="backup-actions">
        <button class="primary" type="button" onclick="printAllQrCards()">Alle QR-Karten der aktiven Klasse drucken</button>
        <button class="secondary" type="button" onclick="openQrScanner('test')">QR-Reader testen</button>
      </div>
    </section>
    <section class="qr-card-grid">
      ${animals.map((animal) => renderQrCardPreview(animal)).join("") || `<div class="empty">Keine aktiven Tiere vorhanden.</div>`}
    </section>
    <div id="printArea" class="print-area" aria-hidden="true"></div>
  `;
}

function renderQrCardPreview(animal) {
  const payload = qrPayloadForAnimal(animal);
  return `
    <article class="qr-card-preview" data-qr-token="${escapeAttribute(payload)}">
      <div class="qr-animal">
        <span class="qr-animal-emoji">${escapeHtml(animal.tierEmoji)}</span>
        <strong>${escapeHtml(animal.tierName)}</strong>
      </div>
      <div class="qr-code-wrap">${makeQrSvg(payload, { scale: 4 })}</div>
      <p class="qr-token">Tier-ID: ${escapeHtml(animal.id)}</p>
      <p class="qr-small">Lernstand-Kompass</p>
      <div class="qr-actions">
        <button class="primary" type="button" onclick="printSingleQrCard('${animal.id}')">Karte drucken</button>
      </div>
    </article>
  `;
}

async function regenerateQrToken(animalId) {
  if (!confirm("Der alte Tier-Code funktioniert danach nicht mehr. Fortfahren?")) return;
  const animals = state.animals.map((animal) => animal.id === animalId ? { ...animal, qrToken: makeUniqueQrToken(animalId) } : animal);
  await persistAndRender({ ...state, animals });
}

async function setQrScannerEnabled(enabled) {
  await persist({ ...state, qrScannerEnabled: Boolean(enabled) });
}

function printSingleQrCard(animalId) {
  const animal = state.animals.find((item) => item.id === animalId && item.classId === state.activeClassId);
  if (!animal) return;
  printQrCards([animal]);
}

function printAllQrCards() {
  printQrCards(animalsForActiveClass().filter((animal) => animal.aktiv));
}

function printQrCards(animals) {
  const printArea = document.querySelector("#printArea");
  if (!printArea) return;
  printArea.innerHTML = `
    <div class="qr-print-page">
      ${animals.map((animal) => {
        const payload = qrPayloadForAnimal(animal);
        return `
        <article class="qr-print-card">
          <div class="qr-print-emoji">${escapeHtml(animal.tierEmoji)}</div>
          <div class="qr-print-name">${escapeHtml(animal.tierName)}</div>
          <div class="qr-print-code">${makeQrSvg(payload, { scale: 4 })}</div>
          <div class="qr-token">Tier-ID: ${escapeHtml(animal.id)}</div>
          <div class="qr-print-title">Lernstand-Kompass</div>
        </article>
      `;
      }).join("")}
    </div>
  `;
  window.print();
}

function qrPayloadForAnimal(animal) {
  return `animalId=${animal.id}`;
}

function findAnimalForQrValue(value) {
  const raw = String(value || "").trim();
  const candidates = new Set([raw]);
  try {
    const parsed = new URL(raw);
    ["animalId", "tier", "qr"].forEach((key) => {
      const param = parsed.searchParams.get(key);
      if (param) candidates.add(param);
    });
  } catch {
    if (raw.includes("=")) {
      const params = new URLSearchParams(raw);
      ["animalId", "tier", "qr"].forEach((key) => {
        const param = params.get(key);
        if (param) candidates.add(param);
      });
    }
  }
  return state.animals.find((item) => (
    item.aktiv
    && (
      candidates.has(item.id)
      || candidates.has(item.qrToken)
      || candidates.has(slugifyAnimalName(item.tierName))
      || candidates.has(item.tierName)
    )
  )) || null;
}

function slugifyAnimalName(value) {
  return String(value || "")
    .toLowerCase()
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("ß", "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function makeUniqueQrToken(exceptAnimalId = "") {
  const usedTokens = new Set(state.animals.filter((animal) => animal.id !== exceptAnimalId).map((animal) => animal.qrToken).filter(Boolean));
  const token = makeQrToken(usedTokens);
  usedTokens.add(token);
  return token;
}

function renderSecurity() {
  return `
    <section class="panel">
      <h2>PIN & Sicherheit</h2>
      <form class="filters" onsubmit="changePin(event)">
        <label class="field">Aktuelle PIN<input class="text-input" id="currentPin" type="password" autocomplete="current-password"></label>
        <label class="field">Neue PIN<input class="text-input" id="newPin" type="password" autocomplete="new-password"></label>
        <label class="field">Neue PIN wiederholen<input class="text-input" id="newPinRepeat" type="password" autocomplete="new-password"></label>
        <button class="primary" type="submit">PIN ändern</button>
      </form>
      ${securityMessage ? `<p class="message ${securityMessage.includes("wurde") || securityMessage.includes("notiere") ? "success" : "error"}">${escapeHtml(securityMessage)}</p>` : ""}
    </section>
    <section class="panel">
      <h2>Wiederherstellungsschlüssel</h2>
      <p class="privacy-text">Die PIN schützt die ${TEACHER_AREA_NAME} auf diesem Gerät. Es gibt keinen geheimen Universal-PIN. Falls du die PIN vergisst, kannst du sie nur mit dem Wiederherstellungsschlüssel zurücksetzen. Ohne Wiederherstellungsschlüssel bleibt nur das Zurücksetzen der App und anschließend der Import eines Backups.</p>
      <button class="secondary" type="button" onclick="regenerateRecoveryKey()">Neuen Wiederherstellungsschlüssel erzeugen</button>
      ${pendingRecoveryKey ? `
        <div class="recovery-key-panel">
          <p>Bitte notiere den neuen Wiederherstellungsschlüssel. Er wird nicht im Klartext gespeichert.</p>
          <div class="recovery-key-box">${escapeHtml(pendingRecoveryKey)}</div>
          <button class="primary" type="button" onclick="hideRecoveryKey()">Ich habe den Schlüssel notiert</button>
        </div>
      ` : ""}
    </section>
  `;
}

async function changePin(event) {
  event.preventDefault();
  const currentPin = document.querySelector("#currentPin").value.trim();
  const newPin = document.querySelector("#newPin").value.trim();
  const repeat = document.querySelector("#newPinRepeat").value.trim();
  if ((await hashSecret(currentPin, "pin")) !== state.pinHash) {
    securityMessage = "Die aktuelle PIN stimmt nicht.";
    render();
    return;
  }
  if (newPin.length < 4 || newPin !== repeat) {
    securityMessage = "Bitte neue PIN prüfen.";
    render();
    return;
  }
  await persist({ ...state, pinHash: await hashSecret(newPin, "pin") });
  securityMessage = "PIN wurde geändert.";
  render();
}

async function regenerateRecoveryKey() {
  if (!confirm("Der alte Wiederherstellungsschlüssel funktioniert danach nicht mehr. Fortfahren?")) return;
  pendingRecoveryKey = makeRecoveryKey();
  await persist({ ...state, recoveryKeyHash: await hashSecret(pendingRecoveryKey, "recovery") });
  securityMessage = "Bitte notiere den neuen Wiederherstellungsschlüssel.";
  render();
}

function hideRecoveryKey() {
  pendingRecoveryKey = "";
  render();
}

function renderStorageStatus() {
  const latestAssessmentChange = latestAssessmentUpdatedAt();
  return `
    <section class="panel">
      <h2>Speicherstatus</h2>
      <div class="status-grid">
        <div>Einrichtung gefunden</div><strong>${state.setupComplete ? "ja" : "nein"}</strong>
        <div>Speicherart</div><strong>${escapeHtml(storage.getStorageType())}</strong>
        <div>aktive Klasse</div><strong>${escapeHtml(activeClass()?.name || "keine")}</strong>
        <div>Anzahl Klassen</div><strong>${state.classes.length}</strong>
        <div>Anzahl Tiere</div><strong>${state.animals.length}</strong>
        <div>Tier-Zuordnung mit Vornamen</div><strong>${state.animals.some((animal) => animal.firstName) ? "ja" : "nein"}</strong>
        <div>Vornamen im Lehrkraftbereich sichtbar</div><strong>${state.teacherShowFirstNames ? "ja" : "nein"}</strong>
        <div>Anzahl Materialien</div><strong>${state.materials.length}</strong>
        <div>Anzahl Lernstände</div><strong>${state.entries.length}</strong>
        <div>Anzahl Lernzielkontrollen</div><strong>${(state.assessments || []).length}</strong>
        <div>Anzahl LZK-Aufgaben</div><strong>${(state.assessmentTasks || []).length}</strong>
        <div>Anzahl gespeicherter Testergebnisse</div><strong>${(state.assessmentResults || []).length}</strong>
        <div>Anzahl Trainingsaufgaben</div><strong>${(state.trainingTasks || []).length}</strong>
        <div>Anzahl bearbeiteter Trainingsaufgaben</div><strong>${(state.trainingCompletions || []).filter((item) => item.status === "bearbeitet").length}</strong>
        <div>Anzahl Trainings-Änderungen</div><strong>${(state.trainingHistory || []).length}</strong>
        <div>Anzahl Lehrwerk-Einträge</div><strong>${(state.workbookCatalog || []).length}</strong>
        <div>Anzahl Wochenpläne</div><strong>${(state.weeklyPlans || []).length}</strong>
        <div>Anzahl Wochenplan-Status</div><strong>${(state.weeklyPlanStatuses || []).length}</strong>
        <div>letzte Änderung Tests & Lernzielkontrollen</div><strong>${latestAssessmentChange ? formatDateTime(latestAssessmentChange) : "noch keine"}</strong>
        <div>assessments vorhanden</div><strong>${(state.assessments || []).length ? "ja" : "nein"}</strong>
        <div>assessmentTasks vorhanden</div><strong>${(state.assessmentTasks || []).length ? "ja" : "nein"}</strong>
        <div>assessmentResults vorhanden</div><strong>${(state.assessmentResults || []).length ? "ja" : "nein"}</strong>
        <div>letzte lokale Speicherung</div><strong>${state.lastSavedAt ? formatDateTime(state.lastSavedAt) : "noch nicht gespeichert"}</strong>
        <div>Mehrgeräte-Hinweis aktiviert</div><strong>${state.multiDeviceReminderEnabled !== false ? "ja" : "nein"}</strong>
        <div>Mehrgeräte-Hinweis Uhrzeit</div><strong>${escapeHtml(state.multiDeviceReminderTime || "13:00")}</strong>
      </div>
      <p class="privacy-text">Die Daten werden lokal auf diesem iPad/in diesem Browser gespeichert. GitHub speichert nur die App-Dateien, nicht die Einträge.</p>
    </section>
  `;
}

async function exportActiveClassBackup() {
  try {
    const classItem = activeClass();
    const filename = `lernstand-kompass-${safeFilePart(classItem?.name)}-backup-${formatFileDate(new Date())}.json`;
    const content = JSON.stringify(makeActiveClassBackup(state, state.activeClassId), null, 2);
    globalMessage = await saveFileWithPickerOrDownload(filename, "application/json", content);
  } catch {
    globalMessage = "Die Datei konnte nicht erstellt werden.";
  }
  render();
}

async function exportFullBackup() {
  try {
    const filename = `lernstand-kompass-gesamtbackup-${formatFileDate(new Date())}.json`;
    const content = JSON.stringify(makeFullBackup(state), null, 2);
    globalMessage = await saveFileWithPickerOrDownload(filename, "application/json", content);
  } catch {
    globalMessage = "Die Datei konnte nicht erstellt werden.";
  }
  render();
}

async function exportCleanDistributionVersion() {
  try {
    const folderName = "lernstand-kompass-weitergabe";
    const files = [];
    for (const path of CLEAN_DISTRIBUTION_FILES) {
      files.push({
        name: `${folderName}/${path}`,
        data: await fetchDistributionFile(path)
      });
    }
    files.push({
      name: `${folderName}/WEITERGABE-HINWEIS.txt`,
      data: textToBytes(cleanDistributionReadme())
    });
    const zipBlob = createZipBlob(files);
    const filename = `lernstand-kompass-weitergabe-${formatFileDate(new Date())}.zip`;
    globalMessage = await saveFileWithPickerOrDownload(filename, "application/zip", zipBlob);
  } catch (error) {
    globalMessage = error.message || "Die saubere Weitergabeversion konnte nicht erstellt werden.";
  }
  render();
}

async function fetchDistributionFile(path) {
  const response = await fetch(`${path}?weitergabe=${Date.now()}`, { cache: "reload" });
  if (!response.ok) throw new Error(`Datei fehlt für die Weitergabeversion: ${path}`);
  return new Uint8Array(await response.arrayBuffer());
}

function cleanDistributionReadme() {
  return [
    "Lernstand-Kompass - saubere Weitergabeversion",
    "",
    "Diese ZIP enthaelt die App-Dateien, Aufgabenlisten, Arbeitsheft-Kataloge, PWA-Dateien und Druckmaterialien.",
    "",
    "Nicht enthalten sind:",
    "- Klassen- oder Lerngruppendaten",
    "- Tier-Zuordnungen und Vornamen",
    "- Fortschritte, Wochenplaene und Lernzielkontrollen",
    "- Punkte, Bewertungen, Noten und Bemerkungen",
    "- lokale Backups oder Lernpost-Dateien",
    "",
    "Beim ersten Start erscheint der Einrichtungsassistent. Eine Lehrkraft kann die App leer starten und eigene Daten anlegen.",
    "Persoenliche Daten duerfen nur ueber ein separat bewusst importiertes Backup ergaenzt werden."
  ].join("\n");
}

function textToBytes(text) {
  return new TextEncoder().encode(text);
}

function createZipBlob(files) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const now = new Date();
  for (const file of files) {
    const nameBytes = textToBytes(file.name);
    const data = file.data instanceof Uint8Array ? file.data : new Uint8Array(file.data);
    const crc = crc32(data);
    const localHeader = zipLocalHeader(nameBytes, data.length, crc, now);
    localParts.push(localHeader, data);
    centralParts.push(zipCentralHeader(nameBytes, data.length, crc, offset, now));
    offset += localHeader.length + data.length;
  }
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = zipEndRecord(files.length, centralSize, offset);
  return new Blob([...localParts, ...centralParts, end], { type: "application/zip" });
}

function zipLocalHeader(nameBytes, size, crc, date) {
  const header = new Uint8Array(30 + nameBytes.length);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 0x0800, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, zipDosTime(date), true);
  view.setUint16(12, zipDosDate(date), true);
  view.setUint32(14, crc, true);
  view.setUint32(18, size, true);
  view.setUint32(22, size, true);
  view.setUint16(26, nameBytes.length, true);
  header.set(nameBytes, 30);
  return header;
}

function zipCentralHeader(nameBytes, size, crc, offset, date) {
  const header = new Uint8Array(46 + nameBytes.length);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x02014b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 20, true);
  view.setUint16(8, 0x0800, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, zipDosTime(date), true);
  view.setUint16(14, zipDosDate(date), true);
  view.setUint32(16, crc, true);
  view.setUint32(20, size, true);
  view.setUint32(24, size, true);
  view.setUint16(28, nameBytes.length, true);
  view.setUint32(42, offset, true);
  header.set(nameBytes, 46);
  return header;
}

function zipEndRecord(fileCount, centralSize, centralOffset) {
  const header = new Uint8Array(22);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x06054b50, true);
  view.setUint16(8, fileCount, true);
  view.setUint16(10, fileCount, true);
  view.setUint32(12, centralSize, true);
  view.setUint32(16, centralOffset, true);
  return header;
}

function zipDosTime(date) {
  return (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
}

function zipDosDate(date) {
  return ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
}

function crc32(data) {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i += 1) {
    crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ data[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let value = i;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[i] = value >>> 0;
  }
  return table;
})();

async function exportActiveClassCsv() {
  try {
    const classItem = activeClass();
    const filename = `lernstand-kompass-${safeFilePart(classItem?.name)}-export-${formatFileDate(new Date())}.csv`;
    globalMessage = await saveFileWithPickerOrDownload(filename, "text/csv", makeCsvForClass(state, state.activeClassId));
  } catch {
    globalMessage = "Die Datei konnte nicht erstellt werden.";
  }
  render();
}

async function exportBeautifulExcel(mode, includeFirstNames = false) {
  try {
    const report = buildBeautifulExcelReport(mode, includeFirstNames);
    await exportBeautifulWorkbook(report);
    globalMessage = includeFirstNames ? "Interne Excel-Datei mit Vornamen wurde erstellt." : "Schöne Excel-Datei wurde erstellt.";
  } catch (error) {
    console.error(error);
    globalMessage = "Die schöne Excel-Datei konnte nicht erstellt werden. Du kannst stattdessen eine einfache CSV-Datei exportieren.";
  }
  render();
}

function buildBeautifulExcelReport(mode, includeFirstNames = false) {
  const now = new Date();
  const active = activeClass();
  const allClassIds = state.classes.map((item) => item.id);
  const classIds = mode === "active" ? [state.activeClassId] : allClassIds;
  const baseEntries = state.entries.filter((entry) => classIds.includes(entry.classId));
  const todayKey = now.toDateString();
  const entries = baseEntries.filter((entry) => {
    if (mode === "today") return new Date(entry.datumUhrzeit).toDateString() === todayKey;
    if (mode === "help") return !entry.erledigt && (entry.status === "brauche Hilfe" || entry.status === "bitte kontrollieren");
    return true;
  });
  const scopeLabel = mode === "active"
    ? active?.name || "aktive Klasse"
    : mode === "today"
      ? "Tagesliste"
      : mode === "help"
        ? "Hilfe & Kontrolle"
        : "Alle Klassen";
  const internalPart = includeFirstNames ? "-intern" : "";
  const filename = mode === "active"
    ? `lernstand-kompass${internalPart}-${safeFilePart(active?.name)}-${formatFileDate(now)}.xlsx`
    : mode === "today"
      ? `lernstand-kompass${internalPart}-heute-${formatFileDate(now)}.xlsx`
      : mode === "help"
        ? `lernstand-kompass${internalPart}-hilfe-kontrolle-${formatFileDate(now)}.xlsx`
        : `lernstand-kompass${internalPart}-alle-klassen-${formatFileDate(now)}.xlsx`;
  const animals = state.animals
    .filter((animal) => classIds.includes(animal.classId) && animal.aktiv)
    .map((animal) => ({ ...animal, exportLabel: exportAnimalLabel(animal, includeFirstNames) }));
  const materials = state.materials.filter((material) => classIds.includes(material.classId));
  const reportEntries = decorateEntries(entries, includeFirstNames).sort(sortNewest);
  const overviewRows = buildBeautifulOverviewRows(animals, baseEntries);
  const progressRows = buildBeautifulProgressRows(classIds, mode === "today" ? entries : baseEntries)
    .map((row) => ({ ...row, animal: { ...row.animal, exportLabel: exportAnimalLabel(row.animal, includeFirstNames) } }));
  const todayEntries = decorateEntries(baseEntries.filter((entry) => new Date(entry.datumUhrzeit).toDateString() === todayKey), includeFirstNames).sort(sortNewest);
  const helpEntries = decorateEntries(baseEntries.filter((entry) => !entry.erledigt && (entry.status === "brauche Hilfe" || entry.status === "bitte kontrollieren")), includeFirstNames).sort(sortNewest);
  const trailEntries = decorateEntries(entries, includeFirstNames).sort(sortEntriesByClassAnimalDate);
  const allEntries = reportEntries;
  const printRows = buildPrintRows(animals, baseEntries);
  const assessments = (state.assessments || []).filter((item) => classIds.includes(item.classId));
  const assessmentIds = new Set(assessments.map((item) => item.id));
  const assessmentTasks = (state.assessmentTasks || []).filter((item) => classIds.includes(item.classId) && assessmentIds.has(item.assessmentId));
  const assessmentResults = (state.assessmentResults || [])
    .filter((item) => classIds.includes(item.classId) && assessmentIds.has(item.assessmentId))
    .map((result) => ({ ...result, tierLabel: exportAnimalLabel(state.animals.find((animal) => animal.id === result.animalId) || result, includeFirstNames) }));
  const trainingRows = classIds.flatMap((classId) => buildTrainingRowsForClass(classId))
    .filter((row) => row.status === "bearbeitet")
    .map((row) => ({ ...row, tierLabel: exportAnimalLabel(row, includeFirstNames) }))
    .sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0));
  return {
    filename,
    scopeLabel,
    generatedAt: now.toISOString(),
    mode,
    entries: reportEntries,
    classes: state.classes.filter((item) => classIds.includes(item.id)),
    animals,
    materials,
    overviewRows,
    progressRows,
    trailEntries,
    todayEntries,
    helpEntries,
    allEntries,
    printRows,
    assessments,
    assessmentTasks,
    assessmentResults,
    trainingRows,
    includeFirstNames,
    stats: buildDashboardStats({ entries: reportEntries, baseEntries, animals, materials, classIds, now, assessments, assessmentResults, trainingRows })
  };
}

function decorateEntries(entries, includeFirstNames = false) {
  return entries.map((entry) => ({
    ...entry,
    klasseName: getClassNameForEntry(entry),
    tierLabel: exportAnimalLabel(state.animals.find((animal) => animal.id === entry.tierID) || entry, includeFirstNames)
  }));
}

function exportAnimalLabel(animalLike, includeFirstNames = false) {
  const animal = state.animals.find((item) => item.id === animalLike.id || item.id === animalLike.animalId || item.id === animalLike.tierID) || animalLike;
  const base = `${animal.tierEmoji || animal.tierEmojiSnapshot || ""} ${animal.tierName || animal.tierNameSnapshot || ""}`.trim();
  if (includeFirstNames && animal.firstName) return `${base} · ${animal.firstName}`;
  return base;
}

function buildDashboardStats({ entries, baseEntries, animals, materials, classIds, now, assessments = [], assessmentResults = [], trainingRows = [] }) {
  const today = now.toDateString();
  const metricEntries = entries;
  const latest = [...metricEntries].sort(sortNewest)[0] || null;
  const materialCounts = new Map();
  metricEntries.forEach((entry) => materialCounts.set(entry.materialName, (materialCounts.get(entry.materialName) || 0) + 1));
  const mostMaterial = [...materialCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const latestDeutschPages = latestPagesByAnimalSubject(baseEntries, "Deutsch");
  const latestMathePages = latestPagesByAnimalSubject(baseEntries, "Mathe");
  const progressRows = buildBeautifulProgressRows(classIds, baseEntries);
  return {
    hasEntries: baseEntries.length > 0,
    activeAnimals: animals.length,
    animalsWithEntry: new Set(metricEntries.map((entry) => entry.tierID)).size,
    todayCount: baseEntries.filter((entry) => new Date(entry.datumUhrzeit).toDateString() === today).length,
    openHelp: baseEntries.filter((entry) => !entry.erledigt && entry.status === "brauche Hilfe").length,
    openCheck: baseEntries.filter((entry) => !entry.erledigt && entry.status === "bitte kontrollieren").length,
    staleAnimals: animals.filter((animal) => {
      const latestAnimalEntry = baseEntries.filter((entry) => entry.tierID === animal.id).sort(sortNewest)[0];
      return latestAnimalEntry && daysSince(latestAnimalEntry.datumUhrzeit) >= (state.progressSettings || DEFAULT_PROGRESS_SETTINGS).staleDays;
    }).length,
    latestEntry: latest ? `${formatGermanDate(latest.datumUhrzeit)} ${formatTime(latest.datumUhrzeit)} · ${latest.tierEmojiSnapshot || ""} ${latest.tierNameSnapshot || ""}`.trim() : "–",
    mostMaterial: mostMaterial ? `${mostMaterial[0]} (${mostMaterial[1]})` : "–",
    classCount: classIds.length,
    materialCount: materials.length,
    openTasks: baseEntries.filter((entry) => !entry.erledigt && entry.status !== "fertig").length,
    deutschAverage: formatAverage(latestDeutschPages),
    matheAverage: formatAverage(latestMathePages),
    aheadCount: progressRows.filter((row) => row.hints.some((hint) => hint === "Zusatzangebot möglich" || hint === "weiter voraus") || row.groupLabel === "weiter voraus").length,
    lookCount: progressRows.filter((row) => row.hints.some((hint) => hint === "Unterstützung prüfen" || hint === "braucht Blick") || row.groupLabel === "braucht Blick" || row.groupLabel === "deutlicher Abstand").length,
    exportedEntryCount: entries.length,
    assessmentCount: assessments.length,
    assessmentResultCount: assessmentResults.length,
    trainingCompletedCount: trainingRows.length
  };
}

function latestPagesByAnimalSubject(entries, subject) {
  const pages = new Map();
  entries
    .filter((entry) => entry.fach === subject && Number(entry.seite) > 0)
    .sort(sortNewest)
    .forEach((entry) => {
      if (!pages.has(entry.tierID)) pages.set(entry.tierID, Number(entry.seite));
    });
  return [...pages.values()].filter((page) => Number.isFinite(page));
}

function formatAverage(values) {
  if (!values.length) return "–";
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return `S. ${String(Math.round(average * 10) / 10).replace(".", ",")}`;
}

function buildBeautifulOverviewRows(animals, entries) {
  return animals
    .map((animal) => {
      const animalEntries = entries.filter((entry) => entry.tierID === animal.id).sort(sortNewest);
      const deutsch = animalEntries.find((entry) => entry.fach === "Deutsch");
      const mathe = animalEntries.find((entry) => entry.fach === "Mathe");
      const latest = animalEntries[0] || null;
      const open = animalEntries.find((entry) => !entry.erledigt && entry.status !== "fertig") || null;
      const stale = latest && daysSince(latest.datumUhrzeit) >= (state.progressSettings || DEFAULT_PROGRESS_SETTINGS).staleDays;
      return {
        animal,
        klasse: getClassNameById(animal.classId),
        deutsch: deutsch ? entryStandLabel(deutsch) : "–",
        mathe: mathe ? entryStandLabel(mathe) : "–",
        latestActivity: latest ? relativeActivity(latest.datumUhrzeit) : "–",
        status: open?.status || latest?.status || "–",
        hint: open?.status === "brauche Hilfe"
          ? "Hilfewunsch offen"
          : open?.status === "bitte kontrollieren"
            ? "Kontrolle offen"
            : stale
              ? "länger kein Eintrag"
              : latest
                ? "im Plan"
                : "kein Eintrag"
      };
    })
    .sort((a, b) => a.klasse.localeCompare(b.klasse, "de") || a.animal.tierName.localeCompare(b.animal.tierName, "de"));
}

function buildBeautifulProgressRows(classIds, entries) {
  return classIds.flatMap((classId) => buildProgressRowsForEntries(classId, entries)).sort((a, b) => (
    getClassNameById(a.classId).localeCompare(getClassNameById(b.classId), "de")
    || a.animal.tierName.localeCompare(b.animal.tierName, "de")
    || a.fach.localeCompare(b.fach, "de")
    || a.material.localeCompare(b.material, "de")
  ));
}

function buildProgressRowsForEntries(classId, entries) {
  const animals = state.animals.filter((animal) => animal.classId === classId && animal.aktiv);
  const materials = dedupeMaterials(state.materials.filter((material) => material.classId === classId && material.aktiv));
  const classEntries = entries.filter((entry) => entry.classId === classId);
  const groupAverages = calculateGroupAverages(classEntries);
  return animals.flatMap((animal) => materials.map((material) => {
    const rowEntries = classEntries
      .filter((entry) => entry.tierID === animal.id && entry.fach === material.fach && entry.materialName === material.materialName)
      .sort((a, b) => new Date(a.datumUhrzeit) - new Date(b.datumUhrzeit));
    const pages = rowEntries.map((entry) => Number(entry.seite)).filter((page) => Number.isFinite(page) && page > 0);
    const firstEntry = rowEntries[0] || null;
    const lastEntry = rowEntries[rowEntries.length - 1] || null;
    const minPage = pages.length ? Math.min(...pages) : null;
    const maxPage = pages.length ? Math.max(...pages) : null;
    const openEntry = rowEntries.find((entry) => !entry.erledigt && entry.status !== "fertig") || null;
    const groupAverage = groupAverages.get(progressKey(material.fach, material.materialName)) ?? null;
    const groupDistance = lastEntry && Number(lastEntry.seite) > 0 && groupAverage != null ? Number(lastEntry.seite) - groupAverage : null;
    const goal = currentGoal(classId, material.fach, material.materialName);
    const goalDistance = lastEntry && Number(lastEntry.seite) > 0 && goal ? Number(lastEntry.seite) - Number(goal.sollSeite) : null;
    const row = {
      classId,
      animal,
      fach: material.fach,
      material: material.materialName,
      entries: rowEntries,
      entryCount: rowEntries.length,
      firstEntry,
      lastEntry,
      minPage,
      maxPage,
      progressPages: pages.length > 1 ? maxPage - minPage : 0,
      lastActivity: lastEntry?.datumUhrzeit || null,
      openEntry,
      groupAverage,
      groupDistance,
      groupLabel: groupComparisonLabel(groupDistance),
      goal,
      goalDistance,
      goalDistanceLabel: goalComparisonLabel(goal, goalDistance)
    };
    row.hints = progressHints(row);
    return row;
  }));
}

function buildPrintRows(animals, entries) {
  return animals
    .map((animal) => {
      const animalEntries = entries.filter((entry) => entry.tierID === animal.id).sort(sortNewest);
      const deutsch = animalEntries.find((entry) => entry.fach === "Deutsch");
      const mathe = animalEntries.find((entry) => entry.fach === "Mathe");
      const latest = animalEntries[0] || null;
      const open = animalEntries.find((entry) => !entry.erledigt && entry.status !== "fertig") || null;
      return {
        tier: animal.exportLabel || `${animal.tierEmoji} ${animal.tierName}`,
        deutsch: deutsch ? entryStandLabel(deutsch) : "–",
        mathe: mathe ? entryStandLabel(mathe) : "–",
        latestActivity: latest ? relativeActivity(latest.datumUhrzeit) : "–",
        open: open ? open.status : "–",
        note: ""
      };
    })
    .sort((a, b) => a.tier.localeCompare(b.tier, "de"));
}

function sortEntriesByClassAnimalDate(a, b) {
  const classCompare = (a.klasseName || getClassNameForEntry(a)).localeCompare(b.klasseName || getClassNameForEntry(b), "de");
  if (classCompare) return classCompare;
  const animalCompare = (a.tierLabel || entryAnimal(a)).localeCompare(b.tierLabel || entryAnimal(b), "de");
  if (animalCompare) return animalCompare;
  return new Date(a.datumUhrzeit) - new Date(b.datumUhrzeit);
}

function exportExcelActiveClass(includeFirstNames = false) {
  const classItem = activeClass();
  const filename = `lernstand-kompass${includeFirstNames ? "-intern" : ""}-${safeFilePart(classItem?.name)}-${formatFileDate(new Date())}.csv`;
  finishExcelExport(entriesForActiveClass(), filename, includeFirstNames);
}

function exportExcelAllClasses(includeFirstNames = false) {
  const filename = `lernstand-kompass${includeFirstNames ? "-intern" : ""}-alle-klassen-${formatFileDate(new Date())}.csv`;
  finishExcelExport(state.entries, filename, includeFirstNames);
}

function exportExcelToday() {
  const today = new Date().toDateString();
  const entries = state.entries.filter((entry) => new Date(entry.datumUhrzeit).toDateString() === today);
  const filename = `lernstand-kompass-heute-${formatFileDate(new Date())}.csv`;
  finishExcelExport(entries, filename);
}

function exportExcelHelpControl() {
  const entries = state.entries.filter((entry) => (
    !entry.erledigt && (entry.status === "brauche Hilfe" || entry.status === "bitte kontrollieren")
  ));
  const filename = `lernstand-kompass-hilfe-kontrolle-${formatFileDate(new Date())}.csv`;
  finishExcelExport(entries, filename);
}

function finishExcelExport(entries, filename, includeFirstNames = false) {
  try {
    const decorated = decorateEntries(entries, includeFirstNames);
    const created = exportToExcelCsv(decorated, filename);
    globalMessage = created ? (includeFirstNames ? "Interne Excel-Liste mit Vornamen wurde erstellt." : "Excel-Liste wurde erstellt.") : "Für diese Auswahl gibt es noch keine Einträge.";
  } catch {
    globalMessage = "Die Excel-Liste konnte nicht erstellt werden.";
  }
  render();
}

async function importBackup(event) {
  event.preventDefault();
  const file = document.querySelector("#backupFile").files[0];
  const mode = document.querySelector("#importMode").value;
  if (!file) return;
  if (!confirm("Dadurch können vorhandene Daten überschrieben oder ergänzt werden. Fortfahren?")) return;

  try {
    const backup = JSON.parse(await file.text());
    const nextState = mode === "restoreAll" ? restoreFullBackup(backup) : importActiveClassAsNew(state, backup);
    await persist(nextState);
    globalMessage = "Backup wurde importiert.";
  } catch (error) {
    globalMessage = error.message || "Backup konnte nicht importiert werden.";
  }
  render();
}

function renderPrivacy() {
  return `
    <section class="panel privacy-panel">
      <h2>Datenschutz & Zweck</h2>
      <p>Diese App dient der datenschutzarmen Dokumentation von Lernständen zur Unterrichtsorganisation. Die Kinder arbeiten mit Tier-Pseudonymen. Optional kann die Lehrkraft im PIN-geschützten Bereich eine lokale Tier-Zuordnung mit Vornamen pflegen; im Kinderbereich, in QR-Codes und in anonymisierten Exporten erscheinen diese Vornamen nicht.</p>
      <h3>Gespeichert werden nur:</h3>
      <ul>
        <li>Klasse/Lerngruppe</li>
        <li>Tier-Pseudonym</li>
        <li>Fach</li>
        <li>Material</li>
        <li>Seite</li>
        <li>Status</li>
        <li>Datum/Uhrzeit</li>
        <li>erledigt-Status</li>
        <li>Tests/Lernzielkontrollen und zugehörige Ergebnisse zu Tier-Pseudonymen</li>
        <li>optional Vornamen in der geschützten Tier-Zuordnung</li>
      </ul>
      <h3>Nicht gespeichert werden:</h3>
      <ul>
        <li>Vornamen im Kinderbereich, in QR-Codes und in anonymisierten Exporten</li>
        <li>Fotos</li>
        <li>Handschrift</li>
        <li>freie Leistungs- oder Verhaltenskommentare</li>
        <li>KI-Auswertungen</li>
      </ul>
      <p>Die Daten werden lokal auf diesem iPad/in diesem Browser gespeichert. Backups sollen nur an einem geschützten Speicherort abgelegt werden.</p>
    </section>
  `;
}

function subjectChipClass(subject) {
  if (subject === "Deutsch") return "deutsch";
  if (subject === "Mathe") return "mathe";
  return "neutral";
}

function assessmentGradingNeedsPoints(gradingType) {
  return String(gradingType || "").includes("Punkte");
}

function assessmentUsesPoints(assessment) {
  return assessmentGradingNeedsPoints(assessment?.bewertungsart);
}

function assessmentUsesNote(assessment) {
  return String(assessment?.bewertungsart || "").includes("Note");
}

function assessmentUsesSymbol(assessment) {
  return String(assessment?.bewertungsart || "").includes("Symbol");
}

function assessmentResultsFor(assessmentId) {
  return (state.assessmentResults || []).filter((item) => item.assessmentId === assessmentId);
}

function assessmentTasksFor(assessmentId) {
  return (state.assessmentTasks || [])
    .filter((item) => item.assessmentId === assessmentId)
    .sort((a, b) => String(a.number).localeCompare(String(b.number), "de", { numeric: true }));
}

function assessmentResultFor(assessmentId, animalId) {
  return (state.assessmentResults || []).find((item) => item.assessmentId === assessmentId && item.animalId === animalId) || null;
}

function assessmentAnimalLabel(result) {
  const animal = state.animals.find((item) => item.id === result?.animalId);
  const base = `${result?.tierEmojiSnapshot || animal?.tierEmoji || ""} ${result?.tierNameSnapshot || animal?.tierName || ""}`.trim() || "Tier";
  if (state.teacherShowFirstNames && animal?.firstName) return `${base} · ${animal.firstName}`;
  return base;
}

function formatAssessmentPoints(result) {
  if (!result) return "–";
  const points = result.totalPoints ?? result.punkte;
  if (points === "" || points == null) return "–";
  const max = result.maxPunkteSnapshot ? `/${result.maxPunkteSnapshot}` : "";
  return `${points}${max}`;
}

function formatAssessmentPercent(result) {
  const points = Number(result?.totalPoints ?? result?.punkte);
  const maxPoints = Number(result?.maxPunkteSnapshot);
  if (!Number.isFinite(points) || !Number.isFinite(maxPoints) || maxPoints <= 0) return "–";
  return `${Math.round((points / maxPoints) * 100)} %`;
}

function formatAssessmentMatrixValue(assessment, result) {
  if (!result) return "–";
  if (result.status && result.status !== "eingetragen") return result.status;
  const parts = [];
  if (assessmentUsesPoints(assessment)) parts.push(formatAssessmentPoints(result));
  if (result.percentage !== "" && result.percentage != null) parts.push(`${result.percentage} %`);
  if (result.finalRating || result.suggestedRating) parts.push(result.finalRating || result.suggestedRating);
  if (assessmentUsesNote(assessment) && result.note) parts.push(result.note);
  if (result.finalNote && !parts.includes(result.finalNote)) parts.push(result.finalNote);
  if (assessmentUsesSymbol(assessment) && result.symbol) parts.push(result.symbol);
  return parts.filter((part) => part && part !== "–").join(" | ") || "–";
}

function assessmentMatrixHeader(assessment) {
  const date = assessment.datum ? formatGermanDate(assessment.datum) : "";
  return `${assessment.titel}${date ? `\n${date}` : ""}`;
}

function assessmentResultCounts(results) {
  return ASSESSMENT_RESULT_STATUSES.reduce((counts, status) => {
    counts[status] = results.filter((result) => result.status === status).length;
    return counts;
  }, {});
}

function parseAssessmentTasksInput(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const parts = line.split(";").map((part) => part.trim());
      const maxPoints = Number((parts[2] || parts[1] || "").replace(",", "."));
      return {
        number: parts[0] || String(index + 1),
        title: parts[1] || parts[0] || `Aufgabe ${index + 1}`,
        maxPoints: Number.isFinite(maxPoints) && maxPoints > 0 ? maxPoints : 0,
        competency: parts[3] || ""
      };
    })
    .filter((task) => task.maxPoints > 0);
}

function assessmentMaxPoints(assessment) {
  const taskSum = assessmentTasksFor(assessment.id).reduce((sum, task) => sum + Number(task.maxPoints || 0), 0);
  return taskSum || Number(assessment.maxPunkte || 0) || "";
}

function calculateAssessmentResultSummary(assessment, result) {
  const tasks = assessmentTasksFor(assessment.id);
  const maxPoints = Number(assessmentMaxPoints(assessment));
  if (!result) {
    return { totalPoints: "", maxPoints: maxPoints || "", percentage: "", rating: "", note: "", pointsLabel: "–", percentLabel: "–" };
  }
  if (tasks.length && !Object.keys(result.taskPoints || {}).length) {
    return { totalPoints: "", maxPoints: maxPoints || "", percentage: "", rating: "", note: "", pointsLabel: "–", percentLabel: "–" };
  }
  const points = tasks.length
    ? tasks.reduce((sum, task) => sum + (Number(result?.taskPoints?.[task.id]) || 0), 0)
    : Number(result?.punkte ?? result?.totalPoints);
  if (!Number.isFinite(points) || !Number.isFinite(maxPoints) || maxPoints <= 0) {
    return { totalPoints: "", maxPoints: maxPoints || "", percentage: "", rating: "", note: "", pointsLabel: "–", percentLabel: "–" };
  }
  const percentage = Math.round((points / maxPoints) * 100);
  const rating = ratingForPercentage(percentage);
  const note = noteForRating(rating);
  return {
    totalPoints: points,
    maxPoints,
    percentage,
    rating,
    note,
    pointsLabel: `${points}/${maxPoints}`,
    percentLabel: `${percentage} %`
  };
}

function enrichAssessmentResult(assessment, result) {
  const summary = calculateAssessmentResultSummary(assessment, result);
  return {
    ...result,
    punkte: summary.totalPoints !== "" ? summary.totalPoints : result.punkte ?? "",
    totalPoints: summary.totalPoints,
    maxPunkteSnapshot: summary.maxPoints || result.maxPunkteSnapshot || assessment.maxPunkte || "",
    percentage: summary.percentage,
    suggestedRating: summary.rating,
    suggestedNote: summary.note,
    finalRating: result.finalRating || summary.rating || "",
    finalNote: result.finalNote || result.note || summary.note || ""
  };
}

function withAssessmentPercentiles(assessmentId, results) {
  const relevant = results
    .filter((item) => item.assessmentId === assessmentId && Number.isFinite(Number(item.percentage)))
    .sort((a, b) => Number(a.percentage) - Number(b.percentage));
  if (relevant.length < 2) return results.map((item) => item.assessmentId === assessmentId ? { ...item, percentileRank: "" } : item);
  return results.map((item) => {
    if (item.assessmentId !== assessmentId || !Number.isFinite(Number(item.percentage))) return item;
    const belowOrEqual = relevant.filter((other) => Number(other.percentage) <= Number(item.percentage)).length;
    return { ...item, percentileRank: Math.round((belowOrEqual / relevant.length) * 100) };
  });
}

function ratingForPercentage(percentage) {
  const value = Number(percentage);
  if (!Number.isFinite(value)) return "";
  if (value >= 96) return "sehr gut";
  if (value >= 87) return "gut";
  if (value >= 71) return "befriedigend";
  if (value >= 50) return "ausreichend";
  if (value >= 21) return "mangelhaft";
  return "ungenügend";
}

function noteForRating(rating) {
  return {
    "sehr gut": "1",
    gut: "2",
    befriedigend: "3",
    ausreichend: "4",
    mangelhaft: "5",
    ungenügend: "6"
  }[rating] || "";
}

function latestAssessmentUpdatedAt() {
  const dates = [
    ...(state.assessments || []).map((item) => item.updatedAt || item.createdAt),
    ...(state.assessmentTasks || []).map((item) => item.updatedAt || item.createdAt),
    ...(state.assessmentResults || []).map((item) => item.updatedAt || item.createdAt)
  ].filter(Boolean).sort((a, b) => new Date(b) - new Date(a));
  return dates[0] || "";
}

function trainingTasksForArea(area) {
  return (state.trainingTasks || [])
    .filter((task) => task.area === area && task.active !== false)
    .sort((a, b) => String(a.subcategory || "").localeCompare(String(b.subcategory || ""), "de") || a.subject.localeCompare(b.subject, "de") || a.code.localeCompare(b.code, "de", { numeric: true }));
}

function isTrainingTaskCompleted(animalId, taskCode) {
  const latest = (state.trainingCompletions || [])
    .filter((item) => item.classId === state.activeClassId && item.animalId === animalId && item.taskCode === taskCode)
    .sort((a, b) => new Date(b.updatedAt || b.completedAt || 0) - new Date(a.updatedAt || a.completedAt || 0))[0];
  return latest?.status === "bearbeitet";
}

function buildTrainingRowsForClass(classId) {
  const animals = state.animals.filter((animal) => animal.classId === classId && animal.aktiv);
  const tasks = (state.trainingTasks || []).filter((task) => task.active !== false);
  const completions = state.trainingCompletions || [];
  return animals.flatMap((animal) => tasks.map((task) => {
    const completion = completions
      .filter((item) => item.classId === classId && item.animalId === animal.id && item.taskCode === task.code)
      .sort((a, b) => new Date(b.updatedAt || b.completedAt || 0) - new Date(a.updatedAt || a.completedAt || 0))[0];
    return {
      classId,
      animalId: animal.id,
      tierName: animal.tierName,
      tierEmoji: animal.tierEmoji,
      trainingArea: task.area,
      subcategory: task.subcategory || completion?.subcategory || defaultTrainingSubcategory(task.code),
      taskCode: task.code,
      subject: task.subject,
      taskTitle: task.title || completion?.taskTitle || task.code,
      taskText: task.text || completion?.taskText || "",
      completedAt: completion?.completedAt || "",
      status: completion?.status || "offen"
    };
  }));
}

function workbookCatalogForActiveClass() {
  return workbookCatalogForClass(state.activeClassId);
}

function workbookCatalogForClass(classId) {
  return (state.workbookCatalog || []).filter((item) => item.classId === classId);
}

function weeklyInputPrefix(scope, animalId = "") {
  return scope === "override" && animalId ? `weeklyOverride_${animalId}_` : "weekly";
}

function normalizeIdArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") return value.split(",").map((item) => item.trim()).filter(Boolean);
  return value ? [String(value)] : [];
}

function pageRangeLabel(item) {
  if (!item || !Number(item.page)) return "";
  if (item.pageLabel) return `S. ${item.pageLabel}`;
  const start = Number(item.page);
  const end = Number(item.pageEnd);
  return end && end > start ? `S. ${start}-${end}` : `S. ${start}`;
}

function workbookCatalogShortLabel(item) {
  if (!item) return "";
  const pageLabel = pageRangeLabel(item);
  if (item.subject === "Mathe") {
    return [item.workbook, item.part, pageLabel].filter(Boolean).join(" · ");
  }
  return [item.workbook, item.part, pageLabel].filter(Boolean).join(" · ");
}

function workbookCatalogFullLabel(item) {
  if (!item) return "";
  const pageLabel = pageRangeLabel(item);
  if (item.subject === "Mathe") {
    return [
      [item.workbook, item.part].filter(Boolean).join(" · "),
      item.area || item.title,
      pageLabel,
      item.competence
    ].filter(Boolean).join(" – ");
  }
  return [
    [item.workbook, item.part].filter(Boolean).join(" · "),
    item.area,
    pageLabel,
    item.title || item.competence
  ].filter(Boolean).join(" – ");
}

function workbookCssClass(workbook) {
  return String(workbook || "")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function workbookCatalogLabel(item) {
  return workbookCatalogFullLabel(item);
}

function weeklyPlansForActiveClass() {
  return (state.weeklyPlans || []).filter((plan) => plan.classId === state.activeClassId && plan.active !== false);
}

function weeklyPlansForAnimal(animalId) {
  return weeklyPlansForActiveClass()
    .filter((plan) => weeklyPlanAppliesToAnimal(plan, animalId))
    .filter((plan) => weeklyPlanIsCurrent(plan))
    .sort((a, b) => String(a.validFrom || a.createdAt || "").localeCompare(String(b.validFrom || b.createdAt || "")));
}

function weeklyPlanAppliesToAnimal(plan, animalId) {
  return plan.assignmentMode === "all" || !plan.animalIds?.length || plan.animalIds.includes(animalId);
}

function weeklyPlanIsCurrent(plan) {
  const today = formatFileDate(new Date());
  if (plan.validFrom && today < plan.validFrom) return false;
  if (plan.validTo && today > plan.validTo) return false;
  return true;
}

function weeklyPlanPeriodLabel(plan) {
  const parts = [];
  if (plan.weekLabel) parts.push(plan.weekLabel);
  if (plan.validFrom || plan.validTo) parts.push(`${plan.validFrom ? formatGermanDate(plan.validFrom) : "offen"} bis ${plan.validTo ? formatGermanDate(plan.validTo) : "offen"}`);
  return parts.join(" · ") || "ohne Zeitraum";
}

function effectiveWeeklyDayData(plan, day, animalId = "") {
  const base = plan.days?.[day] || {};
  const override = animalId ? plan.overrides?.[animalId]?.days?.[day] || {} : {};
  const baseDeutschIds = normalizeIdArray(base.deutschIds || base.deutschId);
  const baseMatheIds = normalizeIdArray(base.matheIds || base.matheId);
  const overrideDeutschIds = normalizeIdArray(override.deutschIds || override.deutschId);
  const overrideMatheIds = normalizeIdArray(override.matheIds || override.matheId);
  return {
    deutschIds: overrideDeutschIds.length ? overrideDeutschIds : baseDeutschIds,
    matheIds: overrideMatheIds.length ? overrideMatheIds : baseMatheIds,
    freeText: override.freeText || base.freeText || ""
  };
}

function weeklyPlanItemsForDay(plan, day, animalId = "") {
  const dayData = effectiveWeeklyDayData(plan, day, animalId);
  const catalog = workbookCatalogForClass(plan.classId);
  const deutschItems = normalizeIdArray(dayData.deutschIds).map((id) => catalog.find((item) => item.id === id)).filter(Boolean);
  const matheItems = normalizeIdArray(dayData.matheIds).map((id) => catalog.find((item) => item.id === id)).filter(Boolean);
  return [
    ...deutschItems.map((deutsch) => ({
      field: `Deutsch:${deutsch.id}`,
      label: "Deutsch",
      workbookCatalogId: deutsch.id,
      catalogItem: deutsch,
      text: workbookCatalogShortLabel(deutsch),
      detail: workbookCatalogFullLabel(deutsch)
    })),
    ...matheItems.map((mathe) => ({
      field: `Mathe:${mathe.id}`,
      label: "Mathe",
      workbookCatalogId: mathe.id,
      catalogItem: mathe,
      text: workbookCatalogShortLabel(mathe),
      detail: workbookCatalogFullLabel(mathe)
    })),
    dayData.freeText ? {
      field: "Freie Aufgabe",
      label: "Extra",
      freeText: dayData.freeText,
      text: dayData.freeText,
      detail: ""
    } : null
  ].filter(Boolean);
}

function weeklyPlanItemStatus(planId, animalId, day, field) {
  return normalizeSimpleWorkStatus(weeklyPlanStatusRecord(planId, animalId, day, field)?.status || "offen");
}

function weeklyPlanStatusRecord(planId, animalId, day, field) {
  return (state.weeklyPlanStatuses || [])
    .filter((item) => item.planId === planId && item.animalId === animalId && item.day === day && item.field === field)
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))[0];
}

function weeklyStatusBadge(status) {
  return simpleWorkStatusBadge(status);
}

function weeklyPlanProgressMode(plan) {
  return plan?.progressMode || (plan?.autoCreateEntries ? "auto" : "confirm");
}

function weeklyCatalogPages(item) {
  const start = Number(item?.page || 0);
  const end = Number(item?.pageEnd || 0);
  if (!start) return [];
  const last = end && end > start ? end : start;
  return Array.from({ length: last - start + 1 }, (_, index) => start + index);
}

function weeklyItemPageSummary(item) {
  if (!item?.catalogItem) return "–";
  return pageRangeLabel(item.catalogItem);
}

function weeklyStatusFilterMatches(row, filter) {
  if (!filter || filter === "all") return true;
  if (filter === "linked") return row.statusRecord?.progressLinked === true;
  return normalizeSimpleWorkStatus(row.status) === filter;
}

function weeklyProgressLinkBadge(statusRecord) {
  if (statusRecord?.progressLinked) return `<span class="badge done">übernommen</span>`;
  if (normalizeSimpleWorkStatus(statusRecord?.status) === "fertig") return `<span class="badge help">noch nicht übernommen</span>`;
  if (normalizeSimpleWorkStatus(statusRecord?.status) === "teilweise") return `<span class="badge help">teilweise</span>`;
  return `<span class="badge stale">nicht übernommen</span>`;
}

function weeklyStatusActions(row) {
  const statusId = row.statusRecord?.id || "";
  const canConfirm = row.item.catalogItem && normalizeSimpleWorkStatus(row.status) !== "offen" && !row.statusRecord?.progressLinked;
  const buttons = [];
  if (canConfirm) buttons.push(`<button class="small-button" type="button" onclick="confirmWeeklyPlanProgress('${statusId}')">in Fortschritt übernehmen</button>`);
  if (row.status !== "offen") buttons.push(`<button class="small-button" type="button" onclick="setWeeklyPlanStatusFromTeacher('${escapeAttribute(row.plan.id)}','${escapeAttribute(row.animal.id)}','${escapeAttribute(row.day)}','${escapeAttribute(row.item.field)}','offen')">auf offen setzen</button>`);
  if (row.statusRecord?.progressLinked) buttons.push(`<button class="small-button" type="button" onclick="unlinkWeeklyPlanProgress('${statusId}')">Zuordnung entfernen</button>`);
  return buttons.join(" ") || "–";
}

function setWeeklyStatusFilter(value) {
  weeklyStatusFilter = value || "all";
  render();
}

async function confirmWeeklyPlanProgress(statusId) {
  const nextState = linkWeeklyStatusToProgress(state, statusId, { confirmed: true });
  await persist(nextState);
  render();
}

async function setWeeklyPlanStatusFromTeacher(planId, animalId, day, field, status) {
  if (!WEEKLY_PLAN_STATUSES.includes(status)) return;
  const timestamp = nowIso();
  const existing = weeklyPlanStatusRecord(planId, animalId, day, field);
  const nextStatus = {
    ...(existing || {}),
    id: existing?.id || makeId(),
    classId: state.activeClassId,
    planId,
    animalId,
    day,
    field,
    status,
    progressLinked: existing?.progressLinked === true,
    progressEntryId: existing?.progressEntryId || "",
    updatedAt: timestamp,
    createdAt: existing?.createdAt || timestamp
  };
  let nextState = {
    ...state,
    weeklyPlanStatuses: existing
      ? (state.weeklyPlanStatuses || []).map((item) => item.id === existing.id ? nextStatus : item)
      : [...(state.weeklyPlanStatuses || []), nextStatus]
  };
  if (status === "offen" && existing?.progressLinked) {
    nextState = removeWeeklyProgressLink(nextState, existing.id);
  }
  await persist(nextState);
  render();
}

async function unlinkWeeklyPlanProgress(statusId) {
  const nextState = removeWeeklyProgressLink(state, statusId);
  await persist(nextState);
  render();
}

function linkWeeklyStatusToProgress(currentState, statusId, options = {}) {
  const timestamp = nowIso();
  const status = (currentState.weeklyPlanStatuses || []).find((item) => item.id === statusId);
  if (!status) return currentState;
  const plan = (currentState.weeklyPlans || []).find((item) => item.id === status.planId);
  const animal = (currentState.animals || []).find((item) => item.id === status.animalId);
  const item = plan && animal ? weeklyPlanItemsForDay(plan, status.day, animal.id).find((entry) => entry.field === status.field) : null;
  if (!plan || !animal || !item?.catalogItem) return currentState;
  const catalog = item.catalogItem;
  const pages = weeklyCatalogPages(catalog);
  const completedPages = (status.completedPages || []).map((page) => Number(page)).filter(Boolean);
  const targetPage = normalizeSimpleWorkStatus(status.status) === "teilweise" && completedPages.length
    ? Math.max(...completedPages)
    : pages.length ? pages[pages.length - 1] : Number(catalog.page || 0);
  if (!targetPage) return currentState;
  const duplicate = (currentState.entries || []).find((entry) => (
    entry.classId === status.classId
    && entry.tierID === animal.id
    && entry.fach === catalog.subject
    && entry.materialName === catalog.workbook
    && entry.workbookCatalogId === catalog.id
  )) || (currentState.entries || []).find((entry) => (
    entry.classId === status.classId
    && entry.tierID === animal.id
    && entry.fach === catalog.subject
    && entry.materialName === catalog.workbook
    && Number(entry.seite) === targetPage
  ));
  const progressEntry = duplicate ? {
    ...duplicate,
    weeklyPlanId: duplicate.weeklyPlanId || plan.id,
    weeklyPlanDay: duplicate.weeklyPlanDay || status.day,
    weeklyPlanField: duplicate.weeklyPlanField || status.field,
    weeklyPlanSource: weeklyPlanPeriodLabel(plan),
    weeklyPlanRepeated: duplicate.weeklyPlanId && duplicate.weeklyPlanId !== plan.id ? true : duplicate.weeklyPlanRepeated === true,
    source: duplicate.source || "Wochenplan",
    workbookCatalogId: duplicate.workbookCatalogId || catalog.id,
    workbookPart: duplicate.workbookPart || catalog.part || "",
    workbookArea: duplicate.workbookArea || catalog.area || "",
    workbookCategory: duplicate.workbookCategory || catalog.category || "",
    seite: targetPage,
    seiteVon: Number(catalog.page || targetPage),
    seiteBis: Number(catalog.pageEnd || targetPage),
    workStatus: normalizeSimpleWorkStatus(status.status)
  } : {
    id: makeId(),
    classId: status.classId,
    tierID: animal.id,
    tierNameSnapshot: animal.tierName,
    tierEmojiSnapshot: animal.tierEmoji,
    fach: catalog.subject,
    materialName: catalog.workbook,
    workbookCatalogId: catalog.id,
    workbookPart: catalog.part || "",
    workbookArea: catalog.area || "",
    workbookCategory: catalog.category || "",
    seite: targetPage,
    seiteVon: Number(catalog.page || targetPage),
    seiteBis: Number(catalog.pageEnd || targetPage),
    zusatzText: catalog.title || catalog.area || "",
    status: "fertig",
    workStatus: normalizeSimpleWorkStatus(status.status),
    erledigt: false,
    datumUhrzeit: status.completedAt || timestamp,
    source: "Wochenplan",
    weeklyPlanId: plan.id,
    weeklyPlanDay: status.day,
    weeklyPlanField: status.field,
    weeklyPlanSource: weeklyPlanPeriodLabel(plan)
  };
  const entries = duplicate
    ? (currentState.entries || []).map((entry) => entry.id === duplicate.id ? progressEntry : entry)
    : [...(currentState.entries || []), progressEntry];
  const weeklyPlanStatuses = (currentState.weeklyPlanStatuses || []).map((item) => item.id === status.id ? {
    ...item,
    status: normalizeSimpleWorkStatus(item.status) === "offen" ? "fertig" : normalizeSimpleWorkStatus(item.status),
    progressLinked: true,
    progressEntryId: progressEntry.id,
    completedPages: normalizeSimpleWorkStatus(item.status) === "teilweise" && status.completedPages?.length ? status.completedPages : pages.map(String),
    openPages: normalizeSimpleWorkStatus(item.status) === "teilweise" ? pages.map(String).filter((page) => !(status.completedPages || []).includes(page)) : [],
    confirmedAt: options.confirmed ? timestamp : item.confirmedAt || "",
    updatedAt: timestamp
  } : item);
  return { ...currentState, entries, weeklyPlanStatuses };
}

function removeWeeklyProgressLink(currentState, statusId) {
  const status = (currentState.weeklyPlanStatuses || []).find((item) => item.id === statusId);
  if (!status) return currentState;
  const entries = (currentState.entries || []).map((entry) => entry.id === status.progressEntryId ? {
    ...entry,
    weeklyPlanId: "",
    weeklyPlanDay: "",
    weeklyPlanField: "",
    weeklyPlanSource: "",
    source: entry.source === "Wochenplan" ? "" : entry.source
  } : entry);
  const weeklyPlanStatuses = (currentState.weeklyPlanStatuses || []).map((item) => item.id === statusId ? {
    ...item,
    status: normalizeSimpleWorkStatus(item.status),
    progressLinked: false,
    progressEntryId: "",
    confirmedAt: "",
    updatedAt: nowIso()
  } : item);
  return { ...currentState, entries, weeklyPlanStatuses };
}

function activeClass() {
  return state.classes.find((item) => item.id === state.activeClassId);
}

function selectedAnimal() {
  return state.animals.find((item) => item.id === childDraft.animalId && item.classId === state.activeClassId);
}

function animalsForActiveClass() {
  return state.animals.filter((item) => item.classId === state.activeClassId);
}

function teacherAnimalLabel(animalLike) {
  const animal = state.animals.find((item) => item.id === animalLike.id || item.id === animalLike.animalId || item.id === animalLike.tierID) || animalLike;
  const base = `${escapeHtml(animal.tierEmoji || animal.tierEmojiSnapshot || "")} ${escapeHtml(animal.tierName || animal.tierNameSnapshot || "")}`.trim();
  if (state.teacherShowFirstNames && animal.firstName) {
    return `${base} <span class="private-name">· ${escapeHtml(animal.firstName)}</span>`;
  }
  return base;
}

function materialsForActiveClass() {
  return state.materials.filter((item) => item.classId === state.activeClassId);
}

function entriesForActiveClass() {
  return state.entries.filter((item) => item.classId === state.activeClassId);
}

function assessmentsForActiveClass() {
  return (state.assessments || []).filter((item) => item.classId === state.activeClassId);
}

function goalsForActiveClass() {
  return state.goals.filter((item) => item.classId === state.activeClassId);
}

function animalsForClass(classId) {
  return state.animals.filter((item) => item.classId === classId);
}

function materialsForClass(classId) {
  return state.materials.filter((item) => item.classId === classId);
}

function getClassNameForEntry(entry) {
  return state.classes.find((item) => item.id === entry.classId)?.name || "";
}

function getClassNameById(classId) {
  return state.classes.find((item) => item.id === classId)?.name || "";
}

function getProgressClassId() {
  return progressFilters.classId && state.classes.some((item) => item.id === progressFilters.classId)
    ? progressFilters.classId
    : state.activeClassId;
}

function progressMaterialOptions(classId, subject) {
  return [...new Set(materialsForClass(classId)
    .filter((material) => !subject || material.fach === subject)
    .map((material) => material.materialName))]
    .sort((a, b) => a.localeCompare(b, "de"));
}

function progressPeriodOptions() {
  return [
    ["today", "heute"],
    ["week", "diese Woche"],
    ["last7", "letzte 7 Tage"],
    ["month", "dieser Monat"],
    ["all", "alle"]
  ].map(([value, label]) => `<option value="${value}" ${progressFilters.period === value ? "selected" : ""}>${label}</option>`).join("");
}

function setProgressFilter(field, value) {
  progressFilters = { ...progressFilters, [field]: value };
  if (field === "classId") {
    progressFilters = { ...progressFilters, animalId: "", material: "" };
    progressDetailAnimalId = "";
  }
  if (field === "fach") {
    progressFilters = { ...progressFilters, material: "" };
  }
  render();
}

function setProgressAnimalTab(tab) {
  progressAnimalTab = tab || "overview";
  render();
}

function normalizeSimpleWorkStatus(status) {
  if (status === "bearbeitet" || status === "von Lehrkraft bestätigt") return "fertig";
  if (status === "begonnen") return "teilweise";
  return ["offen", "teilweise", "fertig"].includes(status) ? status : "offen";
}

function simpleWorkStatusLabel(status) {
  return normalizeSimpleWorkStatus(status);
}

function simpleWorkStatusBadge(status) {
  const normalized = normalizeSimpleWorkStatus(status);
  const className = normalized === "fertig" ? "done" : normalized === "teilweise" ? "help" : "stale";
  return `<span class="badge ${className}">${escapeHtml(normalized)}</span>`;
}

function entriesForAnimalProgress(classId, animalId) {
  return (state.entries || [])
    .filter((entry) => entry.classId === classId && entry.tierID === animalId && (entry.fach === "Deutsch" || entry.fach === "Mathe"))
    .sort(sortNewest);
}

function latestWorkbookEntry(classId, animalId, subject) {
  return entriesForAnimalProgress(classId, animalId)
    .filter((entry) => entry.fach === subject)
    .sort(sortNewest)[0] || null;
}

function progressEntrySummary(entry) {
  if (!entry) return "noch kein Stand";
  const part = entry.workbookPart ? ` ${entry.workbookPart}` : "";
  const status = entry.workStatus && entry.workStatus !== "fertig" ? ` (${normalizeSimpleWorkStatus(entry.workStatus)})` : "";
  return `${entry.materialName}${part}: bis ${entryWorkLabel(entry)}${status}`;
}

async function saveAnimalProgressNote(event, animalId) {
  event.preventDefault();
  const note = document.querySelector("#animalProgressNote")?.value.trim() || "";
  const animals = (state.animals || []).map((animal) => animal.id === animalId ? {
    ...animal,
    progressNote: note,
    updatedAt: nowIso()
  } : animal);
  globalMessage = "Notiz wurde gespeichert.";
  await persistAndRender({ ...state, animals });
}

async function saveDirectWorkbookProgress(event, subject, animalId) {
  event.preventDefault();
  const formId = subject === "Deutsch" ? "directDeutschProgress" : "directMatheProgress";
  const catalogId = document.querySelector(`#${formId}Catalog`)?.value || "";
  const status = normalizeSimpleWorkStatus(document.querySelector(`#${formId}Status`)?.value || "offen");
  const pageText = document.querySelector(`#${formId}Pages`)?.value.trim() || "";
  const note = document.querySelector(`#${formId}Note`)?.value.trim() || "";
  const catalog = workbookCatalogForActiveClass().find((item) => item.id === catalogId);
  const animal = animalsForActiveClass().find((item) => item.id === animalId);
  if (!catalog || !animal) return;
  const nextState = upsertWorkbookProgressEntry(state, {
    classId: state.activeClassId,
    animal,
    catalog,
    status,
    source: "Direkteingabe",
    note,
    completedPages: parsePageSelection(pageText, catalog)
  });
  globalMessage = "Fortschritt wurde gespeichert.";
  await persistAndRender(nextState);
}

async function setWeeklyPlanSimpleStatus(planId, animalId, day, field, status) {
  const normalized = normalizeSimpleWorkStatus(status);
  const plan = (state.weeklyPlans || []).find((item) => item.id === planId);
  const animal = animalsForActiveClass().find((item) => item.id === animalId);
  const item = plan && animal ? weeklyPlanItemsForDay(plan, day, animal.id).find((entry) => entry.field === field) : null;
  if (!plan || !animal || !item || !WEEKLY_PLAN_STATUSES.includes(normalized)) return;
  const timestamp = nowIso();
  const pages = item.catalogItem ? weeklyCatalogPages(item.catalogItem) : [];
  const completedPages = normalized === "fertig"
    ? pages.map(String)
    : normalized === "teilweise" && pages.length > 1
      ? promptCompletedPages(pages)
      : normalized === "teilweise" && pages.length === 1
        ? [String(pages[0])]
        : [];
  const openPages = pages.map(String).filter((page) => !completedPages.includes(page));
  const existing = weeklyPlanStatusRecord(planId, animalId, day, field);
  const nextStatus = {
    ...(existing || {}),
    id: existing?.id || makeId(),
    classId: state.activeClassId,
    planId,
    animalId,
    day,
    field,
    workbookCatalogId: item.workbookCatalogId || "",
    freeText: item.freeText || "",
    status: normalized,
    completedPages,
    openPages,
    completedAt: normalized === "fertig" ? timestamp : existing?.completedAt || "",
    updatedAt: timestamp,
    createdAt: existing?.createdAt || timestamp
  };
  let nextState = {
    ...state,
    weeklyPlanStatuses: existing
      ? (state.weeklyPlanStatuses || []).map((entry) => entry.id === existing.id ? nextStatus : entry)
      : [...(state.weeklyPlanStatuses || []), nextStatus]
  };
  if (normalized === "offen" && existing?.progressLinked) {
    nextState = removeWeeklyProgressLink(nextState, existing.id);
  }
  if (item.catalogItem && (normalized === "teilweise" || normalized === "fertig")) {
    nextState = upsertWorkbookProgressEntry(nextState, {
      classId: state.activeClassId,
      animal,
      catalog: item.catalogItem,
      status: normalized,
      source: "Wochenplan",
      weeklyPlan: plan,
      weeklyStatus: nextStatus,
      completedPages
    });
    const linkedEntry = findWorkbookProgressDuplicate(nextState.entries || [], state.activeClassId, animal.id, item.catalogItem);
    nextState = {
      ...nextState,
      weeklyPlanStatuses: (nextState.weeklyPlanStatuses || []).map((entry) => entry.id === nextStatus.id ? {
        ...entry,
        progressLinked: true,
        progressEntryId: linkedEntry?.id || entry.progressEntryId || "",
        updatedAt: timestamp
      } : entry)
    };
  }
  await persist(nextState);
  render();
}

function promptCompletedPages(pages) {
  const answer = window.prompt(`Welche Seiten wurden bearbeitet?\nMöglich: ${pages.map((page) => `S. ${page}`).join(", ")}\nBitte Seitenzahlen mit Komma trennen.`, pages[0] ? String(pages[0]) : "");
  if (answer == null) return [];
  return parsePageSelection(answer, { page: pages[0], pageEnd: pages[pages.length - 1] });
}

function parsePageSelection(text, catalog) {
  const allowed = new Set(weeklyCatalogPages(catalog).map(String));
  return String(text || "")
    .split(/[,\s;]+/)
    .map((part) => part.replace(/[^0-9]/g, ""))
    .filter((part) => part && (!allowed.size || allowed.has(part)));
}

function findWorkbookProgressDuplicate(entries, classId, animalId, catalog) {
  const targetPage = Number(catalog?.pageEnd || catalog?.page || 0);
  return (entries || []).find((entry) => (
    entry.classId === classId
    && entry.tierID === animalId
    && entry.fach === catalog.subject
    && entry.materialName === catalog.workbook
    && entry.workbookCatalogId === catalog.id
  )) || (entries || []).find((entry) => (
    entry.classId === classId
    && entry.tierID === animalId
    && entry.fach === catalog.subject
    && entry.materialName === catalog.workbook
    && Number(entry.seite) === targetPage
  ));
}

function upsertWorkbookProgressEntry(currentState, { classId, animal, catalog, status, source, weeklyPlan = null, weeklyStatus = null, completedPages = [], note = "" }) {
  const timestamp = nowIso();
  const pages = weeklyCatalogPages(catalog);
  const completedNumbers = completedPages.map((page) => Number(page)).filter(Boolean);
  const targetPage = normalizeSimpleWorkStatus(status) === "teilweise" && completedNumbers.length
    ? Math.max(...completedNumbers)
    : Number(catalog.pageEnd || catalog.page || pages[pages.length - 1] || 0);
  if (!targetPage) return currentState;
  const duplicate = findWorkbookProgressDuplicate(currentState.entries || [], classId, animal.id, catalog);
  const sourceLabel = source || "Direkteingabe";
  const sourceSet = new Set(String(duplicate?.source || "").split(",").map((item) => item.trim()).filter(Boolean));
  sourceSet.add(sourceLabel);
  const progressEntry = {
    ...(duplicate || {}),
    id: duplicate?.id || makeId(),
    classId,
    tierID: animal.id,
    tierNameSnapshot: animal.tierName,
    tierEmojiSnapshot: animal.tierEmoji,
    fach: catalog.subject,
    materialName: catalog.workbook,
    workbookCatalogId: catalog.id,
    workbookPart: catalog.part || "",
    workbookArea: catalog.area || "",
    workbookCategory: catalog.category || "",
    seite: targetPage,
    seiteVon: Number(catalog.page || targetPage),
    seiteBis: Number(catalog.pageEnd || targetPage),
    zusatzText: note || catalog.title || catalog.area || "",
    status: "fertig",
    workStatus: normalizeSimpleWorkStatus(status),
    completedPages,
    openPages: pages.map(String).filter((page) => !completedPages.includes(page)),
    erledigt: false,
    datumUhrzeit: timestamp,
    source: [...sourceSet].join(", "),
    weeklyPlanId: weeklyPlan?.id || duplicate?.weeklyPlanId || "",
    weeklyPlanDay: weeklyStatus?.day || duplicate?.weeklyPlanDay || "",
    weeklyPlanField: weeklyStatus?.field || duplicate?.weeklyPlanField || "",
    weeklyPlanSource: weeklyPlan ? weeklyPlanPeriodLabel(weeklyPlan) : duplicate?.weeklyPlanSource || "",
    createdAt: duplicate?.createdAt || timestamp,
    updatedAt: timestamp
  };
  const entries = duplicate
    ? (currentState.entries || []).map((entry) => entry.id === duplicate.id ? progressEntry : entry)
    : [...(currentState.entries || []), progressEntry];
  return { ...currentState, entries };
}

function openProgressDetail(animalId) {
  progressDetailAnimalId = animalId;
  render();
}

function closeProgressDetail() {
  progressDetailAnimalId = "";
  render();
}

function buildProgressRows(filters) {
  const classId = filters.classId;
  const activeAnimals = animalsForClass(classId).filter((animal) => animal.aktiv && (!filters.animalId || animal.id === filters.animalId));
  const materials = materialsForClass(classId)
    .filter((material) => material.aktiv)
    .filter((material) => !filters.fach || material.fach === filters.fach)
    .filter((material) => !filters.material || material.materialName === filters.material);
  const uniqueMaterials = dedupeMaterials(materials);
  const periodEntries = filterEntriesForProgress(state.entries.filter((entry) => entry.classId === classId), filters);
  const groupAverages = calculateGroupAverages(periodEntries);

  return activeAnimals.flatMap((animal) => uniqueMaterials.map((material) => {
    const entries = periodEntries
      .filter((entry) => entry.tierID === animal.id && entry.fach === material.fach && entry.materialName === material.materialName)
      .sort((a, b) => new Date(a.datumUhrzeit) - new Date(b.datumUhrzeit));
    const pages = entries.map((entry) => Number(entry.seite)).filter((page) => Number.isFinite(page) && page > 0);
    const firstEntry = entries[0] || null;
    const lastEntry = entries[entries.length - 1] || null;
    const minPage = pages.length ? Math.min(...pages) : null;
    const maxPage = pages.length ? Math.max(...pages) : null;
    const allMatchingEntries = state.entries
      .filter((entry) => entry.classId === classId && entry.tierID === animal.id && entry.fach === material.fach && entry.materialName === material.materialName)
      .sort(sortNewest);
    const openEntry = allMatchingEntries.find((entry) => !entry.erledigt && entry.status !== "fertig") || null;
    const lastActivity = allMatchingEntries[0]?.datumUhrzeit || null;
    const groupAverage = groupAverages.get(progressKey(material.fach, material.materialName)) ?? null;
    const groupDistance = lastEntry && Number(lastEntry.seite) > 0 && groupAverage != null ? Number(lastEntry.seite) - groupAverage : null;
    const goal = currentGoal(classId, material.fach, material.materialName);
    const goalDistance = lastEntry && Number(lastEntry.seite) > 0 && goal ? Number(lastEntry.seite) - Number(goal.sollSeite) : null;
    const groupLabel = groupComparisonLabel(groupDistance);
    const goalDistanceLabel = goalComparisonLabel(goal, goalDistance);
    const row = {
      classId,
      animal,
      fach: material.fach,
      material: material.materialName,
      entries,
      entryCount: entries.length,
      firstEntry,
      lastEntry,
      minPage,
      maxPage,
      progressPages: pages.length > 1 ? maxPage - minPage : 0,
      lastActivity,
      openEntry,
      groupAverage,
      groupDistance,
      groupLabel,
      goal,
      goalDistance,
      goalDistanceLabel
    };
    row.hints = progressHints(row);
    return row;
  }));
}

function dedupeMaterials(materials) {
  const seen = new Set();
  return materials.filter((material) => {
    const key = progressKey(material.fach, material.materialName);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function filterEntriesForProgress(entries, filters) {
  const range = progressDateRange(filters.period);
  return entries.filter((entry) => {
    const date = new Date(entry.datumUhrzeit);
    if (filters.fach && entry.fach !== filters.fach) return false;
    if (filters.material && entry.materialName !== filters.material) return false;
    if (filters.animalId && entry.tierID !== filters.animalId) return false;
    if (range.start && date < range.start) return false;
    if (range.end && date >= range.end) return false;
    return true;
  });
}

function progressDateRange(period) {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (period === "today") return { start, end: addDays(start, 1) };
  if (period === "week") return { start: startOfWeek(now), end: addDays(startOfWeek(now), 7) };
  if (period === "last7") return { start: addDays(now, -7), end: null };
  if (period === "month") return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 1) };
  return { start: null, end: null };
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function calculateGroupAverages(entries) {
  const highestByAnimal = new Map();
  entries.forEach((entry) => {
    const page = Number(entry.seite);
    if (page <= 0) return;
    if (!Number.isFinite(page)) return;
    const key = `${progressKey(entry.fach, entry.materialName)}|${entry.tierID}`;
    highestByAnimal.set(key, Math.max(highestByAnimal.get(key) || 0, page));
  });
  const grouped = new Map();
  highestByAnimal.forEach((page, key) => {
    const materialKey = key.split("|")[0];
    const list = grouped.get(materialKey) || [];
    list.push(page);
    grouped.set(materialKey, list);
  });
  const averages = new Map();
  grouped.forEach((pages, key) => {
    averages.set(key, pages.reduce((sum, page) => sum + page, 0) / pages.length);
  });
  return averages;
}

function progressKey(subject, material) {
  return `${subject}::${material}`;
}

function currentGoal(classId, subject, material) {
  const today = formatFileDate(new Date());
  return state.goals
    .filter((goal) => goal.classId === classId && goal.fach === subject && goal.material === material)
    .filter((goal) => !goal.gueltigAbDatum || goal.gueltigAbDatum <= today)
    .sort((a, b) => String(b.gueltigAbDatum || "").localeCompare(String(a.gueltigAbDatum || "")))[0] || null;
}

function groupComparisonLabel(distance) {
  if (distance == null || Number.isNaN(distance)) return "kein Vergleich möglich";
  const settings = state.progressSettings || DEFAULT_PROGRESS_SETTINGS;
  if (distance >= settings.aheadThreshold) return "weiter voraus";
  if (distance <= -settings.groupFarThreshold) return "deutlicher Abstand";
  if (distance <= -settings.groupLookThreshold) return "braucht Blick";
  return "im Bereich der Gruppe";
}

function goalComparisonLabel(goal, distance) {
  if (!goal || distance == null || Number.isNaN(distance)) return "kein Soll festgelegt";
  if (distance >= 0) return "im Plan";
  if (distance >= -3) return "leicht darunter";
  if (distance >= -7) return "braucht Blick";
  return "Unterstützung prüfen";
}

function progressHints(row) {
  const hints = [];
  const settings = state.progressSettings || DEFAULT_PROGRESS_SETTINGS;
  if (row.openEntry?.status === "brauche Hilfe") hints.push("Hilfewunsch offen");
  if (row.openEntry?.status === "bitte kontrollieren") hints.push("Kontrolle offen");
  if (row.lastActivity && daysSince(row.lastActivity) >= settings.staleDays) hints.push("länger kein Eintrag");
  if (row.goalDistance != null && row.goalDistance < -7) hints.push("Unterstützung prüfen");
  if (row.groupLabel === "deutlicher Abstand") hints.push("Unterstützung prüfen");
  if (row.goalDistance != null && row.goalDistance >= settings.aheadThreshold) hints.push("Zusatzangebot möglich");
  if (!hints.length && row.entryCount) hints.push("im Plan");
  if (!hints.length) hints.push("kein Eintrag");
  return [...new Set(hints)];
}

function daysSince(value) {
  const start = new Date(value);
  const now = new Date();
  return Math.floor((now - start) / 86400000);
}

function relativeActivity(value) {
  const days = daysSince(value);
  if (days <= 0) return "heute";
  if (days === 1) return "gestern";
  return `vor ${days} Tagen`;
}

function sortProgressRows(rows, sortKey) {
  const byAnimal = (a, b) => a.animal.tierName.localeCompare(b.animal.tierName, "de") || a.fach.localeCompare(b.fach, "de") || a.material.localeCompare(b.material, "de");
  const sorted = [...rows];
  if (sortKey === "page") return sorted.sort((a, b) => (b.maxPage ?? -1) - (a.maxPage ?? -1) || byAnimal(a, b));
  if (sortKey === "progress") return sorted.sort((a, b) => b.progressPages - a.progressPages || byAnimal(a, b));
  if (sortKey === "activity") return sorted.sort((a, b) => new Date(b.lastActivity || 0) - new Date(a.lastActivity || 0) || byAnimal(a, b));
  if (sortKey === "status") return sorted.sort((a, b) => progressStatusRank(a) - progressStatusRank(b) || byAnimal(a, b));
  return sorted.sort(byAnimal);
}

function progressStatusRank(row) {
  if (row.openEntry?.status === "brauche Hilfe") return 0;
  if (row.openEntry?.status === "bitte kontrollieren") return 1;
  if (row.lastActivity && daysSince(row.lastActivity) >= (state.progressSettings || DEFAULT_PROGRESS_SETTINGS).staleDays) return 2;
  return 3;
}

function progressStatusBadge(row) {
  if (row.openEntry) return statusBadge(row.openEntry.status, false);
  if (row.lastActivity && daysSince(row.lastActivity) >= (state.progressSettings || DEFAULT_PROGRESS_SETTINGS).staleDays) {
    return `<span class="badge stale">länger kein Eintrag</span>`;
  }
  if (row.lastEntry) return statusBadge(row.lastEntry.status, row.lastEntry.erledigt);
  return "kein Eintrag";
}

function renderHintBadges(hints) {
  return hints.map((hint) => `<span class="hint-badge ${hintClass(hint)}">${escapeHtml(hint)}</span>`).join(" ");
}

function hintClass(hint) {
  if (hint.includes("offen") || hint.includes("Blick") || hint.includes("Unterstützung")) return "attention";
  if (hint.includes("länger")) return "stale";
  if (hint.includes("Zusatz")) return "ahead";
  return "ok";
}

function shouldShowGroupComparison() {
  const settings = state.progressSettings || DEFAULT_PROGRESS_SETTINGS;
  return settings.showGroupComparison && progressFilters.comparison !== "goal";
}

function shouldShowGoalComparison() {
  const settings = state.progressSettings || DEFAULT_PROGRESS_SETTINGS;
  return settings.showGoalComparison && progressFilters.comparison !== "group";
}

function latestEntryForAnimalClass(classId, animalId, subject) {
  return state.entries
    .filter((entry) => entry.classId === classId && entry.tierID === animalId && entry.fach === subject)
    .sort(sortNewest)[0] || null;
}

function latestEntry(animalId, subject) {
  return entriesForActiveClass()
    .filter((entry) => entry.tierID === animalId && (!subject || entry.fach === subject))
    .sort(sortNewest)[0];
}

function statusBadge(status, finished) {
  if (finished) return `<span class="badge finished">erledigt</span>`;
  const meta = STATUS_META[status] || STATUS_META.fertig;
  return `<span class="badge ${meta.className}">${escapeHtml(meta.label)}</span>`;
}

function entryAnimal(entry) {
  const animal = state.animals.find((item) => item.id === entry.tierID || item.id === entry.animalId);
  if (animal) return teacherAnimalLabel(animal);
  return `${escapeHtml(entry.tierEmojiSnapshot)} ${escapeHtml(entry.tierNameSnapshot)}`;
}

function isExtraMaterialName(materialName) {
  const normalized = String(materialName || "").toLowerCase();
  return normalized.includes("zusatz") || normalized.includes("notiz") || normalized.includes("frei");
}

function entryWorkLabel(entry) {
  const page = Number(entry?.seite);
  if (page > 0 && !isExtraMaterialName(entry?.materialName)) return `S. ${page}`;
  if (entry?.zusatzText) return entry.zusatzText;
  return page > 0 ? `S. ${page}` : "–";
}

function entryStandLabel(entry) {
  if (!entry) return "–";
  return `${entry.materialName} ${entryWorkLabel(entry)}`;
}

function sortNewest(a, b) {
  return new Date(b.datumUhrzeit) - new Date(a.datumUhrzeit);
}

function sameWeek(date, now) {
  const first = startOfWeek(now);
  const last = new Date(first);
  last.setDate(first.getDate() + 7);
  return date >= first && date < last;
}

function startOfWeek(date) {
  const copy = new Date(date);
  const day = (copy.getDay() + 6) % 7;
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - day);
  return copy;
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function formatSmartDate(value) {
  const date = new Date(value);
  const today = new Date().toDateString();
  const label = date.toDateString() === today ? "heute" : new Intl.DateTimeFormat("de-DE", { dateStyle: "short" }).format(date);
  return `${label} ${formatTime(value)}`;
}

function formatTime(value) {
  return new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatFileDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("\n", " ");
}
