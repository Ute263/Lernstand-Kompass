const STORAGE_KEY = "arbeitsheft-kompass-v1";

const defaultAnimals = [
  ["Fuchs", "🦊"], ["Schildkröte", "🐢"], ["Eule", "🦉"], ["Frosch", "🐸"], ["Bär", "🐻"],
  ["Igel", "🦔"], ["Hase", "🐰"], ["Pinguin", "🐧"], ["Tiger", "🐯"], ["Löwe", "🦁"],
  ["Koala", "🐨"], ["Panda", "🐼"], ["Affe", "🐵"], ["Schmetterling", "🦋"], ["Marienkäfer", "🐞"],
  ["Delfin", "🐬"], ["Wal", "🐳"], ["Giraffe", "🦒"], ["Zebra", "🦓"], ["Elefant", "🐘"],
  ["Eichhörnchen", "🐿️"], ["Waschbär", "🦝"], ["Faultier", "🦥"], ["Flamingo", "🦩"], ["Robbe", "🦭"],
  ["Krake", "🐙"], ["Krebs", "🦀"], ["Fisch", "🐠"], ["Ente", "🦆"], ["Adler", "🦅"]
];

const defaultMaterials = [
  ["Deutsch", "Arbeitsheft Blau"], ["Deutsch", "Arbeitsheft Rot"], ["Deutsch", "Schreibheft"],
  ["Deutsch", "Lesebuch"], ["Deutsch", "Zusatzaufgabe"], ["Mathe", "Arbeitsheft"],
  ["Mathe", "Buch"], ["Mathe", "Rechenheft"], ["Mathe", "Zusatzaufgabe"]
];

const statusMeta = {
  fertig: { label: "fertig", childLabel: "fertig", icon: "✅", className: "done" },
  "brauche Hilfe": { label: "brauche Hilfe", childLabel: "ich brauche Hilfe", icon: "🟡", className: "help" },
  "bitte kontrollieren": { label: "bitte kontrollieren", childLabel: "bitte kontrollieren", icon: "🔵", className: "check" }
};

const app = document.querySelector("#app");
let state = loadState();
let screen = "start";
let teacherTab = "overview";
let childDraft = {};
let loginPin = "";
let loginError = "";

function makeId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function defaultState() {
  return {
    pin: "2468",
    animals: defaultAnimals.map(([tierName, tierEmoji]) => ({ id: makeId(), tierName, tierEmoji, aktiv: true })),
    materials: defaultMaterials.map(([fach, materialName]) => ({ id: makeId(), fach, materialName, aktiv: true })),
    entries: []
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || !Array.isArray(saved.animals) || !Array.isArray(saved.materials) || !Array.isArray(saved.entries)) {
      return defaultState();
    }
    return { pin: saved.pin || "2468", animals: saved.animals, materials: saved.materials, entries: saved.entries };
  } catch {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setScreen(nextScreen) {
  screen = nextScreen;
  render();
}

function render() {
  if (screen.startsWith("child")) {
    app.innerHTML = `<main class="app-shell child">${renderTopbar("Arbeitsheft-Kompass", "Kinderbereich")}${renderChildScreen()}</main>`;
  } else if (screen === "login") {
    app.innerHTML = `<main class="app-shell">${renderTopbar("Arbeitsheft-Kompass", "Geschützter Bereich")}${renderLogin()}</main>`;
  } else if (screen === "teacher") {
    app.innerHTML = `<main class="app-shell">${renderTopbar("Arbeitsheft-Kompass", "Lehrerinnenbereich")}${renderTeacher()}</main>`;
  } else {
    app.innerHTML = renderStart();
  }
}

function renderTopbar(title, subtitle) {
  return `
    <header class="topbar">
      <div class="brand">
        <h1 class="brand-title">${title}</h1>
        <p class="brand-subtitle">${subtitle}</p>
      </div>
      <button class="secondary" type="button" onclick="goHome()">Start</button>
    </header>
  `;
}

function renderStart() {
  return `
    <main class="app-shell">
      <section class="center-stage">
        <div>
          <div class="brand" style="text-align:center;margin-bottom:34px">
            <h1 class="brand-title">Arbeitsheft-Kompass</h1>
            <p class="brand-subtitle">Arbeitsstände einfach festhalten</p>
          </div>
          <div class="start-grid">
            <button class="start-card" type="button" onclick="startChildFlow()">
              <span class="icon">👋</span>
              <strong>Ich bin ein Kind</strong>
            </button>
            <button class="start-card" type="button" onclick="openLogin()">
              <span class="icon">🔒</span>
              <strong>Lehrerinnenbereich</strong>
            </button>
          </div>
        </div>
      </section>
    </main>
  `;
}

function startChildFlow() {
  childDraft = {};
  setScreen("childAnimal");
}

function openLogin() {
  loginPin = "";
  loginError = "";
  setScreen("login");
}

function goHome() {
  childDraft = {};
  screen = "start";
  render();
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

function renderBackButton(target) {
  return `<div class="step-actions"><button class="secondary" type="button" onclick="setScreen('${target}')">Zurück</button></div>`;
}

function renderAnimalSelection() {
  const animals = state.animals.filter((animal) => animal.aktiv);
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
  setScreen("childSubject");
}

function renderSubjectSelection() {
  return `
    <section class="step-wrap">
      ${renderBackButton("childAnimal")}
      <h2 class="child-title">Was hast du bearbeitet?</h2>
      <div class="subject-grid">
        <button class="subject-button" type="button" onclick="selectSubject('Deutsch')">
          <span class="subject-icon">📘</span>Deutsch
        </button>
        <button class="subject-button" type="button" onclick="selectSubject('Mathe')">
          <span class="subject-icon">🔢</span>Mathe
        </button>
      </div>
    </section>
  `;
}

function selectSubject(subject) {
  childDraft.fach = subject;
  setScreen("childMaterial");
}

function renderMaterialSelection() {
  const materials = state.materials.filter((material) => material.aktiv && material.fach === childDraft.fach);
  return `
    <section class="step-wrap">
      ${renderBackButton("childSubject")}
      <h2 class="child-title">Was hast du bearbeitet?</h2>
      <div class="material-grid">
        ${materials.map((material) => `
          <button class="material-button" type="button" onclick="selectMaterial('${material.id}')">
            ${escapeHtml(material.materialName)}
          </button>
        `).join("")}
      </div>
    </section>
  `;
}

function selectMaterial(materialId) {
  const material = state.materials.find((item) => item.id === materialId);
  if (!material) return;
  childDraft.materialName = material.materialName;
  setScreen("childPage");
}

function renderPageInput() {
  return `
    <section class="step-wrap">
      ${renderBackButton("childMaterial")}
      <h2 class="child-title">Welche Seite?</h2>
      <form class="page-form" onsubmit="savePage(event)">
        <input class="page-input" id="pageInput" type="text" inputmode="numeric" pattern="[0-9]*" aria-label="Seite" placeholder="Seite" autocomplete="off">
        <button class="primary" type="submit">Weiter</button>
        <p class="message" id="pageMessage"></p>
      </form>
    </section>
  `;
}

function savePage(event) {
  event.preventDefault();
  const input = document.querySelector("#pageInput");
  const page = Number(String(input.value).replace(/\D/g, ""));
  if (!page || page < 1) {
    document.querySelector("#pageMessage").textContent = "Bitte gib eine Seitenzahl größer als 0 ein.";
    return;
  }
  childDraft.seite = page;
  setScreen("childStatus");
}

function renderStatusSelection() {
  return `
    <section class="step-wrap">
      ${renderBackButton("childPage")}
      <h2 class="child-title">Wie ist dein Stand?</h2>
      <div class="status-list">
        ${Object.entries(statusMeta).map(([status, meta]) => `
          <button class="status-button" type="button" onclick="saveEntry('${status}')">
            <span class="status-icon">${meta.icon}</span>${meta.childLabel}
          </button>
        `).join("")}
      </div>
    </section>
  `;
}

function saveEntry(status) {
  const animal = state.animals.find((item) => item.id === childDraft.animalId);
  if (!animal || !childDraft.fach || !childDraft.materialName || !childDraft.seite) return;
  state.entries.push({
    id: makeId(),
    tierID: animal.id,
    tierNameSnapshot: animal.tierName,
    tierEmojiSnapshot: animal.tierEmoji,
    fach: childDraft.fach,
    materialName: childDraft.materialName,
    seite: childDraft.seite,
    status,
    erledigt: false,
    datumUhrzeit: new Date().toISOString()
  });
  saveState();
  setScreen("childConfirm");
  window.setTimeout(() => {
    if (screen === "childConfirm") startChildFlow();
  }, 2000);
}

function renderConfirmation() {
  return `
    <section class="confirm-box">
      <div class="confirm-icon">✅</div>
      <h2 class="confirm-title">Danke! Dein Stand ist gespeichert.</h2>
      <button class="primary" type="button" onclick="startChildFlow()">Nächstes Kind</button>
    </section>
  `;
}

function renderLogin() {
  return `
    <section class="center-stage">
      <form class="login-box big-card" onsubmit="checkPin(event)">
        <div style="font-size:4.4rem">🔒</div>
        <h2 class="child-title" style="margin:0">Lehrerinnenbereich</h2>
        <input class="pin-input" id="pinInput" type="password" inputmode="numeric" pattern="[0-9]*" placeholder="PIN" value="${escapeAttribute(loginPin)}" autocomplete="off">
        ${loginError ? `<p class="message error">${loginError}</p>` : ""}
        <button class="primary" type="submit">Öffnen</button>
      </form>
    </section>
  `;
}

function checkPin(event) {
  event.preventDefault();
  const value = document.querySelector("#pinInput").value.replace(/\D/g, "");
  if (value === state.pin) {
    teacherTab = "overview";
    setScreen("teacher");
  } else {
    loginPin = value;
    loginError = "Die PIN stimmt nicht.";
    render();
  }
}

function renderTeacher() {
  const tabs = [
    ["overview", "Übersicht"],
    ["today", "Heute"],
    ["help", "Hilfe/Kontrolle"],
    ["history", "Verlauf"],
    ["settings", "Einstellungen"],
    ["export", "Export"]
  ];
  return `
    <section class="teacher-layout">
      <nav class="tabs" aria-label="Lehrerinnenbereich">
        ${tabs.map(([id, label]) => `
          <button class="tab-button ${teacherTab === id ? "active" : ""}" type="button" onclick="setTeacherTab('${id}')">${label}</button>
        `).join("")}
      </nav>
      <div>${renderTeacherTab()}</div>
    </section>
  `;
}

function setTeacherTab(tab) {
  teacherTab = tab;
  render();
}

function renderTeacherTab() {
  if (teacherTab === "overview") return renderOverview();
  if (teacherTab === "today") return renderToday();
  if (teacherTab === "help") return renderHelp();
  if (teacherTab === "history") return renderHistory();
  if (teacherTab === "settings") return renderSettings();
  if (teacherTab === "export") return renderExport();
  return "";
}

function renderOverview() {
  const rows = state.animals.filter((animal) => animal.aktiv).map((animal) => {
    const deutsch = latestEntry(animal.id, "Deutsch");
    const mathe = latestEntry(animal.id, "Mathe");
    const latest = latestEntry(animal.id);
    const open = state.entries
      .filter((entry) => entry.tierID === animal.id && !entry.erledigt && entry.status !== "fertig")
      .sort(sortNewest)[0];
    const statusEntry = open || latest;
    return `
      <tr>
        <td><strong>${escapeHtml(animal.tierEmoji)} ${escapeHtml(animal.tierName)}</strong></td>
        <td>${deutsch ? `${escapeHtml(deutsch.materialName)} S. ${deutsch.seite}` : "noch kein Eintrag"}</td>
        <td>${mathe ? `${escapeHtml(mathe.materialName)} S. ${mathe.seite}` : "noch kein Eintrag"}</td>
        <td>${latest ? formatDateTime(latest.datumUhrzeit) : "noch kein Eintrag"}</td>
        <td>${statusEntry ? statusBadge(statusEntry.status, statusEntry.erledigt) : "noch kein Eintrag"}</td>
      </tr>
    `;
  }).join("");

  return `
    <section class="panel">
      <h2>Übersicht</h2>
      <div class="table-scroll">
        <table>
          <thead><tr><th>Tier</th><th>Deutsch</th><th>Mathe</th><th>letzter Eintrag</th><th>Status</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>
  `;
}

function renderToday() {
  const today = new Date().toDateString();
  const entries = state.entries.filter((entry) => new Date(entry.datumUhrzeit).toDateString() === today).sort(sortNewest);
  return renderEntryTable("Heute", entries, false);
}

function renderHelp() {
  const entries = state.entries
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
                <td>${escapeHtml(entry.tierEmojiSnapshot)} ${escapeHtml(entry.tierNameSnapshot)}</td>
                <td>${entry.fach}</td>
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

function markEntryDone(entryId) {
  const entry = state.entries.find((item) => item.id === entryId);
  if (entry) {
    entry.erledigt = true;
    saveState();
    render();
  }
}

function renderHistory() {
  const animalOptions = state.animals.map((animal) => `<option value="${animal.id}">${escapeHtml(animal.tierEmoji)} ${escapeHtml(animal.tierName)}</option>`).join("");
  const materialOptions = [...new Set(state.materials.map((material) => material.materialName))]
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
        <label class="field">Status<select class="select-input" id="filterStatus"><option value="">Alle Status</option><option>fertig</option><option>brauche Hilfe</option><option>bitte kontrollieren</option></select></label>
        <label class="field">Zeitraum<select class="select-input" id="filterPeriod"><option value="all">alle</option><option value="today">heute</option><option value="week">diese Woche</option></select></label>
        <button class="primary" type="submit">Anzeigen</button>
      </form>
    </section>
    <section class="panel" id="historyResults">${renderHistoryRows(state.entries.sort(sortNewest))}</section>
  `;
}

function renderHistoryResults() {
  const animal = document.querySelector("#filterAnimal").value;
  const subject = document.querySelector("#filterSubject").value;
  const material = document.querySelector("#filterMaterial").value;
  const status = document.querySelector("#filterStatus").value;
  const period = document.querySelector("#filterPeriod").value;
  const now = new Date();

  const entries = state.entries.filter((entry) => {
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
              <td>${escapeHtml(entry.tierEmojiSnapshot)} ${escapeHtml(entry.tierNameSnapshot)}</td>
              <td>${entry.fach}</td>
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
  if (!entries.length) {
    return `<section class="panel"><h2>${title}</h2><div class="empty">Keine Einträge vorhanden.</div></section>`;
  }
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
                <td>${escapeHtml(entry.tierEmojiSnapshot)} ${escapeHtml(entry.tierNameSnapshot)}</td>
                <td>${entry.fach}</td>
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

function renderSettings() {
  return `
    ${renderAnimalSettings()}
    ${renderMaterialSettings()}
    ${renderPinSettings()}
    <section class="panel">
      <h2>Datenschutz</h2>
      <p class="privacy-text">Diese App speichert nur Tier-Pseudonyme, Fach, Material, Seite, Status und Datum lokal auf diesem iPad. Es werden keine Namen, Fotos oder Daten in eine Cloud übertragen.</p>
    </section>
    <section class="panel">
      <h2>Daten löschen</h2>
      <button class="danger" type="button" onclick="deleteEntries()">Alle Einträge löschen</button>
      <button class="danger" type="button" onclick="resetApp()" style="margin-left:10px">App vollständig zurücksetzen</button>
    </section>
  `;
}

function renderAnimalSettings() {
  return `
    <section class="panel">
      <h2>Tiere verwalten</h2>
      <p class="message">Keine Kindernamen verwenden.</p>
      ${state.animals.map((animal) => `
        <div class="editor-row">
          <input class="text-input" value="${escapeAttribute(animal.tierEmoji)}" aria-label="Tier-Emoji" onchange="updateAnimal('${animal.id}', 'tierEmoji', this.value)">
          <input class="text-input" value="${escapeAttribute(animal.tierName)}" aria-label="Tiername" onchange="updateAnimal('${animal.id}', 'tierName', this.value)">
          <label class="toggle-label"><input type="checkbox" ${animal.aktiv ? "checked" : ""} onchange="updateAnimal('${animal.id}', 'aktiv', this.checked)"> aktiv</label>
        </div>
      `).join("")}
      <form class="inline-form" onsubmit="addAnimal(event)">
        <input class="text-input" id="newAnimalEmoji" placeholder="Emoji" aria-label="Neues Tier-Emoji">
        <input class="text-input" id="newAnimalName" placeholder="Neues Tier" aria-label="Neues Tier">
        <button class="primary" type="submit">Hinzufügen</button>
      </form>
    </section>
  `;
}

function updateAnimal(id, field, value) {
  const animal = state.animals.find((item) => item.id === id);
  if (!animal) return;
  animal[field] = typeof value === "string" ? value.trim() : value;
  saveState();
}

function addAnimal(event) {
  event.preventDefault();
  const emoji = document.querySelector("#newAnimalEmoji").value.trim();
  const name = document.querySelector("#newAnimalName").value.trim();
  if (!emoji || !name) return;
  state.animals.push({ id: makeId(), tierName: name, tierEmoji: emoji, aktiv: true });
  saveState();
  render();
}

function renderMaterialSettings() {
  return `
    <section class="panel">
      <h2>Materialien verwalten</h2>
      ${["Deutsch", "Mathe"].map((subject) => `
        <h3>${subject}</h3>
        ${state.materials.filter((material) => material.fach === subject).map((material) => `
          <div class="editor-row material-row">
            <input class="text-input" value="${escapeAttribute(material.materialName)}" aria-label="Material" onchange="updateMaterial('${material.id}', 'materialName', this.value)">
            <label class="toggle-label"><input type="checkbox" ${material.aktiv ? "checked" : ""} onchange="updateMaterial('${material.id}', 'aktiv', this.checked)"> aktiv</label>
          </div>
        `).join("")}
        <form class="inline-form" onsubmit="addMaterial(event, '${subject}')">
          <input class="text-input" id="newMaterial${subject}" placeholder="Neues Material" aria-label="Neues Material">
          <button class="primary" type="submit">Hinzufügen</button>
        </form>
      `).join("")}
    </section>
  `;
}

function updateMaterial(id, field, value) {
  const material = state.materials.find((item) => item.id === id);
  if (!material) return;
  material[field] = typeof value === "string" ? value.trim() : value;
  saveState();
}

function addMaterial(event, subject) {
  event.preventDefault();
  const input = document.querySelector(`#newMaterial${subject}`);
  const name = input.value.trim();
  if (!name) return;
  state.materials.push({ id: makeId(), fach: subject, materialName: name, aktiv: true });
  saveState();
  render();
}

function renderPinSettings() {
  return `
    <section class="panel">
      <h2>PIN ändern</h2>
      <form class="filters" onsubmit="changePin(event)">
        <label class="field">Alte PIN<input class="text-input" id="oldPin" type="password" inputmode="numeric"></label>
        <label class="field">Neue PIN<input class="text-input" id="newPin" type="password" inputmode="numeric"></label>
        <label class="field">Neue PIN bestätigen<input class="text-input" id="confirmPin" type="password" inputmode="numeric"></label>
        <button class="primary" type="submit">PIN speichern</button>
      </form>
      <p class="message" id="pinMessage"></p>
    </section>
  `;
}

function changePin(event) {
  event.preventDefault();
  const oldPin = document.querySelector("#oldPin").value.replace(/\D/g, "");
  const newPin = document.querySelector("#newPin").value.replace(/\D/g, "");
  const confirmPin = document.querySelector("#confirmPin").value.replace(/\D/g, "");
  const message = document.querySelector("#pinMessage");
  if (oldPin !== state.pin || newPin.length < 4 || newPin !== confirmPin) {
    message.textContent = "Bitte Eingaben prüfen.";
    message.className = "message error";
    return;
  }
  state.pin = newPin;
  saveState();
  message.textContent = "Die PIN wurde gespeichert.";
  message.className = "message success";
  event.target.reset();
}

function deleteEntries() {
  if (!confirm("Wirklich alle Arbeitsstand-Einträge löschen? Tiere und Materialien bleiben erhalten.")) return;
  state.entries = [];
  saveState();
  render();
}

function resetApp() {
  if (!confirm("Wirklich alle Daten löschen und App zurücksetzen?")) return;
  state = defaultState();
  saveState();
  render();
}

function renderExport() {
  return `
    <section class="export-box big-card">
      <div style="font-size:4.4rem">📄</div>
      <h2 class="child-title" style="margin:0">CSV-Export</h2>
      <p class="message">${state.entries.length} Einträge werden exportiert.</p>
      <button class="primary" type="button" onclick="exportCsv()" ${state.entries.length ? "" : "disabled"}>CSV teilen oder herunterladen</button>
      <p class="message">Datum, Uhrzeit, Tier, Fach, Material, Seite, Status, Erledigt</p>
    </section>
  `;
}

async function exportCsv() {
  const csv = makeCsv();
  const fileName = `arbeitsheft-kompass-export-${formatFileDate(new Date())}.csv`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const file = new File([blob], fileName, { type: "text/csv" });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({ files: [file], title: "Arbeitsheft-Kompass Export" });
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function makeCsv() {
  const header = ["Datum", "Uhrzeit", "Tier", "Fach", "Material", "Seite", "Status", "Erledigt"];
  const rows = state.entries.sort((a, b) => new Date(a.datumUhrzeit) - new Date(b.datumUhrzeit)).map((entry) => [
    formatFileDate(new Date(entry.datumUhrzeit)),
    formatTime(entry.datumUhrzeit),
    `${entry.tierEmojiSnapshot} ${entry.tierNameSnapshot}`,
    entry.fach,
    entry.materialName,
    entry.seite,
    entry.status,
    entry.erledigt ? "ja" : "nein"
  ]);
  return [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

function latestEntry(animalId, subject) {
  return state.entries
    .filter((entry) => entry.tierID === animalId && (!subject || entry.fach === subject))
    .sort(sortNewest)[0];
}

function statusBadge(status, finished) {
  if (finished) return `<span class="badge finished">erledigt</span>`;
  const meta = statusMeta[status] || statusMeta.fertig;
  return `<span class="badge ${meta.className}">${meta.label}</span>`;
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

function formatTime(value) {
  return new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatFileDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
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

render();
