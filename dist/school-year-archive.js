/* Paket 8: Schuljahreswechsel & Archiv
 *
 * Grundidee:
 * - Eine abgeschlossene Klasse bleibt vollständig im Datenbestand.
 * - Für das neue Schuljahr entsteht eine NEUE Klassen-ID.
 * - Übernommene Kinder/Tiere erhalten NEUE Tier-IDs und NEUE QR-Tokens.
 * - Dadurch vermischen sich alte und neue Lernstände nicht.
 * - Archivierte Klassen können aus dem Archiv wiederhergestellt werden.
 */
(() => {
  if (
    typeof renderTeacherTab !== "function" ||
    typeof persist !== "function" ||
    typeof createClassItem !== "function"
  ) {
    console.warn("Paket 8 konnte nicht initialisiert werden.");
    return;
  }

  const ARCHIVE_TAB = "schoolYearArchive";
  const baseRenderTeacherTab = renderTeacherTab;
  const baseUseClass = typeof useClass === "function" ? useClass : null;
  const baseDeleteClassItem = typeof deleteClassItem === "function" ? deleteClassItem : null;
  const baseDeleteEntriesForClass =
    typeof deleteEntriesForClass === "function" ? deleteEntriesForClass : null;
  const baseRenderClasses = typeof renderClasses === "function" ? renderClasses : null;

  let schoolYearBackupStarted = false;
  let schoolYearMessage = "";

  function timestamp() {
    return typeof nowIso === "function" ? nowIso() : new Date().toISOString();
  }

  function academicYearLabel(date = new Date()) {
    const y = date.getFullYear();
    const start = date.getMonth() >= 6 ? y : y - 1;
    return `${start}/${String(start + 1).slice(-2)}`;
  }

  function nextAcademicYearLabel(label = "") {
    const match = String(label).match(/(20\d{2})\s*\/\s*(\d{2,4})/);
    if (match) {
      const start = Number(match[1]) + 1;
      return `${start}/${String(start + 1).slice(-2)}`;
    }
    const now = new Date();
    const current = academicYearLabel(now);
    const currentStart = Number(current.slice(0, 4));
    return `${currentStart + 1}/${String(currentStart + 2).slice(-2)}`;
  }

  function gradeNumber(classItem) {
    const stored = String(classItem?.activeSchoolYear || "");
    if (/^[1-4]$/.test(stored)) return Number(stored);
    const match = String(classItem?.name || "").match(/\b([1-4])\b|^([1-4])/);
    return Number(match?.[1] || match?.[2] || 1);
  }

  function nextGrade(classItem) {
    return Math.min(4, gradeNumber(classItem) + 1);
  }

  function suggestedNextClassName(classItem) {
    const name = String(classItem?.name || "").trim();
    const grade = nextGrade(classItem);
    if (/^[1-4]/.test(name)) return name.replace(/^[1-4]/, String(grade));
    return `${grade}${name ? ` · ${name}` : ""}`;
  }

  function activeClasses() {
    return (state.classes || []).filter((item) => item.archived !== true);
  }

  function archivedClasses() {
    return (state.classes || [])
      .filter((item) => item.archived === true)
      .sort((a, b) => Date.parse(b.archivedAt || 0) - Date.parse(a.archivedAt || 0));
  }

  function classById(id) {
    return (state.classes || []).find((item) => item.id === id) || null;
  }

  function archiveSchoolYearLabel(classItem) {
    return (
      classItem?.schoolYearLabel ||
      classItem?.archiveSchoolYearLabel ||
      academicYearLabel()
    );
  }

  function classAnimals(classId) {
    return (state.animals || []).filter((item) => item.classId === classId);
  }

  function countByClass(collectionName, classId) {
    const collection = Array.isArray(state?.[collectionName]) ? state[collectionName] : [];
    return collection.filter((item) => item.classId === classId).length;
  }

  function classArchiveStats(classId) {
    return {
      animals: classAnimals(classId).filter((item) => item.aktiv !== false).length,
      entries: countByClass("entries", classId),
      weeklyPlans: countByClass("weeklyPlans", classId),
      assessments: countByClass("assessments", classId),
      training: countByClass("trainingCompletions", classId),
      games: countByClass("learningGameSessions", classId),
      reports: countByClass("childWorkbookReports", classId)
    };
  }

  function archiveSizeText(stats) {
    return [
      `${stats.animals} Tiere`,
      `${stats.entries} Lernstände`,
      `${stats.weeklyPlans} Wochenpläne`,
      `${stats.games} Lernspiel-Runden`,
      `${stats.assessments} Lernzielkontrollen`
    ].join(" · ");
  }

  function makeNewAnimalCopies(oldClassId, newClassId) {
    const usedTokens = new Set(
      (state.animals || []).map((animal) => String(animal.qrToken || "")).filter(Boolean)
    );

    const oldAnimals = classAnimals(oldClassId).filter((animal) => animal.aktiv !== false);
    const map = new Map();

    const animals = oldAnimals.map((animal) => {
      const id = makeId();
      const qrToken = typeof makeQrToken === "function"
        ? makeQrToken(usedTokens)
        : `ak-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
      usedTokens.add(qrToken);
      map.set(animal.id, id);

      return {
        id,
        classId: newClassId,
        tierName: animal.tierName,
        tierEmoji: animal.tierEmoji,
        aktiv: true,
        firstName: animal.firstName || "",
        qrToken
      };
    });

    return { animals, idMap: map };
  }

  function copyGroups(oldClassId, newClassId, idMap) {
    return (state.animalGroups || [])
      .filter((group) => group.classId === oldClassId)
      .map((group) => ({
        ...group,
        id: makeId(),
        classId: newClassId,
        animalIds: (group.animalIds || []).map((id) => idMap.get(id)).filter(Boolean),
        createdAt: timestamp(),
        updatedAt: timestamp()
      }));
  }

  function makeFreshClassResources(newClassId) {
    return {
      materials: typeof createDefaultMaterials === "function"
        ? createDefaultMaterials(newClassId)
        : [],
      workbookCatalog: typeof createDefaultWorkbookCatalog === "function"
        ? createDefaultWorkbookCatalog(newClassId)
        : []
    };
  }

  window.createSchoolYearBackup = function createSchoolYearBackup() {
    try {
      if (typeof exportFullBackup === "function") {
        exportFullBackup();
        schoolYearBackupStarted = true;
        schoolYearMessage = "✓ Gesamtbackup wurde gestartet. Prüfe kurz, ob die Datei in deinen Downloads liegt.";
        render();
      }
    } catch (error) {
      schoolYearMessage = "! Das Backup konnte nicht gestartet werden.";
      console.warn("Schuljahreswechsel-Backup fehlgeschlagen.", error);
      render();
    }
  };

  window.startNewSchoolYear = async function startNewSchoolYear(event) {
    event.preventDefault();

    const current = classById(state.activeClassId);
    if (!current || current.archived) {
      schoolYearMessage = "! Es ist keine aktive, nicht archivierte Klasse ausgewählt.";
      render();
      return;
    }

    const newName = document.querySelector("#syNewClassName")?.value.trim() || "";
    const description = document.querySelector("#syNewDescription")?.value.trim() || "";
    const oldYearLabel =
      document.querySelector("#syOldYearLabel")?.value.trim() || archiveSchoolYearLabel(current);
    const newYearLabel =
      document.querySelector("#syNewYearLabel")?.value.trim() || nextAcademicYearLabel(oldYearLabel);
    const newGrade = document.querySelector("#syNewGrade")?.value || String(nextGrade(current));
    const carryAnimals = document.querySelector("#syCarryAnimals")?.checked !== false;
    const carryGroups = document.querySelector("#syCarryGroups")?.checked === true;
    const backupConfirmed = document.querySelector("#syBackupConfirmed")?.checked === true;

    if (!newName) {
      schoolYearMessage = "! Bitte gib einen Namen für die neue Klasse ein.";
      render();
      return;
    }

    if (!schoolYearBackupStarted || !backupConfirmed) {
      schoolYearMessage = "! Bitte erst das Gesamtbackup starten und anschließend bestätigen, dass die Datei vorhanden ist.";
      render();
      return;
    }

    if (!confirm(
      `${current.name} wird archiviert und ${newName} wird als neue aktive Klasse angelegt. Alte Lernstände werden NICHT gelöscht. Fortfahren?`
    )) return;

    const now = timestamp();
    const newClass = {
      ...createClassItem(newName, description),
      activeSchoolYear: String(newGrade),
      schoolYearLabel: newYearLabel,
      schoolYearStartedAt: now,
      previousClassId: current.id,
      archived: false,
      aktiv: true
    };

    let newAnimals = [];
    let newGroups = [];

    if (carryAnimals) {
      const copied = makeNewAnimalCopies(current.id, newClass.id);
      newAnimals = copied.animals;
      if (carryGroups) {
        newGroups = copyGroups(current.id, newClass.id, copied.idMap);
      }
    } else if (typeof createDefaultAnimals === "function") {
      newAnimals = createDefaultAnimals(newClass.id);
    }

    const resources = makeFreshClassResources(newClass.id);
    const archivedCurrent = {
      ...current,
      archived: true,
      aktiv: false,
      archivedAt: now,
      archiveSchoolYearLabel: oldYearLabel,
      schoolYearLabel: oldYearLabel,
      nextClassId: newClass.id
    };

    const classes = (state.classes || []).map((item) =>
      item.id === current.id ? archivedCurrent : item
    );

    await persist({
      ...state,
      activeClassId: newClass.id,
      classes: [...classes, newClass],
      animals: [...(state.animals || []), ...newAnimals],
      animalGroups: [...(state.animalGroups || []), ...newGroups],
      materials: [...(state.materials || []), ...resources.materials],
      workbookCatalog: [...(state.workbookCatalog || []), ...resources.workbookCatalog]
    });

    schoolYearBackupStarted = false;
    schoolYearMessage =
      `✓ ${current.name} wurde archiviert. ${newClass.name} ist jetzt aktiv und startet ohne alte Lernstände. ` +
      `Für die Kinder gibt es neue Tier-IDs und neue QR-Zugänge.`;

    render();
  };

  window.restoreArchivedClass = async function restoreArchivedClass(classId) {
    const archived = classById(classId);
    if (!archived || archived.archived !== true) return;

    if (!confirm(
      `${archived.name} wieder als normale Klasse herstellen? Die archivierten Daten bleiben erhalten und die Klasse wird aktiv.`
    )) return;

    const classes = (state.classes || []).map((item) =>
      item.id === classId
        ? {
            ...item,
            archived: false,
            aktiv: true,
            restoredAt: timestamp()
          }
        : item
    );

    await persist({
      ...state,
      classes,
      activeClassId: classId
    });

    schoolYearMessage = `✓ ${archived.name} wurde aus dem Archiv wiederhergestellt und ist jetzt aktiv.`;
    render();
  };

  window.archiveExistingClass = async function archiveExistingClass(classId) {
    const target = classById(classId);
    if (!target || target.archived) return;

    if (target.id === state.activeClassId) {
      schoolYearMessage =
        "! Die aktive Klasse wird über „Neues Schuljahr starten“ archiviert. So bleibt immer eine aktive Klasse vorhanden.";
      render();
      return;
    }

    if (!schoolYearBackupStarted) {
      schoolYearMessage = "! Bitte vor dem Archivieren zuerst ein Gesamtbackup starten.";
      render();
      return;
    }

    if (!confirm(`${target.name} archivieren? Es werden keine Daten gelöscht.`)) return;

    const classes = (state.classes || []).map((item) =>
      item.id === classId
        ? {
            ...item,
            archived: true,
            aktiv: false,
            archivedAt: timestamp(),
            archiveSchoolYearLabel: archiveSchoolYearLabel(item)
          }
        : item
    );

    await persist({ ...state, classes });
    schoolYearMessage = `✓ ${target.name} wurde archiviert.`;
    render();
  };

  window.openArchiveQrCards = function openArchiveQrCards() {
    if (typeof setTeacherTab === "function") setTeacherTab("qrCards");
  };

  function renderCurrentTransition() {
    const current = classById(state.activeClassId);
    if (!current || current.archived) {
      return `
        <section class="panel">
          <h2>Neues Schuljahr starten</h2>
          <div class="empty">Wähle zunächst eine aktive Klasse.</div>
        </section>
      `;
    }

    const oldYear = archiveSchoolYearLabel(current);
    const newYear = nextAcademicYearLabel(oldYear);
    const grade = nextGrade(current);

    return `
      <section class="panel sy-transition-panel">
        <div class="sy-heading">
          <div>
            <p class="sy-kicker">Schuljahreswechsel</p>
            <h2>${escapeHtml(current.name)} → neues Schuljahr</h2>
            <p class="privacy-text">
              Die bisherige Klasse wird archiviert. Das neue Schuljahr erhält eine eigene Klasse,
              damit alte und neue Lernstände nicht vermischt werden.
            </p>
          </div>
          <span class="sy-active-badge">aktuell aktiv</span>
        </div>

        <div class="sy-safety-box">
          <strong>1. Zuerst sichern</strong>
          <p>Vor dem Wechsel muss einmal ein Gesamtbackup erstellt werden.</p>
          <button class="primary" type="button" onclick="createSchoolYearBackup()">
            💾 Gesamtbackup vor dem Wechsel
          </button>
        </div>

        <form class="sy-form" onsubmit="startNewSchoolYear(event)">
          <div class="sy-form-grid">
            <label class="field">
              Bisheriges Schuljahr
              <input id="syOldYearLabel" class="text-input" value="${escapeAttribute(oldYear)}" placeholder="2026/27">
            </label>

            <label class="field">
              Neues Schuljahr
              <input id="syNewYearLabel" class="text-input" value="${escapeAttribute(newYear)}" placeholder="2027/28">
            </label>

            <label class="field">
              Neue Klasse
              <input id="syNewClassName" class="text-input" value="${escapeAttribute(suggestedNextClassName(current))}" autocomplete="off">
            </label>

            <label class="field">
              Jahrgang
              <select id="syNewGrade" class="text-input">
                ${[1,2,3,4].map((value) => `<option value="${value}" ${value === grade ? "selected" : ""}>Klasse ${value}</option>`).join("")}
              </select>
            </label>
          </div>

          <label class="field">
            Beschreibung der neuen Klasse
            <input id="syNewDescription" class="text-input" value="${escapeAttribute(current.beschreibung || "")}" placeholder="optional">
          </label>

          <div class="sy-options">
            <label class="toggle-label">
              <input id="syCarryAnimals" type="checkbox" checked>
              Tiere und vorhandene Namenszuordnungen übernehmen
            </label>
            <p class="sy-option-note">
              Es werden neue Tier-IDs und neue QR-Tokens erzeugt. So bleiben die Ergebnisse des alten Schuljahres sauber getrennt.
            </p>

            <label class="toggle-label">
              <input id="syCarryGroups" type="checkbox" checked>
              vorhandene Gruppen übernehmen
            </label>

            <label class="toggle-label sy-backup-check">
              <input id="syBackupConfirmed" type="checkbox">
              Ich habe geprüft, dass das Gesamtbackup heruntergeladen wurde.
            </label>
          </div>

          <div class="sy-clean-start">
            <strong>Im neuen Schuljahr startet leer:</strong>
            <span>Lernstände</span>
            <span>Wochenpläne</span>
            <span>Lernzielkontrollen</span>
            <span>Trainingsverlauf</span>
            <span>Lernspiel-Ergebnisse</span>
            <span>Kindmeldungen</span>
          </div>

          <button class="primary sy-start-button" type="submit">
            Neues Schuljahr starten
          </button>
        </form>
      </section>
    `;
  }

  function renderArchiveCard(classItem) {
    const stats = classArchiveStats(classItem.id);
    const year = classItem.archiveSchoolYearLabel || classItem.schoolYearLabel || "ohne Jahresangabe";
    return `
      <article class="sy-archive-card">
        <div class="sy-archive-main">
          <span class="sy-archive-icon">📦</span>
          <div>
            <strong>${escapeHtml(classItem.name)}</strong>
            <small>${escapeHtml(year)} · archiviert ${classItem.archivedAt ? safetyArchiveDate(classItem.archivedAt) : ""}</small>
            <p>${escapeHtml(archiveSizeText(stats))}</p>
          </div>
        </div>
        <button class="secondary" type="button" onclick="restoreArchivedClass('${escapeAttribute(classItem.id)}')">
          Wiederherstellen
        </button>
      </article>
    `;
  }

  function safetyArchiveDate(value) {
    if (!value) return "";
    if (typeof formatDateTime === "function") {
      try { return formatDateTime(value); } catch {}
    }
    return new Date(value).toLocaleDateString("de-DE");
  }

  function renderArchiveList() {
    const archived = archivedClasses();
    const nonArchived = activeClasses().filter((item) => item.id !== state.activeClassId);

    return `
      <section class="panel sy-archive-panel">
        <div class="sy-heading">
          <div>
            <p class="sy-kicker">Archiv</p>
            <h2>Abgeschlossene Klassen</h2>
            <p class="privacy-text">
              Archivieren löscht nichts. Eine Klasse kann später wiederhergestellt werden,
              wenn du alte Detailauswertungen noch einmal in der normalen App ansehen möchtest.
            </p>
          </div>
          <span class="sy-count-badge">${archived.length} archiviert</span>
        </div>

        <div class="sy-archive-list">
          ${archived.length
            ? archived.map(renderArchiveCard).join("")
            : `<div class="empty">Noch keine Klasse archiviert.</div>`}
        </div>

        ${nonArchived.length ? `
          <details class="sy-other-classes">
            <summary>Weitere vorhandene Klassen archivieren</summary>
            <div class="sy-other-list">
              ${nonArchived.map((item) => `
                <div>
                  <span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.schoolYearLabel || "")}</small></span>
                  <button class="small-button" type="button" onclick="archiveExistingClass('${escapeAttribute(item.id)}')">Archivieren</button>
                </div>
              `).join("")}
            </div>
          </details>
        ` : ""}
      </section>
    `;
  }

  function renderAfterTransitionHelp() {
    const current = classById(state.activeClassId);
    if (!current?.previousClassId) return "";

    return `
      <section class="panel sy-next-steps">
        <h2>Nach dem Schuljahreswechsel</h2>
        <div class="sy-next-grid">
          <article>
            <span>1</span>
            <div><strong>QR-Karten neu ausgeben</strong><small>Die neue Klasse besitzt bewusst neue Tier-Zugänge.</small></div>
          </article>
          <article>
            <span>2</span>
            <div><strong>Lernspiele freischalten</strong><small>Prüfe, welche Spiele die Kinder zum Start sehen sollen.</small></div>
          </article>
          <article>
            <span>3</span>
            <div><strong>Ersten Wochenplan anlegen</strong><small>Die neue Klasse startet ohne alte Wochenplan-Einträge.</small></div>
          </article>
        </div>
        <button class="secondary" type="button" onclick="openArchiveQrCards()">Zu den neuen QR-Karten</button>
      </section>
    `;
  }

  function renderSchoolYearArchive() {
    return `
      ${schoolYearMessage ? `<p class="message ${schoolYearMessage.startsWith("✓") ? "success" : "warning-message"}">${escapeHtml(schoolYearMessage)}</p>` : ""}
      ${renderCurrentTransition()}
      ${renderAfterTransitionHelp()}
      ${renderArchiveList()}
    `;
  }

  // Neuer Menüpunkt direkt bei Klassen & Gruppen.
  const childrenGroup = Array.isArray(TEACHER_GROUPS)
    ? TEACHER_GROUPS.find((group) => group.id === "children")
    : null;

  if (childrenGroup?.sections && !childrenGroup.sections.some((section) => section[0] === ARCHIVE_TAB)) {
    const classIndex = childrenGroup.sections.findIndex((section) => section[0] === "classes");
    childrenGroup.sections.splice(
      classIndex >= 0 ? classIndex + 1 : childrenGroup.sections.length,
      0,
      [ARCHIVE_TAB, "Schuljahreswechsel & Archiv"]
    );
  }

  renderTeacherTab = function renderTeacherTabWithSchoolYearArchive() {
    if (teacherTab === ARCHIVE_TAB) return renderSchoolYearArchive();
    return baseRenderTeacherTab();
  };

  // Archivierte Klassen können nicht versehentlich über die alte Klassenliste aktiviert werden.
  if (baseUseClass) {
    useClass = async function useClassArchiveProtected(classId) {
      const target = classById(classId);
      if (target?.archived) {
        schoolYearMessage =
          `! ${target.name} ist archiviert. Öffne „Schuljahreswechsel & Archiv“ und stelle die Klasse dort zuerst wieder her.`;
        teacherTab = ARCHIVE_TAB;
        render();
        return;
      }
      return baseUseClass(classId);
    };
  }

  // Archivierte Klassen sind ein Archiv: bestehende Löschbuttons der alten Klassenliste
  // werden sicherheitshalber blockiert.
  if (baseDeleteClassItem) {
    deleteClassItem = async function deleteClassItemArchiveProtected(classId) {
      const target = classById(classId);
      if (target?.archived) {
        schoolYearMessage =
          `! ${target.name} ist archiviert und damit gegen versehentliches Löschen geschützt. Stelle die Klasse zuerst wieder her, wenn du sie wirklich bearbeiten oder löschen möchtest.`;
        teacherTab = ARCHIVE_TAB;
        render();
        return;
      }
      return baseDeleteClassItem(classId);
    };
  }

  if (baseDeleteEntriesForClass) {
    deleteEntriesForClass = async function deleteEntriesForClassArchiveProtected(classId) {
      const target = classById(classId);
      if (target?.archived) {
        schoolYearMessage =
          `! Die Lernstände von ${target.name} gehören zum Archiv und werden hier nicht gelöscht.`;
        teacherTab = ARCHIVE_TAB;
        render();
        return;
      }
      return baseDeleteEntriesForClass(classId);
    };
  }

  if (baseRenderClasses) {
    renderClasses = function renderClassesWithArchiveNotice() {
      let html = baseRenderClasses();

      archivedClasses().forEach((classItem) => {
        const useButton = `<button class="small-button" type="button" onclick="useClass('${classItem.id}')" >Als aktive Klasse verwenden</button>`;
        const useButtonNoSpace = `<button class="small-button" type="button" onclick="useClass('${classItem.id}')" >`;
        const normalButton = `<button class="small-button" type="button" onclick="useClass('${classItem.id}')" ${classItem.id === state.activeClassId ? "disabled" : ""}>Als aktive Klasse verwenden</button>`;

        if (html.includes(normalButton)) {
          html = html.replace(
            normalButton,
            `<button class="small-button" type="button" disabled>📦 archiviert</button>`
          );
        }
      });

      return html.replace(
        '<h2>Klassen & Gruppen</h2>',
        `<h2>Klassen & Gruppen</h2>
         <p class="message subtle">Abgeschlossene Schuljahre verwaltest du über <strong>Schuljahreswechsel & Archiv</strong>. Archivierte Klassen sind gegen versehentliches Aktivieren und Löschen geschützt.</p>`
      );
    };
  }

  // Falls ein sehr altes Backup eine archivierte Klasse als aktiv enthält,
  // automatisch auf die erste normale Klasse wechseln.
  setTimeout(async () => {
    try {
      const current = classById(state.activeClassId);
      if (current?.archived) {
        const fallback = activeClasses()[0];
        if (fallback) {
          await persist({ ...state, activeClassId: fallback.id });
          render();
        }
      }
    } catch (error) {
      console.warn("Archiv-Aktivklasse konnte nicht automatisch korrigiert werden.", error);
    }
  }, 1200);

  const style = document.createElement("style");
  style.id = "lk-school-year-archive-style";
  style.textContent = `
    .sy-transition-panel, .sy-archive-panel { border:2px solid rgba(47,111,145,.12); }
    .sy-heading { display:flex; justify-content:space-between; gap:18px; align-items:flex-start; }
    .sy-kicker { margin:0 0 3px; text-transform:uppercase; letter-spacing:.08em; font-size:.75rem; font-weight:800; opacity:.55; }
    .sy-heading h2 { margin:.1rem 0 .35rem; }
    .sy-active-badge, .sy-count-badge {
      padding:7px 10px; border-radius:999px; background:rgba(47,111,145,.08);
      font-size:.8rem; white-space:nowrap;
    }

    .sy-safety-box {
      margin:16px 0; padding:14px; border-radius:16px; background:#fff6d9;
      display:flex; gap:10px; align-items:center; flex-wrap:wrap;
    }
    .sy-safety-box p { margin:0; flex:1 1 260px; opacity:.75; }

    .sy-form { display:grid; gap:14px; }
    .sy-form-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
    .sy-options { display:grid; gap:8px; padding:14px; border-radius:16px; background:rgba(255,255,255,.65); }
    .sy-option-note { margin:-3px 0 2px 28px; font-size:.82rem; opacity:.66; }
    .sy-backup-check { margin-top:6px; padding-top:10px; border-top:1px solid rgba(0,0,0,.08); font-weight:750; }

    .sy-clean-start { display:flex; gap:7px; flex-wrap:wrap; align-items:center; }
    .sy-clean-start strong { margin-right:3px; }
    .sy-clean-start span { padding:5px 8px; border-radius:999px; background:rgba(47,111,145,.07); font-size:.78rem; }
    .sy-start-button { justify-self:start; }

    .sy-next-steps { border:1px solid rgba(75,150,95,.16); }
    .sy-next-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin:12px 0; }
    .sy-next-grid article { display:grid; grid-template-columns:auto 1fr; gap:9px; align-items:start; padding:12px; border-radius:14px; background:rgba(75,150,95,.07); }
    .sy-next-grid article > span { width:28px; height:28px; display:grid; place-items:center; border-radius:50%; background:#fff; font-weight:800; }
    .sy-next-grid article > div { display:grid; gap:3px; }
    .sy-next-grid small { opacity:.66; }

    .sy-archive-list { display:grid; gap:9px; margin-top:14px; }
    .sy-archive-card { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:12px; align-items:center; padding:13px; border:1px solid rgba(0,0,0,.08); border-radius:16px; background:rgba(255,255,255,.72); }
    .sy-archive-main { display:grid; grid-template-columns:auto minmax(0,1fr); gap:10px; align-items:start; }
    .sy-archive-main > div { display:grid; gap:3px; }
    .sy-archive-main small { opacity:.66; }
    .sy-archive-main p { margin:4px 0 0; font-size:.82rem; opacity:.76; }
    .sy-archive-icon { width:40px; height:40px; border-radius:12px; display:grid; place-items:center; background:rgba(47,111,145,.08); font-size:1.2rem; }

    .sy-other-classes { margin-top:14px; border-top:1px solid rgba(0,0,0,.07); padding-top:10px; }
    .sy-other-classes summary { cursor:pointer; font-weight:750; }
    .sy-other-list { display:grid; gap:7px; margin-top:9px; }
    .sy-other-list > div { display:flex; justify-content:space-between; gap:10px; align-items:center; padding:9px 10px; border-radius:12px; background:rgba(0,0,0,.03); }
    .sy-other-list span { display:grid; gap:2px; }
    .sy-other-list small { opacity:.6; }

    @media (max-width:760px) {
      .sy-heading { display:block; }
      .sy-active-badge, .sy-count-badge { display:inline-block; margin-top:7px; }
      .sy-form-grid, .sy-next-grid { grid-template-columns:1fr; }
      .sy-archive-card { grid-template-columns:1fr; }
      .sy-archive-card > button { justify-self:start; }
    }
  `;
  if (!document.getElementById(style.id)) document.head.appendChild(style);

  window.LKSchoolYearArchive = {
    academicYearLabel,
    nextAcademicYearLabel,
    suggestedNextClassName,
    classArchiveStats,
    makeNewAnimalCopies,
    copyGroups
  };
})();
