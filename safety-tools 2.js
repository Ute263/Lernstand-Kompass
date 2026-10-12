/* Paket 7: Sicherheit, Systemcheck und sichere Datenpflege.
 *
 * Wichtig:
 * - Fachliche Ergebnisse werden NICHT automatisch gelöscht.
 * - Aufgeräumt werden nur technische Aktivitätsmeldungen der Lernspiele.
 * - Hängengebliebene "läuft"-Meldungen werden nach 12 Stunden als automatisch
 *   beendet/abgebrochen markiert.
 * - Alte reine Aktivitätsmeldungen werden nach 60 Tagen entfernt.
 * - Zusätzlich werden pro Tier und Spiel höchstens 40 Aktivitätsmeldungen behalten.
 */
(() => {
  if (typeof renderBackup !== "function" || typeof persist !== "function") {
    console.warn("Paket 7 konnte nicht initialisiert werden.");
    return;
  }

  const ACTIVITY_GAME_IDS = new Set(["nomen-probe-activity", "learning-game-activity"]);
  const STALE_RUNNING_MS = 12 * 60 * 60 * 1000;
  const ACTIVITY_RETENTION_MS = 60 * 24 * 60 * 60 * 1000;
  const MAX_ACTIVITY_PER_ANIMAL_GAME = 40;
  const DAILY_CLEANUP_KEY = "lk-safety-last-cleanup-day";
  const SYSTEM_PROBE_KEY = "lk-safety-storage-probe";
  const GAME_IDS = [
    "nomen-probe",
    "verb-probe",
    "adjektiv-probe",
    "wortarten-mix",
    "einmaleins-grundreihen",
    "kopfrechnen-10-min"
  ];

  const baseRenderBackup = renderBackup;
  const baseRenderStorageStatus =
    typeof renderStorageStatus === "function" ? renderStorageStatus : null;

  let safetyReport = null;
  let safetyMessage = "";

  function safeTime(value) {
    const ms = Date.parse(value || "");
    return Number.isFinite(ms) ? ms : 0;
  }

  function safetyFormatDate(value) {
    if (!value) return "noch nie";
    if (typeof formatDateTime === "function") {
      try { return formatDateTime(value); } catch {}
    }
    try {
      return new Intl.DateTimeFormat("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date(value));
    } catch {
      return String(value);
    }
  }

  function isActivity(item) {
    return ACTIVITY_GAME_IDS.has(item?.gameId);
  }

  function activityGameKey(item) {
    return item?.activityGameId || (
      item?.gameId === "nomen-probe-activity" ? "nomen-probe" : "learning-game"
    );
  }

  function activityTimestamp(item) {
    return (
      item?.updatedAt ||
      item?.lastActivityAt ||
      item?.completedAt ||
      item?.abortedAt ||
      item?.startedAt ||
      ""
    );
  }

  function cleanupCandidate(candidate, nowMs = Date.now()) {
    const sessions = Array.isArray(candidate?.learningGameSessions)
      ? candidate.learningGameSessions
      : [];

    let autoClosed = 0;
    let removed = 0;
    const preservedResults = sessions.filter((item) => !isActivity(item)).length;

    const updatedActivities = sessions
      .filter(isActivity)
      .map((item) => {
        if (item.status !== "in_progress") return { ...item };

        const lastMs = safeTime(
          item.lastActivityAt || item.updatedAt || item.startedAt
        );
        if (!lastMs || nowMs - lastMs <= STALE_RUNNING_MS) return { ...item };

        autoClosed += 1;
        return {
          ...item,
          status: "aborted",
          abortedAt: item.abortedAt || item.lastActivityAt || item.updatedAt || item.startedAt,
          autoClosed: true,
          autoClosedAt: new Date(nowMs).toISOString(),
          updatedAt: new Date(nowMs).toISOString()
        };
      });

    // Erst alte technische Aktivitätsmeldungen entfernen.
    const recentActivities = updatedActivities.filter((item) => {
      const timestamp = safeTime(activityTimestamp(item));
      const old = timestamp && nowMs - timestamp > ACTIVITY_RETENTION_MS;
      if (old && item.status !== "in_progress") {
        removed += 1;
        return false;
      }
      return true;
    });

    // Danach pro Tier + Lernspiel maximal 40 technische Meldungen behalten.
    const grouped = new Map();
    recentActivities.forEach((item) => {
      const key = `${item.animalId || "?"}|${activityGameKey(item)}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(item);
    });

    const keptActivityIds = new Set();
    grouped.forEach((items) => {
      items
        .sort((a, b) => safeTime(activityTimestamp(b)) - safeTime(activityTimestamp(a)))
        .forEach((item, index) => {
          if (index < MAX_ACTIVITY_PER_ANIMAL_GAME || item.status === "in_progress") {
            keptActivityIds.add(item.id);
          } else {
            removed += 1;
          }
        });
    });

    const keptActivities = recentActivities.filter((item) => keptActivityIds.has(item.id));
    const results = sessions.filter((item) => !isActivity(item));

    return {
      state: {
        ...candidate,
        learningGameSessions: [...results, ...keptActivities]
      },
      stats: {
        autoClosed,
        removed,
        preservedResults,
        beforeActivities: sessions.filter(isActivity).length,
        afterActivities: keptActivities.length
      }
    };
  }

  function gameReleaseSummary() {
    const stored = state?.childViewSettings?.learningGames || {};
    const released = GAME_IDS.filter((id) => (
      !Object.prototype.hasOwnProperty.call(stored, id) || stored[id] !== false
    ));
    return {
      released: released.length,
      total: GAME_IDS.length
    };
  }

  function qrSummary() {
    const animals = (state.animals || []).filter((animal) => (
      animal.classId === state.activeClassId && animal.aktiv !== false
    ));
    const valid = animals.filter((animal) => /^ak-[A-Z2-9]{8}$/i.test(String(animal.qrToken || "")));
    return {
      valid: valid.length,
      total: animals.length
    };
  }

  function classSyncSummary() {
    const settings = typeof currentClassSyncSettings === "function"
      ? currentClassSyncSettings()
      : (state.classSync || {});
    return {
      enabled: !!settings.enabled,
      ready: !!(
        settings.enabled &&
        /^https:\/\//i.test(String(settings.endpoint || "")) &&
        String(settings.syncCode || "").length >= 20
      ),
      endpoint: settings.endpoint || "",
      lastPullAt: settings.lastPullAt || "",
      lastPushAt: settings.lastPushAt || ""
    };
  }

  function microsoftSummary() {
    const settings = typeof currentMicrosoftSettings === "function"
      ? currentMicrosoftSettings()
      : (state.microsoftSync || {});
    let connected = !!settings.connectedAccount;
    try {
      if (typeof syncRuntime !== "undefined" && syncRuntime?.msAccount) connected = true;
    } catch {}
    return {
      configured: !!settings.clientId,
      connected,
      autoBackup: !!settings.autoBackup,
      lastSyncAt: settings.lastSyncAt || "",
      status: settings.lastSyncStatus || ""
    };
  }

  async function testLocalStorageAndBackup() {
    const result = {
      storageType: typeof storage?.getStorageType === "function"
        ? storage.getStorageType()
        : "unbekannt",
      writeRead: false,
      persistedState: false,
      roundTrip: false,
      sizeKb: 0,
      error: ""
    };

    try {
      localStorage.setItem(SYSTEM_PROBE_KEY, "ok");
      result.writeRead = localStorage.getItem(SYSTEM_PROBE_KEY) === "ok";
      localStorage.removeItem(SYSTEM_PROBE_KEY);
    } catch (error) {
      result.error = "Browser-Speicher konnte nicht geprüft werden.";
    }

    try {
      const json = JSON.stringify(state);
      result.sizeKb = Math.max(1, Math.round(new Blob([json]).size / 1024));
      const parsed = JSON.parse(json);
      const normalized = typeof normalizeState === "function" ? normalizeState(parsed) : parsed;
      result.roundTrip = (
        normalized?.activeClassId === state.activeClassId &&
        (normalized?.classes || []).length === (state.classes || []).length &&
        (normalized?.animals || []).length === (state.animals || []).length &&
        (normalized?.learningGameSessions || []).length === (state.learningGameSessions || []).length
      );
    } catch (error) {
      result.error = result.error || "Backup-Struktur konnte nicht gelesen werden.";
    }

    try {
      const loaded = await storage.load();
      result.persistedState = !!(
        loaded &&
        loaded.activeClassId === state.activeClassId &&
        (loaded.classes || []).length === (state.classes || []).length
      );
    } catch (error) {
      result.error = result.error || "Gespeicherter Zustand konnte nicht erneut geladen werden.";
    }

    return result;
  }

  async function testClassSyncEndpoint(sync) {
    if (!sync.ready || !sync.endpoint) return { tested: false, ok: false, text: "nicht eingerichtet" };
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${String(sync.endpoint).replace(/\/+$/, "")}/health`, {
        cache: "no-store",
        signal: controller.signal
      });
      clearTimeout(timer);
      return {
        tested: true,
        ok: response.ok,
        text: response.ok ? "erreichbar" : `Antwort ${response.status}`
      };
    } catch {
      return { tested: true, ok: false, text: "gerade nicht erreichbar" };
    }
  }

  async function buildSafetyReport({ testNetwork = false } = {}) {
    const local = await testLocalStorageAndBackup();
    const sync = classSyncSummary();
    const microsoft = microsoftSummary();
    const qr = qrSummary();
    const releases = gameReleaseSummary();
    const syncEndpoint = testNetwork
      ? await testClassSyncEndpoint(sync)
      : { tested: false, ok: sync.ready, text: sync.ready ? "eingerichtet" : "nicht eingerichtet" };

    return {
      checkedAt: new Date().toISOString(),
      local,
      sync,
      syncEndpoint,
      microsoft,
      qr,
      releases
    };
  }

  function badge(status, goodText, badText, optional = false) {
    if (status) return `<span class="lk-safety-badge good">✓ ${escapeHtml(goodText)}</span>`;
    return `<span class="lk-safety-badge ${optional ? "optional" : "warn"}">${optional ? "○" : "!"} ${escapeHtml(badText)}</span>`;
  }

  function renderSystemCards(report) {
    const localOk = !!(
      report?.local?.writeRead &&
      report?.local?.persistedState &&
      report?.local?.roundTrip
    );
    const sync = report?.sync || classSyncSummary();
    const oneDrive = report?.microsoft || microsoftSummary();
    const qr = report?.qr || qrSummary();
    const releases = report?.releases || gameReleaseSummary();
    const syncEndpoint = report?.syncEndpoint;

    return `
      <div class="lk-safety-grid">
        <article>
          <span class="lk-safety-icon">💾</span>
          <div>
            <strong>Lokale Speicherung</strong>
            ${badge(localOk, report?.local?.storageType || "bereit", "noch nicht geprüft")}
            <small>${report?.local?.sizeKb ? `Datenstand ca. ${report.local.sizeKb} KB · Backup-Struktur lesbar` : "Mit „Systemcheck starten“ wird Lesen, Schreiben und Backup-Struktur geprüft."}</small>
          </div>
        </article>

        <article>
          <span class="lk-safety-icon">☁️</span>
          <div>
            <strong>OneDrive</strong>
            ${badge(oneDrive.connected, "verbunden", oneDrive.configured ? "nicht angemeldet" : "optional – nicht eingerichtet", true)}
            <small>${oneDrive.lastSyncAt ? `Letzter Abgleich: ${escapeHtml(safetyFormatDate(oneDrive.lastSyncAt))}` : "Noch kein OneDrive-Abgleich gespeichert."}</small>
          </div>
        </article>

        <article>
          <span class="lk-safety-icon">🔄</span>
          <div>
            <strong>Kinder-Sync</strong>
            ${badge(sync.ready && (!syncEndpoint?.tested || syncEndpoint.ok), syncEndpoint?.tested ? "erreichbar" : "eingerichtet", syncEndpoint?.tested ? syncEndpoint.text : "nicht vollständig eingerichtet")}
            <small>${sync.lastPullAt ? `Zuletzt Kinder-Daten geholt: ${escapeHtml(safetyFormatDate(sync.lastPullAt))}` : "Noch kein Abruf gespeichert."}</small>
          </div>
        </article>

        <article>
          <span class="lk-safety-icon">📱</span>
          <div>
            <strong>Gerätewechsel / QR</strong>
            ${badge(qr.total > 0 && qr.valid === qr.total && sync.ready, `${qr.valid}/${qr.total} Tier-Zugänge bereit`, `${qr.valid}/${qr.total} Tier-Zugänge bereit`)}
            <small>${sync.ready ? "Ein neues Kindergerät kann über den Tier-QR wieder angebunden werden." : "Für einen Gerätewechsel muss der Kinder-Sync vollständig eingerichtet sein."}</small>
          </div>
        </article>

        <article>
          <span class="lk-safety-icon">🎮</span>
          <div>
            <strong>Lernspiel-Freigaben</strong>
            ${badge(true, `${releases.released}/${releases.total} freigeschaltet`, "")}
            <small>Die Freigaben liegen in der Kinderansicht und werden mit dem Kinder-Sync übertragen.</small>
          </div>
        </article>

        <article>
          <span class="lk-safety-icon">🛡️</span>
          <div>
            <strong>Löschschutz</strong>
            ${badge(true, "aktiv", "")}
            <small>Werkseinstellung verlangt Backup-Bestätigung, Lehrkraft-PIN, Bestätigungswort und zwei Warnungen.</small>
          </div>
        </article>
      </div>
    `;
  }

  function renderSafetyPanel() {
    const report = safetyReport;
    const checked = report?.checkedAt
      ? `Zuletzt geprüft: ${safetyFormatDate(report.checkedAt)}`
      : "Noch nicht in dieser Sitzung geprüft.";

    return `
      <section class="panel lk-safety-panel">
        <div class="lk-safety-heading">
          <div>
            <p class="lk-safety-kicker">Paket 7</p>
            <h2>Systemprüfung & Sicherheit</h2>
            <p class="privacy-text">Ein schneller Check, ob Speicherung, Backup-Struktur, Kinder-Sync, QR-Zugänge und Lernspiel-Freigaben plausibel sind. Der Check verändert keine Kinderergebnisse.</p>
          </div>
          <span class="lk-safety-checked">${escapeHtml(checked)}</span>
        </div>

        ${renderSystemCards(report)}

        <div class="backup-actions lk-safety-actions">
          <button class="primary" type="button" onclick="runLKSafetyCheck()">✓ Systemcheck starten</button>
          <button class="secondary" type="button" onclick="exportFullBackup()">💾 Gesamtbackup speichern</button>
          <button class="secondary" type="button" onclick="cleanupLKActivityData()">🧹 Aktivitätsdaten aufräumen</button>
        </div>

        ${safetyMessage ? `<p class="message ${safetyMessage.startsWith("✓") ? "success" : safetyMessage.startsWith("!") ? "warning-message" : ""}">${escapeHtml(safetyMessage)}</p>` : ""}

        <details class="lk-safety-details">
          <summary>Was wird beim Aufräumen verändert?</summary>
          <div class="lk-safety-info">
            <p><strong>Ergebnisse bleiben erhalten.</strong> Tests, Übungsrunden, Einmaleins- und Kopfrechen-Ergebnisse werden nicht automatisch gelöscht.</p>
            <p>Nur technische Aktivitätsmeldungen werden gepflegt: seit mehr als 12 Stunden hängengebliebene „läuft“-Meldungen werden automatisch beendet. Reine Aktivitätsmeldungen älter als 60 Tage bzw. sehr alte Überschüsse werden entfernt.</p>
          </div>
        </details>
      </section>
    `;
  }

  window.runLKSafetyCheck = async function runLKSafetyCheck() {
    safetyMessage = "Systemcheck läuft …";
    render();
    try {
      safetyReport = await buildSafetyReport({ testNetwork: true });
      const localOk = (
        safetyReport.local.writeRead &&
        safetyReport.local.persistedState &&
        safetyReport.local.roundTrip
      );
      const syncOk = !safetyReport.sync.ready || safetyReport.syncEndpoint.ok;
      safetyMessage = localOk && syncOk
        ? "✓ Systemcheck abgeschlossen. Die lokale Speicherung ist lesbar; eingerichtete Sync-Verbindungen wurden geprüft."
        : "! Systemcheck abgeschlossen. Mindestens ein Punkt braucht Aufmerksamkeit.";
    } catch (error) {
      safetyMessage = "! Der Systemcheck konnte nicht vollständig abgeschlossen werden.";
      console.warn("Systemcheck fehlgeschlagen.", error);
    }
    render();
  };

  window.cleanupLKActivityData = async function cleanupLKActivityData(options = {}) {
    const silent = options?.silent === true;
    if (!silent && !confirm(
      "Es werden nur technische Lernspiel-Aktivitätsmeldungen aufgeräumt. Fachliche Ergebnisse bleiben erhalten. Fortfahren?"
    )) return;

    const cleaned = cleanupCandidate(state);
    const { stats } = cleaned;

    if (stats.autoClosed || stats.removed) {
      await persist(cleaned.state);
    }

    safetyMessage = `✓ Aufräumen abgeschlossen: ${stats.autoClosed} hängengebliebene Aktivität${stats.autoClosed === 1 ? "" : "en"} beendet, ${stats.removed} alte Aktivitätsmeldung${stats.removed === 1 ? "" : "en"} entfernt. ${stats.preservedResults} Ergebnisdatensätze blieben unverändert.`;

    if (!silent) render();
    return stats;
  };

  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  async function dailyCleanup() {
    try {
      if (!state?.setupComplete) return;
      const today = todayKey();
      if (localStorage.getItem(DAILY_CLEANUP_KEY) === today) return;
      const stats = await cleanupLKActivityData({ silent: true });
      localStorage.setItem(DAILY_CLEANUP_KEY, today);
      if (stats?.autoClosed || stats?.removed) {
        console.info("Paket 7: technische Aktivitätsdaten wurden sicher gepflegt.", stats);
      }
    } catch (error) {
      console.warn("Automatische Aktivitätsdatenpflege konnte nicht ausgeführt werden.", error);
    }
  }

  renderBackup = function renderBackupWithSafety() {
    return `${renderSafetyPanel()}${baseRenderBackup()}`;
  };

  if (baseRenderStorageStatus) {
    renderStorageStatus = function renderStorageStatusWithSafetyNote() {
      const sync = classSyncSummary();
      const releases = gameReleaseSummary();
      return `
        <section class="panel lk-storage-mini-status">
          <h2>Systemstatus</h2>
          <div class="lk-mini-status-row">
            <span>💾 ${escapeHtml(typeof storage?.getStorageType === "function" ? storage.getStorageType() : "lokaler Speicher")}</span>
            <span>${sync.ready ? "✓ Kinder-Sync eingerichtet" : "○ Kinder-Sync nicht vollständig eingerichtet"}</span>
            <span>🎮 ${releases.released}/${releases.total} Lernspiele freigeschaltet</span>
          </div>
        </section>
        ${baseRenderStorageStatus()}
      `;
    };
  }

  const style = document.createElement("style");
  style.id = "lk-safety-tools-style";
  style.textContent = `
    .lk-safety-panel { border:2px solid rgba(47,111,145,.13); }
    .lk-safety-heading { display:flex; justify-content:space-between; gap:18px; align-items:flex-start; }
    .lk-safety-kicker { margin:0 0 3px; font-size:.75rem; text-transform:uppercase; letter-spacing:.08em; font-weight:800; opacity:.55; }
    .lk-safety-heading h2 { margin:.1rem 0 .35rem; }
    .lk-safety-checked { padding:7px 10px; border-radius:999px; background:rgba(47,111,145,.08); font-size:.8rem; white-space:nowrap; }
    .lk-safety-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin:16px 0; }
    .lk-safety-grid article { display:grid; grid-template-columns:auto minmax(0,1fr); gap:10px; align-items:start; padding:13px; border:1px solid rgba(0,0,0,.08); border-radius:16px; background:rgba(255,255,255,.72); }
    .lk-safety-grid article > div { display:grid; gap:5px; min-width:0; }
    .lk-safety-grid small { opacity:.67; line-height:1.35; }
    .lk-safety-icon { width:38px; height:38px; border-radius:12px; display:grid; place-items:center; background:rgba(47,111,145,.08); font-size:1.15rem; }
    .lk-safety-badge { display:inline-flex; width:max-content; max-width:100%; padding:4px 7px; border-radius:999px; font-size:.76rem; font-weight:750; }
    .lk-safety-badge.good { background:rgba(72,154,92,.11); color:#356e43; }
    .lk-safety-badge.warn { background:#fff0c8; color:#8a5b15; }
    .lk-safety-badge.optional { background:rgba(0,0,0,.045); color:inherit; opacity:.75; }
    .lk-safety-actions { margin-top:12px; }
    .lk-safety-details { margin-top:12px; border-top:1px solid rgba(0,0,0,.07); padding-top:10px; }
    .lk-safety-details summary { cursor:pointer; font-weight:750; }
    .lk-safety-info { margin-top:8px; opacity:.82; }
    .lk-safety-info p { margin:6px 0; }
    .lk-storage-mini-status .lk-mini-status-row { display:flex; gap:8px; flex-wrap:wrap; }
    .lk-mini-status-row span { padding:7px 9px; border-radius:999px; background:rgba(47,111,145,.07); font-size:.82rem; }

    @media (max-width:920px) {
      .lk-safety-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
    }
    @media (max-width:620px) {
      .lk-safety-heading { display:block; }
      .lk-safety-checked { display:inline-block; margin-top:7px; }
      .lk-safety-grid { grid-template-columns:1fr; }
    }
  `;
  if (!document.getElementById(style.id)) document.head.appendChild(style);

  window.LKSafetyTools = {
    cleanupCandidate,
    buildSafetyReport,
    classSyncSummary,
    microsoftSummary,
    qrSummary,
    gameReleaseSummary
  };

  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => dailyCleanup(), 2500);
  });
})();
