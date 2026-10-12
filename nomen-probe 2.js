/* Paket 1: Lernspiel / Diagnose Nomen-Probe
 * Integriert die kindgerechte Nomen-Probe in den Lernstand-Kompass.
 * Ergebnisse werden pseudonym über die vorhandene Tier-ID gespeichert.
 */

const NOMEN_GAME_ID = "nomen-probe";
const NOMEN_GAME_WORDS = [
  { word: "Kind", isNoun: true, category: "Mensch", definite: "das", indefinite: "ein", plural: "Kinder" },
  { word: "Frau", isNoun: true, category: "Mensch", definite: "die", indefinite: "eine", plural: "Frauen" },
  { word: "Mann", isNoun: true, category: "Mensch", definite: "der", indefinite: "ein", plural: "Männer" },
  { word: "Oma", isNoun: true, category: "Mensch", definite: "die", indefinite: "eine", plural: "Omas" },
  { word: "Opa", isNoun: true, category: "Mensch", definite: "der", indefinite: "ein", plural: "Opas" },
  { word: "Lehrerin", isNoun: true, category: "Mensch", definite: "die", indefinite: "eine", plural: "Lehrerinnen" },
  { word: "Junge", isNoun: true, category: "Mensch", definite: "der", indefinite: "ein", plural: "Jungen" },
  { word: "Mädchen", isNoun: true, category: "Mensch", definite: "das", indefinite: "ein", plural: "Mädchen" },

  { word: "Hund", isNoun: true, category: "Tier", definite: "der", indefinite: "ein", plural: "Hunde" },
  { word: "Katze", isNoun: true, category: "Tier", definite: "die", indefinite: "eine", plural: "Katzen" },
  { word: "Pferd", isNoun: true, category: "Tier", definite: "das", indefinite: "ein", plural: "Pferde" },
  { word: "Vogel", isNoun: true, category: "Tier", definite: "der", indefinite: "ein", plural: "Vögel" },
  { word: "Hase", isNoun: true, category: "Tier", definite: "der", indefinite: "ein", plural: "Hasen" },
  { word: "Maus", isNoun: true, category: "Tier", definite: "die", indefinite: "eine", plural: "Mäuse" },
  { word: "Fisch", isNoun: true, category: "Tier", definite: "der", indefinite: "ein", plural: "Fische" },
  { word: "Kuh", isNoun: true, category: "Tier", definite: "die", indefinite: "eine", plural: "Kühe" },
  { word: "Schaf", isNoun: true, category: "Tier", definite: "das", indefinite: "ein", plural: "Schafe" },

  { word: "Blume", isNoun: true, category: "Pflanze", definite: "die", indefinite: "eine", plural: "Blumen" },
  { word: "Baum", isNoun: true, category: "Pflanze", definite: "der", indefinite: "ein", plural: "Bäume" },
  { word: "Tulpe", isNoun: true, category: "Pflanze", definite: "die", indefinite: "eine", plural: "Tulpen" },
  { word: "Rose", isNoun: true, category: "Pflanze", definite: "die", indefinite: "eine", plural: "Rosen" },
  { word: "Busch", isNoun: true, category: "Pflanze", definite: "der", indefinite: "ein", plural: "Büsche" },
  { word: "Tanne", isNoun: true, category: "Pflanze", definite: "die", indefinite: "eine", plural: "Tannen" },
  { word: "Eiche", isNoun: true, category: "Pflanze", definite: "die", indefinite: "eine", plural: "Eichen" },
  { word: "Sonnenblume", isNoun: true, category: "Pflanze", definite: "die", indefinite: "eine", plural: "Sonnenblumen" },

  { word: "Ball", isNoun: true, category: "Ding", definite: "der", indefinite: "ein", plural: "Bälle" },
  { word: "Buch", isNoun: true, category: "Ding", definite: "das", indefinite: "ein", plural: "Bücher" },
  { word: "Stift", isNoun: true, category: "Ding", definite: "der", indefinite: "ein", plural: "Stifte" },
  { word: "Tisch", isNoun: true, category: "Ding", definite: "der", indefinite: "ein", plural: "Tische" },
  { word: "Tasse", isNoun: true, category: "Ding", definite: "die", indefinite: "eine", plural: "Tassen" },
  { word: "Fahrrad", isNoun: true, category: "Ding", definite: "das", indefinite: "ein", plural: "Fahrräder" },
  { word: "Schere", isNoun: true, category: "Ding", definite: "die", indefinite: "eine", plural: "Scheren" },
  { word: "Tasche", isNoun: true, category: "Ding", definite: "die", indefinite: "eine", plural: "Taschen" },
  { word: "Heft", isNoun: true, category: "Ding", definite: "das", indefinite: "ein", plural: "Hefte" },
  { word: "Lineal", isNoun: true, category: "Ding", definite: "das", indefinite: "ein", plural: "Lineale" },

  { word: "läuft", isNoun: false, kind: "Verb" },
  { word: "spielt", isNoun: false, kind: "Verb" },
  { word: "malt", isNoun: false, kind: "Verb" },
  { word: "springt", isNoun: false, kind: "Verb" },
  { word: "lacht", isNoun: false, kind: "Verb" },
  { word: "schläft", isNoun: false, kind: "Verb" },
  { word: "schreibt", isNoun: false, kind: "Verb" },
  { word: "liest", isNoun: false, kind: "Verb" },
  { word: "klein", isNoun: false, kind: "Adjektiv" },
  { word: "groß", isNoun: false, kind: "Adjektiv" },
  { word: "schnell", isNoun: false, kind: "Adjektiv" },
  { word: "langsam", isNoun: false, kind: "Adjektiv" },
  { word: "bunt", isNoun: false, kind: "Adjektiv" },
  { word: "weich", isNoun: false, kind: "Adjektiv" },
  { word: "laut", isNoun: false, kind: "Adjektiv" }
];

const NOMEN_CATEGORY_CHOICES = [
  { value: "Mensch", label: "Mensch", icon: "🧒" },
  { value: "Tier", label: "Tier", icon: "🐱" },
  { value: "Pflanze", label: "Pflanze", icon: "🌷" },
  { value: "Ding", label: "Ding", icon: "⚽" },
  { value: "none", label: "Nichts davon", icon: "🤔", wide: true }
];

const NOMEN_ARTICLE_CHOICES = [
  { value: "der|ein", label: "der / ein" },
  { value: "die|eine", label: "die / eine" },
  { value: "das|ein", label: "das / ein" },
  { value: "none", label: "Kein Artikel passt", wide: true }
];

const NOMEN_STEP_KEYS = ["category", "article", "plural", "decision"];
const NOMEN_STEP_LABELS = {
  category: "Namensprobe",
  article: "Artikelprobe",
  plural: "Mehrzahlprobe",
  decision: "Nomen erkannt"
};

let nomenGameRuntime = null;
let nomenTeacherMode = "test";
let nomenTeacherAnimalId = "";
let nomenTeacherSessionId = "";

function renderLearningGameChildScreen() {
  if (screen === "childLearningGames") return renderLearningGamesChildHome();
  if (screen === "childNomenStart") return renderNomenStart();
  if (screen === "childNomenPlay") return renderNomenPlay();
  if (screen === "childNomenFinal") return renderNomenFinal();
  return "";
}

function renderLearningGamesChildHome() {
  const animal = selectedAnimal();
  return `
    <section class="step-wrap learning-games-child-home">
      ${renderBackButton("childSubject")}
      <div class="learning-games-title-row">
        <div>
          <p class="learning-games-kicker">Lernspiele</p>
          <h2 class="child-title">Was möchtest du üben?</h2>
          <p class="message">${animal ? `Hallo ${escapeHtml(animal.tierEmoji)} ${escapeHtml(animal.tierName)}! ` : ""}Hier kannst du zeigen, was du schon kannst.</p>
        </div>
        <img class="nomen-toni-small" src="materials/toni-nomen.png" alt="Toni" />
      </div>
      <div class="learning-game-card-grid">
        <button class="learning-game-card" type="button" onclick="openNomenProbe()">
          <span class="learning-game-icon">⭐</span>
          <strong>Nomen-Probe</strong>
          <small>Name – Artikel – Mehrzahl – entscheiden</small>
        </button>
      </div>
    </section>
  `;
}

function openNomenProbe() {
  nomenGameRuntime = null;
  screen = "childNomenStart";
  render();
}

function renderNomenStart() {
  const animal = selectedAnimal();
  if (!animal) {
    return `
      <section class="step-wrap">
        ${renderBackButton("childAnimal")}
        <div class="empty">Bitte wähle zuerst dein Tier aus.</div>
      </section>
    `;
  }
  return `
    <section class="nomen-shell nomen-start-shell">
      <div class="nomen-start-top">
        <button class="secondary" type="button" onclick="setChildScreen('childLearningGames')">Zurück</button>
        <div class="nomen-player-badge">${escapeHtml(animal.tierEmoji)} ${escapeHtml(animal.tierName)}</div>
      </div>
      <div class="nomen-hero">
        <div>
          <h2>Nomen-Probe</h2>
          <p>Wir prüfen jedes Wort <strong>Schritt für Schritt</strong>.</p>
        </div>
        <img class="nomen-toni" src="materials/toni-nomen.png" alt="Toni, das Klassenmaskottchen" />
      </div>
      <div class="nomen-step-intro-grid">
        <article class="nomen-intro-card">
          <span class="nomen-intro-number">1</span>
          <strong>Name?</strong>
          <p>Mensch, Tier, Pflanze oder Ding?</p>
          <div class="nomen-mini-icons">🧒 🐱 🌷 ⚽</div>
        </article>
        <article class="nomen-intro-card">
          <span class="nomen-intro-number">2</span>
          <strong>Artikel?</strong>
          <p>Passt der, die, das, ein oder eine?</p>
          <div class="nomen-article-cloud">der · die · das · ein · eine</div>
        </article>
        <article class="nomen-intro-card">
          <span class="nomen-intro-number">3</span>
          <strong>Mehrzahl?</strong>
          <p>Schreibe die Mehrzahl mit Artikel.</p>
          <div class="nomen-plural-example">der Ball → <b>die Bälle</b></div>
        </article>
      </div>
      <div class="nomen-mode-grid">
        <button class="nomen-mode-card practice" type="button" onclick="startNomenGame('practice')">
          <span>🌱</span>
          <strong>Üben</strong>
          <small>Du bekommst Rückmeldungen und darfst es noch einmal versuchen.</small>
        </button>
        <button class="nomen-mode-card test" type="button" onclick="startNomenGame('test')">
          <span>🎯</span>
          <strong>Test</strong>
          <small>Du antwortest einmal. Die Lösungen siehst du während des Tests nicht.</small>
        </button>
      </div>
      <p class="nomen-round-info">Eine Runde hat 10 Wörter. Im Wortschatz sind 50 Wörter: 35 Nomen und 15 Nicht-Nomen.</p>
    </section>
  `;
}

function nomenShuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function createNomenRoundSet() {
  const anchors = ["Mensch", "Tier", "Pflanze", "Ding"].map((category) =>
    nomenShuffle(NOMEN_GAME_WORDS.filter((word) => word.isNoun && word.category === category))[0]
  );
  const chosen = new Set(anchors.map((word) => word.word));
  const extraNouns = nomenShuffle(NOMEN_GAME_WORDS.filter((word) => word.isNoun && !chosen.has(word.word))).slice(0, 3);
  const nonNouns = nomenShuffle(NOMEN_GAME_WORDS.filter((word) => !word.isNoun)).slice(0, 3);
  return nomenShuffle([...anchors, ...extraNouns, ...nonNouns]);
}

function startNomenGame(mode) {
  const animal = selectedAnimal();
  if (!animal) return;
  nomenGameRuntime = {
    mode: mode === "test" ? "test" : "practice",
    animalId: animal.id,
    classId: state.activeClassId,
    startedAt: nowIso(),
    startedMs: Date.now(),
    rounds: createNomenRoundSet(),
    roundIndex: 0,
    stepIndex: 0,
    currentAttempts: 1,
    wrongValues: [],
    hint: "",
    phase: "question",
    stepStartedMs: Date.now(),
    itemResults: [],
    currentItemResult: null,
    lastStepResult: null,
    savedSession: null
  };
  prepareNomenCurrentItem();
  screen = "childNomenPlay";
  render();
}

function prepareNomenCurrentItem() {
  if (!nomenGameRuntime) return;
  const item = nomenGameRuntime.rounds[nomenGameRuntime.roundIndex];
  nomenGameRuntime.currentItemResult = {
    word: item.word,
    isNoun: item.isNoun,
    category: item.category || "",
    definite: item.definite || "",
    indefinite: item.indefinite || "",
    plural: item.plural || "",
    kind: item.kind || "",
    startedAt: nowIso(),
    steps: {}
  };
  nomenGameRuntime.stepIndex = 0;
  nomenGameRuntime.currentAttempts = 1;
  nomenGameRuntime.wrongValues = [];
  nomenGameRuntime.hint = "";
  nomenGameRuntime.phase = "question";
  nomenGameRuntime.stepStartedMs = Date.now();
  nomenGameRuntime.lastStepResult = null;
}

function currentNomenWord() {
  return nomenGameRuntime?.rounds?.[nomenGameRuntime.roundIndex] || null;
}

function currentNomenStepKey() {
  return NOMEN_STEP_KEYS[nomenGameRuntime?.stepIndex || 0];
}

function renderNomenPlay() {
  if (!nomenGameRuntime || !currentNomenWord()) return renderNomenStart();
  const item = currentNomenWord();
  const runtime = nomenGameRuntime;
  const totalSteps = runtime.rounds.length * 4;
  const completedCurrent = Object.keys(runtime.currentItemResult?.steps || {}).length;
  const doneSteps = runtime.roundIndex * 4 + completedCurrent;
  const progress = Math.round((doneSteps / totalSteps) * 100);
  const modeLabel = runtime.mode === "test" ? "Test" : "Üben";
  const phaseContent = runtime.phase === "feedback"
    ? renderNomenStepFeedback()
    : runtime.phase === "wordResult"
      ? renderNomenWordResult()
      : renderNomenQuestion();

  return `
    <section class="nomen-shell nomen-game-shell">
      <div class="nomen-game-topbar">
        <button class="secondary" type="button" onclick="leaveNomenGame()">Beenden</button>
        <div class="nomen-game-progress">
          <div><strong>Wort ${runtime.roundIndex + 1} von ${runtime.rounds.length}</strong><span>${escapeHtml(modeLabel)}</span></div>
          <div class="nomen-progress-track"><div style="width:${progress}%"></div></div>
        </div>
        <img class="nomen-toni-mini" src="materials/toni-nomen.png" alt="" />
      </div>
      <div class="nomen-game-card">
        <div class="nomen-path">
          ${NOMEN_STEP_KEYS.map((key, index) => `
            <div class="nomen-path-step ${index === runtime.stepIndex && runtime.phase !== "wordResult" ? "active" : ""} ${index < runtime.stepIndex || runtime.phase === "wordResult" ? "done" : ""}">
              <span>${index < 3 ? index + 1 : "✓"}</span>
              <small>${index === 0 ? "Name?" : index === 1 ? "Artikel?" : index === 2 ? "Mehrzahl?" : "Entscheiden"}</small>
            </div>
            ${index < 3 ? `<i></i>` : ""}
          `).join("")}
        </div>
        <div class="nomen-word-stage">
          <small>Das Wort steht zuerst klein. Prüfe, ob es großgeschrieben werden muss.</small>
          <div class="nomen-word-row">
            <span class="nomen-search-icon">🔎</span>
            <h2>${escapeHtml(item.word.toLocaleLowerCase("de-DE"))}</h2>
            <button class="nomen-speak-button" type="button" onclick="speakNomenWord()" aria-label="Wort vorlesen">🔊</button>
          </div>
        </div>
        ${phaseContent}
      </div>
    </section>
  `;
}

function renderNomenQuestion() {
  const runtime = nomenGameRuntime;
  const item = currentNomenWord();
  const key = currentNomenStepKey();
  const testNote = runtime.mode === "test" ? `<div class="nomen-test-note">🎯 Im Test gibt es während der Aufgabe keine Lösung.</div>` : "";
  const hint = runtime.mode === "practice" && runtime.hint ? `<div class="nomen-hint">💡 ${escapeHtml(runtime.hint)}</div>` : "";
  if (key === "category") {
    return `
      <section class="nomen-question-panel">
        <span class="nomen-step-badge">1. Schritt</span>
        <h3>Ist das Wort ein Name für …?</h3>
        <p>Prüfe: Mensch, Tier, Pflanze oder Ding.</p>
        ${testNote}${hint}
        <div class="nomen-choice-grid">
          ${NOMEN_CATEGORY_CHOICES.map((choice) => nomenChoiceButton(choice, "answerNomenCategory", runtime.wrongValues.includes(choice.value))).join("")}
        </div>
      </section>
    `;
  }
  if (key === "article") {
    return `
      <section class="nomen-question-panel">
        <span class="nomen-step-badge">2. Schritt</span>
        <h3>Welche Artikel passen davor?</h3>
        <p>Sprich das Wort mit der, die, das, ein oder eine.</p>
        ${testNote}${hint}
        <div class="nomen-choice-grid compact">
          ${NOMEN_ARTICLE_CHOICES.map((choice) => nomenChoiceButton(choice, "answerNomenArticle", runtime.wrongValues.includes(choice.value))).join("")}
        </div>
      </section>
    `;
  }
  if (key === "plural") {
    const buttonLabel = runtime.mode === "test" ? "Antwort speichern" : "Prüfen";
    return `
      <section class="nomen-question-panel">
        <span class="nomen-step-badge">3. Schritt</span>
        <h3>Kannst du die Mehrzahl bilden?</h3>
        <p>Schreibe die Mehrzahl <strong>mit Artikel</strong>. Wenn das nicht geht, wähle „Keine Mehrzahl“.</p>
        ${testNote}${hint}
        <form class="nomen-plural-form" onsubmit="submitNomenPlural(event)">
          <label for="nomenPluralInput">Mehrzahl mit Artikel</label>
          <div>
            <input id="nomenPluralInput" class="text-input" type="text" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="z. B. die Hunde">
            <button class="primary" type="submit">${escapeHtml(buttonLabel)}</button>
          </div>
        </form>
        <div class="nomen-or">oder</div>
        <button class="nomen-choice-button wide" type="button" onclick="answerNomenPluralNone()">Keine Mehrzahl</button>
      </section>
    `;
  }
  return `
    <section class="nomen-question-panel">
      <span class="nomen-step-badge">Jetzt du!</span>
      <h3>Was zeigt die Probe bei „${escapeHtml(item.word.toLocaleLowerCase("de-DE"))}“?</h3>
      <p>Denke an alle drei Schritte. Musst du das Wort großschreiben?</p>
      ${testNote}${hint}
      <div class="nomen-choice-grid one-column">
        ${nomenChoiceButton({ value: "noun", label: "Ja – es ist ein Nomen", icon: "⭐", wide: true }, "answerNomenDecision", runtime.wrongValues.includes("noun"))}
        ${nomenChoiceButton({ value: "notNoun", label: "Nein – kein Nomen", icon: "✋", wide: true }, "answerNomenDecision", runtime.wrongValues.includes("notNoun"))}
      </div>
    </section>
  `;
}

function nomenChoiceButton(choice, handler, disabled = false) {
  return `
    <button class="nomen-choice-button ${choice.wide ? "wide" : ""} ${disabled ? "wrong-disabled" : ""}" type="button" ${disabled ? "disabled" : ""} onclick="${handler}(${JSON.stringify(choice.value).replaceAll('"', '&quot;')})">
      ${choice.icon ? `<span>${escapeHtml(choice.icon)}</span>` : ""}<strong>${escapeHtml(choice.label)}</strong>
    </button>
  `;
}

function markNomenPracticeWrong(value, hint) {
  const runtime = nomenGameRuntime;
  if (!runtime || runtime.mode !== "practice") return;
  runtime.currentAttempts += 1;
  if (value && !runtime.wrongValues.includes(value)) runtime.wrongValues.push(value);
  runtime.hint = hint;
  render();
}

function recordNomenStep({ answer, correct, displayAnswer = "" }) {
  const runtime = nomenGameRuntime;
  if (!runtime) return;
  const key = currentNomenStepKey();
  const attempts = runtime.mode === "test" ? 1 : runtime.currentAttempts;
  const result = {
    answer: String(answer ?? ""),
    displayAnswer: String(displayAnswer || answer || ""),
    correct: Boolean(correct),
    attempts,
    firstTry: Boolean(correct && attempts === 1),
    durationMs: Math.max(0, Date.now() - runtime.stepStartedMs)
  };
  runtime.currentItemResult.steps[key] = result;
  runtime.lastStepResult = { key, ...result };
  runtime.phase = "feedback";
  runtime.hint = "";
  runtime.wrongValues = [];
  render();
}

function answerNomenCategory(value) {
  const runtime = nomenGameRuntime;
  const item = currentNomenWord();
  if (!runtime || !item) return;
  const correctValue = item.isNoun ? item.category : "none";
  const correct = value === correctValue;
  if (runtime.mode === "practice" && !correct) {
    markNomenPracticeWrong(value, "Prüfe die Bedeutung noch einmal: Wen oder was bezeichnet das Wort?");
    return;
  }
  recordNomenStep({ answer: value, correct, displayAnswer: value === "none" ? "Nichts davon" : value });
}

function answerNomenArticle(value) {
  const runtime = nomenGameRuntime;
  const item = currentNomenWord();
  if (!runtime || !item) return;
  const correctValue = item.isNoun ? `${item.definite}|${item.indefinite}` : "none";
  const correct = value === correctValue;
  if (runtime.mode === "practice" && !correct) {
    markNomenPracticeWrong(value, "Sprich Artikel und Wort zusammen. Welche Verbindung klingt richtig?");
    return;
  }
  recordNomenStep({ answer: value, correct, displayAnswer: value === "none" ? "Kein Artikel" : value.replace("|", " / ") });
}

function normalizeNomenPlural(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toLocaleLowerCase("de-DE");
}

function submitNomenPlural(event) {
  event.preventDefault();
  const input = document.querySelector("#nomenPluralInput");
  const value = input?.value || "";
  answerNomenPluralInput(value);
}

function answerNomenPluralInput(value) {
  const runtime = nomenGameRuntime;
  const item = currentNomenWord();
  if (!runtime || !item) return;
  const entered = normalizeNomenPlural(value);
  if (!entered && runtime.mode === "practice") {
    markNomenPracticeWrong("", "Schreibe die Mehrzahl mit Artikel hinein oder wähle „Keine Mehrzahl“.");
    return;
  }
  const correctAnswer = item.isNoun ? normalizeNomenPlural(`die ${item.plural}`) : "";
  const correct = Boolean(item.isNoun && entered === correctAnswer);
  if (runtime.mode === "practice" && !correct) {
    const hint = item.isNoun
      ? "Sprich das Wort mit „viele“. Denk auch an den Artikel „die“ vor der Mehrzahl."
      : "Prüfe: Kann man von diesem Wort überhaupt eine Einzahl und eine Mehrzahl bilden?";
    markNomenPracticeWrong(entered, hint);
    return;
  }
  recordNomenStep({ answer: entered, correct, displayAnswer: value.trim() || "leer" });
}

function answerNomenPluralNone() {
  const runtime = nomenGameRuntime;
  const item = currentNomenWord();
  if (!runtime || !item) return;
  const correct = !item.isNoun;
  if (runtime.mode === "practice" && !correct) {
    markNomenPracticeWrong("none", `Von „${item.word.toLocaleLowerCase("de-DE")}“ kannst du mehrere meinen. Schreibe die Mehrzahl mit Artikel.`);
    return;
  }
  recordNomenStep({ answer: "none", correct, displayAnswer: "Keine Mehrzahl" });
}

function answerNomenDecision(value) {
  const runtime = nomenGameRuntime;
  const item = currentNomenWord();
  if (!runtime || !item) return;
  const correctValue = item.isNoun ? "noun" : "notNoun";
  const correct = value === correctValue;
  if (runtime.mode === "practice" && !correct) {
    markNomenPracticeWrong(value, "Schau auf deine drei Ergebnisse: Name? Artikel? Mehrzahl? Was zeigen sie zusammen?");
    return;
  }
  recordNomenStep({ answer: value, correct, displayAnswer: value === "noun" ? "Nomen" : "kein Nomen" });
}

function nomenCorrectStepText(key, item) {
  if (key === "category") return item.isNoun
    ? `Ja. Das Wort ist ein Name für ${nomenCategorySentence(item.category)}.`
    : "Genau. Es ist kein Name für einen Menschen, ein Tier, eine Pflanze oder ein Ding.";
  if (key === "article") return item.isNoun
    ? `Ja. Es heißt zum Beispiel „${item.definite} ${item.word}“ und „${item.indefinite} ${item.word}“.`
    : "Richtig. Keiner der Artikel passt direkt vor dieses Wort.";
  if (key === "plural") return item.isNoun
    ? `Genau. Die Mehrzahl heißt „die ${item.plural}“.`
    : "Richtig. Zu diesem Wort kannst du keine Mehrzahl bilden.";
  return item.isNoun
    ? `Ja! „${item.word}“ ist ein Nomen und wird großgeschrieben.`
    : `Genau! „${item.word.toLocaleLowerCase("de-DE")}“ ist hier kein Nomen.`;
}

function renderNomenStepFeedback() {
  const runtime = nomenGameRuntime;
  const item = currentNomenWord();
  const key = runtime.lastStepResult?.key || currentNomenStepKey();
  if (runtime.mode === "test") {
    return `
      <section class="nomen-step-feedback neutral">
        <div class="nomen-feedback-icon">✓</div>
        <h3>Antwort gespeichert.</h3>
        <p>Weiter mit dem nächsten Prüfschritt.</p>
        <button class="primary" type="button" onclick="continueNomenStep()">${nomenContinueLabel(key)}</button>
      </section>
    `;
  }
  const direct = runtime.lastStepResult?.firstTry;
  return `
    <section class="nomen-step-feedback">
      <div class="nomen-feedback-icon">${direct ? "⭐" : "👍"}</div>
      <h3>${direct ? "Richtig geprüft!" : "Jetzt stimmt es!"}</h3>
      <p>${escapeHtml(nomenCorrectStepText(key, item))}</p>
      <button class="primary" type="button" onclick="continueNomenStep()">${nomenContinueLabel(key)}</button>
    </section>
  `;
}

function nomenContinueLabel(key) {
  if (key === "category") return "Weiter: Artikel-Probe →";
  if (key === "article") return "Weiter: Mehrzahl-Probe →";
  if (key === "plural") return "Jetzt entscheiden →";
  return "Wort abschließen →";
}

function continueNomenStep() {
  const runtime = nomenGameRuntime;
  if (!runtime || runtime.phase !== "feedback") return;
  if (runtime.stepIndex < 3) {
    runtime.stepIndex += 1;
    runtime.currentAttempts = 1;
    runtime.wrongValues = [];
    runtime.hint = "";
    runtime.phase = "question";
    runtime.stepStartedMs = Date.now();
  } else {
    runtime.currentItemResult.finishedAt = nowIso();
    runtime.currentItemResult.durationMs = Object.values(runtime.currentItemResult.steps).reduce((sum, step) => sum + Number(step.durationMs || 0), 0);
    runtime.itemResults.push(runtime.currentItemResult);
    runtime.phase = "wordResult";
  }
  render();
}

function renderNomenWordResult() {
  const runtime = nomenGameRuntime;
  const item = currentNomenWord();
  const isLast = runtime.roundIndex === runtime.rounds.length - 1;
  if (runtime.mode === "test") {
    return `
      <section class="nomen-word-result neutral">
        <div class="nomen-result-stamp neutral">GESPEICHERT</div>
        <h3>Dieses Wort ist fertig.</h3>
        <p>Die Auswertung kommt erst nach dem Test zu deiner Lehrkraft.</p>
        <button class="primary" type="button" onclick="nextNomenWord()">${isLast ? "Test beenden →" : "Nächstes Wort →"}</button>
      </section>
    `;
  }
  const rows = item.isNoun
    ? [
        `Name für ${nomenCategorySentence(item.category)}`,
        `Artikel: ${item.definite} / ${item.indefinite}`,
        `Mehrzahl: die ${item.plural}`
      ]
    : ["kein Name für Mensch, Tier, Pflanze oder Ding", "kein passender Artikel", "keine Mehrzahl"];
  return `
    <section class="nomen-word-result">
      <div class="nomen-result-stamp ${item.isNoun ? "noun" : "not-noun"}">${item.isNoun ? "NOMEN" : "KEIN NOMEN"}</div>
      <div class="nomen-final-word ${item.isNoun ? "noun" : "not-noun"}">
        <small>${item.isNoun ? "So schreiben wir es:" : "So bleibt das Wort:"}</small>
        <strong>${item.isNoun ? `${escapeHtml(item.definite)} ${escapeHtml(item.word)}` : escapeHtml(item.word.toLocaleLowerCase("de-DE"))}</strong>
        ${item.isNoun ? `<span>Mehrzahl: <b>die ${escapeHtml(item.plural)}</b></span>` : ""}
      </div>
      <div class="nomen-proof-summary">
        ${rows.map((row, index) => `<div><span>${index + 1}</span><p>${escapeHtml(row)}</p></div>`).join("")}
      </div>
      <button class="primary" type="button" onclick="nextNomenWord()">${isLast ? "Ergebnis ansehen →" : "Nächstes Wort →"}</button>
    </section>
  `;
}

async function nextNomenWord() {
  const runtime = nomenGameRuntime;
  if (!runtime || runtime.phase !== "wordResult") return;
  if (runtime.roundIndex >= runtime.rounds.length - 1) {
    await finishNomenSession();
    return;
  }
  runtime.roundIndex += 1;
  prepareNomenCurrentItem();
  render();
}

function computeNomenSessionSummary(items) {
  const summary = {};
  NOMEN_STEP_KEYS.forEach((key) => {
    const results = items.map((item) => item.steps?.[key]).filter(Boolean);
    summary[key] = {
      total: results.length,
      correct: results.filter((result) => result.correct).length,
      firstTry: results.filter((result) => result.firstTry).length,
      attempts: results.reduce((sum, result) => sum + Number(result.attempts || 0), 0)
    };
  });
  const allSteps = items.flatMap((item) => Object.values(item.steps || {}));
  return {
    steps: summary,
    firstTryCorrect: allSteps.filter((result) => result.firstTry).length,
    totalInteractions: allSteps.length,
    secureWords: items.filter((item) => NOMEN_STEP_KEYS.every((key) => item.steps?.[key]?.correct && item.steps?.[key]?.firstTry)).length,
    totalWords: items.length
  };
}

async function finishNomenSession() {
  const runtime = nomenGameRuntime;
  if (!runtime || runtime.savedSession) return;
  const animal = selectedAnimal();
  if (!animal) return;
  const finishedAt = nowIso();
  const summary = computeNomenSessionSummary(runtime.itemResults);
  const session = {
    id: makeId(),
    gameId: NOMEN_GAME_ID,
    gameTitle: "Nomen-Probe",
    classId: runtime.classId,
    animalId: runtime.animalId,
    mode: runtime.mode,
    startedAt: runtime.startedAt,
    finishedAt,
    durationSeconds: Math.max(1, Math.round((Date.now() - runtime.startedMs) / 1000)),
    wordPoolSize: NOMEN_GAME_WORDS.length,
    nounPoolSize: NOMEN_GAME_WORDS.filter((word) => word.isNoun).length,
    items: runtime.itemResults,
    summary
  };
  runtime.savedSession = session;
  await persist({ ...state, learningGameSessions: [...(state.learningGameSessions || []), session] });
  if (typeof syncLearningGameSessionAfterSave === "function") {
    runtime.classSyncResult = await syncLearningGameSessionAfterSave(session);
  }
  screen = "childNomenFinal";
  render();
}

function renderNomenFinal() {
  const runtime = nomenGameRuntime;
  const session = runtime?.savedSession;
  if (!runtime || !session) return renderNomenStart();
  const summary = session.summary;
  const pct = summary.totalInteractions ? Math.round((summary.firstTryCorrect / summary.totalInteractions) * 100) : 0;
  const stars = pct >= 85 ? "⭐⭐⭐" : pct >= 65 ? "⭐⭐" : "⭐";
  const isTest = session.mode === "test";
  return `
    <section class="nomen-shell nomen-final-shell">
      <div class="nomen-final-card">
        <img class="nomen-toni" src="materials/toni-nomen.png" alt="Toni" />
        <div class="nomen-final-stars">${isTest ? "🎯" : stars}</div>
        <h2>${isTest ? "Test geschafft!" : "Probe geschafft!"}</h2>
        ${isTest
          ? `<p>Du hast 10 Wörter ganz alleine geprüft. Deine Antworten sind gespeichert.</p><div class="nomen-test-finish-note">Die genaue Auswertung sieht deine Lehrkraft.</div>`
          : `<p>Du hast 10 Wörter mit der ganzen Nomen-Probe geprüft.</p><div class="nomen-practice-score"><strong>${summary.firstTryCorrect}</strong><span>von ${summary.totalInteractions} Prüfschritten direkt richtig</span></div>`}
        ${runtime.classSyncResult?.attempted ? `<div class="nomen-sync-note ${runtime.classSyncResult.success ? "success" : "pending"}">${runtime.classSyncResult.success ? "☁️ Ergebnis wurde an die Lehrkraft gesendet." : "📱 Ergebnis ist auf diesem Gerät gespeichert und wird später gesendet."}</div>` : ""}
        <div class="nomen-final-actions">
          <button class="primary" type="button" onclick="startNomenGame('${session.mode}')">Noch eine Runde</button>
          <button class="secondary" type="button" onclick="openNomenProbe()">Zur Nomen-Probe</button>
          <button class="secondary" type="button" onclick="setChildScreen('childLearningGames')">Zu den Lernspielen</button>
        </div>
      </div>
    </section>
  `;
}

function leaveNomenGame() {
  if (nomenGameRuntime && !nomenGameRuntime.savedSession) {
    if (!confirm("Möchtest du diese Runde wirklich beenden? Die angefangene Runde wird nicht gespeichert.")) return;
  }
  nomenGameRuntime = null;
  screen = "childNomenStart";
  render();
}

function speakNomenWord() {
  const item = currentNomenWord();
  if (!item || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(item.word.toLocaleLowerCase("de-DE"));
  utterance.lang = "de-DE";
  utterance.rate = 0.82;
  utterance.pitch = 1.03;
  window.speechSynthesis.speak(utterance);
}

function nomenCategorySentence(category) {
  return ({ Mensch: "einen Menschen", Tier: "ein Tier", Pflanze: "eine Pflanze", Ding: "ein Ding" })[category] || "etwas";
}

function resetNomenRuntime() {
  nomenGameRuntime = null;
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

/* ---------------- Lehrer-Auswertung ---------------- */

function learningGameSessionsForActiveClass() {
  return (state.learningGameSessions || [])
    .filter((session) => session.classId === state.activeClassId && session.teacherReset !== true && session.gameId === NOMEN_GAME_ID && session.finishedAt)
    .sort((a, b) => new Date(b.finishedAt || 0) - new Date(a.finishedAt || 0));
}

function nomenSessionMetric(session, key) {
  const step = session?.summary?.steps?.[key];
  if (!step?.total) return 0;
  const value = session.mode === "practice" ? step.firstTry : step.correct;
  return Math.round((value / step.total) * 100);
}

function nomenFirstTryPercent(session) {
  const summary = session?.summary;
  if (!summary?.totalInteractions) return 0;
  return Math.round((summary.firstTryCorrect / summary.totalInteractions) * 100);
}

function nomenTeacherSessions() {
  const all = learningGameSessionsForActiveClass();
  if (nomenTeacherMode === "all") return all;
  return all.filter((session) => session.mode === nomenTeacherMode);
}

function setNomenTeacherMode(mode) {
  nomenTeacherMode = ["test", "practice", "all"].includes(mode) ? mode : "test";
  nomenTeacherSessionId = "";
  render();
}

function openNomenTeacherDetails(sessionId) {
  nomenTeacherSessionId = sessionId;
  const session = learningGameSessionsForActiveClass().find((item) => item.id === sessionId);
  if (session) nomenTeacherAnimalId = session.animalId;
  render();
  window.setTimeout(() => document.querySelector("#nomenTeacherDetail")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
}

function renderLearningGamesTeacher() {
  const animals = animalsForActiveClass().filter((animal) => animal.aktiv);
  const classSyncSettings = typeof currentClassSyncSettings === "function" ? currentClassSyncSettings() : { enabled: false, endpoint: "", syncCode: "" };
  const classSyncReady = classSyncSettings.enabled && classSyncSettings.endpoint && classSyncSettings.syncCode;
  const all = learningGameSessionsForActiveClass();
  const filtered = nomenTeacherSessions();
  const latestByAnimal = animals.map((animal) => ({
    animal,
    session: filtered.find((session) => session.animalId === animal.id) || null
  }));
  const testSessions = all.filter((session) => session.mode === "test");
  const averageDecision = testSessions.length
    ? Math.round(testSessions.reduce((sum, session) => sum + nomenSessionMetric(session, "decision"), 0) / testSessions.length)
    : 0;
  const averageFirstTry = testSessions.length
    ? Math.round(testSessions.reduce((sum, session) => sum + nomenFirstTryPercent(session), 0) / testSessions.length)
    : 0;
  const selectedSession = (nomenTeacherSessionId && all.find((session) => session.id === nomenTeacherSessionId)) || null;

  return `
    <section class="panel learning-games-teacher-panel">
      <div class="learning-games-teacher-title">
        <div>
          <h2>Lernspiele & Tests</h2>
          <p class="message">Nomen-Probe: Die App speichert jeden Prüfschritt, den ersten Versuch, weitere Versuche und die Bearbeitungszeit. Kinder bleiben über ihre Tier-ID pseudonymisiert.</p>
        </div>
        <img class="nomen-toni-small" src="materials/toni-nomen.png" alt="Toni" />
      </div>
      <div class="nomen-stat-grid">
        <article><strong>${testSessions.length}</strong><span>abgeschlossene Tests</span></article>
        <article><strong>${averageDecision}%</strong><span>Ø Nomen erkannt</span></article>
        <article><strong>${averageFirstTry}%</strong><span>Ø sofort richtig</span></article>
        <article><strong>${NOMEN_GAME_WORDS.length}</strong><span>Wörter im Aufgabenpool</span></article>
      </div>
      ${classSyncReady ? `<div class="nomen-cloud-fetch"><button class="primary" type="button" onclick="pullClassSyncSessions()">☁️ Kinder-Ergebnisse abrufen</button><small>${classSyncSettings.lastPullAt ? `zuletzt ${escapeHtml(formatDateTime(classSyncSettings.lastPullAt))}` : "noch nicht abgerufen"}</small></div>` : ""}
      <div class="section-tabs nomen-filter-tabs">
        <button class="small-button ${nomenTeacherMode === "test" ? "active" : ""}" type="button" onclick="setNomenTeacherMode('test')">Tests</button>
        <button class="small-button ${nomenTeacherMode === "practice" ? "active" : ""}" type="button" onclick="setNomenTeacherMode('practice')">Üben</button>
        <button class="small-button ${nomenTeacherMode === "all" ? "active" : ""}" type="button" onclick="setNomenTeacherMode('all')">Alle</button>
      </div>
      <p class="message subtle">${nomenTeacherMode === "practice" ? "Bei Übungsrunden zeigen die Prozentwerte, was beim ersten Versuch gelang." : nomenTeacherMode === "test" ? "Im Test gibt es pro Prüfschritt genau eine Antwort und keine Lösungshinweise." : "Tests und Übungsrunden gemeinsam."}</p>
      <div class="table-scroll">
        <table class="nomen-results-table">
          <thead>
            <tr><th>Tier</th><th>letzte Runde</th><th>Namensprobe</th><th>Artikel</th><th>Mehrzahl</th><th>Nomen erkannt</th><th>sofort richtig</th><th>Zeit</th><th></th></tr>
          </thead>
          <tbody>
            ${latestByAnimal.map(({ animal, session }) => renderNomenTeacherRow(animal, session)).join("") || `<tr><td colspan="9">Noch keine Tiere angelegt.</td></tr>`}
          </tbody>
        </table>
      </div>
    </section>
    ${selectedSession ? renderNomenTeacherDetail(selectedSession) : renderNomenTeacherEmptyDetail(filtered)}
  `;
}

function renderNomenTeacherRow(animal, session) {
  if (!session) {
    return `<tr><td><strong>${teacherAnimalLabel(animal)}</strong></td><td colspan="7">Noch keine ${nomenTeacherMode === "test" ? "Test" : nomenTeacherMode === "practice" ? "Übungs" : ""}-Runde</td><td>–</td></tr>`;
  }
  return `
    <tr>
      <td><strong>${teacherAnimalLabel(animal)}</strong></td>
      <td>${escapeHtml(formatSmartDate(session.finishedAt))}<br><small>${session.mode === "test" ? "Test" : "Üben"}</small></td>
      <td>${nomenMetricBadge(nomenSessionMetric(session, "category"))}</td>
      <td>${nomenMetricBadge(nomenSessionMetric(session, "article"))}</td>
      <td>${nomenMetricBadge(nomenSessionMetric(session, "plural"))}</td>
      <td>${nomenMetricBadge(nomenSessionMetric(session, "decision"))}</td>
      <td>${nomenMetricBadge(nomenFirstTryPercent(session))}</td>
      <td>${formatNomenDuration(session.durationSeconds)}</td>
      <td><button class="small-button" type="button" onclick="openNomenTeacherDetails('${escapeAttribute(session.id)}')">Details</button></td>
    </tr>
  `;
}

function nomenMetricBadge(value) {
  const cls = value >= 85 ? "strong" : value >= 65 ? "medium" : "needs-work";
  return `<span class="nomen-metric ${cls}">${Number(value || 0)}%</span>`;
}

function formatNomenDuration(seconds) {
  const total = Math.max(0, Number(seconds || 0));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return minutes ? `${minutes}:${String(rest).padStart(2, "0")} min` : `${rest} s`;
}

function renderNomenTeacherEmptyDetail(filtered) {
  if (!filtered.length) {
    return `
      <section class="panel">
        <h2>Nomen-Probe</h2>
        <div class="empty">Noch keine ${nomenTeacherMode === "test" ? "Tests" : nomenTeacherMode === "practice" ? "Übungsrunden" : "Runden"} gespeichert. Sobald ein Kind eine Runde beendet, erscheint die Auswertung hier automatisch.</div>
      </section>
    `;
  }
  return `
    <section class="panel">
      <h2>Detailauswertung</h2>
      <div class="empty">Wähle in der Tabelle „Details“, um die einzelnen Wörter und Prüfschritte zu sehen.</div>
    </section>
  `;
}

function renderNomenTeacherDetail(session) {
  const animal = state.animals.find((item) => item.id === session.animalId);
  const history = learningGameSessionsForActiveClass().filter((item) => item.animalId === session.animalId).slice(0, 8);
  return `
    <section class="panel nomen-teacher-detail" id="nomenTeacherDetail">
      <div class="nomen-detail-heading">
        <div>
          <h2>${animal ? teacherAnimalLabel(animal) : "Tier"} · Nomen-Probe</h2>
          <p class="message">${session.mode === "test" ? "Test" : "Übungsrunde"} vom ${escapeHtml(formatDateTime(session.finishedAt))} · ${formatNomenDuration(session.durationSeconds)}</p>
        </div>
        <div class="nomen-detail-overall">${nomenFirstTryPercent(session)}%<small>sofort richtig</small></div>
      </div>
      <div class="nomen-stat-grid detail">
        ${NOMEN_STEP_KEYS.map((key) => `<article><strong>${nomenSessionMetric(session, key)}%</strong><span>${escapeHtml(NOMEN_STEP_LABELS[key])}</span></article>`).join("")}
      </div>
      <h3>Die 10 Wörter</h3>
      <div class="table-scroll">
        <table class="nomen-word-detail-table">
          <thead><tr><th>Wort</th><th>Namensprobe</th><th>Artikel</th><th>Mehrzahl</th><th>Entscheidung</th><th>Zeit</th></tr></thead>
          <tbody>${(session.items || []).map((item) => renderNomenWordDetailRow(session, item)).join("")}</tbody>
        </table>
      </div>
      <h3>Verlauf</h3>
      <div class="nomen-history-list">
        ${history.map((item) => `
          <button type="button" class="nomen-history-row ${item.id === session.id ? "active" : ""}" onclick="openNomenTeacherDetails('${escapeAttribute(item.id)}')">
            <span>${escapeHtml(formatSmartDate(item.finishedAt))}</span>
            <span>${item.mode === "test" ? "Test" : "Üben"}</span>
            <strong>${nomenFirstTryPercent(item)}% sofort</strong>
            <span>Nomen: ${nomenSessionMetric(item, "decision")}%</span>
          </button>
        `).join("")}
      </div>
    </section>
  `;
}

function renderNomenWordDetailRow(session, item) {
  const wordLabel = item.isNoun ? `${item.definite} ${item.word}` : item.word.toLocaleLowerCase("de-DE");
  return `
    <tr>
      <td><strong>${escapeHtml(wordLabel)}</strong>${item.isNoun ? `<br><small>die ${escapeHtml(item.plural)}</small>` : `<br><small>${escapeHtml(item.kind || "kein Nomen")}</small>`}</td>
      ${NOMEN_STEP_KEYS.map((key) => `<td>${renderNomenStepDetail(session, item.steps?.[key])}</td>`).join("")}
      <td>${formatNomenDuration(Math.round(Number(item.durationMs || 0) / 1000))}</td>
    </tr>
  `;
}

function renderNomenStepDetail(session, result) {
  if (!result) return "–";
  const icon = result.correct ? "✅" : "❌";
  const attempts = session.mode === "practice" && Number(result.attempts || 1) > 1 ? `<small>${result.attempts} Versuche</small>` : `<small>${result.firstTry ? "sofort" : "1. Antwort"}</small>`;
  return `<span class="nomen-step-detail">${icon}<span>${escapeHtml(result.displayAnswer || result.answer || "–")}</span>${attempts}</span>`;
}
