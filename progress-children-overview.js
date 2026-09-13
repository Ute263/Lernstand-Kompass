(function installProgressChildrenOverview() {
  if (typeof renderProgress !== "function") return;
  const originalRenderProgress = renderProgress;

  function statusMeta(status) {
    if (status === "fertig") return { icon: "✓", label: "fertig", cls: "done" };
    if (status === "teilweise") return { icon: "◐", label: "teilweise", cls: "partial" };
    return { icon: "○", label: "offen", cls: "open" };
  }

  function taskText(item) {
    return item?.text || item?.detail || item?.label || "Aufgabe";
  }

  function taskSubject(item) {
    if (item?.subject) return item.subject;
    const field = String(item?.field || "");
    if (field.startsWith("Deutsch") || field.includes("Lese") || field.includes("Lernw")) return "Deutsch";
    if (field.startsWith("Mathe")) return "Mathe";
    return "Weitere Aufgaben";
  }

  function renderTaskOverview(result) {
    const rows = result?.rows || [];
    if (!rows.length) return `<div class="progress-child-task-empty">Keine Aufgaben gespeichert.</div>`;

    const groups = new Map();
    rows.forEach((row) => {
      const subject = taskSubject(row.item);
      if (!groups.has(subject)) groups.set(subject, []);
      groups.get(subject).push(row);
    });

    return `
      <div class="progress-child-task-groups">
        ${Array.from(groups.entries()).map(([subject, subjectRows]) => `
          <section class="progress-child-task-group">
            <div class="progress-child-task-group-title">
              <strong>${escapeHtml(subject)}</strong>
              <span>${subjectRows.length} ${subjectRows.length === 1 ? "Aufgabe" : "Aufgaben"}</span>
            </div>
            <div class="progress-child-task-list">
              ${subjectRows.map(({ day, item, status }) => {
                const meta = statusMeta(status);
                return `
                  <div class="progress-child-task-row">
                    <span class="progress-child-task-status ${meta.cls}">${meta.icon}</span>
                    <div class="progress-child-task-copy">
                      <strong>${escapeHtml(taskText(item))}</strong>
                      <small>${day === "Woche" ? "Ganze Woche" : escapeHtml(day)} · ${escapeHtml(meta.label)}</small>
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          </section>
        `).join("")}
      </div>
    `;
  }

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
          <p class="message">Hier siehst du den Arbeitsstand aller Kinder. Bei jedem Kind kannst du zusätzlich alle Seiten und Aufgaben der aktuellen Woche aufklappen.</p>
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
                  <div class="progress-child-card-actions">
                    <button class="secondary small-button" type="button" onclick="setProgressFilter('animalId','${escapeAttribute(animal.id)}')">Lernstand öffnen</button>
                  </div>
                  <details class="progress-child-task-overview">
                    <summary>
                      <span>Seiten & Aufgaben</span>
                      <small>${result.rows.length} insgesamt</small>
                    </summary>
                    ${renderTaskOverview(result)}
                  </details>
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
