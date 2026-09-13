(function installProgressChildrenOverview() {
  if (typeof renderProgress !== "function") return;
  const originalRenderProgress = renderProgress;

  function renderProgressChildrenOverview() {
    const classId = getProgressClassId();
    const animals = animalsForClass(classId).filter((animal) => animal.aktiv);
    if (!animals.length) return "";

    const rows = typeof lkWorkStatusRowsForPeriod === "function"
      ? lkWorkStatusRowsForPeriod(animals, "current")
      : [];
    const byAnimal = new Map(rows.map((row) => [row.animal.id, row.result]));
    const withPlan = rows.filter((row) => row.result).length;

    return `
      <details class="panel progress-children-overview">
        <summary class="progress-children-overview-summary">
          <div>
            <span class="progress-children-overview-kicker">Klassenblick</span>
            <strong>Übersicht der Kinder</strong>
            <small>${withPlan} von ${animals.length} Kindern mit Wochenplan in dieser Woche</small>
          </div>
          <span class="progress-children-overview-hint">aufklappen</span>
        </summary>
        <div class="progress-children-overview-body">
          <p class="message">Hier siehst du den Arbeitsstand aller Kinder kompakt. Mit „Lernstand öffnen“ wechselst du direkt zum ausgewählten Kind.</p>
          <div class="progress-children-overview-grid">
            ${animals.map((animal) => {
              const result = byAnimal.get(animal.id) || null;
              if (!result) {
                return `
                  <div class="progress-child-card no-data">
                    <div class="progress-child-card-main">
                      <strong>${escapeHtml(animal.tierEmoji)} ${escapeHtml(animal.tierName)}</strong>
                      <small>Kein Wochenplan für diese Woche</small>
                    </div>
                    <button class="secondary small-button" type="button" onclick="setProgressFilter('animalId','${escapeAttribute(animal.id)}')">Lernstand öffnen</button>
                  </div>
                `;
              }

              return `
                <div class="progress-child-card">
                  <div class="progress-child-card-main">
                    <strong>${escapeHtml(animal.tierEmoji)} ${escapeHtml(animal.tierName)}</strong>
                    <small>${escapeHtml(weeklyPlanPeriodLabel(result.plan) || result.plan.title || "Aktuelle Woche")}</small>
                  </div>
                  <div class="progress-child-card-counts" aria-label="Arbeitsstand">
                    <span class="done">✓ ${result.counts.fertig}</span>
                    <span class="partial">◐ ${result.counts.teilweise}</span>
                    <span class="open">○ ${result.counts.offen}</span>
                  </div>
                  <button class="secondary small-button" type="button" onclick="setProgressFilter('animalId','${escapeAttribute(animal.id)}')">Lernstand öffnen</button>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      </details>
    `;
  }

  renderProgress = function renderProgressWithChildrenOverview() {
    const html = originalRenderProgress();
    const overview = renderProgressChildrenOverview();
    if (!overview) return html;
    const marker = "</section>";
    const index = html.indexOf(marker);
    if (index < 0) return overview + html;
    return html.slice(0, index + marker.length) + overview + html.slice(index + marker.length);
  };
})();
