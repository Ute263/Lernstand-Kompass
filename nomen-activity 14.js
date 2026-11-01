/* Paket 3h: Aktivitätsanzeige für die Nomen-Probe.
 *
 * Auf echten Kindergeräten werden Beginn, Fortschritt, Abschluss und
 * ausdrücklicher Abbruch als pseudonymisierte Aktivitätsdatensätze gespeichert.
 * Sie liegen in learningGameSessions mit eigenem gameId und werden deshalb vom
 * vorhandenen Kinder-Sync automatisch übertragen, ohne die normale Testauswertung
 * zu verfälschen.
 */
(() => {
  if (typeof startNomenGame !== "function" ||
      typeof continueNomenStep !== "function" ||
      typeof finishNomenSession !== "function" ||
      typeof renderLearningGamesTeacher !== "function") {
    console.warn("Nomen-Aktivitätsanzeige konnte nicht initialisiert werden.");
    return;
  }

  const ACTIVITY_GAME_ID = "nomen-probe-activity";
  const MAX_ACTIVITY_RECORDS_PER_ANIMAL = 40;

  const baseStartNomenGame = startNomenGame;
  const baseContinueNomenStep = continueNomenStep;
  const baseFinishNomenSession = finishNomenSession;
  const baseLeaveNomenGame = typeof leaveNomenGame === "function" ? leaveNomenGame : null;
  const baseRenderLearningGamesTeacher = renderLearningGamesTeacher;

  function isRealChildDevice() {
    const marker = state?.lkChildSync;
    return !!(marker?.qrToken && marker?.animalId && marker?.classId);
  }

  function activityRecords() {
    return (state.learningGameSessions || []).filter((item) => item.gameId === ACTIVITY_GAME_ID && item.teacherReset !== true);
  }

  function activityById(id) {
    return activityRecords().find((item) => item.id === id) || null;
  }

  async function persistActivityRecord(record) {
    if (!record?.id) return;
    const others = (state.learningGameSessions || []).filter((item) => item.id !== record.id);
    const merged = [...others, record];

    // Alte reine Aktivitätsmeldungen begrenzen; abgeschlossene Testdaten bleiben unberührt.
    const sameAnimalActivities = merged
      .filter((item) => item.gameId === ACTIVITY_GAME_ID && item.animalId === record.animalId)
      .sort((a, b) => new Date(b.startedAt || 0) - new Date(a.startedAt || 0));

    const keepIds = new Set(sameAnimalActivities.slice(0, MAX_ACTIVITY_RECORDS_PER_ANIMAL).map((item) => item.id));
    const pruned = merged.filter((item) => (
      item.gameId !== ACTIVITY_GAME_ID
      || item.animalId !== record.animalId
      || keepIds.has(item.id)
    ));

    await persist({ ...state, learningGameSessions: pruned });
  }

  function makeActivityRecord(runtime) {
    const timestamp = runtime.startedAt || nowIso();
    return {
      id: `activity-${makeId()}`,
      gameId: ACTIVITY_GAME_ID,
      gameTitle: "Nomen-Probe – Aktivität",
      classId: runtime.classId,
      animalId: runtime.animalId,
      mode: runtime.mode,
      status: "in_progress",
      totalWords: Array.isArray(runtime.rounds) ? runtime.rounds.length : 10,
      processedWords: 0,
      currentWord: 1,
      startedAt: timestamp,
      lastActivityAt: timestamp,
      updatedAt: timestamp,
      abortedAt: "",
      completedAt: "",
      items: [],
      summary: {}
    };
  }

  function updateActivity(fields = {}) {
    const runtime = nomenGameRuntime;
    const id = runtime?.activityId;
    if (!id) return Promise.resolve();

    const previous = activityById(id);
    if (!previous) return Promise.resolve();

    const timestamp = nowIso();
    return persistActivityRecord({
      ...previous,
      ...fields,
      lastActivityAt: fields.lastActivityAt || timestamp,
      updatedAt: timestamp
    });
  }

  startNomenGame = function startNomenGameWithActivity(mode) {
    baseStartNomenGame(mode);
    if (!nomenGameRuntime || !isRealChildDevice()) return;

    const record = makeActivityRecord(nomenGameRuntime);
    nomenGameRuntime.activityId = record.id;
    persistActivityRecord(record).catch((error) => {
      console.warn("Start der Nomen-Probe konnte noch nicht als Aktivität gespeichert werden.", error);
    });
  };

  continueNomenStep = function continueNomenStepWithActivity() {
    const beforeRuntime = nomenGameRuntime;
    if (!beforeRuntime) return baseContinueNomenStep();

    const beforeIndex = beforeRuntime.roundIndex;
    const beforePhase = beforeRuntime.phase;
    baseContinueNomenStep();

    const runtime = nomenGameRuntime;
    if (!runtime?.activityId || !isRealChildDevice()) return;

    // Ein Wort ist genau dann vollständig bearbeitet, wenn nach dem vierten
    // Prüfschritt die Wort-Rückmeldung erreicht wird.
    if (beforePhase === "feedback" && runtime.phase === "wordResult") {
      const processedWords = Math.min(runtime.rounds.length, beforeIndex + 1);
      updateActivity({
        status: "in_progress",
        processedWords,
        currentWord: Math.min(runtime.rounds.length, processedWords + 1)
      }).catch(() => {});
    }
  };

  finishNomenSession = async function finishNomenSessionWithActivity() {
    const runtime = nomenGameRuntime;
    const activityId = runtime?.activityId || "";
    await baseFinishNomenSession();

    if (!activityId || !isRealChildDevice()) return;
    const previous = activityById(activityId);
    if (!previous) return;

    const timestamp = nowIso();
    await persistActivityRecord({
      ...previous,
      status: "completed",
      processedWords: Number(previous.totalWords || 10),
      currentWord: Number(previous.totalWords || 10),
      completedAt: timestamp,
      lastActivityAt: timestamp,
      updatedAt: timestamp
    });
  };

  leaveNomenGame = async function leaveNomenGameWithActivity() {
    if (!nomenGameRuntime || nomenGameRuntime.savedSession) {
      if (baseLeaveNomenGame) baseLeaveNomenGame();
      return;
    }

    if (!confirm("Möchtest du diese Runde wirklich beenden? Die angefangene Runde wird als abgebrochen gespeichert.")) {
      return;
    }

    const runtime = nomenGameRuntime;
    const activityId = runtime.activityId || "";
    if (activityId && isRealChildDevice()) {
      const previous = activityById(activityId);
      if (previous) {
        const timestamp = nowIso();
        await persistActivityRecord({
          ...previous,
          status: "aborted",
          processedWords: Math.max(
            Number(previous.processedWords || 0),
            Array.isArray(runtime.itemResults) ? runtime.itemResults.length : 0
          ),
          currentWord: Math.min(
            Number(previous.totalWords || 10),
            (Array.isArray(runtime.itemResults) ? runtime.itemResults.length : 0) + 1
          ),
          abortedAt: timestamp,
          lastActivityAt: timestamp,
          updatedAt: timestamp
        });
      }
    }

    nomenGameRuntime = null;
    screen = "childNomenStart";
    render();
  };

  function activityStatusMeta(item) {
    if (item.status === "aborted") return { icon: "❌", label: "abgebrochen" };
    if (item.status === "completed") return { icon: "✅", label: "beendet" };
    return { icon: "🟢", label: "gestartet / läuft" };
  }

  function activityTimeLabel(item) {
    if (item.status === "aborted" && item.abortedAt) {
      return `abgebrochen ${formatDateTime(item.abortedAt)}`;
    }
    if (item.status === "completed" && item.completedAt) {
      return `beendet ${formatDateTime(item.completedAt)}`;
    }
    return item.lastActivityAt
      ? `letzte Aktivität ${formatDateTime(item.lastActivityAt)}`
      : "gerade gestartet";
  }

  function renderNomenActivityPanel() {
    const recent = activityRecords()
      .filter((item) => item.classId === state.activeClassId)
      .sort((a, b) => new Date(b.startedAt || 0) - new Date(a.startedAt || 0))
      .slice(0, 30);

    const running = recent.filter((item) => item.status === "in_progress").length;
    const aborted = recent.filter((item) => item.status === "aborted").length;

    return `
      <section class="panel nomen-activity-panel">
        <div class="learning-games-teacher-title">
          <div>
            <h2>Aktivität der Kinder</h2>
            <p class="message">Hier siehst du auch angefangene und abgebrochene Nomen-Proben. Die Anzeige wird über den Klassen-Sync aktualisiert.</p>
          </div>
        </div>

        <div class="nomen-stat-grid">
          <article><strong>${running}</strong><span>gestartet / läuft</span></article>
          <article><strong>${aborted}</strong><span>abgebrochen</span></article>
          <article><strong>${recent.length}</strong><span>letzte Aktivitäten</span></article>
        </div>

        <div class="table-scroll">
          <table class="nomen-results-table">
            <thead>
              <tr>
                <th>Tier</th>
                <th>Modus</th>
                <th>Gestartet</th>
                <th>Bearbeitet</th>
                <th>Status</th>
                <th>Letzte Meldung</th>
              </tr>
            </thead>
            <tbody>
              ${recent.length
                ? recent.map((item) => {
                    const animal = (state.animals || []).find((entry) => entry.id === item.animalId);
                    const status = activityStatusMeta(item);
                    const processed = Math.max(0, Math.min(Number(item.totalWords || 10), Number(item.processedWords || 0)));
                    const total = Number(item.totalWords || 10);
                    return `
                      <tr>
                        <td><strong>${animal ? teacherAnimalLabel(animal) : "Tier"}</strong></td>
                        <td>${item.mode === "test" ? "Test" : "Üben"}</td>
                        <td>${escapeHtml(formatDateTime(item.startedAt))}</td>
                        <td><strong>${processed} von ${total}</strong> Wörtern</td>
                        <td><strong>${status.icon} ${escapeHtml(status.label)}</strong></td>
                        <td>${escapeHtml(activityTimeLabel(item))}</td>
                      </tr>
                    `;
                  }).join("")
                : `<tr><td colspan="6">Noch keine gestarteten Nomen-Proben gemeldet.</td></tr>`}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  renderLearningGamesTeacher = function renderLearningGamesTeacherWithActivity() {
    return `${renderNomenActivityPanel()}${baseRenderLearningGamesTeacher()}`;
  };
})();
