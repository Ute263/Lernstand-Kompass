/* Paket 3g/3h: Mehrzahl mit ODER ohne Artikel als richtig werten.
 * Beispiel: "Jungen" und "die Jungen" sind beide richtig.
 * Groß-/Kleinschreibung wird bei dieser Probe nicht bewertet.
 */
(() => {
  if (typeof answerNomenPluralInput !== "function") return;

  const baseRenderNomenStart =
    typeof renderNomenStart === "function" ? renderNomenStart : null;
  const baseRenderNomenQuestion =
    typeof renderNomenQuestion === "function" ? renderNomenQuestion : null;

  if (baseRenderNomenStart) {
    renderNomenStart = function renderNomenStartPluralFlexible() {
      return baseRenderNomenStart()
        .replace(
          "Schreibe die Mehrzahl mit Artikel.",
          "Schreibe die Mehrzahl. Mit oder ohne Artikel ist richtig."
        );
    };
  }

  if (baseRenderNomenQuestion) {
    renderNomenQuestion = function renderNomenQuestionPluralFlexible() {
      return baseRenderNomenQuestion()
        .replace(
          "Schreibe die Mehrzahl <strong>mit Artikel</strong>. Wenn das nicht geht, wähle „Keine Mehrzahl“.",
          "Schreibe die Mehrzahl. Du kannst sie <strong>mit oder ohne Artikel</strong> schreiben. Wenn das nicht geht, wähle „Keine Mehrzahl“."
        )
        .replace(
          '<label for="nomenPluralInput">Mehrzahl mit Artikel</label>',
          '<label for="nomenPluralInput">Mehrzahl</label>'
        )
        .replace(
          'placeholder="z. B. die Hunde"',
          'placeholder="z. B. Hunde oder die Hunde"'
        );
    };
  }

  answerNomenPluralInput = function answerNomenPluralFlexible(value) {
    const runtime = nomenGameRuntime;
    const item = currentNomenWord();
    if (!runtime || !item) return;

    const entered = normalizeNomenPlural(value);

    if (!entered && runtime.mode === "practice") {
      markNomenPracticeWrong(
        "",
        "Schreibe die Mehrzahl hinein – mit oder ohne Artikel – oder wähle „Keine Mehrzahl“."
      );
      return;
    }

    const pluralOnly = item.isNoun
      ? normalizeNomenPlural(item.plural)
      : "";
    const pluralWithArticle = item.isNoun
      ? normalizeNomenPlural(`die ${item.plural}`)
      : "";

    const correct = Boolean(
      item.isNoun &&
      (entered === pluralOnly || entered === pluralWithArticle)
    );

    if (runtime.mode === "practice" && !correct) {
      const hint = item.isNoun
        ? "Sprich das Wort mit „viele“. Du darfst nur die Mehrzahl oder „die“ plus Mehrzahl schreiben."
        : "Prüfe: Kann man von diesem Wort überhaupt eine Einzahl und eine Mehrzahl bilden?";
      markNomenPracticeWrong(entered, hint);
      return;
    }

    recordNomenStep({
      answer: entered,
      correct,
      displayAnswer: value.trim() || "leer"
    });
  };
})();
