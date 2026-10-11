/* Fachstruktur für Lernübersicht: Deutsch und Mathematik */
(() => {
  if (typeof TEACHER_GROUPS === "undefined" || typeof renderTeacherSection !== "function") return;

  const learning = TEACHER_GROUPS.find((g) => g.id === "learning");
  if (learning) {
    learning.sections.splice(0, learning.sections.length,
      ["overview", "Klassenübersicht"],
      ["progress", "Kindübersicht"],
      ["learningGerman", "Deutsch"],
      ["learningMath", "Mathematik"],
      ["abcLearningWorkbook", "__ABC-Lernstandsheft"],
      ["assessmentsGerman", "__Deutsch-Lernzielkontrollen"],
      ["minimaxTests", "__MiniMax-Teste-dich"],
      ["assessmentsMath", "__Mathe-Lernzielkontrollen"],
      ["workbookCatalog", "__Arbeitshefte"]
    );
  }

  // Die allgemeine Lernzielkontrolle verschwindet aus der Hauptnavigation.
  // Sie bleibt technisch erhalten und wird fachbezogen aus Deutsch/Mathematik geöffnet.
  const assessmentIndex = TEACHER_GROUPS.findIndex((g) => g.id === "assessmentGroup");
  if (assessmentIndex >= 0) TEACHER_GROUPS.splice(assessmentIndex, 1);

  function subjectCard(title, text, action, icon) {
    return `<button class="teacher-home-card lk-subject-card" type="button" onclick="${action}">
      <span>${icon}</span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(text)}</small>
    </button>`;
  }

  function renderGermanHub() {
    return `<section class="panel lk-subject-hub">
      <div class="teacher-home-welcome"><span>Lernübersicht</span><h2>Deutsch</h2><p>Lernstände und Lernzielkontrollen im Fach Deutsch.</p></div>
      <div class="teacher-home-grid">
        ${subjectCard("Lernstandsheft ABC der Tiere", "Das Lernstandsheft bleibt bei den Arbeitsheften. Eine Punkteauswertung wird hier ergänzt, sobald sie genutzt werden soll.", "setTeacherTab('abcLearningWorkbook')", "📘")}
        ${subjectCard("Lernzielkontrollen", "Deutsch-Lernzielkontrollen anlegen, Punkte erfassen und Ergebnisse auswerten.", "setTeacherTab('assessmentsGerman')", "📝")}
      </div>
    </section>`;
  }

  function renderMathHub() {
    return `<section class="panel lk-subject-hub">
      <div class="teacher-home-welcome"><span>Lernübersicht</span><h2>Mathematik</h2><p>MiniMax „Teste dich“ und weitere Lernzielkontrollen.</p></div>
      <div class="teacher-home-grid">
        ${subjectCard("MiniMax 2 · Teste dich", "Teste dich 1–16 · Größen und Sachrechnen 17–20 · Geometrie 21–24. Punkte, Kompetenzstände, Noten und AFB-Auswertung.", "setTeacherTab('minimaxTests')", "📊")}
        ${subjectCard("Lernzielkontrollen", "Mathematik-Lernzielkontrollen anlegen, Punkte erfassen und Ergebnisse auswerten.", "setTeacherTab('assessmentsMath')", "✅")}
      </div>
    </section>`;
  }

  function renderAbcLearningWorkbook() {
    return `<section class="panel">
      <div class="backup-actions"><button class="secondary" type="button" onclick="setTeacherTab('learningGerman')">← Deutsch</button></div>
      <h2>Lernstandsheft · ABC der Tiere</h2>
      <p class="message">Das Lernstandsheft bleibt wie bisher im Bereich der Arbeitshefte hinterlegt. Dadurch gibt es keine doppelte Heftverwaltung.</p>
      <p class="message"><strong>Auswertung:</strong> Wenn für das Lernstandsheft später Punkte hinterlegt werden, werden Punkt- und Kompetenzauswertungen an dieser Stelle ergänzt.</p>
      <div class="backup-actions">
        <button class="primary" type="button" onclick="setTeacherTab('workbookCatalog')">Zu den Arbeitsheften</button>
        <button class="secondary" type="button" onclick="setTeacherTab('progress')">Zur Kindübersicht</button>
      </div>
    </section>`;
  }

  function renderSubjectAssessments(subject) {
    assessmentSubjectFilter = subject;
    return `<section class="panel lk-subject-back"><button class="secondary" type="button" onclick="setTeacherTab('${subject === 'Deutsch' ? 'learningGerman' : 'learningMath'}')">← ${escapeHtml(subject)}</button></section>${renderAssessments(subject)}`;
  }

  const baseRender = renderTeacherSection;
  renderTeacherSection = function learningSubjectsRender(tab) {
    if (tab === "learningGerman") return renderGermanHub();
    if (tab === "learningMath") return renderMathHub();
    if (tab === "abcLearningWorkbook") return renderAbcLearningWorkbook();
    if (tab === "assessmentsGerman") return renderSubjectAssessments("Deutsch");
    if (tab === "assessmentsMath") return renderSubjectAssessments("Mathe");
    if (tab !== "assessments") assessmentSubjectFilter = "";
    return baseRender(tab);
  };
})();
