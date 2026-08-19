/* Paket 3: automatischer Kinder-Sync
 *
 * Ziel:
 * - QR-Karte öffnet die Web-App direkt auf einem frischen Kindergerät.
 * - Das Kind bekommt nur seine pseudonymisierte Tieransicht und freigegebene Inhalte.
 * - Änderungen werden zuerst lokal gespeichert und danach automatisch verschlüsselt gesendet.
 * - Das Lehrkraftgerät holt Kinddaten automatisch ab und verteilt Planänderungen wieder an die Kinder.
 *
 * Sicherheitsprinzip:
 * - Der Klassen-Sync-Code bleibt ausschließlich auf Lehrkraftgeräten.
 * - Kinder erhalten nur einen abgeleiteten Transport-Token.
 * - Jeder Kinder-Datensatz wird mit dem individuellen QR-Token des Tieres AES-GCM-verschlüsselt.
 * - Der Cloudflare-Worker sieht nur Hash-Buckets und verschlüsselte Nutzdaten.
 */

(() => {
  const LK_CHILD_SYNC_VERSION = 1;
  const LK_TEACHER_PULL_INTERVAL_MS = 30_000;
  const LK_CHILD_BOOTSTRAP_INTERVAL_MS = 60_000;
  const LK_CHILD_PUSH_DELAY_MS = 900;
  const LK_TEACHER_PUBLISH_DELAY_MS = 1_800;

  const runtime = {
    applyingRemote: false,
    bootstrapping: false,
    childPushTimer: null,
    childBootstrapTimer: null,
    teacherPullTimer: null,
    teacherPublishTimer: null,
    lastBootstrapFingerprints: new Map(),
    lastTeacherPullAt: 0,
    lastChildPushAt: 0
  };

  if (typeof persist !== "function" || typeof classSyncToken !== "function" || typeof encryptClassPayload !== "function") {
    console.warn("Automatischer Kinder-Sync konnte nicht initialisiert werden: Grundfunktionen fehlen.");
    return;
  }

  const basePersist = persist;
  const baseQrPayloadForAnimal = typeof qrPayloadForAnimal === "function" ? qrPayloadForAnimal : null;
  const baseFindAnimalForQrValue = typeof findAnimalForQrValue === "function" ? findAnimalForQrValue : null;
  const baseRenderQrCards = typeof renderQrCards === "function" ? renderQrCards : null;
  const baseRenderConfirmation = typeof renderConfirmation === "function" ? renderConfirmation : null;

  function normalizedAppBaseUrl() {
    if (location.protocol !== "http:" && location.protocol !== "https:") return "";
    const path = location.pathname.endsWith("index.html")
      ? location.pathname.slice(0, -"index.html".length)
      : location.pathname;
    return `${location.origin}${path}`;
  }

  function deriveSyncEndpoint() {
    const configured = typeof currentClassSyncSettings === "function"
      ? normalizeEndpoint(currentClassSyncSettings().endpoint || "")
      : "";
    if (configured) return configured;
    const host = location.hostname;
    const prefix = "lernstand-kompass.";
    if (host.startsWith(prefix)) {
      return `https://lernstand-kompass-sync.${host.slice(prefix.length)}`;
    }
    return "";
  }

  function currentChildMarker(candidate = state) {
    return candidate?.lkChildSync && typeof candidate.lkChildSync === "object"
      ? candidate.lkChildSync
      : null;
  }

  function isChildDevice(candidate = state) {
    const marker = currentChildMarker(candidate);
    return !!(marker?.qrToken && marker?.transportBucket && marker?.endpoint && marker?.animalId);
  }

  function teacherClassSyncReady() {
    if (isChildDevice()) return false;
    const settings = typeof currentClassSyncSettings === "function" ? currentClassSyncSettings() : {};
    return !!(settings.enabled && /^https:\/\//i.test(settings.endpoint || "") && String(settings.syncCode || "").length >= 20);
  }

  function qrTokenFromUrl(value = location.href) {
    try {
      const parsed = new URL(value, location.href);
      const hash = new URLSearchParams(parsed.hash.replace(/^#/, ""));
      return hash.get("k") || parsed.searchParams.get("k") || "";
    } catch {
      return "";
    }
  }

  function validQrToken(value) {
    return /^ak-[A-Z2-9]{8}$/i.test(String(value || "").trim());
  }

  function childRecordId(animalId) {
    return `child-state:${animalId}`;
  }

  async function bootstrapBucket(qrToken) {
    return classSyncToken(`bootstrap|${qrToken}`);
  }

  async function teacherTransportBucket() {
    const settings = currentClassSyncSettings();
    return classSyncToken(`transport|${settings.syncCode}`);
  }

  function requestHeaders(bucket, json = false) {
    return {
      ...(json ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${bucket}`
    };
  }

  async function syncFetch(endpoint, bucket, options = {}) {
    const response = await fetch(`${normalizeEndpoint(endpoint)}/v1/sessions`, {
      cache: "no-store",
      ...options,
      headers: {
        ...requestHeaders(bucket, !!options.body),
        ...(options.headers || {})
      }
    });
    if (!response.ok) {
      const error = new Error(`Klassen-Sync antwortet mit ${response.status}.`);
      error.status = response.status;
      throw error;
    }
    return response;
  }

  function sanitizeAnimalForChild(animal) {
    return {
      id: animal.id,
      classId: animal.classId,
      tierName: animal.tierName,
      tierEmoji: animal.tierEmoji,
      aktiv: animal.aktiv !== false,
      qrToken: animal.qrToken
    };
  }

  function sanitizeClassForChild(classItem) {
    return {
      id: classItem.id,
      name: classItem.name,
      beschreibung: "",
      activeSchoolYear: classItem.activeSchoolYear || "",
      erstelltAm: classItem.erstelltAm || "",
      aktiv: classItem.aktiv !== false
    };
  }

  function assignmentAppliesToAnimal(assignment, animalId) {
    return assignment?.active !== false && (
      assignment.assignmentMode !== "selected"
      || !Array.isArray(assignment.animalIds)
      || !assignment.animalIds.length
      || assignment.animalIds.includes(animalId)
    );
  }

  function plansForChildSnapshot(animalId) {
    return (state.weeklyPlans || []).filter((plan) => (
      plan.classId === state.activeClassId
      && plan.active !== false
      && (typeof weeklyPlanAppliesToAnimal !== "function" || weeklyPlanAppliesToAnimal(plan, animalId))
    ));
  }

  function assignmentsForChildSnapshot(animalId) {
    return (state.workbookAssignments || []).filter((assignment) => (
      assignment.classId === state.activeClassId
      && assignmentAppliesToAnimal(assignment, animalId)
    ));
  }

  function catalogForChildSnapshot(animalId, plans, assignments) {
    const wanted = new Set(assignments.map((item) => item.workbookCatalogId).filter(Boolean));
    if (typeof weeklyPlanItemsForDay === "function") {
      plans.forEach((plan) => {
        (typeof WEEK_DAYS !== "undefined" ? WEEK_DAYS : ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"]).forEach((day) => {
          try {
            weeklyPlanItemsForDay(plan, day, animalId).forEach((item) => {
              if (item?.workbookCatalogId) wanted.add(item.workbookCatalogId);
              if (item?.catalogItem?.id) wanted.add(item.catalogItem.id);
            });
          } catch {}
        });
      });
    }
    return (state.workbookCatalog || []).filter((item) => item.classId === state.activeClassId && wanted.has(item.id));
  }

  function filterForAnimal(list, animalId, key = "animalId") {
    return (list || []).filter((item) => item?.classId === state.activeClassId && item?.[key] === animalId);
  }

  async function buildChildBootstrap(animal) {
    const classItem = (state.classes || []).find((item) => item.id === animal.classId);
    if (!classItem) return null;
    const plans = plansForChildSnapshot(animal.id);
    const assignments = assignmentsForChildSnapshot(animal.id);
    const catalog = catalogForChildSnapshot(animal.id, plans, assignments);
    const transportBucket = await teacherTransportBucket();
    const endpoint = normalizeEndpoint(currentClassSyncSettings().endpoint);

    return {
      type: "lernstand-kompass-child-bootstrap",
      version: LK_CHILD_SYNC_VERSION,
      endpoint,
      transportBucket,
      classItem: sanitizeClassForChild(classItem),
      animal: sanitizeAnimalForChild(animal),
      childViewSettings: JSON.parse(JSON.stringify(state.childViewSettings || {})),
      materials: (state.materials || []).filter((item) => item.classId === animal.classId && item.aktiv !== false),
      animalGroups: (state.animalGroups || [])
        .filter((group) => group.classId === animal.classId && (group.animalIds || []).includes(animal.id))
        .map((group) => ({ ...group, animalIds: [animal.id] })),
      weeklyPlans: JSON.parse(JSON.stringify(plans)),
      workbookCatalog: JSON.parse(JSON.stringify(catalog)),
      workbookAssignments: JSON.parse(JSON.stringify(assignments)),
      activeWorkbookMaterials: (state.activeWorkbookMaterials || []).filter((item) => (
        item.classId === animal.classId
        && item.active !== false
        && (item.scope !== "animal" || item.animalId === animal.id)
      )),
      sprachweltTasks: (state.sprachweltTasks || []).filter((item) => item.aktiv !== false),
      trainingTasks: (state.trainingTasks || []).filter((item) => item.active !== false),
      entries: filterForAnimal(state.entries, animal.id, "tierID"),
      weeklyPlanStatuses: filterForAnimal(state.weeklyPlanStatuses, animal.id),
      workbookAssignmentStatuses: filterForAnimal(state.workbookAssignmentStatuses, animal.id),
      childWorkbookReports: filterForAnimal(state.childWorkbookReports, animal.id),
      trainingCompletions: filterForAnimal(state.trainingCompletions, animal.id),
      learningGameSessions: filterForAnimal(state.learningGameSessions, animal.id),
      generatedAt: newestTeacherFacingTimestamp(animal.id)
    };
  }

  function newestTeacherFacingTimestamp(animalId) {
    const values = [
      ...(state.weeklyPlans || []).map((item) => item.updatedAt || item.createdAt || ""),
      ...(state.workbookAssignments || []).map((item) => item.updatedAt || item.createdAt || ""),
      ...filterForAnimal(state.weeklyPlanStatuses, animalId).map((item) => item.updatedAt || ""),
      ...filterForAnimal(state.workbookAssignmentStatuses, animalId).map((item) => item.updatedAt || ""),
      ...filterForAnimal(state.childWorkbookReports, animalId).map((item) => item.updatedAt || ""),
      ...filterForAnimal(state.trainingCompletions, animalId).map((item) => item.updatedAt || item.completedAt || ""),
      ...filterForAnimal(state.learningGameSessions, animalId).map((item) => item.finishedAt || item.startedAt || "")
    ].filter(Boolean).sort();
    return values[values.length - 1] || state.lastSavedAt || "";
  }

  async function contentFingerprint(value) {
    const bytes = new TextEncoder().encode(JSON.stringify(value));
    if (crypto?.subtle) {
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      return base64UrlEncode(new Uint8Array(digest));
    }
    return String(bytes.length);
  }

  async function publishChildBootstrap(animal) {
    if (!animal?.qrToken || !validQrToken(animal.qrToken) || !teacherClassSyncReady()) return false;
    const snapshot = await buildChildBootstrap(animal);
    if (!snapshot) return false;
    const fingerprint = await contentFingerprint(snapshot);
    if (runtime.lastBootstrapFingerprints.get(animal.id) === fingerprint) return false;

    const endpoint = currentClassSyncSettings().endpoint;
    const bucket = await bootstrapBucket(animal.qrToken);
    const encrypted = await encryptClassPayload(snapshot, animal.qrToken);
    await syncFetch(endpoint, bucket, {
      method: "POST",
      body: JSON.stringify({ id: "bootstrap", createdAt: nowIso(), payload: encrypted })
    });
    runtime.lastBootstrapFingerprints.set(animal.id, fingerprint);
    return true;
  }

  async function publishAllChildBootstraps() {
    if (!teacherClassSyncReady() || !navigator.onLine) return 0;
    let count = 0;
    const animals = (state.animals || []).filter((animal) => animal.classId === state.activeClassId && animal.aktiv !== false);
    for (const animal of animals) {
      try {
        if (await publishChildBootstrap(animal)) count += 1;
      } catch (error) {
        console.warn(`Kinder-Zugang für ${animal.tierName || animal.id} konnte noch nicht veröffentlicht werden.`, error);
      }
    }
    return count;
  }

  function scheduleTeacherPublish() {
    if (!teacherClassSyncReady() || runtime.applyingRemote) return;
    clearTimeout(runtime.teacherPublishTimer);
    runtime.teacherPublishTimer = setTimeout(() => {
      publishAllChildBootstraps().catch((error) => console.warn("Kinder-Zugänge konnten noch nicht aktualisiert werden.", error));
    }, LK_TEACHER_PUBLISH_DELAY_MS);
  }

  function childStateSnapshot() {
    const marker = currentChildMarker();
    const animalId = marker?.animalId || "";
    const classId = marker?.classId || state.activeClassId;
    return {
      type: "lernstand-kompass-child-state",
      version: LK_CHILD_SYNC_VERSION,
      classId,
      animalId,
      updatedAt: nowIso(),
      entries: (state.entries || []).filter((item) => item.classId === classId && item.tierID === animalId),
      weeklyPlanStatuses: (state.weeklyPlanStatuses || []).filter((item) => item.classId === classId && item.animalId === animalId),
      workbookAssignmentStatuses: (state.workbookAssignmentStatuses || []).filter((item) => item.classId === classId && item.animalId === animalId),
      childWorkbookReports: (state.childWorkbookReports || []).filter((item) => item.classId === classId && item.animalId === animalId),
      trainingCompletions: (state.trainingCompletions || []).filter((item) => item.classId === classId && item.animalId === animalId),
      learningGameSessions: (state.learningGameSessions || []).filter((item) => item.classId === classId && item.animalId === animalId)
    };
  }

  async function saveChildSyncRuntime(fields) {
    const marker = currentChildMarker();
    if (!marker) return;
    runtime.applyingRemote = true;
    try {
      state = await storage.save({
        ...state,
        lkChildSync: { ...marker, ...fields }
      });
    } finally {
      runtime.applyingRemote = false;
    }
  }

  async function pushChildStateNow() {
    if (!isChildDevice() || !navigator.onLine) return false;
    const marker = currentChildMarker();
    try {
      const snapshot = childStateSnapshot();
      const encrypted = await encryptClassPayload(snapshot, marker.qrToken);
      await syncFetch(marker.endpoint, marker.transportBucket, {
        method: "POST",
        body: JSON.stringify({
          id: childRecordId(marker.animalId),
          createdAt: snapshot.updatedAt,
          payload: encrypted
        })
      });
      runtime.lastChildPushAt = Date.now();
      await saveChildSyncRuntime({ lastPushAt: nowIso(), lastError: "" });
      return true;
    } catch (error) {
      console.warn("Kinder-Sync: Änderung bleibt lokal gespeichert und wird später erneut gesendet.", error);
      await saveChildSyncRuntime({ lastError: "Lokal gespeichert – Versand wird automatisch erneut versucht." });
      return false;
    }
  }

  function scheduleChildPush() {
    if (!isChildDevice() || runtime.applyingRemote) return;
    clearTimeout(runtime.childPushTimer);
    runtime.childPushTimer = setTimeout(() => {
      pushChildStateNow().catch(() => {});
    }, LK_CHILD_PUSH_DELAY_MS);
  }

  function mergeByIdPreferNewest(current, incoming) {
    const list = Array.isArray(current) ? [...current] : [];
    const map = new Map(list.filter((item) => item?.id).map((item) => [item.id, item]));
    let changed = 0;
    (incoming || []).forEach((item) => {
      if (!item?.id) return;
      const previous = map.get(item.id);
      if (!previous) {
        list.push(item);
        map.set(item.id, item);
        changed += 1;
        return;
      }
      if (recordTimestamp(item) > recordTimestamp(previous)) {
        const index = list.findIndex((entry) => entry?.id === item.id);
        list[index] = { ...previous, ...item };
        map.set(item.id, list[index]);
        changed += 1;
      }
    });
    return { list, changed };
  }

  function recordTimestamp(item) {
    const value = item?.updatedAt || item?.finishedAt || item?.completedAt || item?.datumUhrzeit || item?.createdAt || item?.startedAt || "";
    const time = Date.parse(value);
    return Number.isFinite(time) ? time : 0;
  }

  function validIncomingList(list, animalId, classId, key) {
    return (Array.isArray(list) ? list : []).filter((item) => (
      item?.id
      && item?.classId === classId
      && item?.[key] === animalId
    ));
  }

  function mergeOneChildState(base, incoming, animal) {
    if (!incoming || incoming.type !== "lernstand-kompass-child-state") return { state: base, changed: 0 };
    if (incoming.classId !== state.activeClassId || incoming.animalId !== animal.id) return { state: base, changed: 0 };
    let changed = 0;
    const next = { ...base };
    const fields = [
      ["entries", "tierID"],
      ["weeklyPlanStatuses", "animalId"],
      ["workbookAssignmentStatuses", "animalId"],
      ["childWorkbookReports", "animalId"],
      ["trainingCompletions", "animalId"],
      ["learningGameSessions", "animalId"]
    ];
    fields.forEach(([field, key]) => {
      const valid = validIncomingList(incoming[field], animal.id, state.activeClassId, key);
      const merged = mergeByIdPreferNewest(next[field], valid);
      next[field] = merged.list;
      changed += merged.changed;
    });
    return { state: next, changed };
  }

  function userIsEditing() {
    const active = document.activeElement;
    if (!active) return false;
    return active.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(active.tagName);
  }

  async function pullTeacherChildStates({ renderIfSafe = true } = {}) {
    if (!teacherClassSyncReady() || !navigator.onLine) return 0;
    const settings = currentClassSyncSettings();
    const bucket = await teacherTransportBucket();
    const response = await syncFetch(settings.endpoint, bucket, { method: "GET" });
    const body = await response.json();
    const items = Array.isArray(body.items) ? body.items : [];
    let nextState = state;
    let changed = 0;

    for (const item of items) {
      if (!String(item?.id || "").startsWith("child-state:")) continue;
      const animalId = String(item.id).slice("child-state:".length);
      const animal = (state.animals || []).find((entry) => entry.id === animalId && entry.classId === state.activeClassId && entry.aktiv !== false);
      if (!animal?.qrToken) continue;
      try {
        const incoming = await decryptClassPayload(item.payload, animal.qrToken);
        const merged = mergeOneChildState(nextState, incoming, animal);
        nextState = merged.state;
        changed += merged.changed;
      } catch (error) {
        console.warn("Ein Kinder-Datensatz konnte nicht entschlüsselt oder geprüft werden.", error);
      }
    }

    runtime.lastTeacherPullAt = Date.now();
    const timestamp = nowIso();
    if (changed) {
      runtime.applyingRemote = true;
      try {
        await basePersist({
          ...nextState,
          classSync: {
            ...currentClassSyncSettings(),
            lastPullAt: timestamp,
            lastError: ""
          }
        });
      } finally {
        runtime.applyingRemote = false;
      }
      globalMessage = `${changed} neue oder aktualisierte Kindmeldung${changed === 1 ? "" : "en"} automatisch übernommen.`;
      scheduleTeacherPublish();
      if (renderIfSafe && screen === "teacher" && !userIsEditing()) render();
    } else if (state.classSync?.lastPullAt !== timestamp) {
      runtime.applyingRemote = true;
      try {
        state = await storage.save({
          ...state,
          classSync: { ...currentClassSyncSettings(), lastPullAt: timestamp, lastError: "" }
        });
      } finally {
        runtime.applyingRemote = false;
      }
    }
    return changed;
  }

  function mergeBootstrapIntoChildState(snapshot, qrToken) {
    const previous = isChildDevice() && currentChildMarker()?.qrToken === qrToken ? state : emptyState();
    const animal = snapshot.animal;
    const classItem = snapshot.classItem;
    const classId = classItem.id;
    const mergeFields = [
      ["entries", "tierID"],
      ["weeklyPlanStatuses", "animalId"],
      ["workbookAssignmentStatuses", "animalId"],
      ["childWorkbookReports", "animalId"],
      ["trainingCompletions", "animalId"],
      ["learningGameSessions", "animalId"]
    ];
    const next = {
      ...emptyState(),
      setupComplete: true,
      pinHash: `child-device-${qrToken}`,
      recoveryKeyHash: `child-device-recovery-${qrToken}`,
      activeClassId: classId,
      classes: [classItem],
      animals: [animal],
      animalGroups: snapshot.animalGroups || [],
      materials: snapshot.materials || [],
      entries: previous.entries || [],
      goals: [],
      assessments: [],
      assessmentTasks: [],
      assessmentResults: [],
      sprachweltTasks: snapshot.sprachweltTasks || [],
      trainingTasks: snapshot.trainingTasks || [],
      trainingCompletions: previous.trainingCompletions || [],
      trainingHistory: [],
      workbookCatalog: snapshot.workbookCatalog || [],
      workbookAssignments: snapshot.workbookAssignments || [],
      workbookAssignmentStatuses: previous.workbookAssignmentStatuses || [],
      childWorkbookReports: previous.childWorkbookReports || [],
      activeWorkbookMaterials: snapshot.activeWorkbookMaterials || [],
      weeklyPlans: snapshot.weeklyPlans || [],
      weeklyPlanStatuses: previous.weeklyPlanStatuses || [],
      learningGameSessions: previous.learningGameSessions || [],
      microsoftSync: { clientId: "", authority: "consumers", redirectUri: "", autoBackup: false, connectedAccount: "", connectedName: "", lastSyncAt: "", lastSyncStatus: "" },
      classSync: { enabled: false, endpoint: "", syncCode: "", lastPushAt: "", lastPullAt: "", lastError: "" },
      progressSettings: { ...(state.progressSettings || {}) },
      childViewSettings: snapshot.childViewSettings || {},
      teacherShowFirstNames: false,
      qrScannerEnabled: false,
      multiDeviceReminderEnabled: false,
      multiDeviceReminderTime: "13:00",
      lkChildSync: {
        version: LK_CHILD_SYNC_VERSION,
        endpoint: normalizeEndpoint(snapshot.endpoint || deriveSyncEndpoint()),
        transportBucket: snapshot.transportBucket,
        qrToken,
        animalId: animal.id,
        classId,
        lastBootstrapAt: nowIso(),
        lastPushAt: currentChildMarker(previous)?.lastPushAt || "",
        lastError: ""
      }
    };

    mergeFields.forEach(([field, key]) => {
      const incoming = validIncomingList(snapshot[field], animal.id, classId, key);
      next[field] = mergeByIdPreferNewest(next[field], incoming).list;
    });
    return next;
  }

  async function fetchChildBootstrap(qrToken) {
    const endpoint = deriveSyncEndpoint();
    if (!endpoint) throw new Error("Die Klassen-Sync-Adresse konnte nicht ermittelt werden.");
    const bucket = await bootstrapBucket(qrToken);
    const response = await syncFetch(endpoint, bucket, { method: "GET" });
    const body = await response.json();
    const item = (body.items || []).find((entry) => entry.id === "bootstrap");
    if (!item?.payload) throw new Error("Dieser Tier-Zugang wurde von der Lehrkraft noch nicht freigegeben.");
    const snapshot = await decryptClassPayload(item.payload, qrToken);
    if (snapshot?.type !== "lernstand-kompass-child-bootstrap" || snapshot?.animal?.qrToken !== qrToken || !snapshot?.transportBucket) {
      throw new Error("Der Tier-Zugang ist ungültig oder veraltet.");
    }
    return snapshot;
  }

  function showChildBootstrapStatus(title, text, error = false) {
    app.innerHTML = `
      <main class="app-shell child">
        <section class="center-stage">
          <div class="setup-card">
            <h1 class="brand-title">${escapeHtml(title)}</h1>
            <p class="message ${error ? "error" : ""}">${escapeHtml(text)}</p>
            ${error ? `<button class="primary" type="button" onclick="location.reload()">Noch einmal versuchen</button>` : ""}
          </div>
        </section>
      </main>
    `;
  }

  async function installOrRefreshChildBootstrap(qrToken, { openChild = true } = {}) {
    if (runtime.bootstrapping || !validQrToken(qrToken)) return false;
    runtime.bootstrapping = true;
    try {
      if (openChild) showChildBootstrapStatus("Deine Lernreise", "Dein Tier-Zugang wird geladen …");
      const snapshot = await fetchChildBootstrap(qrToken);
      const next = mergeBootstrapIntoChildState(snapshot, qrToken);
      runtime.applyingRemote = true;
      try {
        state = await storage.save(next);
      } finally {
        runtime.applyingRemote = false;
      }
      if (openChild) {
        childDraft = { animalId: snapshot.animal.id, fromQr: true };
        screen = "childSubject";
        try {
          history.replaceState(null, "", `${location.pathname}${location.search}`);
        } catch {}
        render();
      }
      return true;
    } catch (error) {
      console.warn("Tier-Zugang konnte noch nicht geladen werden.", error);
      if (openChild) showChildBootstrapStatus("Tier-Zugang", error?.message || "Der Zugang konnte gerade nicht geladen werden.", true);
      return false;
    } finally {
      runtime.bootstrapping = false;
    }
  }

  function openStoredChildDevice() {
    if (!isChildDevice()) return false;
    const marker = currentChildMarker();
    childDraft = { animalId: marker.animalId, fromQr: true };
    screen = "childSubject";
    render();
    return true;
  }

  function scheduleChildBootstrapRefresh() {
    if (!isChildDevice()) return;
    clearTimeout(runtime.childBootstrapTimer);
    runtime.childBootstrapTimer = setTimeout(async () => {
      const marker = currentChildMarker();
      if (marker?.qrToken && navigator.onLine) {
        await installOrRefreshChildBootstrap(marker.qrToken, { openChild: false });
      }
      scheduleChildBootstrapRefresh();
    }, LK_CHILD_BOOTSTRAP_INTERVAL_MS);
  }

  function scheduleTeacherPullLoop() {
    if (!teacherClassSyncReady()) return;
    clearTimeout(runtime.teacherPullTimer);
    runtime.teacherPullTimer = setTimeout(async () => {
      try {
        await pullTeacherChildStates({ renderIfSafe: true });
      } catch (error) {
        console.warn("Automatischer Abruf der Kindmeldungen ist momentan nicht möglich.", error);
      }
      scheduleTeacherPullLoop();
    }, LK_TEACHER_PULL_INTERVAL_MS);
  }

  async function initializeAutomaticSync() {
    // Dem ursprünglichen App-Start kurz Zeit zum Laden des lokalen Speichers geben.
    for (let i = 0; i < 30 && screen === "loading"; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    const qrToken = qrTokenFromUrl();
    if (validQrToken(qrToken)) {
      // Eine bereits vollständig eingerichtete Installation (z. B. Lehrkraftgerät)
      // darf beim Testen einer QR-Karte niemals in ein Kindergerät umgewandelt werden.
      const looksLikeFullInstallation = state?.setupComplete
        && Array.isArray(state.animals)
        && state.animals.length > 1
        && !!state.pinHash
        && !String(state.pinHash).startsWith("child-device-")
        && !isChildDevice();
      if (looksLikeFullInstallation) {
        const animal = (state.animals || []).find((item) => item.aktiv !== false && item.qrToken === qrToken);
        if (animal) {
          childDraft = { animalId: animal.id, fromQr: true };
          if (state.activeClassId !== animal.classId) await basePersist({ ...state, activeClassId: animal.classId });
          screen = "childSubject";
          try { history.replaceState(null, "", `${location.pathname}${location.search}`); } catch {}
          render();
          return;
        }
      }

      const ok = await installOrRefreshChildBootstrap(qrToken, { openChild: true });
      if (ok) {
        scheduleChildPush();
        scheduleChildBootstrapRefresh();
      }
      return;
    }

    if (isChildDevice()) {
      openStoredChildDevice();
      scheduleChildPush();
      scheduleChildBootstrapRefresh();
      return;
    }

    if (teacherClassSyncReady()) {
      scheduleTeacherPublish();
      try {
        await pullTeacherChildStates({ renderIfSafe: false });
      } catch (error) {
        console.warn("Kindmeldungen konnten beim Start noch nicht geladen werden.", error);
      }
      scheduleTeacherPullLoop();
    }
  }

  // Jede normale Speicherung bleibt zuerst lokal. Danach wird je nach Rolle automatisch synchronisiert.
  persist = async function automaticPersist(nextState = state) {
    await basePersist(nextState);
    if (runtime.applyingRemote) return;
    if (isChildDevice()) scheduleChildPush();
    else if (teacherClassSyncReady()) scheduleTeacherPublish();
  };

  // Die Nomen-Probe nutzt dieselbe automatische Kinderpost statt des Klassen-Schlüssels.
  if (typeof syncLearningGameSessionAfterSave === "function") {
    syncLearningGameSessionAfterSave = async function automaticNomenSync() {
      if (!isChildDevice()) {
        return { attempted: false, success: false };
      }
      const success = await pushChildStateNow();
      return { attempted: true, success };
    };
  }

  // Neue QR-Karten öffnen die Web-App direkt. Im QR-Code steckt nur der individuelle anonyme Zugangstoken.
  if (baseQrPayloadForAnimal) {
    qrPayloadForAnimal = function automaticQrPayload(animal) {
      const base = normalizedAppBaseUrl();
      if (!base || !animal?.qrToken) return baseQrPayloadForAnimal(animal);
      return `${base}#k=${encodeURIComponent(animal.qrToken)}`;
    };
  }

  if (baseFindAnimalForQrValue) {
    findAnimalForQrValue = function automaticFindAnimal(value) {
      const token = qrTokenFromUrl(value);
      if (token) {
        const animal = (state.animals || []).find((item) => item.aktiv !== false && item.qrToken === token);
        if (animal) return animal;
      }
      return baseFindAnimalForQrValue(value);
    };
  }

  if (baseRenderQrCards) {
    renderQrCards = function automaticQrCards() {
      return baseRenderQrCards().replace(
        "Die QR-Codes enthalten keine Vornamen und keine Lernstände. Sie enthalten nur eine anonyme Tier-ID.",
        "Die QR-Codes enthalten keine Vornamen und keine Lernstände. Sie öffnen die Web-App direkt und enthalten nur die App-Adresse und einen anonymen Tier-Zugang."
      );
    };
  }

  if (baseRenderConfirmation) {
    renderConfirmation = function automaticChildConfirmation() {
      let html = baseRenderConfirmation();
      if (!isChildDevice()) return html;
      html = html.replace("Alles ist auf diesem iPad gesichert.", "Gespeichert. Dein Brief wird automatisch an die Lehrkraft geschickt.");
      html = html.replace(/<button class="secondary lernpost-button"[^>]*onclick="exportLernpost\(\)"[^>]*>.*?<\/button>/g, "");
      return html;
    };
  }

  window.publishAllChildBootstraps = publishAllChildBootstraps;
  window.pullTeacherChildStates = pullTeacherChildStates;
  window.pushChildStateNow = pushChildStateNow;

  window.addEventListener("online", () => {
    if (isChildDevice()) {
      pushChildStateNow().catch(() => {});
      const marker = currentChildMarker();
      if (marker?.qrToken) installOrRefreshChildBootstrap(marker.qrToken, { openChild: false }).catch(() => {});
    } else if (teacherClassSyncReady()) {
      publishAllChildBootstraps().catch(() => {});
      pullTeacherChildStates({ renderIfSafe: true }).catch(() => {});
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible" || !navigator.onLine) return;
    if (isChildDevice()) {
      const marker = currentChildMarker();
      if (marker?.qrToken) installOrRefreshChildBootstrap(marker.qrToken, { openChild: false }).catch(() => {});
      pushChildStateNow().catch(() => {});
    } else if (teacherClassSyncReady()) {
      pullTeacherChildStates({ renderIfSafe: true }).catch(() => {});
      scheduleTeacherPublish();
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    initializeAutomaticSync().catch((error) => console.warn("Automatischer Kinder-Sync konnte nicht gestartet werden.", error));
  });
})();
