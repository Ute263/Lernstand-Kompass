/* Paket 2: Microsoft/OneDrive-Sicherung + Klassen-Sync-Grundlage
 * - Microsoft-Anmeldung über MSAL (Authorization Code Flow + PKCE)
 * - OneDrive-Appordner via Microsoft Graph (Files.ReadWrite.AppFolder)
 * - verschlüsselter Klassen-Sync für Lernspiel-Sitzungen über einen optionalen Cloudflare-Worker
 *
 * WICHTIG: In einer Browser-App wird KEIN Client-Secret verwendet.
 */

const LK_MSAL_CDN = "https://alcdn.msauth.net/browser/2.35.0/js/msal-browser.min.js";
const LK_GRAPH_BASE = "https://graph.microsoft.com/v1.0";
const LK_ONEDRIVE_FILENAME = "lernstand-kompass-sync.json";
const LK_GRAPH_SCOPES = ["openid", "profile", "Files.ReadWrite.AppFolder"];

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
    autoBackup: false,
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
      await getMsalClient();
      if (syncRuntime.msAccount) syncRuntime.msStatus = "connected";
    }
  } catch (error) {
    console.warn("Microsoft-Sync konnte beim Start nicht initialisiert werden.", error);
  }
  window.addEventListener("online", () => {
    syncPendingLearningGameSessions().catch(() => {});
    scheduleMicrosoftAutoBackup();
  });
  setTimeout(() => syncPendingLearningGameSessions().catch(() => {}), 1200);
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
      <p class="privacy-text">Der Lernstand-Kompass nutzt nur seinen eigenen OneDrive-Appordner. Es wird kein Client-Secret in der App gespeichert.</p>
      <div class="cloud-sync-form-grid">
        <label class="field">Microsoft Client-ID
          <input id="microsoftClientId" class="text-input" autocomplete="off" spellcheck="false" value="${escapeAttribute(ms.clientId || "")}" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx">
        </label>
        <label class="field">Redirect-URL (SPA)
          <input id="microsoftRedirectUri" class="text-input" autocomplete="off" spellcheck="false" value="${escapeAttribute(ms.redirectUri || detectedRedirect)}" placeholder="https://.../">
        </label>
      </div>
      <p class="message"><strong>Diese Redirect-URL muss in der Microsoft-Appregistrierung als „Single-page application (SPA)“ eingetragen sein.</strong><br>${detectedRedirect ? `Aktuell erkannt: <code>${escapeHtml(detectedRedirect)}</code>` : "Lokaler Datei-Modus erkannt – bitte die Web-Version öffnen."}</p>
      <label class="toggle-label cloud-auto-toggle"><input id="microsoftAutoBackup" type="checkbox" ${ms.autoBackup ? "checked" : ""}> nach Änderungen automatisch in OneDrive sichern</label>
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
        <button class="primary" type="button" ${msConnected ? "" : "disabled"} onclick="syncWithOneDriveNow()">Jetzt abgleichen</button>
        <button class="secondary" type="button" ${msConnected ? "" : "disabled"} onclick="uploadOneDriveBackupNow()">Nur sichern</button>
        <button class="secondary" type="button" ${msConnected ? "" : "disabled"} onclick="mergeOneDriveBackupNow()">Nur Cloud-Daten holen</button>
      </div>
      <p class="privacy-text">„Jetzt abgleichen“ holt zuerst das vorhandene OneDrive-Backup, führt neue Einträge zusammen und speichert anschließend den gemeinsamen Stand wieder in OneDrive.</p>
    </section>

    <section class="panel cloud-sync-card">
      <h2>2. Klassen-Sync für Kinder-iPads</h2>
      <p class="privacy-text">Für Lernspiele werden nur Tier-ID, Testdaten und Zeitpunkte übertragen – keine Vornamen. Die Nutzdaten werden im Browser verschlüsselt, bevor sie an den Sync-Dienst gehen.</p>
      <div class="cloud-sync-form-grid">
        <label class="field">Cloudflare-Sync-Adresse
          <input id="classSyncEndpoint" class="text-input" autocomplete="off" spellcheck="false" value="${escapeAttribute(classSync.endpoint || "")}" placeholder="https://lernstand-sync.DEINNAME.workers.dev">
        </label>
        <label class="field">Klassen-Sync-Code
          <input id="classSyncCode" class="text-input" autocomplete="off" spellcheck="false" value="${escapeAttribute(classSync.syncCode || "")}" placeholder="Sync-Code erzeugen">
        </label>
      </div>
      <p class="message">Aktueller Code: <strong>${escapeHtml(codeDisplay)}</strong>. Der Code ist der Schlüssel für diese Klasse. Behandle ihn wie ein Passwort.</p>
      <label class="toggle-label"><input id="classSyncEnabled" type="checkbox" ${classSync.enabled ? "checked" : ""}> Klassen-Sync aktivieren</label>
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
        <article><span>☁️</span><strong>OneDrive-Sicherung</strong><small>Gesamtstand in deinem privaten Appordner</small></article>
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
  const autoBackup = !!document.querySelector("#microsoftAutoBackup")?.checked;
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
        autoBackup
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
    const pca = await getMsalClient(true);
    syncRuntime.msStatus = "working";
    syncRuntime.msMessage = "Microsoft-Anmeldung wird geöffnet …";
    render();
    const result = await pca.loginPopup({
      scopes: LK_GRAPH_SCOPES,
      prompt: "select_account"
    });
    syncRuntime.msAccount = result.account;
    pca.setActiveAccount(result.account);
    syncRuntime.suppressAuto = true;
    try {
      await persist({
        ...state,
        microsoftSync: {
          ...currentMicrosoftSettings(),
          connectedAccount: result.account?.username || "",
          connectedName: result.account?.name || ""
        }
      });
    } finally {
      syncRuntime.suppressAuto = false;
    }
    syncRuntime.msStatus = "connected";
    syncRuntime.msMessage = "Microsoft ist verbunden. OneDrive ist bereit.";
    render();
  } catch (error) {
    console.error("Microsoft-Anmeldung fehlgeschlagen", error);
    syncRuntime.msStatus = "error";
    syncRuntime.msMessage = friendlySyncError(error);
    render();
  }
}

async function disconnectMicrosoft() {
  try {
    const pca = syncRuntime.pca || await getMsalClient();
    const account = syncRuntime.msAccount || pca.getActiveAccount() || pca.getAllAccounts()[0];
    if (account) await pca.logoutPopup({ account, postLogoutRedirectUri: currentMicrosoftSettings().redirectUri || currentRedirectUri() });
  } catch (error) {
    console.warn("Microsoft-Abmeldung nicht vollständig.", error);
  }
  syncRuntime.msAccount = null;
  syncRuntime.pca = null;
  syncRuntime.pcaClientId = "";
  syncRuntime.suppressAuto = true;
  try {
    await persist({
      ...state,
      microsoftSync: {
        ...currentMicrosoftSettings(),
        connectedAccount: "",
        connectedName: ""
      }
    });
  } finally {
    syncRuntime.suppressAuto = false;
  }
  syncRuntime.msStatus = "idle";
  syncRuntime.msMessage = "Microsoft wurde getrennt.";
  render();
}

async function acquireGraphToken() {
  const pca = await getMsalClient();
  let account = syncRuntime.msAccount || pca.getActiveAccount() || pca.getAllAccounts()[0];
  if (!account) {
    const login = await pca.loginPopup({ scopes: LK_GRAPH_SCOPES, prompt: "select_account" });
    account = login.account;
    syncRuntime.msAccount = account;
    pca.setActiveAccount(account);
  }
  try {
    const result = await pca.acquireTokenSilent({ account, scopes: LK_GRAPH_SCOPES });
    return result.accessToken;
  } catch (error) {
    const result = await pca.acquireTokenPopup({ account, scopes: LK_GRAPH_SCOPES });
    return result.accessToken;
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

async function getOneDriveAppRoot() {
  const response = await graphFetch("/me/drive/special/approot");
  return response.json();
}

async function getOneDriveBackup() {
  const root = await getOneDriveAppRoot();
  let metaResponse;
  try {
    metaResponse = await graphFetch(`/me/drive/items/${encodeURIComponent(root.id)}:/${encodeURIComponent(LK_ONEDRIVE_FILENAME)}`);
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
  const meta = await metaResponse.json();
  const contentResponse = await graphFetch(`/me/drive/items/${encodeURIComponent(meta.id)}/content`);
  const text = await contentResponse.text();
  return JSON.parse(text);
}

async function putOneDriveBackup(backup) {
  const root = await getOneDriveAppRoot();
  const response = await graphFetch(`/me/drive/items/${encodeURIComponent(root.id)}:/${encodeURIComponent(LK_ONEDRIVE_FILENAME)}:/content`, {
    method: "PUT",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(backup)
  });
  return response.json();
}

function mergeLearningGameSessions(baseState, importedBackup) {
  const imported = importedBackup?.type === "full-backup" ? importedBackup.state : importedBackup;
  const incoming = Array.isArray(imported?.learningGameSessions) ? imported.learningGameSessions : [];
  if (!incoming.length) return { state: baseState, added: 0 };
  const existingIds = new Set((baseState.learningGameSessions || []).map((item) => item.id));
  const added = incoming.filter((item) => item?.id && !existingIds.has(item.id));
  return {
    state: { ...baseState, learningGameSessions: [...(baseState.learningGameSessions || []), ...added] },
    added: added.length
  };
}

async function syncWithOneDriveNow() {
  if (syncRuntime.msStatus === "working") return;
  syncRuntime.msStatus = "working";
  syncRuntime.msMessage = "OneDrive wird abgeglichen …";
  render();
  try {
    let nextState = state;
    let added = 0;
    const remote = await getOneDriveBackup();
    if (remote) {
      const merged = mergeBackupData(nextState, remote);
      nextState = merged.state;
      const gameMerge = mergeLearningGameSessions(nextState, remote);
      nextState = gameMerge.state;
      added += Number(merged.report?.addedEntries || 0)
        + Number(merged.report?.addedTrainingCompletions || 0)
        + Number(merged.report?.addedAssessmentResults || 0)
        + Number(merged.report?.addedWeeklyPlans || 0)
        + gameMerge.added;
    }
    syncRuntime.suppressAuto = true;
    try {
      await persist(nextState);
    } finally {
      syncRuntime.suppressAuto = false;
    }
    await putOneDriveBackup(makeFullBackup(state));
    await updateMicrosoftSyncMetadata(nowIso(), added ? `${added} neue Einträge übernommen; Cloud aktualisiert.` : "Cloud und Gerät sind abgeglichen.");
    syncRuntime.msStatus = "success";
    syncRuntime.msMessage = added ? `${added} neue Einträge aus OneDrive übernommen.` : "OneDrive-Abgleich abgeschlossen.";
  } catch (error) {
    console.error("OneDrive-Abgleich fehlgeschlagen", error);
    syncRuntime.msStatus = "error";
    syncRuntime.msMessage = friendlySyncError(error);
  }
  render();
}

async function uploadOneDriveBackupNow(silent = false) {
  if (!silent) {
    syncRuntime.msStatus = "working";
    syncRuntime.msMessage = "Sicherung wird in OneDrive gespeichert …";
    render();
  }
  try {
    await putOneDriveBackup(makeFullBackup(state));
    await updateMicrosoftSyncMetadata(nowIso(), "OneDrive-Sicherung aktuell.");
    syncRuntime.msStatus = "success";
    syncRuntime.msMessage = "OneDrive-Sicherung gespeichert.";
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
    const remote = await getOneDriveBackup();
    if (!remote) {
      syncRuntime.msStatus = "success";
      syncRuntime.msMessage = "In OneDrive gibt es noch keine Sicherung.";
      render();
      return;
    }
    const merged = mergeBackupData(state, remote);
    let next = merged.state;
    const gameMerge = mergeLearningGameSessions(next, remote);
    next = gameMerge.state;
    syncRuntime.suppressAuto = true;
    try {
      await persist(next);
    } finally {
      syncRuntime.suppressAuto = false;
    }
    const count = Number(merged.report?.addedEntries || 0)
      + Number(merged.report?.addedTrainingCompletions || 0)
      + Number(merged.report?.addedAssessmentResults || 0)
      + gameMerge.added;
    await updateMicrosoftSyncMetadata(nowIso(), `${count} neue Einträge aus OneDrive übernommen.`);
    syncRuntime.msStatus = "success";
    syncRuntime.msMessage = `${count} neue Einträge übernommen.`;
  } catch (error) {
    console.error("OneDrive-Import fehlgeschlagen", error);
    syncRuntime.msStatus = "error";
    syncRuntime.msMessage = friendlySyncError(error);
  }
  render();
}

async function updateMicrosoftSyncMetadata(at, status) {
  syncRuntime.suppressAuto = true;
  try {
    state = await storage.save({
      ...state,
      microsoftSync: {
        ...currentMicrosoftSettings(),
        lastSyncAt: at || nowIso(),
        lastSyncStatus: status || ""
      }
    });
  } finally {
    syncRuntime.suppressAuto = false;
  }
}

function scheduleMicrosoftAutoBackup() {
  if (syncRuntime.suppressAuto) return;
  const settings = currentMicrosoftSettings();
  if (!settings.autoBackup || !settings.clientId || !navigator.onLine) return;
  if (!syncRuntime.msAccount) return;
  clearTimeout(syncRuntime.autoTimer);
  syncRuntime.autoTimer = setTimeout(async () => {
    const fingerprint = `${state.lastSavedAt || ""}|${(state.entries || []).length}|${(state.learningGameSessions || []).length}|${(state.trainingCompletions || []).length}|${(state.assessmentResults || []).length}`;
    if (fingerprint === syncRuntime.lastAutoFingerprint) return;
    syncRuntime.lastAutoFingerprint = fingerprint;
    await uploadOneDriveBackupNow(true);
  }, 4500);
}

function friendlySyncError(error) {
  const message = String(error?.message || error || "Unbekannter Fehler");
  if (/popup_window_error|popup/i.test(message)) return "Das Microsoft-Anmeldefenster wurde blockiert oder geschlossen.";
  if (/consent|permission|privilege|403/i.test(message)) return "Microsoft hat den Zugriff nicht erlaubt. Prüfe in der Appregistrierung die Berechtigung Files.ReadWrite.AppFolder.";
  if (/network|fetch|internet|Failed to fetch/i.test(message)) return "Keine Verbindung. Prüfe Internet, Cloudflare-Adresse oder Microsoft-Anmeldung.";
  if (/client-id|client id|AADSTS700016/i.test(message)) return "Die Microsoft-Client-ID oder Appregistrierung stimmt noch nicht.";
  return message.length > 160 ? `${message.slice(0, 157)}…` : message;
}

/* ---------- Verschlüsselter Klassen-Sync ---------- */

function randomSyncCode() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return `LK-${base64UrlEncode(bytes)}`;
}

function generateClassSyncCode() {
  const input = document.querySelector("#classSyncCode");
  if (input) input.value = randomSyncCode();
  syncRuntime.classStatus = "idle";
  syncRuntime.classMessage = "Neuer Code erzeugt. Bitte noch „Klassen-Sync speichern“ drücken.";
  const message = document.querySelector(".cloud-sync-card .message");
  if (message) render();
}

async function saveClassSyncSettings() {
  const endpoint = normalizeEndpoint(document.querySelector("#classSyncEndpoint")?.value || "");
  const syncCode = String(document.querySelector("#classSyncCode")?.value || "").trim();
  const enabled = !!document.querySelector("#classSyncEnabled")?.checked;
  if (enabled && (!/^https:\/\//i.test(endpoint) || syncCode.length < 20)) {
    syncRuntime.classStatus = "error";
    syncRuntime.classMessage = "Für den Klassen-Sync brauchst du eine https://-Cloudflare-Adresse und einen ausreichend langen Sync-Code.";
    render();
    return;
  }
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
  syncRuntime.classStatus = "success";
  syncRuntime.classMessage = enabled ? "Klassen-Sync gespeichert." : "Klassen-Sync ist ausgeschaltet.";
  render();
  if (enabled) syncPendingLearningGameSessions().catch(() => {});
}

async function testClassSyncConnection() {
  const endpoint = normalizeEndpoint(document.querySelector("#classSyncEndpoint")?.value || currentClassSyncSettings().endpoint);
  if (!endpoint) {
    syncRuntime.classStatus = "error";
    syncRuntime.classMessage = "Bitte zuerst die Cloudflare-Sync-Adresse eintragen.";
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
    syncRuntime.classMessage = "Cloudflare-Sync ist erreichbar.";
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
