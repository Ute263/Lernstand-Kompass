/* Paket 9o: Ruhiger Wochenplan-Editor mit kompakten Tageskarten
 *
 * Verhalten:
 * - Tage mit Aufgaben bleiben kompakt sichtbar.
 * - Nur der gerade bearbeitete Tag zeigt die große Eingabemaske.
 * - "Fertig" schließt nur die Bearbeitung und behält die Tagesübersicht offen.
 * - Ein Klick auf einen anderen Tag wechselt gezielt dorthin.
 * - Kein selbstständiges Auf-/Zuklappen durch <details>-Toggle mehr.
 *
 * Lädt NACH weekly-calendar-overview.js.
 */
(() => {
  if (
    typeof render !== "function" ||
    typeof collectWeeklyPlanDraftFromDom !== "function"
  ) {
    console.warn("Paket 9o konnte nicht initialisiert werden.");
    return;
  }

  const baseRender = render;
  let lkEditingDay = "";
  let lkEnhanceQueued = false;

  function scheduleEnhance() {
    if (lkEnhanceQueued) return;
    lkEnhanceQueued = true;
    requestAnimationFrame(() => {
      lkEnhanceQueued = false;
      enhanceWeeklyDayEditor();
    });
  }

  render = function render9o() {
    const result = baseRender.apply(this, arguments);
    scheduleEnhance();
    return result;
  };

  function cleanText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function taskCountFromCard(card) {
    const label = cleanText(card.querySelector(".lk-weekly-day-summary span")?.textContent);
    const match = label.match(/(\d+)/);
    return match ? Number(match[1]) : 0;
  }

  function cardDay(card) {
    return cleanText(card.querySelector(".lk-weekly-day-summary strong")?.textContent);
  }

  function subjectName(section) {
    return cleanText(section.querySelector(".lk-editor-subject-head strong")?.textContent) || "Aufgabe";
  }

  function selectedWorkbookTasks(section) {
    return [...section.querySelectorAll(".weekly-selected-task")].map((row) => {
      const title = cleanText(row.querySelector(".weekly-selected-task-label strong")?.textContent);
      const number = cleanText(row.querySelector(".weekly-task-number-input")?.value);
      const starred = Boolean(row.querySelector(".weekly-extra-star")) || row.classList.contains("is-extra");
      return {
        text: [title, number ? `Nr. ${number}` : ""].filter(Boolean).join(" · "),
        starred
      };
    }).filter((item) => item.text);
  }

  function freeTasks(section) {
    return [...section.querySelectorAll("[data-free-task-row]")].map((row) => {
      const text = cleanText(row.querySelector("[data-free-text]")?.value);
      const starred = row.classList.contains("is-extra") || row.querySelector("[data-free-star]")?.value === "1";
      return { text, starred };
    }).filter((item) => item.text);
  }

  function compactGroups(card) {
    return [...card.querySelectorAll(".lk-weekly-day-content .weekly-editor-subject")].map((section) => {
      const tasks = [...selectedWorkbookTasks(section), ...freeTasks(section)];
      return { subject: subjectName(section), tasks };
    }).filter((group) => group.tasks.length);
  }

  function compactPreviewHtml(card) {
    const groups = compactGroups(card);
    if (!groups.length) {
      return `<span class="lk-day-preview-empty">Noch keine Aufgabe eingetragen</span>`;
    }

    return groups.map((group) => {
      const icon = /deutsch/i.test(group.subject) ? "📘" : /mathe/i.test(group.subject) ? "🔢" : "✏️";
      const visible = group.tasks.slice(0, 3);
      const more = group.tasks.length - visible.length;
      return `
        <div class="lk-day-preview-group">
          <span class="lk-day-preview-subject">${icon} ${escapeHtml(group.subject)}</span>
          <div class="lk-day-preview-tasks">
            ${visible.map((item) => `
              <span class="lk-day-preview-task ${item.starred ? "is-extra" : ""}">
                ${item.starred ? "⭐ " : ""}${escapeHtml(item.text)}
              </span>
            `).join("")}
            ${more > 0 ? `<span class="lk-day-preview-more">+ ${more} weitere</span>` : ""}
          </div>
        </div>`;
    }).join("");
  }

  function captureDraft() {
    try {
      weeklyPlanDraft = collectWeeklyPlanDraftFromDom();
    } catch (error) {
      console.warn("Wochenplan-Entwurf konnte vor dem Tageswechsel nicht übernommen werden.", error);
    }
  }

  function editDay(day) {
    if (!day) return;
    captureDraft();
    lkEditingDay = day;
    try {
      if (typeof window.lkRememberWeeklyDay === "function") window.lkRememberWeeklyDay(day);
    } catch {}
    render();
  }

  function finishDay(day) {
    captureDraft();
    if (!day || lkEditingDay === day) lkEditingDay = "";
    render();
  }

  function installSummaryHandler(card, day) {
    const summary = card.querySelector(".lk-weekly-day-summary");
    if (!summary) return;

    summary.removeAttribute("onclick");
    if (summary.dataset.lkCompactBound === "1") return;
    summary.dataset.lkCompactBound = "1";

    summary.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      editDay(day);
    });

    summary.setAttribute("role", "button");
    summary.setAttribute("aria-label", `${day} bearbeiten`);
    summary.title = `${day} bearbeiten`;
  }

  function addFinishButton(card, day) {
    const content = card.querySelector(".lk-weekly-day-content");
    if (!content || content.querySelector(".lk-day-edit-toolbar")) return;

    const toolbar = document.createElement("div");
    toolbar.className = "lk-day-edit-toolbar";
    toolbar.innerHTML = `
      <span>Du bearbeitest gerade <strong>${escapeHtml(day)}</strong>.</span>
      <button class="primary small-button" type="button">✓ Fertig</button>
    `;
    toolbar.querySelector("button")?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      finishDay(day);
    });
    content.prepend(toolbar);
  }

  function addCompactPreview(card, day) {
    card.querySelector(".lk-day-compact-preview")?.remove();
    const summary = card.querySelector(".lk-weekly-day-summary");
    if (!summary) return;

    const preview = document.createElement("div");
    preview.className = "lk-day-compact-preview";
    preview.innerHTML = `
      <div class="lk-day-preview-main">${compactPreviewHtml(card)}</div>
      <button class="secondary small-button lk-day-preview-edit" type="button">Bearbeiten</button>
    `;
    preview.querySelector("button")?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      editDay(day);
    });
    summary.insertAdjacentElement("afterend", preview);
  }

  function enhanceWeeklyDayEditor() {
    const cards = [...document.querySelectorAll(".lk-weekly-day-details")];
    if (!cards.length) return;

    const availableDays = cards.map(cardDay).filter(Boolean);
    if (lkEditingDay && !availableDays.includes(lkEditingDay)) lkEditingDay = "";

    cards.forEach((card) => {
      const day = cardDay(card);
      const count = taskCountFromCard(card);
      const isEditing = day === lkEditingDay;
      const isPlanned = count > 0;

      // Das native details-Toggle ist die Ursache für das unruhige Auf/Zu.
      // Ab hier steuert nur noch Paket 9o den Zustand.
      card.removeAttribute("ontoggle");
      card.ontoggle = null;
      installSummaryHandler(card, day);

      card.classList.toggle("lk-day-mode-edit", isEditing);
      card.classList.toggle("lk-day-mode-compact", !isEditing && isPlanned);
      card.classList.toggle("lk-day-mode-empty", !isEditing && !isPlanned);

      if (isEditing || isPlanned) {
        card.open = true;
      } else {
        card.open = false;
      }

      card.querySelector(".lk-day-compact-preview")?.remove();
      if (isEditing) {
        addFinishButton(card, day);
      } else if (isPlanned) {
        addCompactPreview(card, day);
      }

      const summaryState = card.querySelector(".lk-weekly-day-summary span");
      if (summaryState) {
        if (isEditing) summaryState.textContent = count ? `${count} ${count === 1 ? "Aufgabe" : "Aufgaben"} · wird bearbeitet` : "wird bearbeitet";
        else if (!isPlanned) summaryState.textContent = "noch nicht geplant · + Planen";
      }
    });
  }

  window.lkEditWeeklyDayCompact = editDay;
  window.lkFinishWeeklyDayCompact = finishDay;

  const style = document.createElement("style");
  style.id = "lk-weekly-editor-compact-style";
  style.textContent = `
    .lk-weekly-day-accordion {
      gap:8px !important;
    }

    .lk-weekly-day-details {
      overflow:hidden;
      border-radius:14px !important;
      transition:border-color .15s ease, box-shadow .15s ease;
    }

    .lk-weekly-day-summary {
      min-height:50px;
      padding:10px 13px !important;
      cursor:pointer;
    }

    .lk-weekly-day-summary:hover {
      background:rgba(77,111,220,.055);
    }

    .lk-day-mode-empty .lk-weekly-day-summary {
      opacity:.82;
    }

    .lk-day-mode-compact .lk-weekly-day-summary {
      padding-bottom:7px !important;
      background:rgba(72,154,92,.045) !important;
    }

    .lk-day-mode-edit {
      border-color:rgba(77,111,220,.42) !important;
      box-shadow:0 0 0 3px rgba(77,111,220,.07);
    }

    .lk-day-mode-edit .lk-weekly-day-summary {
      background:rgba(77,111,220,.09) !important;
    }

    .lk-day-mode-compact > .lk-weekly-day-content,
    .lk-day-mode-empty > .lk-weekly-day-content {
      display:none !important;
    }

    .lk-day-compact-preview {
      display:grid;
      grid-template-columns:minmax(0,1fr) auto;
      gap:10px;
      align-items:center;
      padding:0 12px 10px;
      background:rgba(72,154,92,.045);
      border-top:0;
    }

    .lk-day-preview-main {
      display:flex;
      flex-wrap:wrap;
      gap:6px 12px;
      min-width:0;
    }

    .lk-day-preview-group {
      display:flex;
      align-items:center;
      gap:6px;
      min-width:0;
      flex-wrap:wrap;
    }

    .lk-day-preview-subject {
      font-size:.76rem;
      font-weight:800;
      color:#24465a;
      white-space:nowrap;
    }

    .lk-day-preview-tasks {
      display:flex;
      flex-wrap:wrap;
      gap:5px;
      min-width:0;
    }

    .lk-day-preview-task,
    .lk-day-preview-more {
      display:inline-block;
      max-width:300px;
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
      padding:4px 7px;
      border-radius:999px;
      background:#fff;
      border:1px solid rgba(0,0,0,.07);
      font-size:.72rem;
      line-height:1.15;
    }

    .lk-day-preview-task.is-extra {
      background:#fff6d2;
      border-color:rgba(200,151,40,.25);
    }

    .lk-day-preview-more {
      opacity:.62;
      background:transparent;
      border-style:dashed;
    }

    .lk-day-preview-edit {
      white-space:nowrap;
      min-height:34px !important;
      padding:5px 10px !important;
    }

    .lk-day-edit-toolbar {
      grid-column:1 / -1;
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      padding:8px 10px;
      margin:-3px 0 2px;
      border-radius:12px;
      background:rgba(77,111,220,.075);
      font-size:.78rem;
    }

    .lk-day-edit-toolbar button {
      min-height:34px !important;
      padding:5px 12px !important;
      white-space:nowrap;
    }

    @media (max-width:760px) {
      .lk-day-compact-preview {
        grid-template-columns:1fr;
      }
      .lk-day-preview-edit {
        justify-self:start;
      }
      .lk-day-preview-main {
        display:grid;
      }
      .lk-day-edit-toolbar {
        align-items:flex-start;
      }
    }
  `;
  if (!document.getElementById(style.id)) document.head.appendChild(style);

  // Falls das Script nach einem bereits erfolgten Render geladen wird.
  scheduleEnhance();
})();
