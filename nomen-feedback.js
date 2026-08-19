/* Paket 3c: Konkrete Rückmeldung nach jedem vollständig geprüften Wort.
 * Die Prüfschritte im Test bleiben neutral. Erst nach der kompletten Nomen-Probe
 * für ein Wort wird die richtige Lösung gezeigt.
 */
(() => {
  if (typeof renderNomenWordResult !== "function") return;

  const originalRenderNomenStart = typeof renderNomenStart === "function" ? renderNomenStart : null;

  if (originalRenderNomenStart) {
    renderNomenStart = function renderNomenStartWithWordFeedbackInfo() {
      return originalRenderNomenStart().replace(
        "Du antwortest einmal. Die Lösungen siehst du während des Tests nicht.",
        "Du antwortest einmal. Nach jedem vollständig geprüften Wort siehst du die richtige Lösung."
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
    const successful = runtime.mode === "test"
      ? stepResults.length === 4 && stepResults.every((result) => result.correct)
      : stepResults.length === 4 && stepResults.every((result) => result.firstTry);

    const rows = correctWordRows(item);
    const displayWord = item.isNoun
      ? `${item.definite} ${item.word}`
      : item.word.toLocaleLowerCase("de-DE");

    const subline = item.isNoun
      ? `Mehrzahl: <b>die ${escapeHtml(item.plural)}</b>`
      : `Wortart: <b>${escapeHtml(item.kind || "kein Nomen")}</b>`;

    return `
      <section class="nomen-word-result">
        <div class="nomen-result-stamp ${item.isNoun ? "noun" : "not-noun"}">
          ${item.isNoun ? "NOMEN" : "KEIN NOMEN"}
        </div>

        <h3>${successful
          ? (runtime.mode === "test" ? "Alles richtig!" : "Alles direkt richtig!")
          : "So ist die richtige Probe:"}</h3>

        <div class="nomen-final-word ${item.isNoun ? "noun" : "not-noun"}">
          <small>${item.isNoun ? "So schreiben wir das Wort:" : "Das Wort bleibt klein:"}</small>
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
