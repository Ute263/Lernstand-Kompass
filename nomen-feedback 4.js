/* Paket 3d: Eindeutige Richtig/Falsch-Rückmeldung nach jedem Wort.
 * Die Prüfschritte im Test bleiben neutral. Nach dem vollständig geprüften Wort
 * sieht das Kind eindeutig, ob alles richtig war oder ob mindestens ein Fehler vorkam.
 */
(() => {
  if (typeof renderNomenWordResult !== "function") return;

  const originalRenderNomenStart = typeof renderNomenStart === "function" ? renderNomenStart : null;

  if (originalRenderNomenStart) {
    renderNomenStart = function renderNomenStartWithWordFeedbackInfo() {
      return originalRenderNomenStart().replace(
        "Du antwortest einmal. Die Lösungen siehst du während des Tests nicht.",
        "Du antwortest einmal. Nach jedem vollständig geprüften Wort siehst du, ob es richtig war, und die richtige Lösung."
      );
    };
  }

  function nounCategoryText(category) {
    const values = {
      Mensch: "einen Menschen",
      Tier: "ein Tier",
      Pflanze: "eine Pflanze",
      Ding: "ein Ding"
    };
    return values[category] || "etwas";
  }

  function correctWordRows(item) {
    if (item.isNoun) {
      return [
        `Namensprobe: Name für ${nounCategoryText(item.category)}.`,
        `Artikelprobe: ${item.definite} ${item.word}.`,
        `Mehrzahlprobe: die ${item.plural}.`,
        `Ergebnis: Nomen – ${item.word} wird großgeschrieben.`
      ];
    }

    const kind = item.kind || "anderes Wort";
    return [
      "Namensprobe: kein Name für Mensch, Tier, Pflanze oder Ding.",
      "Artikelprobe: kein passender Artikel.",
      "Mehrzahlprobe: keine Mehrzahl.",
      `Ergebnis: kein Nomen – „${item.word.toLocaleLowerCase("de-DE")}“ ist ein ${kind}.`
    ];
  }

  renderNomenWordResult = function renderNomenWordResultWithConcreteFeedback() {
    const runtime = nomenGameRuntime;
    const item = currentNomenWord();
    if (!runtime || !item) return "";

    const isLast = runtime.roundIndex === runtime.rounds.length - 1;
    const stepResults = Object.values(runtime.currentItemResult?.steps || {});
    const allCorrect = stepResults.length === 4 && stepResults.every((result) => result.correct);
    const allFirstTry = stepResults.length === 4 && stepResults.every((result) => result.firstTry);
    const correctCount = stepResults.filter((result) => result.correct).length;

    let feedbackIcon = "✅";
    let feedbackTitle = "Alles richtig!";
    let feedbackText = "Du hast alle Prüfschritte richtig beantwortet.";

    if (runtime.mode === "test" && !allCorrect) {
      feedbackIcon = "❌";
      feedbackTitle = "Da war etwas falsch.";
      feedbackText = `${correctCount} von 4 Prüfschritten waren richtig. Schau dir jetzt die richtige Lösung an.`;
    } else if (runtime.mode === "practice" && !allFirstTry) {
      feedbackIcon = "❌";
      feedbackTitle = "Da war zuerst etwas falsch.";
      feedbackText = "Jetzt stimmt die Probe. Schau dir die richtige Lösung noch einmal genau an.";
    } else if (runtime.mode === "practice") {
      feedbackText = "Du hast alle Prüfschritte direkt richtig beantwortet.";
    }

    const rows = correctWordRows(item);
    const displayWord = item.isNoun
      ? `${item.definite} ${item.word}`
      : item.word.toLocaleLowerCase("de-DE");

    const subline = item.isNoun
      ? `Mehrzahl: <b>die ${escapeHtml(item.plural)}</b>`
      : `Wortart: <b>${escapeHtml(item.kind || "kein Nomen")}</b>`;

    return `
      <section class="nomen-word-result">
        <div class="nomen-result-stamp ${allCorrect && (runtime.mode !== "practice" || allFirstTry) ? "noun" : "not-noun"}">
          ${feedbackIcon} ${escapeHtml(feedbackTitle)}
        </div>

        <h3>${escapeHtml(feedbackText)}</h3>

        <div class="nomen-final-word ${item.isNoun ? "noun" : "not-noun"}">
          <small>${item.isNoun ? "So lautet die richtige Lösung:" : "So lautet die richtige Lösung:"}</small>
          <strong>${escapeHtml(displayWord)}</strong>
          <span>${subline}</span>
        </div>

        <div class="nomen-proof-summary">
          ${rows.map((row, index) => `
            <div>
              <span>${index < 3 ? index + 1 : "✓"}</span>
              <p>${escapeHtml(row)}</p>
            </div>
          `).join("")}
        </div>

        <button class="primary" type="button" onclick="nextNomenWord()">
          ${isLast
            ? (runtime.mode === "test" ? "Test beenden →" : "Ergebnis ansehen →")
            : "Nächstes Wort →"}
        </button>
      </section>
    `;
  };
})();
