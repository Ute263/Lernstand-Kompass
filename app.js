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
    return;
  }
  app.innerHTML = renderStart();
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
  screen = "childPage";
  render();
}

function renderPageInput() {
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
  if (!animal || !childDraft.fach || !childDraft.materialName || !childDraft.seite) return;

  const entry = {
    id: makeId(),
    classId: state.activeClassId,
    tierID: animal.id,
    tierNameSnapshot: animal.tierName,
    tierEmojiSnapshot: animal.tierEmoji,
    fach: childDraft.fach,
    materialName: childDraft.materialName,
    seite: childDraft.seite,
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
    ["today", "Heute"],
    ["help", "Hilfe/Kontrolle"],
    ["history", "Verlauf"],
    ["classes", "Klassen & Gruppen"],
    ["resources", "Tiere & Materialien"],
    ["qrCards", "QR-Karten"],
    ["security", "PIN & Sicherheit"],
    ["storageStatus", "Speicherstatus"],
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
  if (teacherTab === "today") return renderToday();
  if (teacherTab === "help") return renderHelp();
  if (teacherTab === "history") return renderHistory();
  if (teacherTab === "classes") return renderClasses();
  if (teacherTab === "resources") return renderResources();
  if (teacherTab === "qrCards") return renderQrCards();
  if (teacherTab === "security") return renderSecurity();
  if (teacherTab === "storageStatus") return renderStorageStatus();
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
        <td>${deutsch ? `${escapeHtml(deutsch.materialName)} S. ${deutsch.seite}` : "noch kein Eintrag"}</td>
        <td>${mathe ? `${escapeHtml(mathe.materialName)} S. ${mathe.seite}` : "noch kein Eintrag"}</td>
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
          <thead><tr><th>Zeit</th><th>Tier</th><th>Fach</th><th>Material</th><th>Seite</th><th>Status</th><th>Aktion</th></tr></thead>
          <tbody>
            ${entries.map((entry) => `
              <tr>
                <td>${formatDateTime(entry.datumUhrzeit)}</td>
                <td>${entryAnimal(entry)}</td>
                <td>${escapeHtml(entry.fach)}</td>
                <td>${escapeHtml(entry.materialName)}</td>
                <td>S. ${entry.seite}</td>
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
        <thead><tr><th>Datum</th><th>Tier</th><th>Fach</th><th>Material</th><th>Seite</th><th>Status</th></tr></thead>
        <tbody>
          ${entries.map((entry) => `
            <tr>
              <td>${formatDateTime(entry.datumUhrzeit)}</td>
              <td>${entryAnimal(entry)}</td>
              <td>${escapeHtml(entry.fach)}</td>
              <td>${escapeHtml(entry.materialName)}</td>
              <td>S. ${entry.seite}</td>
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
          <thead><tr><th>${showDate ? "Datum" : "Uhrzeit"}</th><th>Tier</th><th>Fach</th><th>Material</th><th>Seite</th><th>Status</th></tr></thead>
          <tbody>
            ${entries.map((entry) => `
              <tr>
                <td>${showDate ? formatDateTime(entry.datumUhrzeit) : formatTime(entry.datumUhrzeit)}</td>
                <td>${entryAnimal(entry)}</td>
                <td>${escapeHtml(entry.fach)}</td>
                <td>${escapeHtml(entry.materialName)}</td>
                <td>S. ${entry.seite}</td>
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
    entries: state.entries.filter((item) => item.classId !== classId)
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

function renderBackup() {
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
      <h2>Backup importieren</h2>
      <p class="message">Dadurch können vorhandene Daten überschrieben oder ergänzt werden. Fortfahren?</p>
      <form class="filters" onsubmit="importBackup(event)">
        <label class="field">Import-Art
          <select class="select-input" id="importMode">
            <option value="newClass">als neue Klasse importieren</option>
            <option value="restoreAll">Gesamtbackup wiederherstellen</option>
          </select>
        </label>
        <label class="field">JSON-Datei
          <input class="text-input" id="backupFile" type="file" accept="application/json,.json">
        </label>
        <button class="primary" type="submit">Import starten</button>
      </form>
    </section>
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
