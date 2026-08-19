/* Paket 6: Lernspiele Deutsch + Mathe
 *
 * Deutsch:
 * - Verb-Probe
 * - Adjektiv-Probe
 * - Wortarten-Mix
 *
 * Mathe:
 * - Einmaleins: 1er, 2er, 5er, 10er, Grundreihen gemischt
 * - 10-Minuten-Kopfrechnen:
 *   + / - / gemischt bis 20
 *   + / - / gemischt bis 100 ohne Zehnerübergang
 *   + / - / gemischt bis 100 mit Zehnerübergang
 *   alles gemischt bis 100
 *
 * Alle Ergebnisse werden pseudonym über die vorhandene Tier-ID gespeichert
 * und laufen über den bestehenden Kinder-Sync.
 */
(() => {
  if (typeof renderChildScreen !== "function" ||
      typeof renderLearningGamesChildHome !== "function" ||
      typeof renderLearningGamesTeacher !== "function") {
    console.warn("Paket 6 konnte nicht initialisiert werden.");
    return;
  }

  const LG_ACTIVITY_ID = "learning-game-activity";
  const LG_GAME_IDS = new Set([
    "verb-probe",
    "adjektiv-probe",
    "wortarten-mix",
    "einmaleins-grundreihen",
    "kopfrechnen-10-min"
  ]);
  const LG_ACTIVITY_PUSH_EVERY = 5;
  const LG_ACTIVITY_PUSH_MS = 15_000;
  const LG_MENTAL_SECONDS = 10 * 60;

  const VERB_WORDS = [
    ["läuft", "laufen"], ["spielt", "spielen"], ["malt", "malen"], ["springt", "springen"],
    ["lacht", "lachen"], ["schläft", "schlafen"], ["schreibt", "schreiben"], ["liest", "lesen"],
    ["isst", "essen"], ["trinkt", "trinken"], ["singt", "singen"], ["tanzt", "tanzen"],
    ["rechnet", "rechnen"], ["lernt", "lernen"], ["trägt", "tragen"], ["fährt", "fahren"],
    ["sieht", "sehen"], ["gibt", "geben"], ["ruft", "rufen"], ["kommt", "kommen"]
  ].map(([word, infinitive]) => ({ word, type: "Verb", infinitive }));

  const ADJECTIVE_WORDS = [
    ["klein", "kleiner"], ["groß", "größer"], ["schnell", "schneller"], ["langsam", "langsamer"],
    ["bunt", "bunter"], ["weich", "weicher"], ["laut", "lauter"], ["leise", "leiser"],
    ["warm", "wärmer"], ["kalt", "kälter"], ["hell", "heller"], ["dunkel", "dunkler"],
    ["stark", "stärker"], ["schwach", "schwächer"], ["lang", "länger"], ["kurz", "kürzer"],
    ["alt", "älter"], ["jung", "jünger"], ["hoch", "höher"], ["tief", "tiefer"]
  ].map(([word, comparative]) => ({ word, type: "Adjektiv", comparative }));

  const NOUN_WORDS = [
    "Hund", "Katze", "Baum", "Blume", "Ball", "Buch", "Kind", "Tisch", "Schule", "Sonne",
    "Haus", "Vogel", "Tasse", "Heft", "Fahrrad", "Maus", "Pferd", "Stift", "Jacke", "Garten"
  ].map((word) => ({ word, type: "Nomen" }));

  const VERB_BASES = VERB_WORDS.map((item) => item.infinitive);
  const ADJECTIVE_FORMS = ADJECTIVE_WORDS.map((item) => item.comparative);

  const MULTIPLICATION_VARIANTS = {
    "1": { label: "1er-Reihe", rows: [1], icon: "1×" },
    "2": { label: "2er-Reihe", rows: [2], icon: "2×" },
    "5": { label: "5er-Reihe", rows: [5], icon: "5×" },
    "10": { label: "10er-Reihe", rows: [10], icon: "10×" },
    mixed: { label: "Grundreihen gemischt", rows: [1, 2, 5, 10], icon: "×" }
  };

  const MENTAL_CATEGORIES = {
    "20-plus": { label: "Plus bis 20", group: "Bis 20", icon: "＋", range: 20, op: "plus", transition: "any" },
    "20-minus": { label: "Minus bis 20", group: "Bis 20", icon: "−", range: 20, op: "minus", transition: "any" },
    "20-mixed": { label: "Plus und Minus bis 20", group: "Bis 20", icon: "±", range: 20, op: "mixed", transition: "any" },

    "100-plus-no": { label: "Plus ohne Zehnerübergang", group: "Bis 100 · ohne Zehnerübergang", icon: "＋", range: 100, op: "plus", transition: "no" },
    "100-minus-no": { label: "Minus ohne Zehnerübergang", group: "Bis 100 · ohne Zehnerübergang", icon: "−", range: 100, op: "minus", transition: "no" },
    "100-mixed-no": { label: "Plus und Minus ohne Zehnerübergang", group: "Bis 100 · ohne Zehnerübergang", icon: "±", range: 100, op: "mixed", transition: "no" },

    "100-plus-cross": { label: "Plus mit Zehnerübergang", group: "Bis 100 · mit Zehnerübergang", icon: "＋", range: 100, op: "plus", transition: "cross" },
    "100-minus-cross": { label: "Minus mit Zehnerübergang", group: "Bis 100 · mit Zehnerübergang", icon: "−", range: 100, op: "minus", transition: "cross" },
    "100-mixed-cross": { label: "Plus und Minus mit Zehnerübergang", group: "Bis 100 · mit Zehnerübergang", icon: "±", range: 100, op: "mixed", transition: "cross" },

    "100-all": { label: "Alles gemischt bis 100", group: "Bis 100 · alles gemischt", icon: "🧠", range: 100, op: "mixed", transition: "any" }
  };

  let lgRuntime = null;
  let lgTeacherFilter = "all";
  let lgTeacherDetailId = "";
  let lgTimerHandle = null;

  const baseRenderChildScreen = renderChildScreen;
  const baseLearningGamesChildHome = renderLearningGamesChildHome;
  const baseRenderLearningGamesTeacher = renderLearningGamesTeacher;
  const baseGoHome = typeof goHome === "function" ? goHome : null;

  function lgShuffle(list) {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function lgRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function lgAnimal() {
    return typeof selectedAnimal === "function" ? selectedAnimal() : null;
  }

  function lgAnimalBadge() {
    const animal = lgAnimal();
    return animal
      ? `${escapeHtml(animal.tierEmoji || "🐾")} ${escapeHtml(animal.tierName || "Tier")}`
      : "Tier";
  }

  function lgNow() {
    return typeof nowIso === "function" ? nowIso() : new Date().toISOString();
  }

  function lgDurationSeconds(startedMs) {
    return Math.max(0, Math.round((Date.now() - Number(startedMs || Date.now())) / 1000));
  }

  function lgSessionList() {
    return Array.isArray(state.learningGameSessions) ? state.learningGameSessions : [];
  }

  function lgActivityRecord() {
    if (!lgRuntime?.activityId) return null;
    return lgSessionList().find((item) => item.id === lgRuntime.activityId) || null;
  }

  async function lgPersistSessions(sessions) {
    await persist({ ...state, learningGameSessions: sessions });
  }

  async function lgStartActivity({
    gameId,
    gameTitle,
    variant = "",
    variantLabel = "",
    mode = "",
    totalItems = 10,
    timeLimitSeconds = 0
  }) {
    const animal = lgAnimal();
    if (!animal) return "";
    const timestamp = lgNow();
    const record = {
      id: `activity-${makeId()}`,
      gameId: LG_ACTIVITY_ID,
      activityGameId: gameId,
      gameTitle,
      classId: state.activeClassId,
      animalId: animal.id,
      variant,
      variantLabel,
      mode,
      status: "in_progress",
      processedItems: 0,
      totalItems,
      correctItems: 0,
      wrongItems: 0,
      timeLimitSeconds,
      startedAt: timestamp,
      lastActivityAt: timestamp,
      updatedAt: timestamp,
      abortedAt: "",
      completedAt: ""
    };
    await lgPersistSessions([...lgSessionList(), record]);
    return record.id;
  }

  async function lgUpdateActivity(fields = {}, force = true) {
    const activity = lgActivityRecord();
    if (!activity) return;
    const timestamp = lgNow();
    const updated = {
      ...activity,
      ...fields,
      lastActivityAt: fields.lastActivityAt || timestamp,
      updatedAt: timestamp
    };
    const list = lgSessionList().map((item) => item.id === activity.id ? updated : item);
    if (force) {
      await lgPersistSessions(list);
    } else {
      state = await storage.save({ ...state, learningGameSessions: list });
    }
  }

  async function lgCompleteSession(session, activityFields = {}) {
    const activity = lgActivityRecord();
    const timestamp = session.finishedAt || lgNow();
    const completedActivity = activity ? {
      ...activity,
      ...activityFields,
      status: "completed",
      completedAt: timestamp,
      lastActivityAt: timestamp,
      updatedAt: timestamp
    } : null;

    const existing = lgSessionList().filter((item) => item.id !== session.id);
    const next = completedActivity
      ? existing.map((item) => item.id === completedActivity.id ? completedActivity : item)
      : existing;

    await lgPersistSessions([...next, session]);
    lgRuntime.savedSession = session;
    lgRuntime.finished = true;

    if (typeof syncLearningGameSessionAfterSave === "function") {
      try {
        await syncLearningGameSessionAfterSave(session);
      } catch {}
    }
  }

  async function lgAbortRuntime({ renderAfter = true, target = "childLearningGames" } = {}) {
    if (!lgRuntime || lgRuntime.finished) {
      lgClearTimer();
      lgRuntime = null;
      if (renderAfter) {
        screen = target;
        render();
      }
      return;
    }

    lgClearTimer();
    const timestamp = lgNow();
    const processedItems =
      lgRuntime.kind === "mental"
        ? lgRuntime.items.length
        : Math.min(10, Number(lgRuntime.index || 0) + (lgRuntime.feedback ? 1 : 0));

    const correctItems =
      lgRuntime.kind === "mental"
        ? lgRuntime.items.filter((item) => item.correct).length
        : Array.isArray(lgRuntime.results)
          ? lgRuntime.results.filter((item) => item.correct || item.firstTry).length
          : 0;

    await lgUpdateActivity({
      status: "aborted",
      processedItems,
      correctItems,
      wrongItems: Math.max(0, processedItems - correctItems),
      abortedAt: timestamp
    });

    lgRuntime = null;
    if (renderAfter) {
      screen = target;
      render();
    }
  }

  function lgClearTimer() {
    if (lgTimerHandle) {
      clearInterval(lgTimerHandle);
      lgTimerHandle = null;
    }
  }

  /* --------------------- Lernspiel-Startseite --------------------- */

  renderLearningGamesChildHome = function renderLearningGamesChildHomePlus() {
    const animal = lgAnimal();
    return `
      <section class="step-wrap learning-games-child-home lg-game-home">
        ${renderBackButton("childSubject")}
        <div class="learning-games-title-row">
          <div>
            <p class="learning-games-kicker">Lernspiele</p>
            <h2 class="child-title">Was möchtest du üben?</h2>
            <p class="message">${animal ? `Hallo ${escapeHtml(animal.tierEmoji)} ${escapeHtml(animal.tierName)}! ` : ""}Wähle Deutsch oder Mathe.</p>
          </div>
          <img class="nomen-toni-small" src="materials/toni-nomen.png" alt="Toni" />
        </div>

        <div class="lg-subject-heading"><span>📘</span><div><strong>Deutsch</strong><small>Wörter und Wortarten sicher erkennen</small></div></div>
        <div class="learning-game-card-grid lg-card-grid">
          <button class="learning-game-card" type="button" onclick="openNomenProbe()">
            <span class="learning-game-icon">⭐</span>
            <strong>Nomen-Probe</strong>
            <small>Name – Artikel – Mehrzahl – entscheiden</small>
          </button>
          <button class="learning-game-card" type="button" onclick="lgOpenLanguage('verb')">
            <span class="learning-game-icon">🏃</span>
            <strong>Verb-Probe</strong>
            <small>Tun-Wort – Grundform – Verb erkennen</small>
          </button>
          <button class="learning-game-card" type="button" onclick="lgOpenLanguage('adjective')">
            <span class="learning-game-icon">🎨</span>
            <strong>Adjektiv-Probe</strong>
            <small>Eigenschaft – Steigerung – Adjektiv erkennen</small>
          </button>
          <button class="learning-game-card" type="button" onclick="lgOpenLanguage('mix')">
            <span class="learning-game-icon">🔤</span>
            <strong>Wortarten-Mix</strong>
            <small>Nomen · Verb · Adjektiv</small>
          </button>
        </div>

        <div class="lg-subject-heading math"><span>🔢</span><div><strong>Mathe</strong><small>Grundreihen und Kopfrechnen</small></div></div>
        <div class="learning-game-card-grid lg-card-grid">
          <button class="learning-game-card" type="button" onclick="lgOpenMultiplication()">
            <span class="learning-game-icon">✖️</span>
            <strong>Einmaleins</strong>
            <small>1er · 2er · 5er · 10er · gemischt</small>
          </button>
          <button class="learning-game-card lg-mental-card" type="button" onclick="lgOpenMentalMath()">
            <span class="learning-game-icon">🧠</span>
            <strong>10-Minuten-Kopfrechnen</strong>
            <small>Wie viele Aufgaben schaffst du in 10 Minuten?</small>
          </button>
        </div>
      </section>
    `;
  };

  /* --------------------- Deutsch --------------------- */

  function lgLanguageConfig(key) {
    if (key === "verb") {
      return {
        key,
        gameId: "verb-probe",
        title: "Verb-Probe",
        icon: "🏃",
        intro: "Prüfe: Kann jemand das tun? Finde die Grundform und entscheide.",
        steps: ["action", "base", "decision"]
      };
    }
    if (key === "adjective") {
      return {
        key,
        gameId: "adjektiv-probe",
        title: "Adjektiv-Probe",
        icon: "🎨",
        intro: "Prüfe: Beschreibt das Wort, wie jemand oder etwas ist? Kann man es steigern?",
        steps: ["property", "comparative", "decision"]
      };
    }
    return {
      key: "mix",
      gameId: "wortarten-mix",
      title: "Wortarten-Mix",
      icon: "🔤",
      intro: "Entscheide bei jedem Wort: Nomen, Verb oder Adjektiv?",
      steps: ["class"]
    };
  }

  function lgCreateLanguageItems(key) {
    if (key === "verb") {
      const positives = lgShuffle(VERB_WORDS).slice(0, 7);
      const negatives = lgShuffle([...ADJECTIVE_WORDS, ...NOUN_WORDS]).slice(0, 3);
      return lgShuffle([...positives, ...negatives]).map((item) => lgPrepareLanguageItem(item, key));
    }
    if (key === "adjective") {
      const positives = lgShuffle(ADJECTIVE_WORDS).slice(0, 7);
      const negatives = lgShuffle([...VERB_WORDS, ...NOUN_WORDS]).slice(0, 3);
      return lgShuffle([...positives, ...negatives]).map((item) => lgPrepareLanguageItem(item, key));
    }
    const nouns = lgShuffle(NOUN_WORDS).slice(0, 4);
    const verbs = lgShuffle(VERB_WORDS).slice(0, 3);
    const adjectives = lgShuffle(ADJECTIVE_WORDS).slice(0, 3);
    return lgShuffle([...nouns, ...verbs, ...adjectives]).map((item) => lgPrepareLanguageItem(item, key));
  }

  function lgPrepareLanguageItem(item, key) {
    const prepared = { ...item };
    if (key === "verb") {
      const wrongBases = lgShuffle(VERB_BASES.filter((value) => value !== item.infinitive)).slice(0, 2);
      const baseChoices = item.type === "Verb"
        ? lgShuffle([item.infinitive, ...wrongBases, "none"])
        : lgShuffle([...lgShuffle(VERB_BASES).slice(0, 3), "none"]);
      prepared.baseChoices = [...new Set(baseChoices)];
    }
    if (key === "adjective") {
      const wrongForms = lgShuffle(ADJECTIVE_FORMS.filter((value) => value !== item.comparative)).slice(0, 2);
      const comparativeChoices = item.type === "Adjektiv"
        ? lgShuffle([item.comparative, ...wrongForms, "none"])
        : lgShuffle([...lgShuffle(ADJECTIVE_FORMS).slice(0, 3), "none"]);
      prepared.comparativeChoices = [...new Set(comparativeChoices)];
    }
    return prepared;
  }

  window.lgOpenLanguage = function lgOpenLanguage(key) {
    lgRuntime = null;
    lgClearTimer();
    childDraft.lgLanguageKey = key;
    screen = "childLGLanguageStart";
    render();
  };

  function lgRenderLanguageStart() {
    const config = lgLanguageConfig(childDraft.lgLanguageKey || "verb");
    return `
      <section class="nomen-shell lg-start-shell">
        <div class="nomen-start-top">
          <button class="secondary" type="button" onclick="setChildScreen('childLearningGames')">Zurück</button>
          <div class="nomen-player-badge">${lgAnimalBadge()}</div>
        </div>
        <div class="lg-simple-hero">
          <span>${config.icon}</span>
          <div>
            <h2>${escapeHtml(config.title)}</h2>
            <p>${escapeHtml(config.intro)}</p>
          </div>
        </div>

        ${config.key === "verb" ? `
          <div class="lg-probe-steps">
            <article><b>1</b><strong>Tun?</strong><small>Kann jemand das tun?</small></article>
            <article><b>2</b><strong>Grundform?</strong><small>z. B. läuft → laufen</small></article>
            <article><b>3</b><strong>Verb?</strong><small>Entscheide.</small></article>
          </div>
        ` : config.key === "adjective" ? `
          <div class="lg-probe-steps">
            <article><b>1</b><strong>Eigenschaft?</strong><small>Wie ist jemand oder etwas?</small></article>
            <article><b>2</b><strong>Steigern?</strong><small>z. B. klein → kleiner</small></article>
            <article><b>3</b><strong>Adjektiv?</strong><small>Entscheide.</small></article>
          </div>
        ` : `
          <div class="lg-probe-steps single">
            <article><b>🔤</b><strong>Drei Wortarten</strong><small>Nomen · Verb · Adjektiv</small></article>
          </div>
        `}

        <div class="nomen-mode-grid">
          <button class="nomen-mode-card practice" type="button" onclick="lgStartLanguage('practice')">
            <span>🌱</span><strong>Üben</strong><small>Bei einem Fehler darfst du es noch einmal versuchen.</small>
          </button>
          <button class="nomen-mode-card test" type="button" onclick="lgStartLanguage('test')">
            <span>🎯</span><strong>Test</strong><small>Jede Antwort zählt beim ersten Versuch.</small>
          </button>
        </div>
        <p class="nomen-round-info">Eine Runde hat 10 Wörter.</p>
      </section>
    `;
  }

  window.lgStartLanguage = async function lgStartLanguage(mode) {
    const animal = lgAnimal();
    if (!animal) return;
    const config = lgLanguageConfig(childDraft.lgLanguageKey || "verb");
    const items = lgCreateLanguageItems(config.key);
    lgRuntime = {
      kind: "language",
      config,
      mode: mode === "test" ? "test" : "practice",
      animalId: animal.id,
      classId: state.activeClassId,
      startedAt: lgNow(),
      startedMs: Date.now(),
      items,
      index: 0,
      stageIndex: 0,
      attempts: 1,
      hint: "",
      currentSteps: {},
      results: [],
      feedback: null,
      savedSession: null,
      finished: false
    };
    lgRuntime.activityId = await lgStartActivity({
      gameId: config.gameId,
      gameTitle: config.title,
      mode: lgRuntime.mode,
      totalItems: 10
    });
    screen = "childLGLanguagePlay";
    render();
  };

  function lgCurrentLanguageItem() {
    return lgRuntime?.items?.[lgRuntime.index] || null;
  }

  function lgCurrentLanguageStep() {
    return lgRuntime?.config?.steps?.[lgRuntime.stageIndex] || "";
  }

  function lgLanguageChoiceButton(value, label, icon = "") {
    return `<button class="lg-choice-button" type="button" onclick='lgAnswerLanguage(${JSON.stringify(value)})'>${icon ? `<span>${icon}</span>` : ""}<strong>${escapeHtml(label)}</strong></button>`;
  }

  function lgRenderLanguageQuestion(item, step) {
    const config = lgRuntime.config;

    if (step === "action") {
      return `
        <p class="lg-question-title">Kann jemand <strong>„${escapeHtml(item.word)}“</strong> tun?</p>
        <div class="lg-choice-grid two">
          ${lgLanguageChoiceButton("yes", "Ja", "👍")}
          ${lgLanguageChoiceButton("no", "Nein", "👎")}
        </div>
      `;
    }

    if (step === "base") {
      return `
        <p class="lg-question-title">Wie heißt die <strong>Grundform</strong>?</p>
        <div class="lg-choice-grid">
          ${item.baseChoices.map((choice) => lgLanguageChoiceButton(
            choice,
            choice === "none" ? "Keine Grundform" : choice
          )).join("")}
        </div>
      `;
    }

    if (step === "property") {
      return `
        <p class="lg-question-title">Beschreibt <strong>„${escapeHtml(item.word)}“</strong>, wie jemand oder etwas ist?</p>
        <div class="lg-choice-grid two">
          ${lgLanguageChoiceButton("yes", "Ja", "👍")}
          ${lgLanguageChoiceButton("no", "Nein", "👎")}
        </div>
      `;
    }

    if (step === "comparative") {
      return `
        <p class="lg-question-title">Wie kannst du das Wort <strong>steigern</strong>?</p>
        <div class="lg-choice-grid">
          ${item.comparativeChoices.map((choice) => lgLanguageChoiceButton(
            choice,
            choice === "none" ? "Nicht steigern" : choice
          )).join("")}
        </div>
      `;
    }

    if (step === "decision" && config.key === "verb") {
      return `
        <p class="lg-question-title">Ist <strong>„${escapeHtml(item.word)}“</strong> ein Verb?</p>
        <div class="lg-choice-grid two">
          ${lgLanguageChoiceButton("verb", "Verb", "🏃")}
          ${lgLanguageChoiceButton("not", "kein Verb", "✋")}
        </div>
      `;
    }

    if (step === "decision" && config.key === "adjective") {
      return `
        <p class="lg-question-title">Ist <strong>„${escapeHtml(item.word)}“</strong> ein Adjektiv?</p>
        <div class="lg-choice-grid two">
          ${lgLanguageChoiceButton("adjective", "Adjektiv", "🎨")}
          ${lgLanguageChoiceButton("not", "kein Adjektiv", "✋")}
        </div>
      `;
    }

    return `
      <p class="lg-question-title">Welche Wortart ist <strong>„${escapeHtml(item.word)}“</strong>?</p>
      <div class="lg-choice-grid three">
        ${lgLanguageChoiceButton("Nomen", "Nomen", "📦")}
        ${lgLanguageChoiceButton("Verb", "Verb", "🏃")}
        ${lgLanguageChoiceButton("Adjektiv", "Adjektiv", "🎨")}
      </div>
    `;
  }

  function lgCorrectLanguageValue(item, step) {
    if (step === "action") return item.type === "Verb" ? "yes" : "no";
    if (step === "base") return item.type === "Verb" ? item.infinitive : "none";
    if (step === "property") return item.type === "Adjektiv" ? "yes" : "no";
    if (step === "comparative") return item.type === "Adjektiv" ? item.comparative : "none";
    if (step === "decision" && lgRuntime.config.key === "verb") return item.type === "Verb" ? "verb" : "not";
    if (step === "decision" && lgRuntime.config.key === "adjective") return item.type === "Adjektiv" ? "adjective" : "not";
    if (step === "class") return item.type;
    return "";
  }

  function lgLanguageHint(item, step) {
    if (step === "action") return "Frage dich: Kann jemand das wirklich tun?";
    if (step === "base") return "Sprich: ich …, du …, er/sie … – wie heißt die Grundform?";
    if (step === "property") return "Frage: Wie ist jemand oder etwas?";
    if (step === "comparative") return "Probiere: …, noch …, am …sten.";
    if (step === "decision") return "Nutze die Proben von eben.";
    return "Achte darauf, was das Wort bezeichnet oder beschreibt.";
  }

  function lgLanguageSolution(item) {
    if (lgRuntime.config.key === "verb") {
      return item.type === "Verb"
        ? `Ja. Grundform: ${item.infinitive}. „${item.word}“ ist ein Verb.`
        : `„${item.word}“ ist ${item.type === "Nomen" ? "ein Nomen" : "ein Adjektiv"} und kein Verb.`;
    }
    if (lgRuntime.config.key === "adjective") {
      return item.type === "Adjektiv"
        ? `Ja. Steigerung: ${item.word} – ${item.comparative}. „${item.word}“ ist ein Adjektiv.`
        : `„${item.word}“ ist ${item.type === "Nomen" ? "ein Nomen" : "ein Verb"} und kein Adjektiv.`;
    }
    return `„${item.word}“ ist ${item.type === "Nomen" ? "ein Nomen" : item.type === "Verb" ? "ein Verb" : "ein Adjektiv"}.`;
  }

  window.lgAnswerLanguage = async function lgAnswerLanguage(value) {
    if (!lgRuntime || lgRuntime.kind !== "language" || lgRuntime.feedback) return;
    const item = lgCurrentLanguageItem();
    const step = lgCurrentLanguageStep();
    if (!item || !step) return;

    const correctValue = lgCorrectLanguageValue(item, step);
    const correct = value === correctValue;

    if (lgRuntime.mode === "practice" && !correct) {
      lgRuntime.attempts += 1;
      lgRuntime.hint = `❌ Noch nicht. ${lgLanguageHint(item, step)}`;
      render();
      return;
    }

    lgRuntime.currentSteps[step] = {
      answer: value,
      correct,
      attempts: lgRuntime.attempts,
      firstTry: correct && lgRuntime.attempts === 1
    };
    lgRuntime.hint = "";

    if (lgRuntime.stageIndex < lgRuntime.config.steps.length - 1) {
      lgRuntime.stageIndex += 1;
      lgRuntime.attempts = 1;
      render();
      return;
    }

    const steps = { ...lgRuntime.currentSteps };
    const stepValues = Object.values(steps);
    const result = {
      word: item.word,
      type: item.type,
      infinitive: item.infinitive || "",
      comparative: item.comparative || "",
      steps,
      correct: stepValues.every((entry) => entry.correct),
      firstTry: stepValues.every((entry) => entry.firstTry)
    };
    lgRuntime.results.push(result);
    lgRuntime.feedback = {
      correct: lgRuntime.mode === "practice" ? result.firstTry : result.correct,
      hadRetry: lgRuntime.mode === "practice" && !result.firstTry,
      solution: lgLanguageSolution(item)
    };

    await lgUpdateActivity({
      processedItems: lgRuntime.results.length,
      correctItems: lgRuntime.results.filter((entry) => lgRuntime.mode === "practice" ? entry.firstTry : entry.correct).length,
      wrongItems: lgRuntime.results.filter((entry) => lgRuntime.mode === "practice" ? !entry.firstTry : !entry.correct).length
    });

    render();
  };

  window.lgNextLanguageWord = async function lgNextLanguageWord() {
    if (!lgRuntime || lgRuntime.kind !== "language" || !lgRuntime.feedback) return;
    if (lgRuntime.index >= lgRuntime.items.length - 1) {
      await lgFinishLanguage();
      return;
    }
    lgRuntime.index += 1;
    lgRuntime.stageIndex = 0;
    lgRuntime.attempts = 1;
    lgRuntime.hint = "";
    lgRuntime.currentSteps = {};
    lgRuntime.feedback = null;
    render();
  };

  async function lgFinishLanguage() {
    const runtime = lgRuntime;
    if (!runtime || runtime.finished) return;
    const finishedAt = lgNow();
    const direct = runtime.results.filter((item) => item.firstTry).length;
    const correct = runtime.results.filter((item) => item.correct).length;
    const score = runtime.mode === "practice" ? direct : correct;
    const session = {
      id: makeId(),
      gameId: runtime.config.gameId,
      gameTitle: runtime.config.title,
      classId: runtime.classId,
      animalId: runtime.animalId,
      mode: runtime.mode,
      startedAt: runtime.startedAt,
      finishedAt,
      durationSeconds: lgDurationSeconds(runtime.startedMs),
      items: runtime.results,
      summary: {
        totalItems: runtime.results.length,
        correctItems: correct,
        firstTryItems: direct,
        scoreItems: score,
        accuracy: runtime.results.length ? Math.round((score / runtime.results.length) * 100) : 0
      }
    };
    await lgCompleteSession(session, {
      processedItems: runtime.results.length,
      correctItems: score,
      wrongItems: runtime.results.length - score
    });
    screen = "childLGLanguageFinal";
    render();
  }

  function lgRenderLanguagePlay() {
    const item = lgCurrentLanguageItem();
    if (!lgRuntime || !item) return "";
    const progress = Math.min(10, lgRuntime.index + 1);
    const step = lgCurrentLanguageStep();

    return `
      <section class="nomen-shell lg-play-shell">
        <div class="lg-game-top">
          <button class="secondary" type="button" onclick="lgAbortGame()">Beenden</button>
          <div class="lg-progress-text">Wort ${progress} von 10</div>
          <div class="nomen-player-badge">${lgAnimalBadge()}</div>
        </div>
        <div class="lg-progress-bar"><span style="width:${Math.round((progress / 10) * 100)}%"></span></div>

        <div class="lg-word-card">
          <small>${escapeHtml(lgRuntime.config.title)}</small>
          <strong>${escapeHtml(item.word)}</strong>
        </div>

        ${lgRuntime.feedback ? `
          <section class="lg-result-card ${lgRuntime.feedback.correct ? "correct" : "wrong"}">
            <div class="lg-result-icon">${lgRuntime.feedback.correct ? "✅" : "❌"}</div>
            <h3>${lgRuntime.feedback.correct ? "Alles richtig!" : lgRuntime.feedback.hadRetry ? "Da war zuerst etwas falsch." : "Da war etwas falsch."}</h3>
            <p>${escapeHtml(lgRuntime.feedback.solution)}</p>
            <button class="primary" type="button" onclick="lgNextLanguageWord()">${lgRuntime.index >= 9 ? "Ergebnis ansehen" : "Nächstes Wort"}</button>
          </section>
        ` : `
          <div class="lg-step-label">Schritt ${lgRuntime.stageIndex + 1} von ${lgRuntime.config.steps.length}</div>
          ${lgRenderLanguageQuestion(item, step)}
          ${lgRuntime.hint ? `<div class="message error lg-inline-hint">${escapeHtml(lgRuntime.hint)}</div>` : ""}
        `}
      </section>
    `;
  }

  function lgRenderLanguageFinal() {
    const session = lgRuntime?.savedSession;
    if (!session) return "";
    const score = Number(session.summary?.scoreItems || 0);
    return `
      <section class="nomen-shell lg-final-shell">
        <div class="lg-final-icon">${score >= 8 ? "🌟" : "👏"}</div>
        <h2>${escapeHtml(session.gameTitle)} geschafft!</h2>
        <p class="lg-final-score"><strong>${score} von ${session.summary.totalItems}</strong> Wörtern ${session.mode === "practice" ? "direkt richtig" : "vollständig richtig"}.</p>
        <div class="confirm-actions">
          <button class="primary" type="button" onclick="lgReplayLanguage()">Noch eine Runde</button>
          <button class="secondary" type="button" onclick="lgReturnToGames()">Zu den Lernspielen</button>
        </div>
      </section>
    `;
  }

  window.lgReplayLanguage = function lgReplayLanguage() {
    const key = lgRuntime?.config?.key || childDraft.lgLanguageKey || "verb";
    lgRuntime = null;
    childDraft.lgLanguageKey = key;
    screen = "childLGLanguageStart";
    render();
  };

  /* --------------------- Einmaleins --------------------- */

  window.lgOpenMultiplication = function lgOpenMultiplication() {
    lgRuntime = null;
    lgClearTimer();
    screen = "childLGMultiplicationStart";
    render();
  };

  function lgCreateMultiplicationItems(variant) {
    const config = MULTIPLICATION_VARIANTS[variant] || MULTIPLICATION_VARIANTS.mixed;
    if (variant !== "mixed") {
      return lgShuffle(Array.from({ length: 10 }, (_, index) => {
        const b = index + 1;
        const a = config.rows[0];
        return { a, b, answer: a * b };
      }));
    }

    const pool = [];
    config.rows.forEach((a) => {
      for (let b = 1; b <= 10; b += 1) pool.push({ a, b, answer: a * b });
    });
    return lgShuffle(pool).slice(0, 10);
  }

  function lgMultiplicationBest(variant) {
    const sessions = lgSessionList().filter((item) => (
      item.gameId === "einmaleins-grundreihen" &&
      item.animalId === lgAnimal()?.id &&
      item.variant === variant &&
      item.finishedAt
    ));
    if (!sessions.length) return null;
    return Math.max(...sessions.map((item) => Number(item.summary?.scoreItems || 0)));
  }

  function lgRenderMultiplicationStart() {
    return `
      <section class="nomen-shell lg-start-shell">
        <div class="nomen-start-top">
          <button class="secondary" type="button" onclick="setChildScreen('childLearningGames')">Zurück</button>
          <div class="nomen-player-badge">${lgAnimalBadge()}</div>
        </div>
        <div class="lg-simple-hero">
          <span>✖️</span>
          <div>
            <h2>Einmaleins</h2>
            <p>Übe zuerst die Grundreihen: <strong>1er, 2er, 5er und 10er</strong>.</p>
          </div>
        </div>
        <div class="lg-variant-grid">
          ${Object.entries(MULTIPLICATION_VARIANTS).map(([key, variant]) => {
            const best = lgMultiplicationBest(key);
            return `
              <article class="lg-variant-card">
                <span>${escapeHtml(variant.icon)}</span>
                <strong>${escapeHtml(variant.label)}</strong>
                <small>${best === null ? "Noch keine Runde" : `Bestwert: ${best}/10`}</small>
                <div>
                  <button class="small-button" type="button" onclick="lgStartMultiplication('${key}','practice')">🌱 Üben</button>
                  <button class="small-button" type="button" onclick="lgStartMultiplication('${key}','test')">🎯 Test</button>
                </div>
              </article>
            `;
          }).join("")}
        </div>
      </section>
    `;
  }

  window.lgStartMultiplication = async function lgStartMultiplication(variant, mode) {
    const animal = lgAnimal();
    if (!animal) return;
    const config = MULTIPLICATION_VARIANTS[variant] || MULTIPLICATION_VARIANTS.mixed;
    lgRuntime = {
      kind: "multiplication",
      gameId: "einmaleins-grundreihen",
      gameTitle: "Einmaleins",
      variant,
      variantLabel: config.label,
      mode: mode === "test" ? "test" : "practice",
      animalId: animal.id,
      classId: state.activeClassId,
      startedAt: lgNow(),
      startedMs: Date.now(),
      items: lgCreateMultiplicationItems(variant),
      index: 0,
      attempts: 1,
      results: [],
      feedback: null,
      savedSession: null,
      finished: false,
      questionStartedMs: Date.now()
    };
    lgRuntime.activityId = await lgStartActivity({
      gameId: lgRuntime.gameId,
      gameTitle: lgRuntime.gameTitle,
      variant,
      variantLabel: config.label,
      mode: lgRuntime.mode,
      totalItems: 10
    });
    screen = "childLGMultiplicationPlay";
    render();
    setTimeout(() => document.querySelector("#lgMathAnswer")?.focus(), 0);
  };

  window.lgSubmitMultiplication = async function lgSubmitMultiplication(event) {
    event?.preventDefault?.();
    if (!lgRuntime || lgRuntime.kind !== "multiplication" || lgRuntime.feedback) return;
    const input = document.querySelector("#lgMathAnswer");
    const raw = String(input?.value || "").trim();
    if (!/^-?\d+$/.test(raw)) return;
    const value = Number(raw);
    const item = lgRuntime.items[lgRuntime.index];
    const correct = value === item.answer;

    if (lgRuntime.mode === "practice" && !correct) {
      lgRuntime.attempts += 1;
      lgRuntime.feedback = { retry: true, correct: false, message: "Noch nicht. Versuche es noch einmal." };
      render();
      setTimeout(() => document.querySelector("#lgMathAnswer")?.focus(), 0);
      return;
    }

    const result = {
      prompt: `${item.a} × ${item.b}`,
      a: item.a,
      b: item.b,
      correctAnswer: item.answer,
      answer: value,
      correct,
      attempts: lgRuntime.attempts,
      firstTry: correct && lgRuntime.attempts === 1,
      durationMs: Math.max(0, Date.now() - lgRuntime.questionStartedMs)
    };
    lgRuntime.results.push(result);
    lgRuntime.feedback = {
      retry: false,
      correct,
      message: correct ? "Richtig!" : `Richtig ist: ${item.a} × ${item.b} = ${item.answer}`
    };
    await lgUpdateActivity({
      processedItems: lgRuntime.results.length,
      correctItems: lgRuntime.results.filter((entry) => lgRuntime.mode === "practice" ? entry.firstTry : entry.correct).length,
      wrongItems: lgRuntime.results.filter((entry) => lgRuntime.mode === "practice" ? !entry.firstTry : !entry.correct).length
    });
    render();
  };

  window.lgRetryMultiplication = function lgRetryMultiplication() {
    if (!lgRuntime || lgRuntime.kind !== "multiplication" || !lgRuntime.feedback?.retry) return;
    lgRuntime.feedback = null;
    render();
    setTimeout(() => document.querySelector("#lgMathAnswer")?.focus(), 0);
  };

  window.lgNextMultiplication = async function lgNextMultiplication() {
    if (!lgRuntime || lgRuntime.kind !== "multiplication" || !lgRuntime.feedback || lgRuntime.feedback.retry) return;
    if (lgRuntime.index >= 9) {
      await lgFinishMultiplication();
      return;
    }
    lgRuntime.index += 1;
    lgRuntime.attempts = 1;
    lgRuntime.feedback = null;
    lgRuntime.questionStartedMs = Date.now();
    render();
    setTimeout(() => document.querySelector("#lgMathAnswer")?.focus(), 0);
  };

  async function lgFinishMultiplication() {
    const runtime = lgRuntime;
    if (!runtime || runtime.finished) return;
    const finishedAt = lgNow();
    const direct = runtime.results.filter((item) => item.firstTry).length;
    const correct = runtime.results.filter((item) => item.correct).length;
    const score = runtime.mode === "practice" ? direct : correct;
    const avgSeconds = runtime.results.length
      ? Math.round((runtime.results.reduce((sum, item) => sum + Number(item.durationMs || 0), 0) / runtime.results.length / 1000) * 10) / 10
      : 0;
    const session = {
      id: makeId(),
      gameId: runtime.gameId,
      gameTitle: runtime.gameTitle,
      classId: runtime.classId,
      animalId: runtime.animalId,
      variant: runtime.variant,
      variantLabel: runtime.variantLabel,
      mode: runtime.mode,
      startedAt: runtime.startedAt,
      finishedAt,
      durationSeconds: lgDurationSeconds(runtime.startedMs),
      items: runtime.results,
      summary: {
        totalItems: runtime.results.length,
        correctItems: correct,
        firstTryItems: direct,
        scoreItems: score,
        accuracy: runtime.results.length ? Math.round((score / runtime.results.length) * 100) : 0,
        avgSeconds
      }
    };
    await lgCompleteSession(session, {
      processedItems: runtime.results.length,
      correctItems: score,
      wrongItems: runtime.results.length - score
    });
    screen = "childLGMultiplicationFinal";
    render();
  }

  function lgRenderMultiplicationPlay() {
    const item = lgRuntime?.items?.[lgRuntime.index];
    if (!lgRuntime || !item) return "";
    const feedback = lgRuntime.feedback;
    return `
      <section class="nomen-shell lg-play-shell">
        <div class="lg-game-top">
          <button class="secondary" type="button" onclick="lgAbortGame()">Beenden</button>
          <div class="lg-progress-text">Aufgabe ${lgRuntime.index + 1} von 10</div>
          <div class="nomen-player-badge">${lgAnimalBadge()}</div>
        </div>
        <div class="lg-progress-bar"><span style="width:${Math.round(((lgRuntime.index + 1) / 10) * 100)}%"></span></div>
        <p class="lg-mini-title">${escapeHtml(lgRuntime.variantLabel)} · ${lgRuntime.mode === "test" ? "Test" : "Üben"}</p>
        <div class="lg-math-problem">${item.a} × ${item.b} = <span>?</span></div>

        ${feedback ? `
          <div class="lg-math-feedback ${feedback.correct ? "correct" : "wrong"}">
            <strong>${feedback.correct ? "✅" : "❌"} ${escapeHtml(feedback.message)}</strong>
            ${feedback.retry
              ? `<button class="primary" type="button" onclick="lgRetryMultiplication()">Noch einmal</button>`
              : `<button class="primary" type="button" onclick="lgNextMultiplication()">${lgRuntime.index >= 9 ? "Ergebnis ansehen" : "Nächste Aufgabe"}</button>`}
          </div>
        ` : `
          <form class="lg-answer-form" onsubmit="lgSubmitMultiplication(event)">
            <input id="lgMathAnswer" class="text-input lg-number-input" inputmode="numeric" autocomplete="off" aria-label="Ergebnis">
            <button class="primary" type="submit">Prüfen</button>
          </form>
        `}
      </section>
    `;
  }

  function lgRenderMultiplicationFinal() {
    const session = lgRuntime?.savedSession;
    if (!session) return "";
    const score = Number(session.summary?.scoreItems || 0);
    return `
      <section class="nomen-shell lg-final-shell">
        <div class="lg-final-icon">${score === 10 ? "🏆" : "🌟"}</div>
        <h2>${escapeHtml(session.variantLabel)} geschafft!</h2>
        <p class="lg-final-score"><strong>${score} von 10</strong> ${session.mode === "practice" ? "direkt richtig" : "richtig"}.</p>
        <p class="message">Ø ${escapeHtml(String(session.summary.avgSeconds).replace(".", ","))} Sekunden pro Aufgabe.</p>
        <div class="confirm-actions">
          <button class="primary" type="button" onclick="lgReplayMultiplication()">Noch eine Runde</button>
          <button class="secondary" type="button" onclick="lgReturnToGames()">Zu den Lernspielen</button>
        </div>
      </section>
    `;
  }

  window.lgReplayMultiplication = function lgReplayMultiplication() {
    lgRuntime = null;
    screen = "childLGMultiplicationStart";
    render();
  };

  /* --------------------- 10-Minuten-Kopfrechnen --------------------- */

  window.lgOpenMentalMath = function lgOpenMentalMath() {
    lgRuntime = null;
    lgClearTimer();
    screen = "childLGMentalStart";
    render();
  };

  function lgMentalBest(categoryKey) {
    const animal = lgAnimal();
    if (!animal) return null;
    const sessions = lgSessionList().filter((item) => (
      item.gameId === "kopfrechnen-10-min" &&
      item.animalId === animal.id &&
      item.variant === categoryKey &&
      item.finishedAt
    ));
    if (!sessions.length) return null;
    return Math.max(...sessions.map((item) => Number(item.summary?.correctItems || 0)));
  }

  function lgRenderMentalGroup(groupName) {
    const entries = Object.entries(MENTAL_CATEGORIES).filter(([, item]) => item.group === groupName);
    return `
      <section class="lg-mental-group">
        <h3>${escapeHtml(groupName)}</h3>
        <div class="lg-mental-grid">
          ${entries.map(([key, item]) => {
            const best = lgMentalBest(key);
            return `
              <button class="lg-mental-choice" type="button" onclick="lgStartMental('${key}')">
                <span>${escapeHtml(item.icon)}</span>
                <strong>${escapeHtml(item.label)}</strong>
                <small>${best === null ? "10 Minuten" : `Bestwert: ${best} richtig`}</small>
              </button>
            `;
          }).join("")}
        </div>
      </section>
    `;
  }

  function lgRenderMentalStart() {
    const groups = [...new Set(Object.values(MENTAL_CATEGORIES).map((item) => item.group))];
    return `
      <section class="nomen-shell lg-start-shell">
        <div class="nomen-start-top">
          <button class="secondary" type="button" onclick="setChildScreen('childLearningGames')">Zurück</button>
          <div class="nomen-player-badge">${lgAnimalBadge()}</div>
        </div>
        <div class="lg-simple-hero">
          <span>🧠</span>
          <div>
            <h2>10-Minuten-Kopfrechnen</h2>
            <p>Du hast <strong>10 Minuten Zeit</strong>. Wie viele Aufgaben schaffst du – und wie viele davon sind richtig?</p>
          </div>
        </div>
        <div class="lg-challenge-note">
          <strong>⏱️ Es zählt beides:</strong>
          <span>Wie viele Aufgaben du bearbeitest <b>und</b> wie genau du rechnest.</span>
        </div>
        ${groups.map(lgRenderMentalGroup).join("")}
      </section>
    `;
  }

  function lgGenerateMentalQuestion(categoryKey, previousKey = "") {
    const category = MENTAL_CATEGORIES[categoryKey] || MENTAL_CATEGORIES["20-mixed"];

    for (let guard = 0; guard < 200; guard += 1) {
      let op = category.op;
      let transition = category.transition;

      if (op === "mixed") op = Math.random() < 0.5 ? "plus" : "minus";
      if (category.range === 100 && transition === "any") transition = Math.random() < 0.5 ? "no" : "cross";

      let a, b, answer;

      if (category.range === 20) {
        if (op === "plus") {
          a = lgRandomInt(2, 18);
          b = lgRandomInt(1, Math.min(9, 20 - a));
          if (b < 1) continue;
          answer = a + b;
        } else {
          a = lgRandomInt(5, 20);
          b = lgRandomInt(1, Math.min(9, a));
          answer = a - b;
        }
      } else if (op === "plus") {
        a = lgRandomInt(11, 91);
        const ones = a % 10;
        const candidates = [];
        for (let candidate = 1; candidate <= 9; candidate += 1) {
          const crosses = ones + candidate >= 10;
          if ((transition === "cross" && crosses) || (transition === "no" && !crosses)) {
            if (a + candidate <= 100) candidates.push(candidate);
          }
        }
        if (!candidates.length) continue;
        b = candidates[lgRandomInt(0, candidates.length - 1)];
        answer = a + b;
      } else {
        a = lgRandomInt(11, 99);
        const ones = a % 10;
        const candidates = [];
        for (let candidate = 1; candidate <= 9; candidate += 1) {
          const crosses = ones < candidate;
          if ((transition === "cross" && crosses) || (transition === "no" && !crosses)) {
            if (a - candidate >= 0) candidates.push(candidate);
          }
        }
        if (!candidates.length) continue;
        b = candidates[lgRandomInt(0, candidates.length - 1)];
        answer = a - b;
      }

      const symbol = op === "plus" ? "+" : "−";
      const key = `${a}${symbol}${b}`;
      if (key === previousKey) continue;

      return {
        a,
        b,
        op,
        symbol,
        answer,
        key,
        prompt: `${a} ${symbol} ${b}`
      };
    }

    return { a: 8, b: 7, op: "plus", symbol: "+", answer: 15, key: "8+7", prompt: "8 + 7" };
  }

  function lgMentalRemainingSeconds() {
    if (!lgRuntime || lgRuntime.kind !== "mental") return 0;
    return Math.max(0, Math.ceil((lgRuntime.endsAtMs - Date.now()) / 1000));
  }

  function lgTimerText(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  function lgStartTimerLoop() {
    lgClearTimer();
    lgTimerHandle = setInterval(() => {
      if (!lgRuntime || lgRuntime.kind !== "mental" || lgRuntime.finished) {
        lgClearTimer();
        return;
      }
      const remaining = lgMentalRemainingSeconds();
      const node = document.querySelector("#lgMentalTimer");
      if (node) node.textContent = lgTimerText(remaining);
      if (remaining <= 0) {
        lgFinishMental().catch(() => {});
      }
    }, 500);
  }

  window.lgStartMental = async function lgStartMental(categoryKey) {
    const animal = lgAnimal();
    const category = MENTAL_CATEGORIES[categoryKey];
    if (!animal || !category) return;
    const now = Date.now();
    lgRuntime = {
      kind: "mental",
      gameId: "kopfrechnen-10-min",
      gameTitle: "10-Minuten-Kopfrechnen",
      variant: categoryKey,
      variantLabel: category.label,
      mode: "challenge",
      animalId: animal.id,
      classId: state.activeClassId,
      startedAt: lgNow(),
      startedMs: now,
      endsAtMs: now + LG_MENTAL_SECONDS * 1000,
      items: [],
      current: lgGenerateMentalQuestion(categoryKey),
      questionStartedMs: now,
      flash: null,
      savedSession: null,
      finished: false,
      lastActivityPersistMs: now,
      lastActivityPersistCount: 0
    };
    lgRuntime.activityId = await lgStartActivity({
      gameId: lgRuntime.gameId,
      gameTitle: lgRuntime.gameTitle,
      variant: categoryKey,
      variantLabel: category.label,
      mode: "challenge",
      totalItems: 0,
      timeLimitSeconds: LG_MENTAL_SECONDS
    });
    screen = "childLGMentalPlay";
    render();
    lgStartTimerLoop();
    setTimeout(() => document.querySelector("#lgMentalAnswer")?.focus(), 0);
  };

  window.lgSubmitMental = async function lgSubmitMental(event) {
    event?.preventDefault?.();
    if (!lgRuntime || lgRuntime.kind !== "mental" || lgRuntime.finished) return;
    if (lgMentalRemainingSeconds() <= 0) {
      await lgFinishMental();
      return;
    }

    const input = document.querySelector("#lgMentalAnswer");
    const raw = String(input?.value || "").trim();
    if (!/^-?\d+$/.test(raw)) return;

    const value = Number(raw);
    const question = lgRuntime.current;
    const correct = value === question.answer;
    const durationMs = Math.max(0, Date.now() - lgRuntime.questionStartedMs);

    lgRuntime.items.push({
      prompt: question.prompt,
      a: question.a,
      b: question.b,
      operation: question.op,
      correctAnswer: question.answer,
      answer: value,
      correct,
      durationMs
    });

    lgRuntime.flash = correct
      ? { correct: true, text: "✓ richtig" }
      : { correct: false, text: `✗ ${question.prompt} = ${question.answer}` };

    lgRuntime.current = lgGenerateMentalQuestion(lgRuntime.variant, question.key);
    lgRuntime.questionStartedMs = Date.now();

    const count = lgRuntime.items.length;
    const shouldPush =
      count - lgRuntime.lastActivityPersistCount >= LG_ACTIVITY_PUSH_EVERY ||
      Date.now() - lgRuntime.lastActivityPersistMs >= LG_ACTIVITY_PUSH_MS;

    if (shouldPush) {
      const correctItems = lgRuntime.items.filter((item) => item.correct).length;
      await lgUpdateActivity({
        processedItems: count,
        correctItems,
        wrongItems: count - correctItems
      });
      lgRuntime.lastActivityPersistCount = count;
      lgRuntime.lastActivityPersistMs = Date.now();
    }

    render();
    setTimeout(() => document.querySelector("#lgMentalAnswer")?.focus(), 0);
  };

  async function lgFinishMental() {
    const runtime = lgRuntime;
    if (!runtime || runtime.kind !== "mental" || runtime.finished) return;
    runtime.finished = true;
    lgClearTimer();

    const finishedAt = lgNow();
    const attempted = runtime.items.length;
    const correct = runtime.items.filter((item) => item.correct).length;
    const wrong = attempted - correct;
    const totalMs = runtime.items.reduce((sum, item) => sum + Number(item.durationMs || 0), 0);
    const avgSeconds = attempted ? Math.round((totalMs / attempted / 1000) * 10) / 10 : 0;

    const session = {
      id: makeId(),
      gameId: runtime.gameId,
      gameTitle: runtime.gameTitle,
      classId: runtime.classId,
      animalId: runtime.animalId,
      variant: runtime.variant,
      variantLabel: runtime.variantLabel,
      mode: "challenge",
      timeLimitSeconds: LG_MENTAL_SECONDS,
      startedAt: runtime.startedAt,
      finishedAt,
      durationSeconds: Math.min(LG_MENTAL_SECONDS, lgDurationSeconds(runtime.startedMs)),
      items: runtime.items,
      summary: {
        attemptedItems: attempted,
        totalItems: attempted,
        correctItems: correct,
        wrongItems: wrong,
        scoreItems: correct,
        accuracy: attempted ? Math.round((correct / attempted) * 100) : 0,
        avgSeconds
      }
    };

    await lgCompleteSession(session, {
      processedItems: attempted,
      correctItems: correct,
      wrongItems: wrong
    });

    screen = "childLGMentalFinal";
    render();
  }

  function lgRenderMentalPlay() {
    if (!lgRuntime || lgRuntime.kind !== "mental") return "";
    const attempted = lgRuntime.items.length;
    const correct = lgRuntime.items.filter((item) => item.correct).length;
    const question = lgRuntime.current;
    return `
      <section class="nomen-shell lg-play-shell lg-mental-play">
        <div class="lg-game-top">
          <button class="secondary" type="button" onclick="lgAbortGame()">Beenden</button>
          <div class="lg-timer" id="lgMentalTimer">${lgTimerText(lgMentalRemainingSeconds())}</div>
          <div class="nomen-player-badge">${lgAnimalBadge()}</div>
        </div>
        <p class="lg-mini-title">${escapeHtml(lgRuntime.variantLabel)}</p>

        <div class="lg-live-stats">
          <span><strong>${attempted}</strong> bearbeitet</span>
          <span><strong>${correct}</strong> richtig</span>
        </div>

        <div class="lg-math-problem mental">${escapeHtml(question.prompt)} = <span>?</span></div>

        <form class="lg-answer-form" onsubmit="lgSubmitMental(event)">
          <input id="lgMentalAnswer" class="text-input lg-number-input" inputmode="numeric" autocomplete="off" aria-label="Ergebnis">
          <button class="primary" type="submit">Weiter</button>
        </form>

        <div class="lg-mental-flash ${lgRuntime.flash?.correct === false ? "wrong" : "correct"}">
          ${lgRuntime.flash ? escapeHtml(lgRuntime.flash.text) : "Rechne genau – und bleib in deinem Tempo."}
        </div>
      </section>
    `;
  }

  function lgMentalPersonalBest(session) {
    if (!session) return 0;
    return Math.max(
      Number(session.summary?.correctItems || 0),
      ...lgSessionList()
        .filter((item) => (
          item.gameId === session.gameId &&
          item.animalId === session.animalId &&
          item.variant === session.variant &&
          item.finishedAt
        ))
        .map((item) => Number(item.summary?.correctItems || 0))
    );
  }

  function lgRenderMentalFinal() {
    const session = lgRuntime?.savedSession;
    if (!session) return "";
    const summary = session.summary || {};
    const wrongItems = (session.items || []).filter((item) => !item.correct).slice(0, 8);
    const best = lgMentalPersonalBest(session);
    return `
      <section class="nomen-shell lg-final-shell">
        <div class="lg-final-icon">🧠</div>
        <h2>10 Minuten geschafft!</h2>
        <p class="lg-final-score"><strong>${summary.attemptedItems}</strong> Aufgaben bearbeitet · <strong>${summary.correctItems}</strong> richtig.</p>
        <div class="lg-final-stat-grid">
          <article><strong>${summary.accuracy}%</strong><small>richtig</small></article>
          <article><strong>${String(summary.avgSeconds).replace(".", ",")} s</strong><small>Ø pro Aufgabe</small></article>
          <article><strong>${summary.wrongItems}</strong><small>Fehler</small></article>
          <article><strong>${best}</strong><small>persönlicher Bestwert</small></article>
        </div>
        ${wrongItems.length ? `
          <div class="lg-child-wrong-list">
            <strong>Schau dir diese Aufgaben noch einmal an:</strong>
            <div>${wrongItems.map((item) => `<span>${escapeHtml(item.prompt)} = ${item.correctAnswer}</span>`).join("")}</div>
          </div>
        ` : `<div class="lg-perfect-note">🌟 Keine falsche Aufgabe in dieser Runde!</div>`}
        <div class="confirm-actions">
          <button class="primary" type="button" onclick="lgReplayMental()">Noch einmal</button>
          <button class="secondary" type="button" onclick="lgReturnToGames()">Zu den Lernspielen</button>
        </div>
      </section>
    `;
  }

  window.lgReplayMental = function lgReplayMental() {
    const variant = lgRuntime?.variant;
    lgRuntime = null;
    lgClearTimer();
    if (variant) {
      lgStartMental(variant);
      return;
    }
    screen = "childLGMentalStart";
    render();
  };

  /* --------------------- Gemeinsame Kinder-Navigation --------------------- */

  window.lgAbortGame = async function lgAbortGame() {
    if (!lgRuntime || lgRuntime.finished) {
      lgReturnToGames();
      return;
    }
    if (!confirm("Möchtest du diese Runde wirklich beenden? Die angefangene Runde wird als abgebrochen gespeichert.")) return;
    await lgAbortRuntime({ renderAfter: true, target: "childLearningGames" });
  };

  window.lgReturnToGames = function lgReturnToGames() {
    lgClearTimer();
    lgRuntime = null;
    screen = "childLearningGames";
    render();
  };

  renderChildScreen = function renderChildScreenWithMoreGames() {
    if (screen === "childLGLanguageStart") return lgRenderLanguageStart();
    if (screen === "childLGLanguagePlay") return lgRenderLanguagePlay();
    if (screen === "childLGLanguageFinal") return lgRenderLanguageFinal();

    if (screen === "childLGMultiplicationStart") return lgRenderMultiplicationStart();
    if (screen === "childLGMultiplicationPlay") return lgRenderMultiplicationPlay();
    if (screen === "childLGMultiplicationFinal") return lgRenderMultiplicationFinal();

    if (screen === "childLGMentalStart") return lgRenderMentalStart();
    if (screen === "childLGMentalPlay") return lgRenderMentalPlay();
    if (screen === "childLGMentalFinal") return lgRenderMentalFinal();

    return baseRenderChildScreen();
  };

  if (baseGoHome) {
    goHome = function goHomeWithGameAbort() {
      if (lgRuntime && !lgRuntime.finished && String(screen || "").startsWith("childLG")) {
        if (!confirm("Möchtest du diese Runde wirklich beenden?")) return;
        lgAbortRuntime({ renderAfter: false }).then(() => baseGoHome());
        return;
      }
      lgClearTimer();
      lgRuntime = null;
      baseGoHome();
    };
  }

  /* --------------------- Lehrkraft-Auswertung --------------------- */

  function lgTeacherSessions() {
    return lgSessionList()
      .filter((session) => (
        session.classId === state.activeClassId &&
        LG_GAME_IDS.has(session.gameId) &&
        session.finishedAt
      ))
      .sort((a, b) => new Date(b.finishedAt || 0) - new Date(a.finishedAt || 0));
  }

  function lgTeacherActivities() {
    return lgSessionList()
      .filter((item) => (
        item.classId === state.activeClassId &&
        item.gameId === LG_ACTIVITY_ID &&
        LG_GAME_IDS.has(item.activityGameId)
      ))
      .sort((a, b) => new Date(b.updatedAt || b.startedAt || 0) - new Date(a.updatedAt || a.startedAt || 0));
  }

  function lgTeacherAnimal(session) {
    return (state.animals || []).find((item) => item.id === session.animalId) || null;
  }

  function lgTeacherResultText(session) {
    const s = session.summary || {};
    if (session.gameId === "kopfrechnen-10-min") {
      return `${Number(s.correctItems || 0)} von ${Number(s.attemptedItems || 0)} richtig · ${Number(s.accuracy || 0)} % · Ø ${String(Number(s.avgSeconds || 0)).replace(".", ",")} s`;
    }
    if (session.gameId === "einmaleins-grundreihen") {
      return `${Number(s.scoreItems || 0)} von ${Number(s.totalItems || 10)} ${session.mode === "practice" ? "direkt richtig" : "richtig"}`;
    }
    return `${Number(s.scoreItems || 0)} von ${Number(s.totalItems || 10)} Wörtern ${session.mode === "practice" ? "direkt richtig" : "richtig"}`;
  }

  function lgTeacherGameLabel(session) {
    return [session.gameTitle, session.variantLabel].filter(Boolean).join(" · ");
  }

  function lgTeacherModeLabel(session) {
    if (session.mode === "challenge") return "10-Minuten-Challenge";
    return session.mode === "test" ? "Test" : "Üben";
  }

  window.setLGTeacherFilter = function setLGTeacherFilter(value) {
    lgTeacherFilter = value || "all";
    lgTeacherDetailId = "";
    render();
  };

  window.openLGTeacherDetails = function openLGTeacherDetails(sessionId) {
    lgTeacherDetailId = sessionId;
    render();
    setTimeout(() => document.querySelector("#lgTeacherDetails")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  function lgRenderTeacherDetails(session) {
    if (!session) return "";
    const animal = lgTeacherAnimal(session);
    const wrong = (session.items || []).filter((item) => !item.correct && !item.firstTry);
    const rows = (session.items || []).slice(0, 100).map((item, index) => {
      let task = item.prompt || item.word || `Aufgabe ${index + 1}`;
      let answer = item.answer ?? "";
      let solution = item.correctAnswer ?? "";
      let okay = item.correct === true || item.firstTry === true;

      if (item.word && item.steps) {
        const stepValues = Object.values(item.steps);
        okay = session.mode === "practice"
          ? stepValues.every((entry) => entry.firstTry)
          : stepValues.every((entry) => entry.correct);
        answer = okay ? "richtig erkannt" : "Fehler in der Probe";
        solution = item.type;
      }

      return `
        <tr class="${okay ? "" : "lg-row-wrong"}">
          <td>${index + 1}</td>
          <td><strong>${escapeHtml(task)}</strong></td>
          <td>${escapeHtml(String(answer))}</td>
          <td>${escapeHtml(String(solution || "–"))}</td>
          <td>${okay ? "✅" : "❌"}</td>
        </tr>
      `;
    }).join("");

    return `
      <section class="panel lg-teacher-detail" id="lgTeacherDetails">
        <div class="lg-teacher-detail-head">
          <div>
            <h3>${animal ? teacherAnimalLabel(animal) : "Tier"} · ${escapeHtml(lgTeacherGameLabel(session))}</h3>
            <p class="message">${escapeHtml(lgTeacherModeLabel(session))} · ${escapeHtml(lgTeacherResultText(session))}</p>
          </div>
          <button class="secondary" type="button" onclick="openLGTeacherDetails('')">Schließen</button>
        </div>
        <div class="table-scroll">
          <table>
            <thead><tr><th>#</th><th>Aufgabe/Wort</th><th>Antwort</th><th>richtig</th><th></th></tr></thead>
            <tbody>${rows || `<tr><td colspan="5">Keine Einzeldaten.</td></tr>`}</tbody>
          </table>
        </div>
      </section>
    `;
  }

  function lgRenderTeacherPanel() {
    const sessions = lgTeacherSessions();
    const activities = lgTeacherActivities();
    const filters = [
      ["all", "Alle"],
      ["verb-probe", "Verben"],
      ["adjektiv-probe", "Adjektive"],
      ["wortarten-mix", "Wortarten-Mix"],
      ["einmaleins-grundreihen", "Einmaleins"],
      ["kopfrechnen-10-min", "Kopfrechnen"]
    ];
    const filtered = lgTeacherFilter === "all"
      ? sessions
      : sessions.filter((item) => item.gameId === lgTeacherFilter);

    const running = activities.filter((item) => item.status === "in_progress").length;
    const aborted = activities.filter((item) => item.status === "aborted").length;
    const detail = lgTeacherDetailId ? sessions.find((item) => item.id === lgTeacherDetailId) : null;

    return `
      <section class="panel lg-teacher-panel">
        <div class="learning-games-teacher-title">
          <div>
            <h2>Weitere Lernspiele</h2>
            <p class="message">Verb, Adjektiv, Wortarten, Einmaleins und 10-Minuten-Kopfrechnen.</p>
          </div>
        </div>

        <div class="nomen-stat-grid">
          <article><strong>${sessions.length}</strong><span>beendete Runden</span></article>
          <article><strong>${running}</strong><span>gestartet / läuft</span></article>
          <article><strong>${aborted}</strong><span>abgebrochen</span></article>
        </div>

        <div class="section-tabs lg-filter-tabs">
          ${filters.map(([value, label]) => `<button class="small-button ${lgTeacherFilter === value ? "active" : ""}" type="button" onclick="setLGTeacherFilter('${value}')">${escapeHtml(label)}</button>`).join("")}
        </div>

        <div class="table-scroll">
          <table>
            <thead><tr><th>Tier</th><th>Lernspiel</th><th>Modus</th><th>Ergebnis</th><th>Zeitpunkt</th><th></th></tr></thead>
            <tbody>
              ${filtered.slice(0, 50).map((session) => {
                const animal = lgTeacherAnimal(session);
                return `
                  <tr>
                    <td><strong>${animal ? teacherAnimalLabel(animal) : "Tier"}</strong></td>
                    <td>${escapeHtml(lgTeacherGameLabel(session))}</td>
                    <td>${escapeHtml(lgTeacherModeLabel(session))}</td>
                    <td>${escapeHtml(lgTeacherResultText(session))}</td>
                    <td>${escapeHtml(typeof formatDateTime === "function" ? formatDateTime(session.finishedAt) : session.finishedAt)}</td>
                    <td><button class="small-button" type="button" onclick='openLGTeacherDetails(${JSON.stringify(session.id)})'>Details</button></td>
                  </tr>
                `;
              }).join("") || `<tr><td colspan="6">Noch keine Ergebnisse aus diesen Lernspielen.</td></tr>`}
            </tbody>
          </table>
        </div>
      </section>
      ${detail ? lgRenderTeacherDetails(detail) : ""}
    `;
  }

  renderLearningGamesTeacher = function renderLearningGamesTeacherPlus() {
    return `${lgRenderTeacherPanel()}${baseRenderLearningGamesTeacher()}`;
  };

  /* --------------------- Styles --------------------- */

  const style = document.createElement("style");
  style.id = "lk-learning-games-plus-style";
  style.textContent = `
    .lg-game-home { display:grid; gap:18px; }
    .lg-subject-heading { display:flex; gap:10px; align-items:center; margin-top:4px; padding:10px 12px; border-radius:14px; background:rgba(90,140,190,.08); }
    .lg-subject-heading.math { background:rgba(230,160,70,.09); }
    .lg-subject-heading > span { font-size:1.35rem; }
    .lg-subject-heading > div { display:grid; gap:2px; }
    .lg-subject-heading small { opacity:.65; }
    .lg-card-grid { margin-top:-6px; }
    .lg-mental-card { grid-column:span 2; }

    .lg-start-shell, .lg-play-shell, .lg-final-shell { max-width:920px; margin:0 auto; }
    .lg-simple-hero { display:flex; gap:18px; align-items:center; padding:18px; border-radius:20px; background:rgba(255,255,255,.7); margin:16px 0; }
    .lg-simple-hero > span { font-size:3rem; }
    .lg-simple-hero h2 { margin:0 0 5px; font-size:1.8rem; }
    .lg-simple-hero p { margin:0; }

    .lg-probe-steps { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin:14px 0; }
    .lg-probe-steps.single { grid-template-columns:1fr; }
    .lg-probe-steps article { padding:14px; border-radius:16px; background:rgba(255,255,255,.65); display:grid; gap:5px; }
    .lg-probe-steps b { width:28px; height:28px; display:grid; place-items:center; border-radius:50%; background:rgba(47,111,145,.11); }
    .lg-probe-steps small { opacity:.65; }

    .lg-game-top { display:grid; grid-template-columns:auto 1fr auto; gap:12px; align-items:center; }
    .lg-progress-text { text-align:center; font-weight:750; }
    .lg-progress-bar { height:8px; background:rgba(0,0,0,.07); border-radius:999px; overflow:hidden; margin:12px 0 18px; }
    .lg-progress-bar span { display:block; height:100%; background:currentColor; opacity:.35; border-radius:999px; }
    .lg-word-card { display:grid; justify-items:center; gap:5px; padding:24px; border-radius:22px; background:rgba(255,255,255,.78); margin-bottom:18px; }
    .lg-word-card small { opacity:.62; }
    .lg-word-card strong { font-size:clamp(2rem,6vw,3.2rem); }
    .lg-step-label { text-align:center; opacity:.6; font-size:.85rem; margin-bottom:8px; }
    .lg-question-title { text-align:center; font-size:1.2rem; margin:12px 0 16px; }

    .lg-choice-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; max-width:720px; margin:0 auto; }
    .lg-choice-grid.two { grid-template-columns:repeat(2,minmax(0,1fr)); }
    .lg-choice-grid.three { grid-template-columns:repeat(3,minmax(0,1fr)); }
    .lg-choice-button { min-height:72px; border:1px solid rgba(0,0,0,.09); border-radius:16px; background:rgba(255,255,255,.82); display:flex; gap:8px; align-items:center; justify-content:center; font:inherit; cursor:pointer; }
    .lg-choice-button span { font-size:1.25rem; }
    .lg-inline-hint { max-width:720px; margin:12px auto 0; }

    .lg-result-card { max-width:680px; margin:0 auto; border-radius:20px; padding:20px; text-align:center; background:rgba(75,150,95,.09); }
    .lg-result-card.wrong { background:#fff4d8; }
    .lg-result-card h3 { margin:5px 0; }
    .lg-result-icon { font-size:2rem; }

    .lg-variant-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; }
    .lg-variant-card { padding:16px; border:1px solid rgba(0,0,0,.08); border-radius:18px; background:rgba(255,255,255,.7); display:grid; gap:8px; }
    .lg-variant-card > span { font-size:1.65rem; }
    .lg-variant-card small { opacity:.65; }
    .lg-variant-card > div { display:flex; gap:7px; flex-wrap:wrap; }

    .lg-mini-title { text-align:center; font-weight:750; opacity:.72; margin:6px 0 12px; }
    .lg-math-problem { text-align:center; font-size:clamp(2.4rem,9vw,4.6rem); font-weight:800; padding:26px 10px; }
    .lg-answer-form { display:flex; justify-content:center; gap:10px; max-width:430px; margin:0 auto; }
    .lg-number-input { font-size:1.8rem; text-align:center; max-width:210px; }
    .lg-math-feedback { max-width:520px; margin:0 auto; padding:18px; border-radius:18px; background:rgba(75,150,95,.09); display:grid; gap:12px; text-align:center; }
    .lg-math-feedback.wrong { background:#fff4d8; }

    .lg-final-shell { text-align:center; padding-top:20px; }
    .lg-final-icon { font-size:3.2rem; }
    .lg-final-shell h2 { margin:5px 0; }
    .lg-final-score { font-size:1.15rem; }
    .lg-final-stat-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; max-width:720px; margin:18px auto; }
    .lg-final-stat-grid article { padding:14px; border-radius:15px; background:rgba(255,255,255,.72); display:grid; gap:3px; }
    .lg-final-stat-grid strong { font-size:1.25rem; }
    .lg-final-stat-grid small { opacity:.64; }

    .lg-challenge-note { display:flex; gap:9px; flex-wrap:wrap; padding:12px 14px; border-radius:14px; background:rgba(230,160,70,.11); margin-bottom:18px; }
    .lg-mental-group { margin:18px 0; }
    .lg-mental-group h3 { margin-bottom:9px; }
    .lg-mental-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; }
    .lg-mental-choice { min-height:104px; padding:14px; border:1px solid rgba(0,0,0,.08); border-radius:17px; background:rgba(255,255,255,.72); display:grid; justify-items:start; gap:4px; text-align:left; font:inherit; cursor:pointer; }
    .lg-mental-choice > span { font-size:1.45rem; }
    .lg-mental-choice small { opacity:.65; }

    .lg-timer { justify-self:center; min-width:110px; padding:8px 12px; border-radius:999px; text-align:center; font-size:1.35rem; font-weight:850; background:#fff4d8; }
    .lg-live-stats { display:flex; justify-content:center; gap:10px; flex-wrap:wrap; }
    .lg-live-stats span { padding:7px 10px; border-radius:999px; background:rgba(255,255,255,.68); }
    .lg-math-problem.mental { padding:34px 10px 22px; }
    .lg-mental-flash { min-height:38px; text-align:center; margin-top:12px; font-weight:700; color:#357a48; }
    .lg-mental-flash.wrong { color:#a55d21; }
    .lg-child-wrong-list { max-width:700px; margin:18px auto; padding:14px; border-radius:16px; background:#fff7e7; display:grid; gap:9px; text-align:left; }
    .lg-child-wrong-list > div { display:flex; flex-wrap:wrap; gap:7px; }
    .lg-child-wrong-list span { padding:6px 8px; border-radius:9px; background:rgba(255,255,255,.75); }
    .lg-perfect-note { max-width:560px; margin:18px auto; padding:14px; border-radius:16px; background:rgba(75,150,95,.09); }

    .lg-teacher-panel { margin-bottom:14px; }
    .lg-filter-tabs { margin:14px 0; flex-wrap:wrap; }
    .lg-row-wrong { background:#fff8eb; }
    .lg-teacher-detail-head { display:flex; justify-content:space-between; gap:12px; align-items:flex-start; }

    @media (max-width:760px) {
      .lg-mental-card { grid-column:auto; }
      .lg-probe-steps, .lg-variant-grid, .lg-mental-grid { grid-template-columns:1fr; }
      .lg-choice-grid.three { grid-template-columns:1fr; }
      .lg-final-stat-grid { grid-template-columns:repeat(2,1fr); }
      .lg-game-top { grid-template-columns:auto 1fr; }
      .lg-game-top .nomen-player-badge { grid-column:2; justify-self:end; }
      .lg-timer { justify-self:end; }
    }
  `;
  if (!document.getElementById(style.id)) document.head.appendChild(style);

  // Export only deterministic helpers for smoke tests; no personal data.
  window.LearningGamesPlus = {
    generateMentalQuestion: lgGenerateMentalQuestion,
    createMultiplicationItems: lgCreateMultiplicationItems,
    mentalCategories: MENTAL_CATEGORIES
  };
})();
