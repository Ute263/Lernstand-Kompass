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
    try {
      const autoBackup = state?.microsoftSync?.autoBackup !== false;
      await persistSharedMicrosoftSettings({ autoBackup });

      if (typeof syncRuntime !== "undefined") {
        syncRuntime.pca = null;
        syncRuntime.pcaClientId = "";
        syncRuntime.msStatus = "working";
        syncRuntime.msMessage = "Weiter zu Microsoft …";
      }

      colleagueSyncMessage = "Du wirst jetzt zu Microsoft weitergeleitet. Danach kehrst du automatisch zum Lernstand-Kompass zurück.";
      render();

      // Paket 10g: kein Popup mehr. Die Anmeldung läuft im selben Browserfenster.
      await startMicrosoftLoginRedirect("connect");
    } catch (error) {
      console.warn("Microsoft-Weiterleitung konnte nicht gestartet werden.", error);
      clearMicrosoftRedirectAction();
      colleagueSyncStatus = "error";
      const friendly = typeof friendlySyncError === "function"
        ? friendlySyncError(error)
        : String(error?.message || error || "Microsoft-Fehler");
      colleagueSyncMessage = `Microsoft-Anmeldung konnte nicht gestartet werden: ${friendly}`;
      if (typeof syncRuntime !== "undefined") {
        syncRuntime.msStatus = "error";
        syncRuntime.msMessage = friendly;
      }
      render();
    }
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
    const lastText = ms.lastSyncAt ? formatDateTime(ms.lastSyncAt) : "noch keine Sicherung";

    return `
      <section class="panel lk-simple-sync-card">
        <div class="lk-simple-sync-head">
          <div class="lk-simple-sync-icon">☁️</div>
          <div>
            <h2>Meine Sicherung</h2>
            <p>Zusätzliche Sicherung deiner App-Daten in OneDrive.</p>
          </div>
          <span class="lk-simple-status ${connected ? "ok" : "open"}">
            ${connected ? "✓ eingerichtet" : "noch nicht eingerichtet"}
          </span>
        </div>

        ${connected ? `
          <div class="lk-simple-status-grid">
            <div><span>Konto</span><strong>${escapeHtml(label)}</strong></div>
            <div><span>Letzte Sicherung</span><strong>${escapeHtml(lastText)}</strong></div>
          </div>

          <label class="lk-simple-switch">
            <input id="colleagueAutoBackup" type="checkbox" ${ms.autoBackup ? "checked" : ""} onchange="saveColleagueAutoBackup()">
            <span>
              <strong>Automatisch sichern</strong>
              <small>Änderungen werden regelmäßig zusätzlich in OneDrive gesichert.</small>
            </span>
          </label>

          <div class="lk-simple-main-actions">
            <button class="primary" type="button" ${isWorking ? "disabled" : ""} onclick="uploadOneDriveBackupNow()">
              ${isWorking ? "Bitte warten …" : "Jetzt sichern"}
            </button>
            <button class="secondary" type="button" ${isWorking ? "disabled" : ""} onclick="mergeOneDriveBackupNow()">
              Aus OneDrive holen
            </button>
          </div>
          <p class="lk-simple-help">„Aus OneDrive holen“ ergänzt den lokalen Stand. Vorhandene Daten werden nicht einfach gelöscht.</p>

          ${liveStatus === "error" ? `
            <div class="lk-simple-feedback error"><strong>Verbindung prüfen</strong><span>${escapeHtml(liveMessage || "OneDrive konnte gerade nicht erreicht werden.")}</span></div>
          ` : liveStatus === "working" ? `
            <div class="lk-simple-feedback working"><strong>OneDrive arbeitet …</strong><span>${escapeHtml(liveMessage || "Bitte kurz warten.")}</span></div>
          ` : ""}

          <details class="lk-simple-more-actions">
            <summary>Weitere Aktionen</summary>
            <div class="lk-simple-more-body">
              <button class="secondary" type="button" ${isWorking ? "disabled" : ""} onclick="syncWithOneDriveNow()">Lokalen Stand und OneDrive zusammenführen</button>
              <button class="secondary" type="button" onclick="disconnectMicrosoft()">Microsoft-Konto trennen</button>
            </div>
          </details>
        ` : `
          <div class="lk-simple-empty-state">
            <div>
              <strong>Noch keine zusätzliche Sicherung</strong>
              <small>Deine Daten bleiben trotzdem lokal gespeichert. Für eine zusätzliche Sicherung meldest du dich einmal mit Microsoft an.</small>
            </div>
            <button class="primary recommended-action" type="button" onclick="connectSharedMicrosoft()">Sicherung einrichten</button>
          </div>
        `}
      </section>
    `;
  }

  function renderClassSyncCard() {
    const settings = currentClassSyncSettings();
    const ready = classSyncReady();
    const lastPull = settings.lastPullAt ? formatDateTime(settings.lastPullAt) : "noch keine Übertragung";

    return `
      <section class="panel lk-simple-sync-card">
        <div class="lk-simple-sync-head">
          <div class="lk-simple-sync-icon">🧒</div>
          <div>
            <h2>Kindergeräte</h2>
            <p>Ergebnisse der Kinder automatisch in deine Klasse übernehmen.</p>
          </div>
          <span class="lk-simple-status ${ready ? "ok" : "open"}">
            ${ready ? "✓ verbunden" : "noch nicht verbunden"}
          </span>
        </div>

        ${ready ? `
          <div class="lk-simple-status-grid one-line">
            <div><span>Zuletzt abgerufen</span><strong>${escapeHtml(lastPull)}</strong></div>
            <div><span>Status</span><strong>bereit</strong></div>
          </div>

          <div class="lk-simple-main-actions">
            <button class="primary" type="button" onclick="pullClassSyncSessions()">Ergebnisse jetzt abrufen</button>
            <button class="secondary" type="button" onclick="setTeacherTab('qrCards')">QR-Karten</button>
          </div>
          <p class="lk-simple-help">Im Alltag musst du hier nichts weiter einstellen. Neue Ergebnisse werden automatisch übernommen.</p>

          <details class="lk-simple-more-actions">
            <summary>Weitere Aktionen</summary>
            <div class="lk-simple-more-body">
              <button class="secondary" type="button" onclick="testSharedClassSync()">Verbindung prüfen</button>
              <button class="secondary" type="button" onclick="regenerateSharedClassSync()">Kindergeräte neu verbinden</button>
            </div>
          </details>
        ` : `
          <div class="lk-simple-empty-state">
            <div>
              <strong>Kindergeräte noch nicht verbunden</strong>
              <small>Ein Klick genügt. Die technische Einrichtung übernimmt die App im Hintergrund.</small>
            </div>
            <button class="primary" type="button" onclick="setupSharedClassSync()">Kindergeräte verbinden</button>
          </div>
        `}
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
      <section class="lk-simple-page-intro">
        <div>
          <p class="lk-simple-kicker">Sicherung & Kindergeräte</p>
          <h2>Zwei Dinge, die im Alltag wichtig sind</h2>
          <p>Ist deine Sicherung eingerichtet? Sind die Kindergeräte verbunden? Mehr musst du normalerweise nicht prüfen.</p>
        </div>
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

      <div class="lk-simple-sync-layout">
        ${renderMicrosoftCard()}
        ${renderClassSyncCard()}
      </div>

      <details class="panel lk-simple-explain">
        <summary>Was passiert im Hintergrund?</summary>
        <div>
          <p>Die App speichert weiterhin lokal auf diesem Gerät. OneDrive ist eine zusätzliche Sicherung. Die Kindergeräte übertragen nur die für die App benötigten Lern- und Statusdaten.</p>
          <p>Technische Adressen, Microsoft-Appdaten und Klassenkennungen verwaltet die App selbst. Du musst sie im normalen Betrieb weder kennen noch eingeben.</p>
        </div>
      </details>
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
      currentMs.redirectUri !== detectedRedirectUri();
    const classNeedsMigration = !currentClass.endpoint;

    if (msNeedsMigration || classNeedsMigration) {
      await persist({
        ...state,
        microsoftSync: {
          ...currentMs,
          clientId: SHARED_MICROSOFT_CLIENT_ID,
          authority: SHARED_MICROSOFT_AUTHORITY,
          // Immer die tatsächlich geöffnete App-Adresse verwenden. Alte Redirects
          // von früheren Deployments dürfen die Anmeldung nicht blockieren.
          redirectUri: detectedRedirectUri()
        },
        classSync: {
          ...currentClass,
          endpoint: currentClass.endpoint || SHARED_CLASS_SYNC_ENDPOINT
        }
      });

      try {
        if (typeof syncRuntime !== "undefined") {
          syncRuntime.pca = null;
          syncRuntime.pcaClientId = "";
        }
      } catch {}
    }

    // MSAL im Hintergrund vorbereiten. Die Anmeldung selbst verwendet ab Paket 10g
    // ausschließlich Redirect und öffnet kein zusätzliches Browserfenster.
    try {
      await getMsalClient();
    } catch (error) {
      console.warn("Microsoft-Anmeldung konnte noch nicht vorbereitet werden.", error);
    }
  }

  const style = document.createElement("style");
  style.id = "lk-colleague-mode-style";
  style.textContent = `
    .lk-simple-page-intro {
      margin:0 0 14px;
      padding:4px 2px;
      max-width:760px;
    }
    .lk-simple-page-intro h2 { margin:3px 0 5px; font-size:1.35rem; }
    .lk-simple-page-intro p { margin:0; color:#5d6b73; line-height:1.45; }
    .lk-simple-kicker {
      font-size:.72rem;
      font-weight:800;
      text-transform:uppercase;
      letter-spacing:.08em;
      color:#39728e !important;
    }
    .lk-simple-sync-layout { display:grid; gap:14px; max-width:980px; }
    .lk-simple-sync-card { padding:18px; }
    .lk-simple-sync-head {
      display:grid;
      grid-template-columns:auto minmax(0,1fr) auto;
      align-items:start;
      gap:12px;
    }
    .lk-simple-sync-head h2 { margin:0 0 3px; font-size:1.16rem; }
    .lk-simple-sync-head p { margin:0; color:#65737a; line-height:1.35; }
    .lk-simple-sync-icon {
      width:42px; height:42px; display:grid; place-items:center;
      border-radius:13px; background:#eef8fd; font-size:1.3rem;
    }
    .lk-simple-status {
      display:inline-flex; align-items:center; min-height:28px; padding:4px 9px;
      border-radius:999px; font-size:.75rem; font-weight:800; white-space:nowrap;
    }
    .lk-simple-status.ok { background:#e5f5eb; color:#2f7048; }
    .lk-simple-status.open { background:#fff5dc; color:#7b6424; }
    .lk-simple-status-grid {
      display:grid; grid-template-columns:1fr 1fr; gap:8px; margin:14px 0;
    }
    .lk-simple-status-grid > div {
      display:grid; gap:2px; padding:9px 11px; border-radius:11px;
      background:#f7fafb; border:1px solid rgba(47,111,145,.08);
    }
    .lk-simple-status-grid span { font-size:.7rem; color:#73818a; }
    .lk-simple-status-grid strong { font-size:.85rem; overflow-wrap:anywhere; }
    .lk-simple-switch {
      display:flex; align-items:flex-start; gap:9px; margin:10px 0 14px;
      padding:10px 11px; border-radius:11px; background:#fbfcfc;
    }
    .lk-simple-switch > span { display:grid; gap:2px; }
    .lk-simple-switch small { color:#6d7a81; }
    .lk-simple-main-actions { display:flex; gap:8px; flex-wrap:wrap; }
    .lk-simple-main-actions button { min-height:40px; }
    .lk-simple-help { margin:8px 0 0; font-size:.78rem; color:#6d7a81; }
    .lk-simple-empty-state {
      display:flex; align-items:center; justify-content:space-between; gap:16px;
      margin-top:14px; padding:13px; border-radius:13px; background:#f8fbfc;
    }
    .lk-simple-empty-state > div { display:grid; gap:3px; }
    .lk-simple-empty-state small { color:#6d7a81; line-height:1.35; }
    .lk-simple-more-actions { margin-top:12px; border-top:1px solid rgba(0,0,0,.06); padding-top:9px; }
    .lk-simple-more-actions summary { cursor:pointer; color:#536b79; font-size:.8rem; font-weight:700; }
    .lk-simple-more-body { display:flex; gap:8px; flex-wrap:wrap; margin-top:9px; }
    .lk-simple-feedback { display:grid; gap:2px; margin-top:10px; padding:9px 11px; border-radius:10px; font-size:.8rem; }
    .lk-simple-feedback.error { background:#fff0ed; color:#8b4032; }
    .lk-simple-feedback.working { background:#eef7fc; color:#315a70; }
    .lk-simple-explain { max-width:980px; margin-top:14px; padding:12px 14px; }
    .lk-simple-explain summary { cursor:pointer; font-weight:700; color:#536b79; }
    .lk-simple-explain div { margin-top:9px; color:#68777f; font-size:.84rem; line-height:1.45; }
    .lk-simple-explain p { margin:5px 0; }
    @media (max-width:720px) {
      .lk-simple-sync-head { grid-template-columns:auto 1fr; }
      .lk-simple-status { grid-column:2; justify-self:start; }
      .lk-simple-status-grid { grid-template-columns:1fr; }
      .lk-simple-empty-state { display:grid; }
      .lk-simple-main-actions { display:grid; grid-template-columns:1fr; }
      .lk-simple-main-actions button { width:100%; }
    }
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
