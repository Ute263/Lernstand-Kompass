/* Paket 10h – Einfach & übersichtlich
 * Seltene Funktionen bleiben erhalten, stehen aber nicht mehr im Vordergrund.
 */
(() => {
  if (typeof TEACHER_GROUPS === "undefined" || typeof renderTeacherSection !== "function") {
    console.warn("Paket 10h konnte nicht initialisiert werden.");
    return;
  }

  function group(id) {
    return TEACHER_GROUPS.find((item) => item.id === id);
  }

  // Kurze, klare Hauptnavigation.
  const labels = {
    teacherHomeGroup: "Start",
    weeklyPlansGroup: "Wochenplan",
    learning: "Lernübersicht",
    trainingGroup: "Trainingszeit",
    learningGamesGroup: "Lernspiele",
    assessmentGroup: "Lernzielkontrolle",
    children: "Klasse",
    materialsGroup: "Material & Druck",
    settingsGroup: "Einstellungen"
  };
  Object.entries(labels).forEach(([id, label]) => {
    const item = group(id);
    if (item) item.label = label;
  });

  // Lernübersicht: nur Klassen- und Kindübersicht.
  const learning = group("learning");
  if (learning) {
    learning.sections.splice(0, learning.sections.length,
      ["overview", "Klassenübersicht"],
      ["progress", "Kindübersicht"]
    );
  }

  // Klassenbereich: kurze Begriffe, seltene Zuordnung zuletzt.
  const children = group("children");
  if (children) {
    children.sections.splice(0, children.sections.length,
      ["childrenRegistry", "Kinder"],
      ["classes", "Klassen & Gruppen"],
      ["qrCards", "QR-Karten"],
      ["animalMapping", "Namen"]
    );
  }

  const materials = group("materialsGroup");
  if (materials) {
    materials.sections.splice(0, materials.sections.length,
      ["materialPrint", "Material"],
      ["printPdf", "PDF & Druck"],
      ["excelExport", "Excel"]
    );
  }

  // Einstellungen: Alltag zuerst. Backup-Dateien, Speicherstatus und Datenschutz
  // bleiben erreichbar, stehen aber unter „Weitere Einstellungen“.
  const settings = group("settingsGroup");
  if (settings) {
    settings.sections.splice(0, settings.sections.length,
      ["cloudSync", "Sicherung & Kindergeräte"],
      ["childSettings", "Kinderansicht"],
      ["security", "PIN & Sicherheit"],
      ["simpleMoreSettings", "Weitere Einstellungen"]
    );
  }

  const baseRenderTeacherSection10h = renderTeacherSection;
  let legacySettingsTab = "";

  function renderSimpleMoreSettings() {
    if (legacySettingsTab) {
      const titleMap = {
        backup: "Datei-Sicherung",
        storageStatus: "Speicher & Diagnose",
        privacy: "Datenschutz"
      };
      return `
        <section class="panel lk-simple-legacy-head">
          <button class="secondary" type="button" onclick="lkSimpleSettingsBack()">← Zurück</button>
          <div>
            <span>Weitere Einstellungen</span>
            <strong>${escapeHtml(titleMap[legacySettingsTab] || "Einstellung")}</strong>
          </div>
        </section>
        ${baseRenderTeacherSection10h(legacySettingsTab)}
      `;
    }

    return `
      <section class="lk-simple-settings-intro">
        <h2>Weitere Einstellungen</h2>
        <p>Diese Bereiche brauchst du im normalen Schulalltag selten.</p>
      </section>
      <div class="lk-simple-settings-cards">
        <article class="panel">
          <span class="lk-simple-settings-icon">📦</span>
          <div><strong>Datei-Sicherung</strong><small>Manuelle Sicherungsdatei für Notfälle oder Gerätewechsel.</small></div>
          <button class="secondary" type="button" onclick="lkOpenSimpleSetting('backup')">Öffnen</button>
        </article>
        <article class="panel">
          <span class="lk-simple-settings-icon">💾</span>
          <div><strong>Speicher & Diagnose</strong><small>Nur nötig, wenn Speichern oder App-Daten geprüft werden sollen.</small></div>
          <button class="secondary" type="button" onclick="lkOpenSimpleSetting('storageStatus')">Öffnen</button>
        </article>
        <article class="panel">
          <span class="lk-simple-settings-icon">🔒</span>
          <div><strong>Datenschutz</strong><small>Informationen dazu, welche Daten die App verwendet.</small></div>
          <button class="secondary" type="button" onclick="lkOpenSimpleSetting('privacy')">Öffnen</button>
        </article>
      </div>
    `;
  }

  renderTeacherSection = function renderTeacherSection10h(tab) {
    if (tab === "simpleMoreSettings") return renderSimpleMoreSettings();
    return baseRenderTeacherSection10h(tab);
  };

  window.lkOpenSimpleSetting = function lkOpenSimpleSetting(tab) {
    legacySettingsTab = tab;
    render();
  };

  window.lkSimpleSettingsBack = function lkSimpleSettingsBack() {
    legacySettingsTab = "";
    render();
  };

  const baseSetTeacherTab10h = typeof setTeacherTab === "function" ? setTeacherTab : null;
  if (baseSetTeacherTab10h) {
    setTeacherTab = function setTeacherTab10h(tab) {
      if (tab !== "simpleMoreSettings") legacySettingsTab = "";
      return baseSetTeacherTab10h(tab);
    };
  }

  const style = document.createElement("style");
  style.id = "lk-simple-ui-10h";
  style.textContent = `
    .teacher-layout { gap:14px; }
    .teacher-layout > .tabs { gap:6px; row-gap:6px; }
    .teacher-layout > .tabs .tab-button {
      min-height:38px;
      padding:7px 11px;
      border-radius:10px;
      font-size:.82rem;
    }
    .active-class-banner {
      margin-bottom:10px;
      padding:7px 10px;
      border-radius:10px;
      font-size:.8rem;
    }
    .teacher-group-panel {
      padding:9px 11px;
      margin-bottom:12px;
    }
    .teacher-group-panel > h2 { display:none; }
    .section-tabs { gap:6px; }
    .section-tabs .small-button {
      min-height:34px;
      padding:6px 9px;
      font-size:.78rem;
      border-radius:9px;
    }
    .panel { border-radius:15px; }
    .panel h2 { font-size:1.18rem; }
    .privacy-text, .message { line-height:1.42; }
    details > summary { user-select:none; }

    .lk-simple-settings-intro { margin:0 0 12px; max-width:700px; }
    .lk-simple-settings-intro h2 { margin:0 0 4px; font-size:1.25rem; }
    .lk-simple-settings-intro p { margin:0; color:#68777f; }
    .lk-simple-settings-cards { display:grid; gap:10px; max-width:900px; }
    .lk-simple-settings-cards article {
      display:grid;
      grid-template-columns:auto minmax(0,1fr) auto;
      align-items:center;
      gap:12px;
      padding:13px 15px;
    }
    .lk-simple-settings-cards article > div { display:grid; gap:3px; }
    .lk-simple-settings-cards small { color:#6d7a81; line-height:1.35; }
    .lk-simple-settings-icon {
      width:38px; height:38px; display:grid; place-items:center;
      border-radius:12px; background:#eef7fb; font-size:1.15rem;
    }
    .lk-simple-legacy-head {
      display:flex; align-items:center; gap:12px; padding:10px 12px; margin-bottom:10px;
    }
    .lk-simple-legacy-head > div { display:grid; gap:1px; }
    .lk-simple-legacy-head span { font-size:.68rem; text-transform:uppercase; letter-spacing:.07em; color:#77858d; }
    .lk-simple-legacy-head strong { font-size:.95rem; }
    @media (max-width:700px) {
      .teacher-layout > .tabs { overflow-x:auto; flex-wrap:nowrap; padding-bottom:3px; }
      .teacher-layout > .tabs .tab-button { white-space:nowrap; }
      .lk-simple-settings-cards article { grid-template-columns:auto 1fr; }
      .lk-simple-settings-cards article button { grid-column:1 / -1; width:100%; }
    }
  `;
  document.head.appendChild(style);
})();
