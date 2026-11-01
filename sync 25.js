/* Paket 2: Microsoft/OneDrive-Sicherung + Klassen-Sync-Grundlage
 * - Microsoft-Anmeldung über MSAL (Authorization Code Flow + PKCE)
 * - OneDrive-Ordner /Lernstand-Kompass via Microsoft Graph (Files.ReadWrite)
 * - verschlüsselter Klassen-Sync für Lernspiel-Sitzungen über einen optionalen Cloudflare-Worker
 *
 * WICHTIG: In einer Browser-App wird KEIN Client-Secret verwendet.
 */

const LK_MSAL_CDN = "https://alcdn.msauth.net/browser/2.35.0/js/msal-browser.min.js";
const LK_GRAPH_BASE = "https://graph.microsoft.com/v1.0";
const LK_ONEDRIVE_FOLDER = "Lernstand-Kompass";
const LK_ONEDRIVE_FILENAME = "lernstand-kompass-sync.json";
const LK_GRAPH_SCOPES = ["openid", "profile", "User.Read", "Files.ReadWrite"];
const LK_MS_REDIRECT_ACTION_KEY = "lkMicrosoftRedirectAction";

function rememberMicrosoftRedirectAction(action = "connect") {
  try { sessionStorage.setItem(LK_MS_REDIRECT_ACTION_KEY, action); } catch {}
}

function readMicrosoftRedirectAction() {
  try { return sessionStorage.getItem(LK_MS_REDIRECT_ACTION_KEY) || ""; } catch { return ""; }
}

function clearMicrosoftRedirectAction() {
  try { sessionStorage.removeItem(LK_MS_REDIRECT_ACTION_KEY); } catch {}
}

const syncRuntime = {
  msalPromise: null,
  pca: null,
  pcaClientId: "",
  msAccount: null,
  msStatus: "idle",
  msMessage: "",
  classStatus: "idle",
  classMessage: "",
  autoTimer: null,
  suppressAuto: false,
  lastAutoFingerprint: ""
};

function defaultMicrosoftSyncSettings() {
  return {
    clientId: "",
    authority: "consumers",
    redirectUri: "",
    autoBackup: true,
    autoBackupPolicyVersion: 2,
    connectedAccount: "",
    connectedName: "",
    lastSyncAt: "",
    lastSyncStatus: ""
  };
}

function defaultClassSyncSettings() {
  return {
    enabled: false,
    endpoint: "",
    syncCode: "",
    lastPushAt: "",
    lastPullAt: "",
    lastError: ""
  };
}

function normalizeSyncState(candidate) {
  return {
    microsoftSync: {
      ...defaultMicrosoftSyncSettings(),
      ...(candidate?.microsoftSync && typeof candidate.microsoftSync === "object" ? candidate.microsoftSync : {})
    },
    classSync: {
      ...defaultClassSyncSettings(),
      ...(candidate?.classSync && typeof candidate.classSync === "object" ? candidate.classSync : {})
    }
  };
}

function currentMicrosoftSettings() {
  return {
    ...defaultMicrosoftSyncSettings(),
    ...(state?.microsoftSync || {})
  };
}

function currentClassSyncSettings() {
  return {
    ...defaultClassSyncSettings(),
    ...(state?.classSync || {})
  };
}

function currentRedirectUri() {
  if (location.protocol === "file:") return "";
  const path = location.pathname.endsWith("index.html")
    ? location.pathname.slice(0, -"index.html".length)
    : location.pathname;
  return `${location.origin}${path}`;
}

function normalizeEndpoint(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function isValidClientId(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || "").trim());
}

function loadMsalLibrary() {
  if (window.msal?.PublicClientApplication) return Promise.resolve(window.msal);
  if (syncRuntime.msalPromise) return syncRuntime.msalPromise;
  syncRuntime.msalPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-lk-msal="true"]');
    if (existing) {
      existing.addEventListener("load", () => window.msal ? resolve(window.msal) : reject(new Error("MSAL wurde nicht geladen.")), { once: true });
      existing.addEventListener("error", () => reject(new Error("Microsoft-Anmeldung konnte nicht geladen werden.")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = LK_MSAL_CDN;
    script.async = true;
    script.defer = true;
    script.dataset.lkMsal = "true";
    script.crossOrigin = "anonymous";
    script.onload = () => window.msal ? resolve(window.msal) : reject(new Error("MSAL wurde nicht geladen."));
    script.onerror = () => reject(new Error("Microsoft-Anmeldung konnte nicht geladen werden. Prüfe die Internetverbindung."));
    document.head.appendChild(script);
  });
  return syncRuntime.msalPromise;
}

async function getMsalClient(force = false) {
  const settings = currentMicrosoftSettings();
  const clientId = String(settings.clientId || "").trim();
  if (!isValidClientId(clientId)) throw new Error("Bitte zuerst eine gültige Microsoft-Client-ID speichern.");
  if (!force && syncRuntime.pca && syncRuntime.pcaClientId === clientId) return syncRuntime.pca;
  const msalLib = await loadMsalLibrary();
  const redirectUri = settings.redirectUri || currentRedirectUri();
  if (!redirectUri) throw new Error("Die App muss über http:// oder https:// geöffnet werden, damit Microsoft-Anmeldung funktioniert.");
  syncRuntime.pca = new msalLib.PublicClientApplication({
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${settings.authority || "consumers"}`,
      redirectUri
    },
    cache: {
      cacheLocation: "localStorage",
      storeAuthStateInCookie: false
    },
    system: {
      allowNativeBroker: false
    }
  });
  syncRuntime.pcaClientId = clientId;
  const accounts = syncRuntime.pca.getAllAccounts();
  syncRuntime.msAccount = accounts[0] || null;
  if (syncRuntime.msAccount) syncRuntime.pca.setActiveAccount(syncRuntime.msAccount);
  return syncRuntime.pca;
}

async function initCloudSync() {
  try {
    const settings = currentMicrosoftSettings();
    if (isValidClientId(settings.clientId)) {
      const pca = await getMsalClient();

      // Paket 10g: Rückkehr von loginRedirect/acquireTokenRedirect abholen.
      // Microsoft verlangt bei Redirect-Flows handleRedirectPromise(), bevor
      // eine neue interaktive Anmeldung gestartet werden darf.
      const redirectResult = await pca.handleRedirectPromise();
      const action = readMicrosoftRedirectAction();
      const account = redirectResult?.account || pca.getActiveAccount() || pca.getAllAccounts()[0] || null;

      if (account) {
        syncRuntime.msAccount = account;
        pca.setActiveAccount(account);
        syncRuntime.msStatus = "connected";
        syncRuntime.msMessage = redirectResult
          ? "Microsoft-Anmeldung abgeschlossen. OneDrive wird geprüft …"
          : "Microsoft ist verbunden.";

        syncRuntime.suppressAuto = true;
        try {
          await persist({
            ...state,
            microsoftSync: {
              ...currentMicrosoftSettings(),
              autoBackup: state?.microsoftSync?.autoBackupPolicyVersion === 2 ? currentMicrosoftSettings().autoBackup !== false : true,
              autoBackupPolicyVersion: 2,
              connectedAccount: account.username || "",
              connectedName: account.name || "",
              lastSyncStatus: redirectResult
                ? "Microsoft verbunden – OneDrive wird geprüft"
                : (currentMicrosoftSettings().lastSyncStatus || "Microsoft verbunden")
            }
          });
        } finally {
          syncRuntime.suppressAuto = false;
        }

        if (redirectResult && action === "connect") {
          try {
            await ensureOneDriveFolder();
            syncRuntime.msStatus = "connected";
            syncRuntime.msMessage = "Microsoft und OneDrive sind verbunden.";
            syncRuntime.suppressAuto = true;
            try {
              await persist({
                ...state,
                microsoftSync: {
                  ...currentMicrosoftSettings(),
                  autoBackup: currentMicrosoftSettings().autoBackup !== false,
                  autoBackupPolicyVersion: 2,
                  connectedAccount: account.username || "",
                  connectedName: account.name || "",
                  lastSyncStatus: "Microsoft und OneDrive verbunden"
                }
              });
            } finally {
              syncRuntime.suppressAuto = false;
            }
          } catch (driveError) {
            console.warn("Microsoft ist angemeldet, aber OneDrive konnte nicht geprüft werden.", driveError);
            syncRuntime.msStatus = "error";
            syncRuntime.msMessage = `Microsoft ist angemeldet, aber OneDrive konnte nicht geöffnet werden: ${friendlySyncError(driveError)}`;
          }
        }
      }
      clearMicrosoftRedirectAction();
    }
  } catch (error) {
    clearMicrosoftRedirectAction();
    console.warn("Microsoft-Sync konnte beim Start nicht initialisiert werden.", error);
    syncRuntime.msStatus = "error";
    syncRuntime.msMessage = friendlySyncError(error);
  }

  window.addEventListener("online", () => {
    syncPendingLearningGameSessions().catch(() => {});
  });
  setTimeout(() => syncPendingLearningGameSessions().catch(() => {}), 1200);
  // Kein blindes Überschreiben beim Start. Wenn die Automatik aktiv ist,
  // wird nach kurzer Ruhe derselbe sichere Ablauf verwendet wie bei jeder Änderung:
  // Kinderstände holen -> Cloud lesen -> zusammenführen -> Cloud schreiben.
  if (syncRuntime.msAccount && currentMicrosoftSettings().autoBackup !== false) {
    setTimeout(() => scheduleMicrosoftAutoBackup(), 5000);
  }
}

async function startMicrosoftLoginRedirect(action = "connect") {
  const pca = await getMsalClient(true);
  rememberMicrosoftRedirectAction(action);
  syncRuntime.msStatus = "working";
  syncRuntime.msMessage = "Weiter zu Microsoft …";
  render();
  await pca.loginRedirect({
    scopes: LK_GRAPH_SCOPES,
    prompt: "select_account",
    redirectUri: currentMicrosoftSettings().redirectUri || currentRedirectUri()
  });
}

function renderCloudSyncPanel() {
  const ms = currentMicrosoftSettings();
  const classSync = currentClassSyncSettings();
  const detectedRedirect = currentRedirectUri();
  const accountLabel = syncRuntime.msAccount?.username || ms.connectedAccount || "nicht verbunden";
  const msConnected = !!syncRuntime.msAccount;
  const classReady = classSync.enabled && !!classSync.endpoint && !!classSync.syncCode;
  const codeDisplay = classSync.syncCode ? `${classSync.syncCode.slice(0, 5)}••••••••${classSync.syncCode.slice(-4)}` : "noch nicht erstellt";
  return `
    <section class="panel cloud-sync-hero">
      <div class="cloud-sync-heading-row">
        <div>
          <h2>Microsoft & Synchronisierung</h2>
          <p class="privacy-text">Die lokalen Daten bleiben erhalten. Microsoft/OneDrive ergänzt eine geschützte Sicherung für deine Geräte. Die Kinder brauchen dafür kein Microsoft-Konto.</p>
        </div>
        <span class="cloud-status-pill ${msConnected ? "is-connected" : ""}">${msConnected ? "● Microsoft verbunden" : "○ Microsoft nicht verbunden"}</span>
      </div>
    </section>

    <section class="panel cloud-sync-card">
      <h2>1. OneDrive für deine Geräte</h2>
      <p class="privacy-text">Der Lernstand-Kompass speichert seine Sicherung ausschließlich im Ordner <strong>OneDrive/Lernstand-Kompass</strong>. Die Microsoft-Berechtigung <code>Files.ReadWrite</code> erlaubt technisch Dateizugriff im angemeldeten OneDrive; die App verwendet ihn nur für diesen Ordner. Es wird kein Client-Secret in der App gespeichert.</p>
      <div class="cloud-sync-form-grid">
        <label class="field">Microsoft Client-ID
          <input id="microsoftClientId" class="text-input" autocomplete="off" spellcheck="false" value="${escapeAttribute(ms.clientId || "")}" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx">
        </label>
        <label class="field">Redirect-URL (SPA)
          <input id="microsoftRedirectUri" class="text-input" autocomplete="off" spellcheck="false" value="${escapeAttribute(ms.redirectUri || detectedRedirect)}" placeholder="https://.../">
        </label>
      </div>
      <p class="message"><strong>Diese Redirect-URL muss in der Microsoft-Appregistrierung als „Single-page application (SPA)“ eingetragen sein.</strong><br>${detectedRedirect ? `Aktuell erkannt: <code>${escapeHtml(detectedRedirect)}</code>` : "Lokaler Datei-Modus erkannt – bitte die Web-Version öffnen."}</p>
      <label class="toggle-label cloud-auto-toggle"><input id="microsoftAutoBackup" type="checkbox" ${ms.autoBackup !== false ? "checked" : ""}> automatisch sicher abgleichen (ca. 4 Sekunden nach der letzten Änderung)</label>
      <div class="backup-actions">
        <button class="primary" type="button" onclick="saveMicrosoftSyncSettings()">Microsoft-Einstellungen speichern</button>
        ${msConnected
          ? `<button class="secondary" type="button" onclick="disconnectMicrosoft()">Microsoft trennen</button>`
          : `<button class="primary recommended-action" type="button" onclick="connectMicrosoft()">Mit Microsoft verbinden</button>`}
      </div>
      <div class="cloud-sync-status-grid">
        <div><span>Konto</span><strong>${escapeHtml(accountLabel)}</strong></div>
        <div><span>Letzter OneDrive-Abgleich</span><strong>${ms.lastSyncAt ? escapeHtml(formatDateTime(ms.lastSyncAt)) : "noch keiner"}</strong></div>
        <div><span>Status</span><strong>${escapeHtml(syncRuntime.msMessage || ms.lastSyncStatus || (msConnected ? "bereit" : "nicht verbunden"))}</strong></div>
      </div>
      <div class="backup-actions">
        <button class="primary" type="button" ${msConnected ? "" : "disabled"} onclick="syncWithOneDriveNow()">Sicher abgleichen</button>
        <button class="secondary" type="button" ${msConnected ? "" : "disabled"} onclick="replaceLocalWithOneDriveNow()">Cloud vollständig auf dieses Gerät übernehmen</button>
        <button class="secondary" type="button" ${msConnected ? "" : "disabled"} onclick="replaceOneDriveWithLocalNow()">Cloud mit diesem Gerät ersetzen</button>
      </div>
      <p class="privacy-text"><strong>Automatischer sicherer Abgleich:</strong> Änderungen werden sofort lokal gespeichert. Nach etwa 4 Sekunden Ruhe werden zuerst neue Kinder-Eingaben abgerufen, danach OneDrive gelesen, zusammengeführt und erst dann zurückgeschrieben. Die vollständigen Übernahmefunktionen bleiben nur für Wiederherstellung und Gerätewechsel gedacht.</p>
    </section>

    <section class="panel cloud-sync-card">
      <h2>2. Klassen-Sync für Kinder-iPads</h2>
      <p class="privacy-text">Für Lernspiele werden nur Tier-ID, Testdaten und Zeitpunkte übertragen – keine Vornamen. Die Nutzdaten werden im Browser verschlüsselt, bevor sie an den Sync-Dienst gehen.</p>
      <div class="cloud-sync-form-grid">
        <label class="field">Cloudflare-Sync-Adresse
          <input id="classSyncEndpoint" class="text-input" autocomplete="off" spellcheck="false" value="${escapeAttribute(classSync.endpoint || "")}" placeholder="https://lernstand-sync.DEINNAME.workers.dev" onchange="rememberClassSyncForm()">
        </label>
        <label class="field">Klassen-Sync-Code
          <input id="classSyncCode" class="text-input" autocomplete="off" spellcheck="false" value="${escapeAttribute(classSync.syncCode || "")}" placeholder="Sync-Code erzeugen" onchange="rememberClassSyncForm()">
        </label>
      </div>
      <p class="message">Aktueller Code: <strong>${escapeHtml(codeDisplay)}</strong>. Der Code ist der Schlüssel für diese Klasse. Behandle ihn wie ein Passwort.</p>
      <label class="toggle-label"><input id="classSyncEnabled" type="checkbox" ${classSync.enabled ? "checked" : ""} onchange="rememberClassSyncForm()"> Klassen-Sync aktivieren</label>
      <div class="backup-actions">
        <button class="secondary" type="button" onclick="generateClassSyncCode()">Neuen Sync-Code erzeugen</button>
        <button class="primary" type="button" onclick="saveClassSyncSettings()">Klassen-Sync speichern</button>
        <button class="secondary" type="button" onclick="testClassSyncConnection()">Verbindung testen</button>
      </div>
      <div class="cloud-sync-status-grid">
        <div><span>Bereit</span><strong>${classReady ? "ja" : "noch nicht"}</strong></div>
        <div><span>Letztes Kinder-Ergebnis gesendet</span><strong>${classSync.lastPushAt ? escapeHtml(formatDateTime(classSync.lastPushAt)) : "noch keines"}</strong></div>
        <div><span>Zuletzt abgerufen</span><strong>${classSync.lastPullAt ? escapeHtml(formatDateTime(classSync.lastPullAt)) : "noch nie"}</strong></div>
      </div>
      <div class="backup-actions">
        <button class="primary" type="button" ${classReady ? "" : "disabled"} onclick="pullClassSyncSessions()">Kinder-Ergebnisse jetzt abrufen</button>
      </div>
      <p class="message ${syncRuntime.classStatus === "error" ? "error" : syncRuntime.classStatus === "success" ? "success" : ""}">${escapeHtml(syncRuntime.classMessage || classSync.lastError || "Nach dem Einrichten werden neue Nomen-Probe-Ergebnisse automatisch vom Kindergerät gesendet.")}</p>
    </section>

    <section class="panel cloud-sync-card">
      <h2>Was Paket 2 bereits kann</h2>
      <div class="cloud-capability-grid">
        <article><span>☁️</span><strong>OneDrive-Sicherung</strong><small>Gesamtstand in OneDrive/Lernstand-Kompass</small></article>
        <article><span>🔄</span><strong>Geräte-Abgleich</strong><small>Backups zusammenführen statt überschreiben</small></article>
        <article><span>🧒</span><strong>Kinder-Sync</strong><small>Nomen-Tests automatisch einsammeln</small></article>
        <article><span>🔐</span><strong>Verschlüsselt</strong><small>Klassen-Sync-Nutzdaten vor dem Upload verschlüsselt</small></article>
      </div>
    </section>
  `;
}

async function saveMicrosoftSyncSettings() {
  const clientId = String(document.querySelector("#microsoftClientId")?.value || "").trim();
  const redirectUri = String(document.querySelector("#microsoftRedirectUri")?.value || "").trim();
  const autoBackup = document.querySelector("#microsoftAutoBackup")?.checked !== false;
  if (clientId && !isValidClientId(clientId)) {
    syncRuntime.msStatus = "error";
    syncRuntime.msMessage = "Die Client-ID sieht nicht vollständig aus.";
    render();
    return;
  }
  if (redirectUri && !/^https?:\/\//i.test(redirectUri)) {
    syncRuntime.msStatus = "error";
    syncRuntime.msMessage = "Die Redirect-URL muss mit http:// oder https:// beginnen.";
    render();
    return;
  }
  syncRuntime.pca = null;
  syncRuntime.pcaClientId = "";
  syncRuntime.msAccount = null;
  syncRuntime.suppressAuto = true;
  try {
    await persist({
      ...state,
      microsoftSync: {
        ...currentMicrosoftSettings(),
        clientId,
        redirectUri,
        autoBackup,
        autoBackupPolicyVersion: 2
      }
    });
  } finally {
    syncRuntime.suppressAuto = false;
  }
  syncRuntime.msStatus = "success";
  syncRuntime.msMessage = "Microsoft-Einstellungen gespeichert.";
  render();
}

async function connectMicrosoft() {
  try {
    await saveMicrosoftSyncSettings();
    await startMicrosoftLoginRedirect("connect");
  } catch (error) {
    console.error("Microsoft-Anmeldung konnte nicht gestartet werden", error);
    clearMicrosoftRedirectAction();
    syncRuntime.msStatus = "error";
    syncRuntime.msMessage = friendlySyncError(error);
    render();
  }
}

async function disconnectMicrosoft() {
  try {
    const pca = syncRuntime.pca || await getMsalClient();
    const account = syncRuntime.msAccount || pca.getActiveAccount() || pca.getAllAccounts()[0];

    syncRuntime.msAccount = null;
    syncRuntime.suppressAuto = true;
    try {
      await persist({
        ...state,
        microsoftSync: {
          ...currentMicrosoftSettings(),
          connectedAccount: "",
          connectedName: "",
          lastSyncStatus: "Microsoft wurde getrennt"
        }
      });
    } finally {
      syncRuntime.suppressAuto = false;
    }

    if (account) {
      rememberMicrosoftRedirectAction("logout");
      await pca.logoutRedirect({
        account,
        postLogoutRedirectUri: currentMicrosoftSettings().redirectUri || currentRedirectUri()
      });
      return;
    }
  } catch (error) {
    console.warn("Microsoft-Abmeldung nicht vollständig.", error);
  }
  clearMicrosoftRedirectAction();
  syncRuntime.pca = null;
  syncRuntime.pcaClientId = "";
  syncRuntime.msStatus = "idle";
  syncRuntime.msMessage = "Microsoft wurde getrennt.";
  render();
}

async function acquireGraphToken() {
  const pca = await getMsalClient();
  let account = syncRuntime.msAccount || pca.getActiveAccount() || pca.getAllAccounts()[0];

  if (!account) {
    rememberMicrosoftRedirectAction("token");
    syncRuntime.msStatus = "working";
    syncRuntime.msMessage = "Microsoft-Anmeldung erforderlich …";
    await pca.loginRedirect({
      scopes: LK_GRAPH_SCOPES,
      prompt: "select_account",
      redirectUri: currentMicrosoftSettings().redirectUri || currentRedirectUri()
    });
    throw new Error("Microsoft-Anmeldung wird fortgesetzt.");
  }

  try {
    const result = await pca.acquireTokenSilent({ account, scopes: LK_GRAPH_SCOPES });
    return result.accessToken;
  } catch (error) {
    // Kein Popup-Fallback mehr. Wenn Microsoft erneut Interaktion verlangt,
    // wechseln wir im selben Browserfenster zu Microsoft.
    rememberMicrosoftRedirectAction("token");
    syncRuntime.msStatus = "working";
    syncRuntime.msMessage = "Microsoft-Berechtigung wird erneuert …";
    await pca.acquireTokenRedirect({
      account,
      scopes: LK_GRAPH_SCOPES,
      redirectUri: currentMicrosoftSettings().redirectUri || currentRedirectUri()
    });
    throw error;
  }
}

async function graphFetch(path, options = {}) {
  const token = await acquireGraphToken();
  const response = await fetch(`${LK_GRAPH_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });
  if (!response.ok) {
    let details = "";
    try {
      const body = await response.json();
      details = body?.error?.message || "";
    } catch {}
    const error = new Error(details || `Microsoft Graph Fehler ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response;
}

function oneDrivePath(...parts) {
  return parts.map((part) => encodeURIComponent(String(part || ""))).join("/");
}

async function ensureOneDriveFolder() {
  const folderPath = oneDrivePath(LK_ONEDRIVE_FOLDER);
  try {
    const response = await graphFetch(`/me/drive/root:/${folderPath}`);
    return response.json();
  } catch (error) {
    if (error.status !== 404) throw error;
  }

  try {
    const response = await graphFetch("/me/drive/root/children", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        name: LK_ONEDRIVE_FOLDER,
        folder: {},
        "@microsoft.graph.conflictBehavior": "fail"
      })
    });
    return response.json();
  } catch (error) {
    // Falls zwei Geräte den Ordner praktisch gleichzeitig anlegen, ist ein 409 unkritisch.
    if (error.status !== 409) throw error;
    const response = await graphFetch(`/me/drive/root:/${folderPath}`);
    return response.json();
  }
}

async function getOneDriveBackupRecord() {
  await ensureOneDriveFolder();
  const backupPath = oneDrivePath(LK_ONEDRIVE_FOLDER, LK_ONEDRIVE_FILENAME);
  try {
    // Metadaten zuerst lesen, damit wir beim Schreiben mit eTag/If-Match vor
    // parallelem Überschreiben durch ein zweites Lehrkraftgerät geschützt sind.
    const metaResponse = await graphFetch(`/me/drive/root:/${backupPath}`);
    const item = await metaResponse.json();
    const contentResponse = await graphFetch(`/me/drive/items/${encodeURIComponent(item.id)}/content`);
    const raw = await contentResponse.text();
    return {
      backup: JSON.parse(raw),
      eTag: item.eTag || "",
      itemId: item.id || "",
      lastModifiedDateTime: item.lastModifiedDateTime || ""
    };
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

async function getOneDriveBackup() {
  const record = await getOneDriveBackupRecord();
  return record?.backup || null;
}

async function putOneDriveBackup(backup, expectedETag = null) {
  await ensureOneDriveFolder();
  const backupPath = oneDrivePath(LK_ONEDRIVE_FOLDER, LK_ONEDRIVE_FILENAME);
  const headers = { "Content-Type": "application/json; charset=utf-8" };
  // Existiert die Datei bereits, darf nur exakt die zuvor gelesene Version
  // ersetzt werden. Beim allerersten Anlegen verhindert If-None-Match, dass
  // zwei Lehrkraftgeraete gleichzeitig unbemerkt den ersten Stand ueberschreiben.
  if (expectedETag) headers["If-Match"] = expectedETag;
  else headers["If-None-Match"] = "*";
  const response = await graphFetch(`/me/drive/root:/${backupPath}:/content`, {
    method: "PUT",
    headers,
    body: JSON.stringify(backup)
  });
  return response.json();
}

async function putOneDriveNamedBackup(backup, filename) {
  await ensureOneDriveFolder();
  const backupPath = oneDrivePath(LK_ONEDRIVE_FOLDER, filename);
  const response = await graphFetch(`/me/drive/root:/${backupPath}:/content`, {
    method: "PUT",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(backup)
  });
  return response.json();
}

function safeBackupTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function replaceOneDriveWithLocalNow() {
  if (syncRuntime.msStatus === "working") return;
  if (!confirm("Den aktuellen Stand dieses Geräts als neuen gemeinsamen Cloud-Stand verwenden? Der bisherige Cloud-Stand wird vorher als Sicherheitskopie gespeichert.")) return;
  syncRuntime.msStatus = "working";
  syncRuntime.msMessage = "Cloud-Sicherheitskopie wird erstellt …";
  render();
  try {
    const remoteRecord = await getOneDriveBackupRecord();
    if (remoteRecord?.backup) {
      await putOneDriveNamedBackup(remoteRecord.backup, `lernstand-kompass-vor-ersetzung-${safeBackupTimestamp()}.json`);
    }
    const localBackup = makeFullBackup(state);
    // Bei einer bewusst erzwungenen Ersetzung darf ein zwischenzeitlich von einem
    // anderen Gerät geänderter Cloud-Stand nicht still überschrieben werden.
    await putOneDriveBackup(localBackup, remoteRecord?.eTag || null);
    const verifyRecord = await getOneDriveBackupRecord();
    const localJson = JSON.stringify(localBackup.state || {});
    const remoteJson = JSON.stringify(verifyRecord?.backup?.state || {});
    if (localJson !== remoteJson) throw new Error("Die Cloud-Prüfung nach dem Schreiben war nicht identisch. Es wurde nichts weiter automatisch verändert.");
    await updateMicrosoftSyncMetadata(nowIso(), "Cloud wurde kontrolliert mit diesem Gerätestand ersetzt.");
    syncRuntime.msStatus = "success";
    syncRuntime.msMessage = "Cloud entspricht jetzt diesem Gerät. Der vorige Cloud-Stand wurde als Sicherheitskopie erhalten.";
  } catch (error) {
    console.error("Cloud-Ersetzung fehlgeschlagen", error);
    syncRuntime.msStatus = "error";
    syncRuntime.msMessage = friendlySyncError(error);
  }
  render();
}

async function replaceLocalWithOneDriveNow() {
  if (syncRuntime.msStatus === "working") return;
  if (!confirm("Den lokalen Stand dieses Geräts vollständig durch den aktuellen Cloud-Stand ersetzen? Erstelle vorher bei Bedarf ein Gesamtbackup.")) return;
  syncRuntime.msStatus = "working";
  syncRuntime.msMessage = "Cloud-Stand wird vollständig übernommen …";
  render();
  try {
    const remoteRecord = await getOneDriveBackupRecord();
    if (!remoteRecord?.backup) throw new Error("In OneDrive wurde keine Sicherung gefunden.");
    const nextState = stateFromBackup(remoteRecord.backup);
    await persistWithoutMicrosoftAuto(nextState);
    await updateMicrosoftSyncMetadata(nowIso(), "Cloud-Stand vollständig auf dieses Gerät übernommen.");
    syncRuntime.msStatus = "success";
    syncRuntime.msMessage = "Dieses Gerät entspricht jetzt vollständig dem Cloud-Stand.";
  } catch (error) {
    console.error("Vollständige Cloud-Übernahme fehlgeschlagen", error);
    syncRuntime.msStatus = "error";
    syncRuntime.msMessage = friendlySyncError(error);
  }
  render();
}

function mergeLearningGameSessions(baseState, importedBackup) {
  const imported = importedBackup?.type === "full-backup" ? importedBackup.state : importedBackup;
  const incoming = Array.isArray(imported?.learningGameSessions) ? imported.learningGameSessions : [];
  if (!incoming.length) return { state: baseState, added: 0 };
  const list = [...(baseState.learningGameSessions || [])];
  const byId = new Map(list.map((item, index) => [item?.id, index]).filter(([id]) => !!id));
  let changed = 0;
  incoming.forEach((item) => {
    if (!item?.id) return;
    const index = byId.get(item.id);
    if (index === undefined) {
      byId.set(item.id, list.length);
      list.push(item);
      changed += 1;
      return;
    }
    const existing = list[index];
    const existingTime = typeof recordSyncTimestamp === "function" ? recordSyncTimestamp(existing) : Date.parse(existing?.updatedAt || existing?.createdAt || "") || 0;
    const incomingTime = typeof recordSyncTimestamp === "function" ? recordSyncTimestamp(item) : Date.parse(item?.updatedAt || item?.createdAt || "") || 0;
    if (incomingTime > existingTime) {
      list[index] = { ...existing, ...item, id: existing.id || item.id };
      changed += 1;
    }
  });
  return { state: { ...baseState, learningGameSessions: list }, added: changed };
}

function oneDriveMeaningfulDataCount(candidate) {
  const source = candidate?.type === "full-backup" ? candidate.state : candidate;
  if (!source || typeof source !== "object") return 0;
  const keys = [
    "entries", "weeklyPlans", "weeklyPlanStatuses", "assessmentResults",
    "trainingCompletions", "trainingHistory", "workbookAssignments",
    "workbookAssignmentStatuses", "childWorkbookReports", "learningGameSessions"
  ];
  return keys.reduce((sum, key) => sum + (Array.isArray(source[key]) ? source[key].length : 0), 0);
}

function shouldPreferCloudOnThisDevice(localState, remoteBackup) {
  return oneDriveMeaningfulDataCount(localState) === 0 && oneDriveMeaningfulDataCount(remoteBackup) > 0;
}

function oneDriveMergeChangeCount(report = {}, gameAdded = 0) {
  const keys = [
    "addedClasses", "addedAnimals", "addedMaterials", "addedEntries", "addedGoals",
    "addedAssessments", "addedAssessmentTasks", "addedAssessmentResults",
    "addedTrainingTasks", "addedTrainingCompletions", "addedTrainingHistory",
    "addedWorkbookCatalog", "addedWorkbookAssignments", "addedWorkbookAssignmentStatuses",
    "addedChildWorkbookReports", "addedActiveWorkbookMaterials", "addedWeeklyPlans",
    "addedWeeklyPlanStatuses", "addedLearningGameSessions", "updatedRecords"
  ];
  return keys.reduce((sum, key) => sum + Number(report?.[key] || 0), Number(gameAdded || 0));
}

function mergeRemoteBackupIntoState(localState, remoteBackup) {
  if (!remoteBackup) return { state: localState, changed: 0, cloudFirst: false };
  const cloudFirst = shouldPreferCloudOnThisDevice(localState, remoteBackup);
  if (cloudFirst) {
    return {
      state: stateFromBackup(remoteBackup),
      changed: oneDriveMeaningfulDataCount(remoteBackup),
      cloudFirst: true
    };
  }
  const merged = mergeBackupData(localState, remoteBackup);
  // Historische Versionen hatten Lernspielsitzungen teilweise außerhalb der
  // allgemeinen Merge-Auswertung. Der Zusatzmerge ist idempotent und schützt
  // deshalb auch ältere Backups.
  const gameMerge = mergeLearningGameSessions(merged.state, remoteBackup);
  return {
    state: gameMerge.state,
    changed: oneDriveMergeChangeCount(merged.report, gameMerge.added),
    cloudFirst: false
  };
}

async function persistWithoutMicrosoftAuto(nextState) {
  const previous = syncRuntime.suppressAuto;
  syncRuntime.suppressAuto = true;
  try {
    await persist(nextState);
  } finally {
    syncRuntime.suppressAuto = previous;
  }
}

async function commitOneDriveWithConflictRetry(initialRecord = null, maxAttempts = 3) {
  let record = initialRecord;
  let conflictCount = 0;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      // Immer den aktuellsten lokalen Zustand schreiben. Lokale Änderungen, die
      // während eines laufenden Syncs entstanden sind, werden so mitgenommen.
      const result = await putOneDriveBackup(makeFullBackup(state), record?.eTag || null);
      return { result, conflicts: conflictCount };
    } catch (error) {
      if (![409, 412].includes(Number(error?.status)) || attempt >= maxAttempts) throw error;
      conflictCount += 1;
      // Ein anderes Gerät hat zwischen Lesen und Schreiben gespeichert. Den neuen
      // Cloud-Stand erneut lesen, zusammenführen und erst danach erneut schreiben.
      record = await getOneDriveBackupRecord();
      if (record?.backup) {
        const merged = mergeRemoteBackupIntoState(state, record.backup);
        await persistWithoutMicrosoftAuto(merged.state);
      }
    }
  }
  throw new Error("OneDrive-Konflikt konnte nach mehreren Versuchen nicht sicher aufgelöst werden.");
}

async function syncWithOneDriveNow() {
  if (syncRuntime.msStatus === "working") return;
  syncRuntime.msStatus = "working";
  syncRuntime.msMessage = "OneDrive wird sicher abgeglichen …";
  render();
  try {
    if (typeof window.lkPullAllChildChangesForCloud === "function") {
      await window.lkPullAllChildChangesForCloud();
    }
    const remoteRecord = await getOneDriveBackupRecord();
    const merged = mergeRemoteBackupIntoState(state, remoteRecord?.backup || null);
    await persistWithoutMicrosoftAuto(merged.state);

    let conflictCount = 0;
    if (!merged.cloudFirst) {
      const committed = await commitOneDriveWithConflictRetry(remoteRecord);
      conflictCount = committed.conflicts;
    }

    const status = merged.cloudFirst
      ? "Cloud-Stand vollständig auf diesem Gerät übernommen."
      : `${merged.changed ? `${merged.changed} neue oder aktualisierte Einträge zusammengeführt. ` : ""}Cloud und Gerät sind abgeglichen.${conflictCount ? ` ${conflictCount} parallele Cloud-Änderung${conflictCount === 1 ? "" : "en"} wurde sicher nachgeladen.` : ""}`;
    await updateMicrosoftSyncMetadata(nowIso(), status);
    syncRuntime.msStatus = "success";
    syncRuntime.msMessage = status;
  } catch (error) {
    console.error("OneDrive-Abgleich fehlgeschlagen", error);
    syncRuntime.msStatus = "error";
    syncRuntime.msMessage = friendlySyncError(error);
  }
  render();
}

async function uploadOneDriveBackupNow(silent = false) {
  if (syncRuntime.msStatus === "working") return false;
  syncRuntime.msStatus = "working";
  if (!silent) {
    syncRuntime.msMessage = "Cloud und Gerät werden sicher zusammengeführt …";
    render();
  }
  try {
    // Reihenfolge ist verbindlich: Kinder -> lokal -> OneDrive lesen -> mergen -> schreiben.
    if (typeof window.lkPullAllChildChangesForCloud === "function") {
      await window.lkPullAllChildChangesForCloud();
    }
    const remoteRecord = await getOneDriveBackupRecord();
    const merged = mergeRemoteBackupIntoState(state, remoteRecord?.backup || null);
    await persistWithoutMicrosoftAuto(merged.state);

    const committed = await commitOneDriveWithConflictRetry(remoteRecord);
    const status = `${merged.changed ? `${merged.changed} Cloud-/Geräteänderungen zusammengeführt. ` : ""}Sicher in OneDrive gespeichert.${committed.conflicts ? ` ${committed.conflicts} parallele Änderung${committed.conflicts === 1 ? "" : "en"} wurde vor dem Schreiben erneut zusammengeführt.` : ""}`;
    await updateMicrosoftSyncMetadata(nowIso(), status);
    syncRuntime.msStatus = "success";
    syncRuntime.msMessage = status;
    if (!silent) render();
    return true;
  } catch (error) {
    console.error("OneDrive-Sicherung fehlgeschlagen", error);
    syncRuntime.msStatus = "error";
    syncRuntime.msMessage = friendlySyncError(error);
    if (!silent) render();
    return false;
  }
}

async function mergeOneDriveBackupNow() {
  syncRuntime.msStatus = "working";
  syncRuntime.msMessage = "Cloud-Daten werden geladen …";
  render();
  try {
    const remoteRecord = await getOneDriveBackupRecord();
    if (!remoteRecord?.backup) {
      syncRuntime.msStatus = "success";
      syncRuntime.msMessage = "In OneDrive gibt es noch keine Sicherung.";
      render();
      return;
    }
    const merged = mergeRemoteBackupIntoState(state, remoteRecord.backup);
    await persistWithoutMicrosoftAuto(merged.state);
    const status = merged.cloudFirst
      ? "Cloud-Stand vollständig auf diesem Gerät übernommen."
      : `${merged.changed} neue oder aktualisierte Einträge aus OneDrive übernommen.`;
    await updateMicrosoftSyncMetadata(nowIso(), status);
    syncRuntime.msStatus = "success";
    syncRuntime.msMessage = status;
  } catch (error) {
    console.error("OneDrive-Import fehlgeschlagen", error);
    syncRuntime.msStatus = "error";
    syncRuntime.msMessage = friendlySyncError(error);
  }
  render();
}

async function updateMicrosoftSyncMetadata(at, status) {
  const nextState = {
    ...state,
    microsoftSync: {
      ...currentMicrosoftSettings(),
      lastSyncAt: at || nowIso(),
      lastSyncStatus: status || ""
    }
  };
  await persistWithoutMicrosoftAuto(nextState);
}

function scheduleMicrosoftAutoBackup() {
  if (syncRuntime.suppressAuto) return;
  const ms = currentMicrosoftSettings();
  if (ms.autoBackup === false) return;
  if (!syncRuntime.msAccount || !navigator.onLine) return;
  clearTimeout(syncRuntime.autoTimer);
  syncRuntime.autoTimer = setTimeout(async () => {
    if (syncRuntime.suppressAuto || syncRuntime.msStatus === "working") {
      scheduleMicrosoftAutoBackup();
      return;
    }
    try {
      await uploadOneDriveBackupNow(true);
    } catch (error) {
      console.warn("Automatischer OneDrive-Abgleich konnte noch nicht abgeschlossen werden.", error);
    }
  }, 4000);
}

function friendlySyncError(error) {
  const message = String(error?.message || error || "Unbekannter Fehler");
  if (/popup_window_error|popup/i.test(message)) return "Das Microsoft-Anmeldefenster wurde blockiert oder geschlossen.";
  if (/consent|permission|privilege|403/i.test(message)) return "Microsoft hat den Zugriff nicht erlaubt. Prüfe in der Appregistrierung die delegierte Berechtigung Files.ReadWrite und melde dich anschließend neu an.";
  if (/network|fetch|internet|Failed to fetch/i.test(message)) return "Keine Verbindung. Prüfe Internet, Cloudflare-Adresse oder Microsoft-Anmeldung.";
  if (/client-id|client id|AADSTS700016/i.test(message)) return "Die Microsoft-Client-ID oder Appregistrierung stimmt noch nicht.";
  if ([409, 412].includes(Number(error?.status))) return "OneDrive wurde parallel auf einem anderen Gerät geändert. Der Stand wurde nicht blind überschrieben; bitte den Abgleich erneut starten.";
  return message.length > 160 ? `${message.slice(0, 157)}…` : message;
}

/* ---------- Verschlüsselter Klassen-Sync ---------- */

function randomSyncCode() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return `LK-${base64UrlEncode(bytes)}`;
}

async function rememberClassSyncForm() {
  const endpoint = normalizeEndpoint(document.querySelector("#classSyncEndpoint")?.value || currentClassSyncSettings().endpoint || "");
  const syncCode = String(document.querySelector("#classSyncCode")?.value || currentClassSyncSettings().syncCode || "").trim();
  const requestedEnabled = !!document.querySelector("#classSyncEnabled")?.checked;
  const ready = /^https:\/\//i.test(endpoint) && syncCode.length >= 20;
  const enabled = requestedEnabled && ready;

  syncRuntime.suppressAuto = true;
  try {
    await persist({
      ...state,
      classSync: {
        ...currentClassSyncSettings(),
        endpoint,
        syncCode,
        enabled,
        lastError: ""
      }
    });
  } finally {
    syncRuntime.suppressAuto = false;
  }

  if (requestedEnabled && !ready) {
    const checkbox = document.querySelector("#classSyncEnabled");
    if (checkbox) checkbox.checked = false;
    syncRuntime.classStatus = "error";
    syncRuntime.classMessage = "Für die Aktivierung brauchst du zuerst die vollständige https://-Adresse und einen Sync-Code.";
    return false;
  }
  return true;
}

async function generateClassSyncCode() {
  const input = document.querySelector("#classSyncCode");
  if (!input) return;
  input.value = randomSyncCode();
  syncRuntime.classStatus = "idle";
  syncRuntime.classMessage = "Neuer Code erzeugt und gespeichert.";
  await rememberClassSyncForm();
  const classSync = currentClassSyncSettings();
  const codeLine = document.querySelector(".cloud-sync-card:nth-of-type(3) .message");
  if (codeLine && classSync.syncCode) {
    codeLine.innerHTML = `Aktueller Code: <strong>${escapeHtml(`${classSync.syncCode.slice(0, 5)}••••••••${classSync.syncCode.slice(-4)}`)}</strong>. Der Code ist der Schlüssel für diese Klasse. Behandle ihn wie ein Passwort.`;
  }
}

async function saveClassSyncSettings() {
  const ok = await rememberClassSyncForm();
  const settings = currentClassSyncSettings();
  syncRuntime.classStatus = ok ? "success" : "error";
  syncRuntime.classMessage = ok
    ? (settings.enabled ? "Klassen-Sync ist gespeichert und aktiv." : "Klassen-Sync-Einstellungen gespeichert.")
    : syncRuntime.classMessage;
  render();
  if (settings.enabled) syncPendingLearningGameSessions().catch(() => {});
}

async function testClassSyncConnection() {
  // Zuerst alle aktuell sichtbaren Formularwerte sichern. Dadurch gehen Adresse,
  // Code und Aktivierungs-Haken beim anschließenden Rendern nicht mehr verloren.
  const ok = await rememberClassSyncForm();
  const settings = currentClassSyncSettings();
  const endpoint = normalizeEndpoint(settings.endpoint);
  if (!ok || !endpoint) {
    syncRuntime.classStatus = "error";
    syncRuntime.classMessage = syncRuntime.classMessage || "Bitte zuerst die Cloudflare-Sync-Adresse eintragen.";
    render();
    return;
  }
  syncRuntime.classStatus = "working";
  syncRuntime.classMessage = "Verbindung wird geprüft …";
  render();
  try {
    const response = await fetch(`${endpoint}/health`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Cloudflare antwortet mit ${response.status}.`);
    syncRuntime.classStatus = "success";
    syncRuntime.classMessage = settings.enabled
      ? "Cloudflare-Sync ist erreichbar und aktiv."
      : "Cloudflare-Sync ist erreichbar. Zum Senden noch aktivieren.";
  } catch (error) {
    syncRuntime.classStatus = "error";
    syncRuntime.classMessage = friendlySyncError(error);
  }
  render();
}

async function classSyncToken(syncCode) {
  const bytes = new TextEncoder().encode(String(syncCode || ""));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return base64UrlEncode(new Uint8Array(digest));
}

async function classSyncCryptoKey(syncCode) {
  const raw = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(syncCode || "")));
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function encryptClassPayload(value, syncCode) {
  const key = await classSyncCryptoKey(syncCode);
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const plain = new TextEncoder().encode(JSON.stringify(value));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain);
  return {
    v: 1,
    iv: base64UrlEncode(iv),
    data: base64UrlEncode(new Uint8Array(cipher))
  };
}

async function decryptClassPayload(value, syncCode) {
  if (!value || value.v !== 1 || !value.iv || !value.data) throw new Error("Unbekanntes Sync-Datenformat.");
  const key = await classSyncCryptoKey(syncCode);
  const iv = base64UrlDecode(value.iv);
  const cipher = base64UrlDecode(value.data);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
  return JSON.parse(new TextDecoder().decode(plain));
}

function base64UrlEncode(bytes) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value) {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function pushLearningGameSessionToClassSync(session) {
  const settings = currentClassSyncSettings();
  if (!settings.enabled || !settings.endpoint || !settings.syncCode || !navigator.onLine) return false;
  if (!session?.id || !session?.gameId) return false;
  const token = await classSyncToken(settings.syncCode);
  const encrypted = await encryptClassPayload(session, settings.syncCode);
  const response = await fetch(`${normalizeEndpoint(settings.endpoint)}/v1/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ id: session.id, payload: encrypted, createdAt: session.finishedAt || nowIso() })
  });
  if (!response.ok) throw new Error(`Klassen-Sync antwortet mit ${response.status}.`);
  return true;
}

async function markLearningGameSessionSynced(sessionId) {
  const sessions = (state.learningGameSessions || []).map((item) => item.id === sessionId ? { ...item, classSyncSyncedAt: nowIso() } : item);
  state = await storage.save({
    ...state,
    learningGameSessions: sessions,
    classSync: {
      ...currentClassSyncSettings(),
      lastPushAt: nowIso(),
      lastError: ""
    }
  });
}

async function syncLearningGameSessionAfterSave(session) {
  const settings = currentClassSyncSettings();
  if (!settings.enabled) return { attempted: false, success: false };
  try {
    const success = await pushLearningGameSessionToClassSync(session);
    if (success) {
      await markLearningGameSessionSynced(session.id);
      syncRuntime.classStatus = "success";
      syncRuntime.classMessage = "Ergebnis wurde an die Lehrkraft gesendet.";
      return { attempted: true, success: true };
    }
    return { attempted: false, success: false };
  } catch (error) {
    console.warn("Klassen-Sync: Ergebnis bleibt lokal gespeichert.", error);
    state = await storage.save({
      ...state,
      classSync: {
        ...currentClassSyncSettings(),
        lastError: "Ergebnis ist lokal gespeichert und wird später erneut gesendet."
      }
    });
    syncRuntime.classStatus = "error";
    syncRuntime.classMessage = "Ergebnis ist lokal gespeichert. Der Versand wird später erneut versucht.";
    return { attempted: true, success: false };
  }
}

async function syncPendingLearningGameSessions() {
  const settings = currentClassSyncSettings();
  if (!settings.enabled || !settings.endpoint || !settings.syncCode || !navigator.onLine) return 0;
  const pending = (state.learningGameSessions || [])
    .filter((item) => item?.id && item?.gameId && !item.classSyncSyncedAt)
    .slice(-30);
  let count = 0;
  for (const session of pending) {
    try {
      const ok = await pushLearningGameSessionToClassSync(session);
      if (ok) {
        await markLearningGameSessionSynced(session.id);
        count += 1;
      }
    } catch (error) {
      console.warn("Ein ausstehendes Lernergebnis konnte noch nicht gesendet werden.", error);
      break;
    }
  }
  return count;
}

async function pullClassSyncSessions() {
  const settings = currentClassSyncSettings();
  if (!settings.enabled || !settings.endpoint || !settings.syncCode) {
    syncRuntime.classStatus = "error";
    syncRuntime.classMessage = "Klassen-Sync ist noch nicht vollständig eingerichtet.";
    render();
    return;
  }
  syncRuntime.classStatus = "working";
  syncRuntime.classMessage = "Kinder-Ergebnisse werden abgerufen …";
  render();
  try {
    const token = await classSyncToken(settings.syncCode);
    const response = await fetch(`${normalizeEndpoint(settings.endpoint)}/v1/sessions`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });
    if (!response.ok) throw new Error(`Klassen-Sync antwortet mit ${response.status}.`);
    const body = await response.json();
    const encryptedItems = Array.isArray(body.items) ? body.items : [];
    const sessions = [];
    for (const item of encryptedItems) {
      try {
        const session = await decryptClassPayload(item.payload, settings.syncCode);
        if (session?.id && session?.gameId && session?.classId === state.activeClassId) sessions.push(session);
      } catch (error) {
        console.warn("Ein Sync-Datensatz konnte nicht entschlüsselt werden.", error);
      }
    }
    const existingIds = new Set((state.learningGameSessions || []).map((item) => item.id));
    const fresh = sessions.filter((item) => !existingIds.has(item.id));
    syncRuntime.suppressAuto = true;
    try {
      await persist({
        ...state,
        learningGameSessions: [...(state.learningGameSessions || []), ...fresh],
        classSync: {
          ...currentClassSyncSettings(),
          lastPullAt: nowIso(),
          lastError: ""
        }
      });
    } finally {
      syncRuntime.suppressAuto = false;
    }
    syncRuntime.classStatus = "success";
    syncRuntime.classMessage = fresh.length ? `${fresh.length} neue Kinder-Ergebnisse übernommen.` : "Keine neuen Kinder-Ergebnisse.";
  } catch (error) {
    console.error("Klassen-Sync Abruf fehlgeschlagen", error);
    syncRuntime.classStatus = "error";
    syncRuntime.classMessage = friendlySyncError(error);
  }
  render();
}
