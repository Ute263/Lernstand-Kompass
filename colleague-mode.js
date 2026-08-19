/* Paket 9: Kolleginnen-Version
 *
 * Ziel:
 * - Kolleginnen brauchen KEINE eigene Microsoft-Appregistrierung.
 * - Die gemeinsame Lernstand-Kompass-Appregistrierung wird verwendet.
 * - Microsoft-Anmeldung nutzt "common": Dienst-/Schulkonten + persönliche Konten.
 * - Technische Client-ID-/Redirect-Felder verschwinden aus der normalen Ansicht.
 * - Der gemeinsame Cloudflare-Sync-Endpunkt ist voreingestellt.
 * - Jede Installation erzeugt ihren eigenen zufälligen Klassen-Sync-Code.
 *
 * Hinweis:
 * Die Microsoft-Appregistrierung selbst muss einmalig auf
 * "Accounts in any organizational directory and personal Microsoft accounts"
 * gestellt sein. Das kann nicht aus einer Browser-App heraus geändert werden.
 */
(() => {
  if (
    typeof renderCloudSyncPanel !== "function" ||
    typeof currentMicrosoftSettings !== "function" ||
    typeof currentClassSyncSettings !== "function" ||
    typeof persist !== "function"
  ) {
    console.warn("Paket 9 konnte nicht initialisiert werden.");
    return;
  }

  const SHARED_MICROSOFT_CLIENT_ID = "36512ee1-b4ed-4208-81ae-40cde5f7ba1a";
  const SHARED_MICROSOFT_AUTHORITY = "common";
  const SHARED_CLASS_SYNC_ENDPOINT =
    "https://lernstand-kompass-sync.uteholzschneider26.workers.dev";

  const baseCurrentMicrosoftSettings = currentMicrosoftSettings;
  const baseCurrentClassSyncSettings = currentClassSyncSettings;
  const baseDefaultMicrosoftSyncSettings =
    typeof defaultMicrosoftSyncSettings === "function"
      ? defaultMicrosoftSyncSettings
      : null;
  const baseDefaultClassSyncSettings =
    typeof defaultClassSyncSettings === "function"
      ? defaultClassSyncSettings
      : null;

  let colleagueSyncMessage = "";
  let colleagueSyncStatus = "idle";

  function detectedRedirectUri() {
    if (typeof currentRedirectUri === "function") return currentRedirectUri();
    if (location.protocol === "file:") return "";
    return `${location.origin}${location.pathname}`;
  }

  function microsoftEffectiveSettings() {
    const stored = {
      ...(baseCurrentMicrosoftSettings ? baseCurrentMicrosoftSettings() : {}),
      ...(state?.microsoftSync || {})
    };
    return {
      ...stored,
      clientId: SHARED_MICROSOFT_CLIENT_ID,
      authority: SHARED_MICROSOFT_AUTHORITY,
      redirectUri: stored.redirectUri || detectedRedirectUri(),
      autoBackup: stored.autoBackup === true
    };
  }

  function classSyncEffectiveSettings() {
    const stored = {
      ...(baseCurrentClassSyncSettings ? baseCurrentClassSyncSettings() : {}),
      ...(state?.classSync || {})
    };
    return {
      ...stored,
      endpoint: stored.endpoint || SHARED_CLASS_SYNC_ENDPOINT
    };
  }

  // Alle bestehenden Sync-Funktionen greifen dadurch automatisch auf
  // die gemeinsame Microsoft-Registrierung bzw. den gemeinsamen Worker zu.
  currentMicrosoftSettings = microsoftEffectiveSettings;
  currentClassSyncSettings = classSyncEffectiveSettings;

  if (baseDefaultMicrosoftSyncSettings) {
    defaultMicrosoftSyncSettings = function defaultMicrosoftSyncSettingsShared() {
      return {
        ...baseDefaultMicrosoftSyncSettings(),
        clientId: SHARED_MICROSOFT_CLIENT_ID,
        authority: SHARED_MICROSOFT_AUTHORITY,
        redirectUri: detectedRedirectUri()
      };
    };
  }

  if (baseDefaultClassSyncSettings) {
    defaultClassSyncSettings = function defaultClassSyncSettingsShared() {
      return {
        ...baseDefaultClassSyncSettings(),
        endpoint: SHARED_CLASS_SYNC_ENDPOINT
      };
    };
  }

  function accountLabel() {
    try {
      return (
        syncRuntime?.msAccount?.username ||
        state?.microsoftSync?.connectedAccount ||
        "nicht verbunden"
      );
    } catch {
      return state?.microsoftSync?.connectedAccount || "nicht verbunden";
    }
  }

  function microsoftConnected() {
    try {
      return !!syncRuntime?.msAccount;
    } catch {
      return !!state?.microsoftSync?.connectedAccount;
    }
  }

  function classSyncReady() {
    const settings = currentClassSyncSettings();
    return !!(
      settings.enabled &&
      settings.endpoint &&
      String(settings.syncCode || "").length >= 20
    );
  }

  function maskCode(value) {
    const code = String(value || "");
    if (!code) return "noch nicht eingerichtet";
    if (code.length < 12) return "••••••••";
    return `${code.slice(0, 4)}••••••••${code.slice(-4)}`;
  }

  function randomSyncCode(length = 40) {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
  }

  async function persistSharedMicrosoftSettings({ autoBackup } = {}) {
    const old = state.microsoftSync || {};
    const next = {
      ...old,
      clientId: SHARED_MICROSOFT_CLIENT_ID,
      authority: SHARED_MICROSOFT_AUTHORITY,
      redirectUri: detectedRedirectUri(),
      autoBackup: autoBackup ?? old.autoBackup === true
    };
    await persist({ ...state, microsoftSync: next });
    return next;
  }

  window.connectSharedMicrosoft = async function connectSharedMicrosoft() {
    colleagueSyncMessage = "";
    colleagueSyncStatus = "working";
    render();

    try {
      const autoBackup =
        document.querySelector("#colleagueAutoBackup")?.checked !== false;
      await persistSharedMicrosoftSettings({ autoBackup });

      // MSAL-Instanz neu aufbauen, falls zuvor "consumers" aktiv war.
      try {
        if (typeof syncRuntime !== "undefined") {
          syncRuntime.pca = null;
          syncRuntime.pcaClientId = "";
          syncRuntime.msAccount = null;
        }
      } catch {}

      await connectMicrosoft();
      colleagueSyncStatus = "success";
      colleagueSyncMessage =
        "Microsoft ist verbunden. Die Sicherung liegt im OneDrive des angemeldeten Kontos.";
    } catch (error) {
      colleagueSyncStatus = "error";
      const text = String(error?.message || error || "");
      colleagueSyncMessage =
        text.includes("AADSTS") || text.toLowerCase().includes("admin")
          ? "Die Anmeldung wurde von Microsoft bzw. der Schulorganisation abgelehnt. Bei Dienstkonten kann eine Freigabe durch die Schul-IT nötig sein."
          : "Microsoft konnte nicht verbunden werden. Prüfe das Konto und versuche es erneut.";
      console.warn("Gemeinsame Microsoft-Anmeldung fehlgeschlagen.", error);
    }
    render();
  };

  window.saveColleagueAutoBackup = async function saveColleagueAutoBackup() {
    const autoBackup =
      document.querySelector("#colleagueAutoBackup")?.checked === true;
    await persistSharedMicrosoftSettings({ autoBackup });
    colleagueSyncStatus = "success";
    colleagueSyncMessage = autoBackup
      ? "Automatische OneDrive-Sicherung ist eingeschaltet."
      : "Automatische OneDrive-Sicherung ist ausgeschaltet.";
    render();
  };

  window.setupSharedClassSync = async function setupSharedClassSync() {
    const existing = currentClassSyncSettings();

    if (classSyncReady()) {
      colleagueSyncStatus = "success";
      colleagueSyncMessage = "Der Kinder-Sync ist bereits eingerichtet.";
      render();
      return;
    }

    const syncCode =
      String(existing.syncCode || "").length >= 20
        ? existing.syncCode
        : randomSyncCode();

    await persist({
      ...state,
      classSync: {
        ...(state.classSync || {}),
        enabled: true,
        endpoint: SHARED_CLASS_SYNC_ENDPOINT,
        syncCode,
        lastError: ""
      }
    });

    colleagueSyncStatus = "success";
    colleagueSyncMessage =
      "Kinder-Sync ist eingerichtet. Die QR-Zugänge können jetzt verwendet werden.";
    render();
  };

  window.regenerateSharedClassSync = async function regenerateSharedClassSync() {
    if (
      !confirm(
        "Einen neuen Klassen-Sync-Code erzeugen? Bereits ausgegebene Kinder-Zugänge müssen danach neu geladen bzw. neu ausgegeben werden."
      )
    ) return;

    await persist({
      ...state,
      classSync: {
        ...(state.classSync || {}),
        enabled: true,
        endpoint: SHARED_CLASS_SYNC_ENDPOINT,
        syncCode: randomSyncCode(),
        lastPushAt: "",
        lastPullAt: "",
        lastError: ""
      }
    });

    colleagueSyncStatus = "success";
    colleagueSyncMessage =
      "Ein neuer Klassen-Sync-Code wurde erzeugt. Bitte die QR-Karten neu ausgeben.";
    render();
  };

  window.testSharedClassSync = async function testSharedClassSync() {
    colleagueSyncStatus = "working";
    colleagueSyncMessage = "Verbindung wird geprüft …";
    render();

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const response = await fetch(`${SHARED_CLASS_SYNC_ENDPOINT}/health`, {
        cache: "no-store",
        signal: controller.signal
      });
      clearTimeout(timer);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      colleagueSyncStatus = "success";
      colleagueSyncMessage = "Kinder-Sync ist erreichbar.";
    } catch (error) {
      colleagueSyncStatus = "error";
      colleagueSyncMessage =
        "Der Kinder-Sync ist gerade nicht erreichbar. Die lokalen Daten bleiben trotzdem erhalten.";
    }
    render();
  };

  function renderMicrosoftCard() {
    const ms = currentMicrosoftSettings();
    const connected = microsoftConnected();
    const label = accountLabel();
    let liveStatus = "idle";
    let liveMessage = "";
    try {
      liveStatus = syncRuntime?.msStatus || "idle";
      liveMessage = syncRuntime?.msMessage || ms.lastSyncStatus || "";
    } catch {
      liveMessage = ms.lastSyncStatus || "";
    }
    const isWorking = liveStatus === "working";

    return `
      <section class="panel colleague-sync-card">
        <div class="colleague-card-heading">
          <span class="colleague-card-icon">☁️</span>
          <div>
            <h2>OneDrive-Sicherung</h2>
            <p class="privacy-text">
              Melde dich mit deinem eigenen Microsoft-Konto an. Die Sicherung
              wird ausschließlich in deinem OneDrive gespeichert.
            </p>
          </div>
          <span class="cloud-status-pill ${connected ? "is-connected" : ""}">
            ${connected ? "● verbunden" : "○ nicht verbunden"}
          </span>
        </div>

        ${connected ? `
          <div class="colleague-account-box">
            <span>Angemeldetes Konto</span>
            <strong>${escapeHtml(label)}</strong>
            <small>${ms.lastSyncAt ? `Letzter Abgleich: ${escapeHtml(formatDateTime(ms.lastSyncAt))}` : "Noch kein OneDrive-Abgleich"}</small>
          </div>

          <label class="toggle-label colleague-toggle">
            <input id="colleagueAutoBackup" type="checkbox" ${ms.autoBackup ? "checked" : ""} onchange="saveColleagueAutoBackup()">
            Änderungen automatisch in meinem OneDrive sichern
          </label>

          <div class="backup-actions">
            <button class="primary" type="button" ${isWorking ? "disabled" : ""} onclick="syncWithOneDriveNow()">
              ${isWorking ? "⏳ Abgleich läuft …" : "Jetzt abgleichen"}
            </button>
            <button class="secondary" type="button" ${isWorking ? "disabled" : ""} onclick="uploadOneDriveBackupNow()">
              ${isWorking ? "Bitte warten …" : "Nur sichern"}
            </button>
            <button class="secondary" type="button" ${isWorking ? "disabled" : ""} onclick="disconnectMicrosoft()">Konto trennen</button>
          </div>

          ${liveMessage ? `
            <div class="colleague-sync-feedback ${
              liveStatus === "error"
                ? "error"
                : liveStatus === "success"
                  ? "success"
                  : liveStatus === "working"
                    ? "working"
                    : ""
            }">
              <span>${liveStatus === "working" ? "⏳" : liveStatus === "error" ? "❌" : "✅"}</span>
              <div>
                <strong>${
                  liveStatus === "working"
                    ? "OneDrive arbeitet"
                    : liveStatus === "error"
                      ? "OneDrive-Fehler"
                      : "OneDrive"
                }</strong>
                <small>${escapeHtml(liveMessage)}</small>
              </div>
            </div>
          ` : ""}
        ` : `
          <div class="colleague-connect-box">
            <div>
              <strong>Keine technische Einrichtung nötig</strong>
              <small>
                Du brauchst keine eigene App-Registrierung und keine Client-ID.
                Bei einem schulischen Microsoft-Konto kann die Schul-IT die Zustimmung zu externen Apps einschränken.
              </small>
            </div>
            <button class="primary recommended-action" type="button" onclick="connectSharedMicrosoft()">
              Mit Microsoft verbinden
            </button>
          </div>
        `}
      </section>
    `;
  }

  function renderClassSyncCard() {
    const settings = currentClassSyncSettings();
    const ready = classSyncReady();

    return `
      <section class="panel colleague-sync-card">
        <div class="colleague-card-heading">
          <span class="colleague-card-icon">🧒</span>
          <div>
            <h2>Kinder-Sync</h2>
            <p class="privacy-text">
              Damit Ergebnisse von Kinder-iPads bei dir ankommen. Die Kinder
              brauchen kein Microsoft-Konto.
            </p>
          </div>
          <span class="cloud-status-pill ${ready ? "is-connected" : ""}">
            ${ready ? "● eingerichtet" : "○ noch nicht eingerichtet"}
          </span>
        </div>

        ${ready ? `
          <div class="colleague-sync-ready">
            <div>
              <strong>Diese Klasse ist bereit.</strong>
              <small>Klassen-Code: ${escapeHtml(maskCode(settings.syncCode))}</small>
            </div>
            <div class="backup-actions">
              <button class="primary" type="button" onclick="pullClassSyncSessions()">Kinder-Ergebnisse abrufen</button>
              <button class="secondary" type="button" onclick="testSharedClassSync()">Verbindung prüfen</button>
            </div>
          </div>
        ` : `
          <div class="colleague-connect-box">
            <div>
              <strong>Ein Klick genügt</strong>
              <small>
                Die App erzeugt einen eigenen zufälligen Klassen-Code und verwendet
                den gemeinsamen verschlüsselten Sync-Dienst.
              </small>
            </div>
            <button class="primary" type="button" onclick="setupSharedClassSync()">
              Kinder-Sync einrichten
            </button>
          </div>
        `}

        <details class="colleague-tech-details">
          <summary>Technische Informationen</summary>
          <div class="colleague-tech-grid">
            <div>
              <span>Sync-Dienst</span>
              <code>${escapeHtml(SHARED_CLASS_SYNC_ENDPOINT)}</code>
            </div>
            <div>
              <span>Klassen-Code</span>
              <code>${escapeHtml(maskCode(settings.syncCode))}</code>
            </div>
          </div>
          ${ready ? `
            <button class="small-button" type="button" onclick="regenerateSharedClassSync()">
              Neuen Klassen-Code erzeugen
            </button>
          ` : ""}
        </details>
      </section>
    `;
  }

  function renderTechnicalOwnerNote() {
    const redirect = detectedRedirectUri();
    return `
      <details class="panel colleague-owner-details">
        <summary>Technische Angaben zur gemeinsamen App</summary>
        <div class="colleague-owner-body">
          <p class="privacy-text">
            Diese Angaben sind für normale Nutzerinnen nur zur Information.
            Eine Kollegin muss hier nichts eintragen.
          </p>
          <div class="colleague-tech-grid">
            <div>
              <span>Gemeinsame Microsoft Client-ID</span>
              <code>${escapeHtml(SHARED_MICROSOFT_CLIENT_ID)}</code>
            </div>
            <div>
              <span>Microsoft-Anmeldung</span>
              <code>common</code>
            </div>
            <div>
              <span>SPA Redirect-URL</span>
              <code>${escapeHtml(redirect || "Web-Version öffnen")}</code>
            </div>
          </div>
          <p class="message">
            Die Microsoft-Appregistrierung muss „Konten in jedem Organisationsverzeichnis
            und persönliche Microsoft-Konten“ zulassen. Manche Schul-Mandanten verlangen
            zusätzlich eine Freigabe durch die eigene IT.
          </p>
        </div>
      </details>
    `;
  }

  renderCloudSyncPanel = function renderCloudSyncPanelForColleagues() {
    return `
      <section class="panel colleague-sync-hero">
        <div>
          <p class="colleague-kicker">Sicherung & Geräte</p>
          <h2>Einfach verbinden</h2>
          <p class="privacy-text">
            Für die normale Nutzung musst du weder Microsoft- noch Cloudflare-Einstellungen
            selbst anlegen. Dein Konto und deine Klasse bleiben voneinander getrennt.
          </p>
        </div>
        <span class="colleague-hero-icon">🔐</span>
      </section>

      ${colleagueSyncMessage ? `
        <p class="message ${
          colleagueSyncStatus === "error"
            ? "error"
            : colleagueSyncStatus === "success"
              ? "success"
              : ""
        }">${escapeHtml(colleagueSyncMessage)}</p>
      ` : ""}

      <div class="colleague-sync-layout">
        ${renderMicrosoftCard()}
        ${renderClassSyncCard()}
      </div>

      ${renderTechnicalOwnerNote()}
    `;
  };

  async function migrateSharedDefaultsWhenReady() {
    for (let i = 0; i < 20; i += 1) {
      if (state?.setupComplete) break;
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    if (!state?.setupComplete) return;

    const currentMs = state.microsoftSync || {};
    const currentClass = state.classSync || {};

    const msNeedsMigration =
      currentMs.clientId !== SHARED_MICROSOFT_CLIENT_ID ||
      currentMs.authority !== SHARED_MICROSOFT_AUTHORITY ||
      !currentMs.redirectUri;

    const classNeedsMigration = !currentClass.endpoint;

    if (!msNeedsMigration && !classNeedsMigration) return;

    await persist({
      ...state,
      microsoftSync: {
        ...currentMs,
        clientId: SHARED_MICROSOFT_CLIENT_ID,
        authority: SHARED_MICROSOFT_AUTHORITY,
        redirectUri: currentMs.redirectUri || detectedRedirectUri()
      },
      classSync: {
        ...currentClass,
        endpoint: currentClass.endpoint || SHARED_CLASS_SYNC_ENDPOINT
      }
    });

    // Eine alte MSAL-Instanz mit "consumers" nicht weiterverwenden.
    try {
      if (typeof syncRuntime !== "undefined" && currentMs.authority === "consumers") {
        syncRuntime.pca = null;
        syncRuntime.pcaClientId = "";
      }
    } catch {}
  }

  const style = document.createElement("style");
  style.id = "lk-colleague-mode-style";
  style.textContent = `
    .colleague-sync-hero {
      display:flex;
      justify-content:space-between;
      gap:18px;
      align-items:center;
      background:linear-gradient(135deg, rgba(223,243,255,.85), rgba(255,244,210,.82));
      border:2px solid rgba(47,111,145,.1);
    }
    .colleague-sync-hero h2 { margin:.1rem 0 .35rem; }
    .colleague-kicker {
      margin:0 0 3px;
      font-size:.75rem;
      text-transform:uppercase;
      letter-spacing:.08em;
      font-weight:800;
      opacity:.55;
    }
    .colleague-hero-icon { font-size:2.4rem; }
    .colleague-sync-layout {
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:14px;
    }
    .colleague-sync-card {
      display:grid;
      align-content:start;
      gap:14px;
      min-width:0;
    }
    .colleague-card-heading {
      display:grid;
      grid-template-columns:auto minmax(0,1fr) auto;
      gap:10px;
      align-items:start;
    }
    .colleague-card-heading h2 { margin:.1rem 0 .3rem; }
    .colleague-card-icon {
      width:44px;
      height:44px;
      display:grid;
      place-items:center;
      border-radius:14px;
      background:rgba(47,111,145,.08);
      font-size:1.3rem;
    }
    .colleague-connect-box,
    .colleague-sync-ready,
    .colleague-account-box {
      padding:14px;
      border-radius:16px;
      background:rgba(47,111,145,.055);
    }
    .colleague-connect-box {
      display:flex;
      gap:12px;
      align-items:center;
      justify-content:space-between;
    }
    .colleague-connect-box > div,
    .colleague-sync-ready > div:first-child,
    .colleague-account-box {
      display:grid;
      gap:4px;
    }
    .colleague-connect-box small,
    .colleague-sync-ready small,
    .colleague-account-box small {
      opacity:.68;
      line-height:1.35;
    }
    .colleague-sync-ready {
      display:grid;
      gap:10px;
    }
    .colleague-toggle {
      padding:10px 12px;
      border-radius:14px;
      background:rgba(255,255,255,.68);
    }
    .colleague-tech-details,
    .colleague-owner-details {
      margin-top:4px;
    }
    .colleague-tech-details summary,
    .colleague-owner-details summary {
      cursor:pointer;
      font-weight:750;
    }
    .colleague-owner-body { margin-top:12px; }
    .colleague-tech-grid {
      display:grid;
      grid-template-columns:1fr;
      gap:8px;
      margin:10px 0;
    }
    .colleague-tech-grid > div {
      display:grid;
      gap:4px;
      min-width:0;
      padding:9px 10px;
      border-radius:12px;
      background:rgba(0,0,0,.03);
    }
    .colleague-tech-grid span {
      font-size:.78rem;
      opacity:.65;
    }
    .colleague-tech-grid code {
      overflow-wrap:anywhere;
      white-space:normal;
    }
    .colleague-sync-feedback {
      display:grid;
      grid-template-columns:auto minmax(0,1fr);
      gap:9px;
      align-items:start;
      padding:11px 12px;
      border-radius:14px;
      background:rgba(47,111,145,.07);
    }
    .colleague-sync-feedback.success {
      background:rgba(75,150,95,.10);
    }
    .colleague-sync-feedback.error {
      background:rgba(184,75,75,.10);
    }
    .colleague-sync-feedback.working {
      background:rgba(230,160,70,.12);
    }
    .colleague-sync-feedback > div {
      display:grid;
      gap:2px;
    }
    .colleague-sync-feedback small {
      opacity:.76;
      line-height:1.35;
    }

    @media (max-width:900px) {
      .colleague-sync-layout { grid-template-columns:1fr; }
    }
    @media (max-width:620px) {
      .colleague-card-heading { grid-template-columns:auto minmax(0,1fr); }
      .colleague-card-heading .cloud-status-pill {
        grid-column:2;
        justify-self:start;
      }
      .colleague-connect-box { display:grid; }
      .colleague-connect-box button { justify-self:start; }
    }
  `;
  if (!document.getElementById(style.id)) document.head.appendChild(style);

  window.LKColleagueMode = {
    sharedClientId: SHARED_MICROSOFT_CLIENT_ID,
    sharedAuthority: SHARED_MICROSOFT_AUTHORITY,
    sharedClassSyncEndpoint: SHARED_CLASS_SYNC_ENDPOINT,
    randomSyncCode,
    microsoftEffectiveSettings,
    classSyncEffectiveSettings
  };

  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => migrateSharedDefaultsWhenReady().catch((error) => {
      console.warn("Gemeinsame Sync-Vorgaben konnten nicht gespeichert werden.", error);
    }), 500);
  });
})();
