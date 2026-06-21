const storage = new AppStorage();
const app = document.querySelector("#app");

let state = emptyState();
let screen = "loading";
let teacherTab = "overview";
let childDraft = {};
let loginError = "";
let globalMessage = "";
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
let pendingBackup = null;
let lastMergeReport = null;
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
    app.innerHTML = `<main class="app-shell child">${renderTopbar("Kinderbereich")}${renderChildStart()}</main>`;
    return;
  }
  if (screen === "qrScanner") {
    app.innerHTML = `<main class="app-shell child">${renderTopbar(scannerMode === "test" ? "QR-Scanner testen" : "Kinderbereich")}${renderQrScanner()}</main>`;
    startQrScanner();
    return;
  }
  if (screen.startsWith("child")) {
    app.innerHTML = `<main class="app-shell child">${renderTopbar("Kinderbereich")}${renderChildScreen()}</main>`;
    return;
  }
  if (screen === "login") {
    app.innerHTML = `<main class="app-shell">${renderTopbar("Geschützter Bereich")}${renderLogin()}</main>`;
    return;
  }
  if (screen === "teacher") {
    app.innerHTML = `<main class="app-shell">${renderTopbar("Lehrerinnenbereich")}${renderTeacher()}</main>`;
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
        <h1 class="brand-title">Arbeitsheft-Kompass</h1>
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
        <h1 class="brand-title">Arbeitsheft-Kompass einrichten</h1>
        <p class="privacy-text">Richte die App einmalig für deine Klasse oder Lerngruppe ein. Es werden keine Kindernamen gespeichert. Die Daten bleiben lokal auf diesem iPad/in diesem Browser.</p>
        <form class="setup-form" onsubmit="completeSetup(event)">
          <label class="field">Lehrerinnen-PIN festlegen
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
            <h1 class="brand-title">Arbeitsheft-Kompass</h1>
            <p class="brand-subtitle">Arbeitsstände einfach festhalten</p>
            <p class="active-note">Aktive Klasse: ${escapeHtml(activeClass()?.name || "keine")}</p>
          </div>
          <div class="start-grid">
            <button class="start-card" type="button" onclick="startChildFlow()">
              <span class="icon">👋</span>
              <strong>Ich bin ein Kind</strong>
            </button>
            <button class="start-card" type="button" onclick="openLogin()">
              <span class="icon">🔒</span>
              <strong>Lehrerinnenbereich 🔒</strong>
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
  screen = "childStart";
  render();
}

async function startQrFlow(qrToken) {
  const animal = state.animals.find((item) => item.aktiv && item.qrToken === qrToken);
  if (!animal || !state.classes.some((item) => item.id === animal.classId)) {
    qrErrorMessage = "Dieser QR-Code wurde nicht erkannt. Bitte wende dich an die Lehrkraft.";
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
          <h1 class="brand-title">QR-Code</h1>
          <p class="privacy-text">${escapeHtml(qrErrorMessage || "Dieser QR-Code wurde nicht erkannt. Bitte wende dich an die Lehrkraft.")}</p>
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
  return "";
}

function renderChildStart() {
  return `
    <section class="step-wrap child-start-wrap">
      <h2 class="child-title">Wie möchtest du starten?</h2>
      <div class="start-grid child-choice-grid">
        ${state.qrScannerEnabled ? `
          <button class="start-card primary-child-card" type="button" onclick="openQrScanner('child')">
            <span class="icon">📷</span>
            <strong>QR-Code scannen</strong>
          </button>
        ` : ""}
        <button class="start-card" type="button" onclick="setChildScreen('childAnimal')">
          <span class="icon">🐾</span>
          <strong>Tier auswählen</strong>
        </button>
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
      <h2 class="child-title">Was hast du bearbeitet?</h2>
      <div class="subject-grid">
        <button class="subject-button" type="button" onclick="selectSubject('Deutsch')"><span class="subject-icon">📘</span>Deutsch</button>
        <button class="subject-button" type="button" onclick="selectSubject('Mathe')"><span class="subject-icon">🔢</span>Mathe</button>
      </div>
    </section>
  `;
}

function selectSubject(subject) {
  childDraft.fach = subject;
  screen = "childMaterial";
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
          <button class="material-button" type="button" onclick="selectMaterial('${material.id}')">${escapeHtml(material.materialName)}</button>
        `).join("")}
      </div>
    </section>
  `;
}

function selectMaterial(materialId) {
  const material = state.materials.find((item) => item.id === materialId && item.classId === state.activeClassId);
  if (!material) return;
  childDraft.materialName = material.materialName;
  childDraft.seite = null;
  childDraft.zusatzText = "";
  childDraft.sprachweltTaskId = "";
  screen = "childPage";
  render();
}

function renderPageInput() {
  if (isSprachweltExtra()) return renderSprachweltTaskSelection();
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
      <h2 class="child-title">Was hast du gemacht?</h2>
      <form class="page-form" onsubmit="saveExtraText(event)">
        <textarea class="page-input free-text-input" id="extraTextInput" rows="3" aria-label="Zusatzaufgabe" placeholder="Schreibe kurz deine Aufgabe auf." autocomplete="off"></textarea>
        <button class="primary" type="submit">Weiter</button>
        <p class="message error" id="pageMessage"></p>
      </form>
    </section>
  `;
}

function renderSprachweltTaskSelection() {
  const tasks = (state.sprachweltTasks || DEFAULT_SPRACHWELT_TASKS).filter((task) => task.aktiv !== false);
  return `
    <section class="step-wrap">
      ${renderBackButton("childMaterial")}
      <h2 class="child-title">Welche Sprachwelt-Aufgabe?</h2>
      <div class="sprachwelt-task-grid">
        ${tasks.map((task) => `
          <button class="sprachwelt-task-card" type="button" onclick="selectSprachweltTask('${escapeAttribute(task.id)}')">
            <span class="task-check">☐</span>
            <strong>${escapeHtml(task.id)} ${escapeHtml(task.titel)}</strong>
            <span>${escapeHtml(task.auftrag)}</span>
          </button>
        `).join("")}
      </div>
      ${tasks.length ? "" : `<div class="empty">Keine Sprachwelt-Aufgaben aktiv.</div>`}
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

function selectSprachweltTask(taskId) {
  const task = (state.sprachweltTasks || DEFAULT_SPRACHWELT_TASKS).find((item) => item.id === taskId);
  if (!task) return;
  childDraft.seite = 0;
  childDraft.sprachweltTaskId = task.id;
  childDraft.zusatzText = `${task.id} ${task.titel}`;
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
        <div class="confirm-actions">
          <button class="primary" type="button" onclick="startQrAgain()">Noch etwas eintragen</button>
          <button class="secondary" type="button" onclick="goHome()">Zur Startseite</button>
        </div>
      </section>
    `;
  }
  return `
    <section class="confirm-box">
      <div class="confirm-icon">✅</div>
      <h2 class="confirm-title">Danke! Dein Stand ist gespeichert.</h2>
      <button class="primary" type="button" onclick="startChildFlow()">Nächstes Kind</button>
    </section>
  `;
}

function startQrAgain() {
  childDraft = { animalId: childDraft.animalId, fromQr: true };
  screen = "childSubject";
  render();
}

function renderLogin() {
  const loginMessageClass = loginError.includes("zurückgesetzt") ? "success" : "error";
  return `
    <section class="center-stage">
      <form class="login-box big-card" onsubmit="checkPin(event)">
        <div class="lock-icon">🔒</div>
        <h2 class="child-title compact-title">Lehrerinnenbereich</h2>
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
      <h2 class="child-title">${scannerMode === "test" ? "QR-Scanner testen" : "QR-Code scannen"}</h2>
      <div class="scanner-panel">
        <video id="qrVideo" class="qr-video" autoplay playsinline muted></video>
        <canvas id="qrCanvas" class="qr-canvas"></canvas>
        <p class="message" id="scannerMessage">Kamera wird geöffnet...</p>
      </div>
      <p class="privacy-text">Die Erkennung läuft lokal im Browser. Es werden keine Fotos gespeichert und keine Daten übertragen.</p>
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
    message.textContent = "Halte die QR-Karte vor die Kamera.";
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
    } else if (window.jsQR && video.videoWidth && video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      token = window.jsQR(imageData.data, imageData.width, imageData.height)?.data || "";
    } else if (!("BarcodeDetector" in window)) {
      message.textContent = "QR-Erkennung ist in diesem Browser nicht verfügbar. Bitte wähle dein Tier über die Tierauswahl.";
    }

    if (token) {
      await handleScannedQrToken(token.trim());
      return;
    }
  } catch {
    message.textContent = "Der QR-Code konnte nicht gelesen werden. Bitte erneut versuchen.";
  }
  scannerTimer = window.setTimeout(scanQrFrame, 350);
}

async function handleScannedQrToken(token) {
  const animal = state.animals.find((item) => item.aktiv && item.qrToken === token);
  stopQrScanner();
  if (scannerMode === "test") {
    globalMessage = animal
      ? `QR-Code erkannt: ${animal.tierEmoji} ${animal.tierName}`
      : "QR-Code wurde erkannt, gehört aber zu keinem Tier der gespeicherten Klassen.";
    screen = "teacher";
    teacherTab = "qrCards";
    render();
    return;
  }
  if (!animal) {
    qrErrorMessage = "Dieser QR-Code wurde nicht gefunden. Bitte frage deine Lehrerin.";
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
  if (!confirm("Dadurch werden alle lokal gespeicherten Klassen, Tiere, Materialien und Arbeitsstände gelöscht. Fortfahren?")) return;
  if (!confirm("Bitte bestätige: App wirklich zurücksetzen.")) return;
  await storage.clear();
  state = emptyState();
  pendingRecoveryKey = "";
  screen = "setup";
  render();
}

function renderTeacher() {
  const tabs = [
    ["overview", "Übersicht"],
    ["progress", "Fortschritt"],
    ["assessments", "Tests"],
    ["today", "Heute"],
    ["help", "Hilfe/Kontrolle"],
    ["history", "Verlauf"],
    ["classes", "Klassen & Gruppen"],
    ["resources", "Tiere & Materialien"],
    ["qrCards", "QR-Karten"],
    ["security", "PIN & Sicherheit"],
    ["storageStatus", "Speicherstatus"],
    ["excelExport", "Excel-Export"],
    ["printPdf", "Druckansicht / PDF"],
    ["backup", "Datensicherung"],
    ["privacy", "Datenschutz & Zweck"]
  ];

  return `
    <section class="teacher-layout">
      <nav class="tabs" aria-label="Lehrerinnenbereich">
        ${tabs.map(([id, label]) => `
          <button class="tab-button ${teacherTab === id ? "active" : ""}" type="button" onclick="setTeacherTab('${id}')">${label}</button>
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

function setTeacherTab(tab) {
  stopQrScanner();
  teacherTab = tab;
  globalMessage = "";
  render();
}

function renderTeacherTab() {
  if (teacherTab === "overview") return renderOverview();
  if (teacherTab === "progress") return renderProgress();
  if (teacherTab === "assessments") return renderAssessments();
  if (teacherTab === "today") return renderToday();
  if (teacherTab === "help") return renderHelp();
  if (teacherTab === "history") return renderHistory();
  if (teacherTab === "classes") return renderClasses();
  if (teacherTab === "resources") return renderResources();
  if (teacherTab === "qrCards") return renderQrCards();
  if (teacherTab === "security") return renderSecurity();
  if (teacherTab === "storageStatus") return renderStorageStatus();
  if (teacherTab === "excelExport") return renderExcelExport();
  if (teacherTab === "printPdf") return renderPrintPdf();
  if (teacherTab === "backup") return renderBackup();
  if (teacherTab === "privacy") return renderPrivacy();
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
        <td><strong>${escapeHtml(animal.tierEmoji)} ${escapeHtml(animal.tierName)}</strong></td>
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
  const animalOptions = animalsForClass(classId).filter((animal) => animal.aktiv)
    .map((animal) => `<option value="${animal.id}" ${progressFilters.animalId === animal.id ? "selected" : ""}>${escapeHtml(animal.tierEmoji)} ${escapeHtml(animal.tierName)}</option>`)
    .join("");
  const materialOptions = progressMaterialOptions(classId, progressFilters.fach)
    .map((name) => `<option value="${escapeAttribute(name)}" ${progressFilters.material === name ? "selected" : ""}>${escapeHtml(name)}</option>`)
    .join("");

  if (progressDetailAnimalId) return renderProgressDetail(classId, classOptions, materialOptions);

  const rows = sortProgressRows(buildProgressRows({
    classId,
    fach: progressFilters.fach,
    material: progressFilters.material,
    animalId: progressFilters.animalId,
    period: progressFilters.period
  }), progressFilters.sort);

  return `
    <section class="panel">
      <h2>Fortschritt</h2>
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
        <label class="field">Tier
          <select class="select-input" onchange="setProgressFilter('animalId', this.value)">
            <option value="">Alle Tiere</option>${animalOptions}
          </select>
        </label>
        <label class="field">Zeitraum
          <select class="select-input" onchange="setProgressFilter('period', this.value)">
            ${progressPeriodOptions()}
          </select>
        </label>
        <label class="field">Sortieren
          <select class="select-input" onchange="setProgressFilter('sort', this.value)">
            <option value="animal" ${progressFilters.sort === "animal" ? "selected" : ""}>nach Tier</option>
            <option value="page" ${progressFilters.sort === "page" ? "selected" : ""}>nach letzter Seite</option>
            <option value="progress" ${progressFilters.sort === "progress" ? "selected" : ""}>nach Fortschritt</option>
            <option value="activity" ${progressFilters.sort === "activity" ? "selected" : ""}>nach letzter Aktivität</option>
            <option value="status" ${progressFilters.sort === "status" ? "selected" : ""}>nach Status</option>
          </select>
        </label>
        <label class="field">Vergleich
          <select class="select-input" onchange="setProgressFilter('comparison', this.value)">
            <option value="both" ${progressFilters.comparison === "both" ? "selected" : ""}>Gruppe und Soll-Seite</option>
            <option value="group" ${progressFilters.comparison === "group" ? "selected" : ""}>Vergleich mit Gruppe</option>
            <option value="goal" ${progressFilters.comparison === "goal" ? "selected" : ""}>Vergleich mit Soll-Seite</option>
          </select>
        </label>
      </form>
      <div class="backup-actions progress-actions">
        <button class="primary" type="button" onclick="exportBeautifulExcel('active')">Schöne Excel-Datei aktive Klasse</button>
      </div>
    </section>
    <section class="panel">
      <h2>Fortschrittstabelle</h2>
      ${renderProgressTable(rows)}
    </section>
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
              <td><button class="link-button" type="button" onclick="openProgressDetail('${row.animal.id}')">${escapeHtml(row.animal.tierEmoji)} ${escapeHtml(row.animal.tierName)}</button></td>
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
  return `
    <section class="panel">
      <h2>Lernzielkontrollen & Tests</h2>
      <p class="message">Hier können Tests und Lernzielkontrollen für die Unterrichtsorganisation notiert werden. Bitte keine Kindernamen, Noten oder Leistungs-/Verhaltenskommentare eintragen.</p>
      <form class="filters" onsubmit="addAssessment(event)">
        <label class="field">Fach
          <select class="select-input" id="newAssessmentSubject">${SUBJECTS.map((subject) => `<option>${subject}</option>`).join("")}</select>
        </label>
        <label class="field">Titel
          <input class="text-input" id="newAssessmentTitle" placeholder="z. B. Lernzielkontrolle 1" autocomplete="off">
        </label>
        <label class="field">Datum
          <input class="text-input" id="newAssessmentDate" type="date" value="${formatFileDate(new Date())}">
        </label>
        <button class="primary" type="submit">Hinzufügen</button>
      </form>
    </section>
    <section class="panel">
      <h2>Kontrolle & Notizen</h2>
      ${items.length ? items.map((item) => `
        <article class="assessment-card">
          <div class="assessment-head">
            <strong>${escapeHtml(item.titel)}</strong>
            <span class="subject-chip ${item.fach === "Deutsch" ? "deutsch" : "mathe"}">${escapeHtml(item.fach)}</span>
            <span>${item.datum ? formatGermanDate(item.datum) : "ohne Datum"}</span>
          </div>
          <label class="field">Kontrollstatus
            <select class="select-input" onchange="updateAssessment('${item.id}', 'kontrolle', this.value)">
              ${["geplant", "geschrieben", "kontrollieren", "kontrolliert", "zurückgegeben"].map((status) => `
                <option value="${status}" ${item.kontrolle === status ? "selected" : ""}>${status}</option>
              `).join("")}
            </select>
          </label>
          <label class="field">Kommentar / Kontrollnotiz
            <textarea class="text-input assessment-comment" rows="3" placeholder="Nur organisatorische Notiz, keine Kindernamen." onchange="updateAssessment('${item.id}', 'kommentar', this.value)">${escapeHtml(item.kommentar || "")}</textarea>
          </label>
          <div class="backup-actions">
            <button class="danger" type="button" onclick="deleteAssessment('${item.id}')">löschen</button>
          </div>
        </article>
      `).join("") : `<div class="empty">Noch keine Lernzielkontrolle oder kein Test angelegt.</div>`}
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
      <h2>Verlauf von ${escapeHtml(animal.tierEmoji)} ${escapeHtml(animal.tierName)}</h2>
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
  `;
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
      <p class="message">Aktive Klasse für Kinderbereich: <strong>${escapeHtml(activeClass()?.name || "keine")}</strong></p>
      <div class="class-list">
        ${state.classes.map((classItem) => `
          <div class="manage-row">
            <input class="text-input" value="${escapeAttribute(classItem.name)}" aria-label="Name" onchange="updateClassItem('${classItem.id}', 'name', this.value)">
            <input class="text-input" value="${escapeAttribute(classItem.beschreibung || "")}" aria-label="Beschreibung" placeholder="Beschreibung optional" onchange="updateClassItem('${classItem.id}', 'beschreibung', this.value)">
            <button class="small-button" type="button" onclick="useClass('${classItem.id}')" ${classItem.id === state.activeClassId ? "disabled" : ""}>Als aktive Klasse verwenden</button>
            <button class="danger" type="button" onclick="deleteEntriesForClass('${classItem.id}')">Arbeitsstände dieser Klasse löschen</button>
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
    materials: [...state.materials, ...createDefaultMaterials(classItem.id)]
  });
}

async function updateClassItem(classId, field, value) {
  const cleanValue = String(value).trim();
  if (field === "name" && !cleanValue) return render();
  const classes = state.classes.map((item) => item.id === classId ? { ...item, [field]: cleanValue } : item);
  await persist({ ...state, classes });
}

async function deleteEntriesForClass(classId) {
  if (!confirm("Alle Arbeitsstände dieser Klasse löschen? Tiere und Materialien bleiben erhalten.")) return;
  await persistAndRender({ ...state, entries: state.entries.filter((entry) => entry.classId !== classId) });
}

async function deleteClassItem(classId) {
  if (state.classes.length <= 1) {
    alert("Die letzte Klasse kann nicht gelöscht werden.");
    return;
  }
  if (!confirm("Diese Klasse und alle dazugehörigen Arbeitsstände werden gelöscht. Fortfahren?")) return;
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
    assessments: (state.assessments || []).filter((item) => item.classId !== classId)
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
    ${renderSprachweltSettings()}
    ${renderGoalSettings()}
    ${renderProgressSettings()}
  `;
}

function renderSprachweltSettings() {
  const tasks = state.sprachweltTasks || DEFAULT_SPRACHWELT_TASKS.map((task) => ({ ...task, aktiv: true }));
  return `
    <section class="panel">
      <h2>Sprachwelt-Aufgaben</h2>
      <p class="message">Diese Aufgaben erscheinen für Kinder bei Deutsch → Zusatzaufgabe. Kinder wählen eine Aufgabe aus und melden sie anschließend wie gewohnt als fertig, Hilfe oder Kontrolle.</p>
      <div class="sprachwelt-admin-list">
        ${tasks.map((task) => `
          <div class="manage-row sprachwelt-admin-row">
            <strong>${escapeHtml(task.id)} ${escapeHtml(task.titel)}</strong>
            <span>${escapeHtml(task.auftrag)}</span>
            <label class="toggle-label"><input type="checkbox" ${task.aktiv !== false ? "checked" : ""} onchange="updateSprachweltTask('${escapeAttribute(task.id)}', 'aktiv', this.checked)"> aktiv</label>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function renderGoalSettings() {
  const goals = goalsForActiveClass().sort((a, b) => a.fach.localeCompare(b.fach, "de") || a.material.localeCompare(b.material, "de"));
  return `
    <section class="panel">
      <h2>Soll-Seiten</h2>
      <p class="message">Lege pro Fach und Material eine aktuelle Soll-Seite fest. Diese Werte werden nur im Lehrerinnenbereich angezeigt.</p>
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

async function updateSprachweltTask(taskId, field, value) {
  const tasks = (state.sprachweltTasks || DEFAULT_SPRACHWELT_TASKS.map((task) => ({ ...task, aktiv: true }))).map((task) => {
    if (task.id !== taskId) return task;
    return { ...task, [field]: field === "aktiv" ? Boolean(value) : String(value).trim() };
  });
  await persist({ ...state, sprachweltTasks: tasks });
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
  const fach = document.querySelector("#newAssessmentSubject").value;
  const titel = document.querySelector("#newAssessmentTitle").value.trim();
  const datum = document.querySelector("#newAssessmentDate").value || formatFileDate(new Date());
  if (!titel) return;
  const item = {
    id: makeId(),
    classId: state.activeClassId,
    fach,
    titel,
    datum,
    kontrolle: "geplant",
    kommentar: "",
    erstelltAm: nowIso()
  };
  await persistAndRender({ ...state, assessments: [...(state.assessments || []), item] });
}

async function updateAssessment(assessmentId, field, value) {
  const assessments = (state.assessments || []).map((item) => (
    item.id === assessmentId ? { ...item, [field]: String(value).trim() } : item
  ));
  await persist({ ...state, assessments });
}

async function deleteAssessment(assessmentId) {
  if (!confirm("Diese Lernzielkontrolle / diesen Test löschen?")) return;
  await persistAndRender({ ...state, assessments: (state.assessments || []).filter((item) => item.id !== assessmentId) });
}

function renderBackup() {
  const settings = {
    enabled: state.multiDeviceReminderEnabled !== false,
    time: state.multiDeviceReminderTime || "13:00"
  };
  return `
    <section class="panel">
      <h2>Datensicherung</h2>
      <p class="privacy-text">Die Arbeitsstände werden lokal auf diesem iPad/in diesem Browser gespeichert. GitHub speichert nur die App-Dateien, nicht die Einträge. Erstelle regelmäßig ein Backup und speichere es an einem geschützten Ort.</p>
      <div class="backup-actions">
        <button class="primary" type="button" onclick="exportActiveClassBackup()">Backup aktive Klasse speichern</button>
        <button class="primary" type="button" onclick="exportFullBackup()">Gesamtbackup speichern</button>
        <button class="secondary" type="button" onclick="exportActiveClassCsv()">CSV aktive Klasse speichern</button>
      </div>
      <p class="message">Letzte lokale Speicherung: ${state.lastSavedAt ? formatDateTime(state.lastSavedAt) : "noch nicht gespeichert"}</p>
    </section>
    <section class="panel">
      <h2>Mehrere Geräte verwenden</h2>
      <p class="privacy-text">Du kannst mehrere iPads verwenden. Die Geräte synchronisieren sich nicht automatisch. Nutze regelmäßig den Backup-Export und die Funktion „Backup zusammenführen“. Beim Zusammenführen werden neue Einträge ergänzt. Vorhandene Einträge bleiben erhalten.</p>
      <p class="message"><strong>Wichtig:</strong> Die Geräte synchronisieren sich nicht von allein. Der Abgleich funktioniert über Backup-Dateien. Nutze auf dem Hauptgerät immer „Backup zusammenführen“, nicht „Backup wiederherstellen“, damit keine Einträge verloren gehen.</p>
      <div class="backup-actions">
        <button class="primary" type="button" onclick="exportFullBackup()">Backup exportieren</button>
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
  `;
}

function renderPendingBackupChoice() {
  if (!pendingBackup) return "";
  return `
    <div class="backup-decision">
      <h3>Was möchtest du tun?</h3>
      <p class="message">Ausgewählte Datei: <strong>${escapeHtml(pendingBackup.name)}</strong></p>
      <div class="backup-actions">
        <button class="primary recommended-action" type="button" onclick="finishBackupImport('merge')">Backup zusammenführen</button>
        <button class="danger" type="button" onclick="finishBackupImport('restore')">Backup wiederherstellen</button>
        <button class="secondary" type="button" onclick="cancelPendingBackup()">Abbrechen</button>
      </div>
      <p class="message">Empfohlen ist „Backup zusammenführen“. Dabei werden nur neue Daten ergänzt; vorhandene Daten bleiben erhalten.</p>
    </div>
  `;
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
        <div>übersprungene doppelte Einträge</div><strong>${lastMergeReport.skippedDuplicateEntries}</strong>
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
      globalMessage = "Backup wurde zusammengeführt.";
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
      <p class="privacy-text">Erstellt eine gestaltete Excel-Datei als Lernstands- und Arbeitsheft-Planer. Es werden keine Kindernamen, QR-Tokens, Fotos oder KI-Daten exportiert.</p>
      <div class="backup-actions">
        <button class="primary" type="button" onclick="exportBeautifulExcel('active')">Schöne Excel-Datei aktive Klasse</button>
        <button class="primary" type="button" onclick="exportBeautifulExcel('all')">Schöne Excel-Datei alle Klassen</button>
        <button class="secondary" type="button" onclick="exportBeautifulExcel('today')">Schöne Tagesliste</button>
        <button class="secondary" type="button" onclick="exportBeautifulExcel('help')">Schöne Hilfe-/Kontrollliste</button>
      </div>
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
      <p class="privacy-text">Öffnet eine gestaltete Druckansicht direkt aus der App. Im Druckdialog kann die Übersicht auch als PDF gespeichert werden. Es werden keine Kindernamen, QR-Tokens, Fotos oder KI-Daten angezeigt.</p>
      <div class="backup-actions">
        <button class="primary" type="button" onclick="renderPrintView('today')">Tagesübersicht drucken</button>
        <button class="primary" type="button" onclick="renderPrintView('week')">Wochenübersicht drucken</button>
        <button class="secondary" type="button" onclick="renderPrintView('helpControl')">Hilfe & Kontrolle drucken</button>
        <button class="secondary" type="button" onclick="renderPrintView('progress')">Fortschritt drucken</button>
        <button class="primary" type="button" onclick="renderPrintView('report')">Gesamtbericht drucken</button>
      </div>
      <p class="message">Die Druckansicht liest nur die lokal gespeicherten Daten und verändert keine Arbeitsstände.</p>
    </section>
  `;
}

function renderPrintView(type) {
  currentPrintType = type;
  screen = "printView";
  render();
}

function closePrintView() {
  currentPrintType = "";
  screen = "teacher";
  teacherTab = "printPdf";
  render();
}

function renderPrintScreen() {
  const classItem = activeClass();
  const className = classItem?.name || "keine aktive Klasse";
  const generatedAt = new Date();
  const context = buildPrintContext(classItem, generatedAt);
  const titles = {
    today: "Arbeitsheft-Kompass – Tagesübersicht",
    week: "Arbeitsheft-Kompass – Wochenübersicht",
    helpControl: "Offene Hilfe und Kontrolle",
    progress: "Fortschritt und Arbeitstempo",
    report: "Arbeitsheft-Kompass – Gesamtbericht"
  };
  const type = currentPrintType || "today";
  return `
    <style>${printViewCss()}</style>
    <div class="print-toolbar" aria-label="Druckwerkzeuge">
      <strong>${escapeHtml(titles[type] || "Druckansicht")}</strong>
      <button type="button" onclick="window.print()">Drucken / Als PDF speichern</button>
      <button type="button" onclick="closePrintView()">Zurück</button>
      <button type="button" onclick="closePrintView()">Fenster schließen</button>
    </div>
    <main class="print-page">
      ${type === "today" ? renderPrintToday(context, className, generatedAt) : ""}
      ${type === "week" ? renderPrintWeek(context, className, generatedAt) : ""}
      ${type === "helpControl" ? renderPrintHelpControl(context, className, generatedAt) : ""}
      ${type === "progress" ? renderPrintProgress(context, className, generatedAt) : ""}
      ${type === "report" ? renderPrintReport(context, className, generatedAt) : ""}
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
  return {
    classId,
    animals,
    entries,
    todayEntries,
    weekEntries,
    openEntries,
    staleAnimals,
    progressRows,
    overviewRows
  };
}

function renderPrintToday(context, className, generatedAt) {
  return `
    ${printHero("Arbeitsheft-Kompass – Tagesübersicht", `Klasse: ${className} · Datum: ${formatGermanDate(generatedAt)}`)}
    ${renderPrintKpis([
      ["Einträge heute", context.todayEntries.length, "neutral"],
      ["Offene Hilfe", context.openEntries.filter((entry) => entry.status === "brauche Hilfe").length, "help"],
      ["Offene Kontrolle", context.openEntries.filter((entry) => entry.status === "bitte kontrollieren").length, "check"],
      ["Länger kein Eintrag", context.staleAnimals.length, "stale"]
    ])}
    <section class="print-section">
      <h2>Heute bearbeitet</h2>
      ${context.todayEntries.length ? renderPrintEntryTable(context.todayEntries, ["Uhrzeit", "Tier", "Fach", "Material", "Seite/Aufgabe", "Status"], false) : printEmpty("Heute wurden noch keine Arbeitsstände eingetragen.")}
    </section>
  `;
}

function renderPrintWeek(context, className, generatedAt) {
  return `
    ${printHero("Arbeitsheft-Kompass – Wochenübersicht", `Klasse: ${className} · erstellt am ${formatGermanDate(generatedAt)} um ${formatTime(generatedAt)} Uhr`)}
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

function renderPrintReport(context, className, generatedAt) {
  const dataRows = context.entries.slice().sort(sortNewest).slice(0, 20);
  return `
    ${printHero("Arbeitsheft-Kompass – Gesamtbericht", `Klasse: ${className} · erstellt am ${formatGermanDate(generatedAt)} um ${formatTime(generatedAt)} Uhr`)}
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
              <td class="print-animal">${escapeHtml(row.animal.tierEmoji)} ${escapeHtml(row.animal.tierName)}</td>
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
            <td class="print-animal">${escapeHtml(row.animal.tierEmoji)} ${escapeHtml(row.animal.tierName)}</td>
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
      <p>Arbeitsheft-Kompass</p>
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
  const className = safeStatus === "brauche Hilfe" ? "help" : safeStatus === "bitte kontrollieren" ? "check" : "done";
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

function printViewCss() {
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
    .page-break {
      break-before: page;
      page-break-before: always;
      height: 1px;
    }
    @page {
      size: A4;
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
      <h2>QR-Karten</h2>
      <p class="message">Die QR-Codes enthalten keine Kindernamen und keine Leistungsdaten. Sie enthalten nur einen technischen Tier-Code. Die Zuordnung Tier zu Kind bleibt analog bei der Lehrkraft.</p>
      <div class="backup-actions">
        <button class="primary" type="button" onclick="printAllQrCards()">Alle QR-Karten der aktiven Klasse drucken</button>
        <button class="secondary" type="button" onclick="openQrScanner('test')">QR-Scanner testen</button>
        <label class="toggle-label qr-toggle"><input type="checkbox" ${state.qrScannerEnabled ? "checked" : ""} onchange="setQrScannerEnabled(this.checked)"> QR-Scanner im Kinderbereich anzeigen</label>
      </div>
    </section>
    <section class="qr-card-grid">
      ${animals.map((animal) => renderQrCardPreview(animal)).join("") || `<div class="empty">Keine aktiven Tiere vorhanden.</div>`}
    </section>
    <div id="printArea" class="print-area" aria-hidden="true"></div>
  `;
}

function renderQrCardPreview(animal) {
  return `
    <article class="qr-card-preview" data-qr-token="${escapeAttribute(animal.qrToken)}">
      <div class="qr-animal">
        <span class="qr-animal-emoji">${escapeHtml(animal.tierEmoji)}</span>
        <strong>${escapeHtml(animal.tierName)}</strong>
      </div>
      <div class="qr-code-wrap">${makeQrSvg(animal.qrToken, { scale: 4 })}</div>
      <p class="qr-token">${escapeHtml(animal.qrToken)}</p>
      <p class="qr-small">Arbeitsheft-Kompass</p>
      <div class="qr-actions">
        <button class="secondary" type="button" onclick="regenerateQrToken('${animal.id}')">QR-Code neu erzeugen</button>
        <button class="primary" type="button" onclick="printSingleQrCard('${animal.id}')">QR-Karte drucken</button>
      </div>
    </article>
  `;
}

async function regenerateQrToken(animalId) {
  if (!confirm("Der alte QR-Code funktioniert danach nicht mehr. Fortfahren?")) return;
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
      ${animals.map((animal) => `
        <article class="qr-print-card">
          <div class="qr-print-emoji">${escapeHtml(animal.tierEmoji)}</div>
          <div class="qr-print-name">${escapeHtml(animal.tierName)}</div>
          <div class="qr-print-code">${makeQrSvg(animal.qrToken, { scale: 4 })}</div>
          <div class="qr-print-title">Arbeitsheft-Kompass</div>
        </article>
      `).join("")}
    </div>
  `;
  window.print();
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
      <p class="privacy-text">Die PIN schützt den Lehrerinnenbereich auf diesem Gerät. Es gibt keinen geheimen Universal-PIN. Falls du die PIN vergisst, kannst du sie nur mit dem Wiederherstellungsschlüssel zurücksetzen. Ohne Wiederherstellungsschlüssel bleibt nur das Zurücksetzen der App und anschließend der Import eines Backups.</p>
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
  return `
    <section class="panel">
      <h2>Speicherstatus</h2>
      <div class="status-grid">
        <div>Einrichtung gefunden</div><strong>${state.setupComplete ? "ja" : "nein"}</strong>
        <div>Speicherart</div><strong>${escapeHtml(storage.getStorageType())}</strong>
        <div>aktive Klasse</div><strong>${escapeHtml(activeClass()?.name || "keine")}</strong>
        <div>Anzahl Klassen</div><strong>${state.classes.length}</strong>
        <div>Anzahl Tiere</div><strong>${state.animals.length}</strong>
        <div>Anzahl Materialien</div><strong>${state.materials.length}</strong>
        <div>Anzahl Arbeitsstände</div><strong>${state.entries.length}</strong>
        <div>letzte lokale Speicherung</div><strong>${state.lastSavedAt ? formatDateTime(state.lastSavedAt) : "noch nicht gespeichert"}</strong>
        <div>QR-Scanner aktiviert</div><strong>${state.qrScannerEnabled ? "ja" : "nein"}</strong>
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
    const filename = `arbeitsheft-kompass-${safeFilePart(classItem?.name)}-backup-${formatFileDate(new Date())}.json`;
    const content = JSON.stringify(makeActiveClassBackup(state, state.activeClassId), null, 2);
    globalMessage = await saveFileWithPickerOrDownload(filename, "application/json", content);
  } catch {
    globalMessage = "Die Datei konnte nicht erstellt werden.";
  }
  render();
}

async function exportFullBackup() {
  try {
    const filename = `arbeitsheft-kompass-gesamtbackup-${formatFileDate(new Date())}.json`;
    const content = JSON.stringify(makeFullBackup(state), null, 2);
    globalMessage = await saveFileWithPickerOrDownload(filename, "application/json", content);
  } catch {
    globalMessage = "Die Datei konnte nicht erstellt werden.";
  }
  render();
}

async function exportActiveClassCsv() {
  try {
    const classItem = activeClass();
    const filename = `arbeitsheft-kompass-${safeFilePart(classItem?.name)}-export-${formatFileDate(new Date())}.csv`;
    globalMessage = await saveFileWithPickerOrDownload(filename, "text/csv", makeCsvForClass(state, state.activeClassId));
  } catch {
    globalMessage = "Die Datei konnte nicht erstellt werden.";
  }
  render();
}

async function exportBeautifulExcel(mode) {
  try {
    const report = buildBeautifulExcelReport(mode);
    await exportBeautifulWorkbook(report);
    globalMessage = "Schöne Excel-Datei wurde erstellt.";
  } catch (error) {
    console.error(error);
    globalMessage = "Die schöne Excel-Datei konnte nicht erstellt werden. Du kannst stattdessen eine einfache CSV-Datei exportieren.";
  }
  render();
}

function buildBeautifulExcelReport(mode) {
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
  const filename = mode === "active"
    ? `arbeitsheft-kompass-${safeFilePart(active?.name)}-${formatFileDate(now)}.xlsx`
    : mode === "today"
      ? `arbeitsheft-kompass-heute-${formatFileDate(now)}.xlsx`
      : mode === "help"
        ? `arbeitsheft-kompass-hilfe-kontrolle-${formatFileDate(now)}.xlsx`
        : `arbeitsheft-kompass-alle-klassen-${formatFileDate(now)}.xlsx`;
  const animals = state.animals.filter((animal) => classIds.includes(animal.classId) && animal.aktiv);
  const materials = state.materials.filter((material) => classIds.includes(material.classId));
  const reportEntries = decorateEntries(entries).sort(sortNewest);
  const overviewRows = buildBeautifulOverviewRows(animals, baseEntries);
  const progressRows = buildBeautifulProgressRows(classIds, mode === "today" ? entries : baseEntries);
  const todayEntries = decorateEntries(baseEntries.filter((entry) => new Date(entry.datumUhrzeit).toDateString() === todayKey)).sort(sortNewest);
  const helpEntries = decorateEntries(baseEntries.filter((entry) => !entry.erledigt && (entry.status === "brauche Hilfe" || entry.status === "bitte kontrollieren"))).sort(sortNewest);
  const trailEntries = decorateEntries(entries).sort(sortEntriesByClassAnimalDate);
  const allEntries = reportEntries;
  const printRows = buildPrintRows(animals, baseEntries);
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
    stats: buildDashboardStats({ entries: reportEntries, baseEntries, animals, materials, classIds, now })
  };
}

function decorateEntries(entries) {
  return entries.map((entry) => ({
    ...entry,
    klasseName: getClassNameForEntry(entry),
    tierLabel: `${entry.tierEmojiSnapshot || ""} ${entry.tierNameSnapshot || ""}`.trim()
  }));
}

function buildDashboardStats({ entries, baseEntries, animals, materials, classIds, now }) {
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
    exportedEntryCount: entries.length
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
        tier: `${animal.tierEmoji} ${animal.tierName}`,
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

function exportExcelActiveClass() {
  const classItem = activeClass();
  const filename = `arbeitsheft-kompass-${safeFilePart(classItem?.name)}-${formatFileDate(new Date())}.csv`;
  finishExcelExport(entriesForActiveClass(), filename);
}

function exportExcelAllClasses() {
  const filename = `arbeitsheft-kompass-alle-klassen-${formatFileDate(new Date())}.csv`;
  finishExcelExport(state.entries, filename);
}

function exportExcelToday() {
  const today = new Date().toDateString();
  const entries = state.entries.filter((entry) => new Date(entry.datumUhrzeit).toDateString() === today);
  const filename = `arbeitsheft-kompass-heute-${formatFileDate(new Date())}.csv`;
  finishExcelExport(entries, filename);
}

function exportExcelHelpControl() {
  const entries = state.entries.filter((entry) => (
    !entry.erledigt && (entry.status === "brauche Hilfe" || entry.status === "bitte kontrollieren")
  ));
  const filename = `arbeitsheft-kompass-hilfe-kontrolle-${formatFileDate(new Date())}.csv`;
  finishExcelExport(entries, filename);
}

function finishExcelExport(entries, filename) {
  try {
    const created = exportToExcelCsv(entries, filename);
    globalMessage = created ? "Excel-Liste wurde erstellt." : "Für diese Auswahl gibt es noch keine Einträge.";
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
      <p>Diese App dient der Dokumentation von Arbeitsständen in Deutsch und Mathe zur Unterrichtsorganisation. Es werden keine Klarnamen der Kinder gespeichert. Die Kinder arbeiten mit Tier-Pseudonymen. Die Zuordnung Tier zu Kind wird nicht digital gespeichert, sondern bleibt ausschließlich analog bei der Lehrkraft.</p>
      <p>Für jedes Tier kann ein QR-Code erzeugt werden. Der QR-Code enthält keinen Kindernamen und keine Leistungsdaten, sondern nur einen zufälligen technischen Zugangscode. Die Zuordnung Tier zu Kind bleibt weiterhin ausschließlich analog bei der Lehrkraft.</p>
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
      </ul>
      <h3>Nicht gespeichert werden:</h3>
      <ul>
        <li>Namen</li>
        <li>Fotos</li>
        <li>Handschrift</li>
        <li>Noten</li>
        <li>freie Leistungs- oder Verhaltenskommentare</li>
        <li>KI-Auswertungen</li>
      </ul>
      <p>Die Daten werden lokal auf diesem iPad/in diesem Browser gespeichert. Backups sollen nur an einem geschützten Speicherort abgelegt werden.</p>
    </section>
  `;
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
  return `${escapeHtml(entry.tierEmojiSnapshot)} ${escapeHtml(entry.tierNameSnapshot)}`;
}

function isExtraMaterialName(materialName) {
  return String(materialName || "").toLowerCase().includes("zusatz");
}

function isSprachweltExtra() {
  return childDraft.fach === "Deutsch" && isExtraMaterialName(childDraft.materialName);
}

function entryWorkLabel(entry) {
  if (entry?.zusatzText) return entry.zusatzText;
  const page = Number(entry?.seite);
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
