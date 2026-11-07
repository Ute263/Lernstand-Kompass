/* Lernübersicht v7: klare Trennung zwischen Wochenplan und Lernstand */
(() => {
  if (typeof TEACHER_GROUPS === 'undefined' || typeof renderTeacherSection !== 'function') return;

  const weekly = TEACHER_GROUPS.find((g) => g.id === 'weeklyPlansGroup');
  if (weekly) {
    weekly.sections.splice(0, weekly.sections.length,
      ['weeklyPlans', 'Plan erstellen'],
      ['overview', 'Klassenübersicht']
    );
  }

  const learning = TEACHER_GROUPS.find((g) => g.id === 'learning');
  if (learning) {
    learning.sections.splice(0, learning.sections.length,
      ['learningSummary', 'Gesamt'],
      ['learningGerman', 'Deutsch'],
      ['learningMath', 'Mathematik'],
      ['abcLearningWorkbook', '__ABC-Lernstandsheft'],
      ['assessmentsGerman', '__Deutsch-Lernzielkontrollen'],
      ['minimaxTests', '__MiniMax-Teste-dich'],
      ['assessmentsMath', '__Mathe-Lernzielkontrollen'],
      ['progress', '__Kindbezogene Lernstände'],
      ['workbookCatalog', '__Arbeitshefte']
    );
  }

  function quickCard(title, subtitle, action, icon) {
    return `<button class="lk-learning-card" type="button" onclick="${action}">
      <span class="lk-learning-card-icon">${icon}</span>
      <span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(subtitle)}</small></span>
      <b aria-hidden="true">›</b>
    </button>`;
  }

  function renderSummary() {
    return `<section class="panel lk-learning-clean">
      <div class="lk-learning-clean-head">
        <h2>Lernstand</h2>
        <p>Was können die Kinder?</p>
      </div>
      <div class="lk-learning-subject-grid">
        <section class="lk-learning-subject-block">
          <div class="lk-learning-subject-title"><span>📘</span><h3>Deutsch</h3></div>
          ${quickCard('Lernstandsheft ABC der Tiere', 'Lernstände aus dem Arbeitsheft', "setTeacherTab('abcLearningWorkbook')", 'ABC')}
          ${quickCard('Lernzielkontrollen', 'Ergebnisse und Kompetenzen', "setTeacherTab('assessmentsGerman')", '✓')}
        </section>
        <section class="lk-learning-subject-block">
          <div class="lk-learning-subject-title"><span>🔢</span><h3>Mathematik</h3></div>
          ${quickCard('MiniMax 2 · Teste dich', 'Teste dich 1–24', "setTeacherTab('minimaxTests')", 'MM')}
          ${quickCard('Lernzielkontrollen', 'Ergebnisse und Kompetenzen', "setTeacherTab('assessmentsMath')", '✓')}
        </section>
      </div>
    </section>`;
  }

  function renderGerman() {
    return `<section class="panel lk-learning-clean">
      <div class="lk-learning-clean-head"><h2>Deutsch</h2></div>
      <div class="lk-learning-single-grid">
        ${quickCard('Lernstandsheft ABC der Tiere', 'Lernstände aus dem Arbeitsheft', "setTeacherTab('abcLearningWorkbook')", 'ABC')}
        ${quickCard('Lernzielkontrollen', 'Punkte, Kompetenzen und Auswertung', "setTeacherTab('assessmentsGerman')", '✓')}
      </div>
    </section>`;
  }

  function renderMath() {
    return `<section class="panel lk-learning-clean">
      <div class="lk-learning-clean-head"><h2>Mathematik</h2></div>
      <div class="lk-learning-single-grid">
        ${quickCard('MiniMax 2 · Teste dich', 'Teste dich 1–24', "setTeacherTab('minimaxTests')", 'MM')}
        ${quickCard('Lernzielkontrollen', 'Punkte, Kompetenzen und Auswertung', "setTeacherTab('assessmentsMath')", '✓')}
      </div>
    </section>`;
  }

  function renderAbc() {
    return `<section class="panel lk-learning-clean">
      <div class="backup-actions"><button class="secondary" type="button" onclick="setTeacherTab('learningGerman')">← Deutsch</button></div>
      <div class="lk-learning-clean-head"><h2>Lernstandsheft · ABC der Tiere</h2></div>
      <p class="message">Das Heft bleibt unter den Arbeitsheften. Eine Punkteauswertung kann hier später ergänzt werden.</p>
      <div class="backup-actions"><button class="primary" type="button" onclick="setTeacherTab('workbookCatalog')">Arbeitshefte öffnen</button></div>
    </section>`;
  }

  const baseRender = renderTeacherSection;
  renderTeacherSection = function learningNavigationV7(tab) {
    if (tab === 'learningSummary') return renderSummary();
    if (tab === 'learningGerman') return renderGerman();
    if (tab === 'learningMath') return renderMath();
    if (tab === 'abcLearningWorkbook') return renderAbc();
    return baseRender(tab);
  };
})();
