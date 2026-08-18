async function saveFileWithPickerOrDownload(filename, mimeType, content) {
  const blob = new Blob([content], { type: mimeType });
  if ("showSaveFilePicker" in window) {
    const handle = await window.showSaveFilePicker({
      suggestedName: filename,
      types: [{ description: mimeType, accept: { [mimeType]: [`.${filename.split(".").pop()}`] } }]
    });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
  } else {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
  return "Datei erstellt. Bitte an einem geschützten Ort ablegen.";
}

function makeActiveClassBackup(state, classId) {
  const classItem = state.classes.find((item) => item.id === classId);
  return {
    app: "Lernstand-Kompass",
    type: "active-class-backup",
    version: APP_VERSION,
    exportedAt: nowIso(),
    classItem,
    animals: state.animals.filter((item) => item.classId === classId),
    animalGroups: (state.animalGroups || []).filter((item) => item.classId === classId),
    materials: state.materials.filter((item) => item.classId === classId),
    entries: state.entries.filter((item) => item.classId === classId),
    goals: state.goals.filter((item) => item.classId === classId),
    assessments: (state.assessments || []).filter((item) => item.classId === classId),
    assessmentTasks: (state.assessmentTasks || []).filter((item) => item.classId === classId),
    assessmentResults: (state.assessmentResults || []).filter((item) => item.classId === classId),
    sprachweltTasks: state.sprachweltTasks || [],
    trainingTasks: state.trainingTasks || [],
    trainingCompletions: (state.trainingCompletions || []).filter((item) => item.classId === classId),
    trainingHistory: (state.trainingHistory || []).filter((item) => item.classId === classId),
    workbookCatalog: (state.workbookCatalog || []).filter((item) => item.classId === classId),
    workbookAssignments: (state.workbookAssignments || []).filter((item) => item.classId === classId),
    workbookAssignmentStatuses: (state.workbookAssignmentStatuses || []).filter((item) => item.classId === classId),
    childWorkbookReports: (state.childWorkbookReports || []).filter((item) => item.classId === classId),
    activeWorkbookMaterials: (state.activeWorkbookMaterials || []).filter((item) => item.classId === classId),
    childViewSettings: state.childViewSettings || {},
    weeklyPlans: (state.weeklyPlans || []).filter((item) => item.classId === classId),
    weeklyPlanStatuses: (state.weeklyPlanStatuses || []).filter((item) => item.classId === classId),
    learningGameSessions: (state.learningGameSessions || []).filter((item) => item.classId === classId)
  };
}

function makeLernpostPackage(state, classId) {
  const classItem = state.classes.find((item) => item.id === classId);
  return {
    app: "Lernstand-Kompass",
    type: "lernpost",
    version: APP_VERSION,
    exportedAt: nowIso(),
    classItem,
    animals: state.animals
      .filter((item) => item.classId === classId)
      .map(({ firstName, ...animal }) => animal),
    animalGroups: (state.animalGroups || []).filter((item) => item.classId === classId),
    materials: state.materials.filter((item) => item.classId === classId),
    entries: state.entries.filter((item) => item.classId === classId),
    sprachweltTasks: state.sprachweltTasks || [],
    trainingTasks: state.trainingTasks || [],
    trainingCompletions: (state.trainingCompletions || []).filter((item) => item.classId === classId),
    trainingHistory: [],
    workbookCatalog: (state.workbookCatalog || []).filter((item) => item.classId === classId),
    workbookAssignments: (state.workbookAssignments || []).filter((item) => item.classId === classId),
    workbookAssignmentStatuses: (state.workbookAssignmentStatuses || []).filter((item) => item.classId === classId),
    childWorkbookReports: (state.childWorkbookReports || []).filter((item) => item.classId === classId),
    activeWorkbookMaterials: (state.activeWorkbookMaterials || []).filter((item) => item.classId === classId),
    childViewSettings: state.childViewSettings || {},
    weeklyPlans: (state.weeklyPlans || []).filter((item) => item.classId === classId),
    weeklyPlanStatuses: (state.weeklyPlanStatuses || []).filter((item) => item.classId === classId),
    childSafe: true
  };
}

function makeFullBackup(state) {
  return {
    app: "Lernstand-Kompass",
    type: "full-backup",
    version: APP_VERSION,
    exportedAt: nowIso(),
    state
  };
}

function makeCsvForClass(state, classId) {
  const classItem = state.classes.find((item) => item.id === classId);
  const header = ["Datum", "Uhrzeit", "Klasse", "Tier", "Fach", "Material", "Seite/Aufgabe", "Status", "Erledigt"];
  const rows = state.entries
    .filter((entry) => entry.classId === classId)
    .sort((a, b) => new Date(a.datumUhrzeit) - new Date(b.datumUhrzeit))
    .map((entry) => [
      formatFileDate(new Date(entry.datumUhrzeit)),
      formatTime(entry.datumUhrzeit),
      classItem?.name || "",
      `${entry.tierEmojiSnapshot} ${entry.tierNameSnapshot}`,
      entry.fach,
      entry.materialName,
      entryExportWork(entry),
      entry.status,
      entry.erledigt ? "ja" : "nein"
    ]);
  return [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

function exportToExcelCsv(entries, filename) {
  const rows = [...entries].sort((a, b) => new Date(b.datumUhrzeit) - new Date(a.datumUhrzeit));
  if (!rows.length) return false;

  const header = ["Datum", "Uhrzeit", "Klasse", "Tier", "Fach", "Material", "Seite/Aufgabe", "Status", "Erledigt"];
  const csvRows = rows.map((entry) => [
    formatGermanDate(entry.datumUhrzeit),
    formatExcelTime(entry.datumUhrzeit),
    entry.klasseName || getClassNameForEntry(entry),
    entry.tierLabel || `${entry.tierEmojiSnapshot || ""} ${entry.tierNameSnapshot || ""}`.trim(),
    entry.fach || "",
    entry.materialName || "",
    entryExportWork(entry),
    entry.status || "",
    entry.erledigt ? "Ja" : "Nein"
  ]);

  const csvContent = `\uFEFF${[header, ...csvRows].map((row) => row.map(excelCsvEscape).join(";")).join("\r\n")}`;
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return true;
}

async function exportBeautifulWorkbook(report) {
  if (!window.ExcelJS) {
    throw new Error("ExcelJS ist nicht geladen.");
  }
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Lernstand-Kompass";
  workbook.created = new Date(report.generatedAt);
  workbook.modified = new Date(report.generatedAt);
  workbook.properties.date1904 = false;

  addStartSheet(workbook, report);
  addClassOverviewSheet(workbook, report);
  addProgressSheet(workbook, report);
  addHelpSheet(workbook, report);
  addTodaySheet(workbook, report);
  addPrintSheet(workbook, report);
  addTrainingSheet(workbook, report);
  addAssessmentOverviewSheet(workbook, report);
  addAssessmentTasksSheet(workbook, report);
  addAssessmentResultsSheet(workbook, report);
  addAssessmentMatrixSheet(workbook, report);
  addAssessmentLegendSheet(workbook, report);
  addDataSheet(workbook, report);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  downloadBlob(blob, report.filename);
  return true;
}

const XLSX_COLORS = {
  aubergine: "FF4C2A57",
  aubergineLight: "FFE9DDF0",
  cream: "FFFFFBF2",
  softGray: "FFF7F7FA",
  line: "FFD8DEE8",
  white: "FFFFFFFF",
  text: "FF1F2937",
  deutsch: "FFDFF3FF",
  mathe: "FFE5F7E8",
  done: "FFDFF6E8",
  help: "FFFFE7B3",
  check: "FFDDEAFF",
  stale: "FFFFE3E8",
  neutral: "FFEDEFF4",
  ahead: "FFE6F3FF"
};

function addStartSheet(workbook, report) {
  const sheet = workbook.addWorksheet("Start");
  setupSheet(sheet, { orientation: "portrait", widths: [18, 18, 18, 18, 18, 18, 18, 18], freezeRow: 0 });
  addDashboardTitle(sheet, report);

  addMetricTile(sheet, "A5:B8", "Tiere aktiv", report.stats.activeAnimals, XLSX_COLORS.aubergineLight);
  addMetricTile(sheet, "C5:D8", "Einträge heute", report.stats.todayCount, XLSX_COLORS.deutsch);
  addMetricTile(sheet, "E5:F8", "Offene Hilfe", report.stats.openHelp, XLSX_COLORS.help);
  addMetricTile(sheet, "G5:H8", "Offene Kontrolle", report.stats.openCheck, XLSX_COLORS.check);
  addMetricTile(sheet, "A10:B13", "Deutsch Ø", report.stats.deutschAverage, XLSX_COLORS.deutsch);
  addMetricTile(sheet, "C10:D13", "Mathe Ø", report.stats.matheAverage, XLSX_COLORS.mathe);
  addMetricTile(sheet, "E10:F13", "Lernzielkontrollen", report.stats.assessmentCount, XLSX_COLORS.aubergineLight);
  addMetricTile(sheet, "G10:H13", "LZK-Ergebnisse", report.stats.assessmentResultCount, XLSX_COLORS.neutral);
  addMetricTile(sheet, "E14:F17", "Trainingszeit", report.stats.trainingCompletedCount, XLSX_COLORS.done);

  sheet.mergeCells("A19:H19");
  const focusTitle = sheet.getCell("A19");
  focusTitle.value = "Heute im Blick";
  focusTitle.font = { bold: true, size: 16, color: { argb: XLSX_COLORS.aubergine } };
  focusTitle.alignment = { vertical: "middle" };
  sheet.getRow(19).height = 24;

  if (!report.stats.hasEntries) {
    addEmptyMessage(sheet, "A21:H24", "Aktuell keine Einträge.");
  } else {
    addTable(sheet, 21, ["Bereich", "Wert", "Hinweis"], [
      ["Hilfe offen", report.stats.openHelp, "Hilfewünsche im Blick behalten"],
      ["Kontrolle offen", report.stats.openCheck, "Kontrollwünsche gesammelt"],
      ["länger kein Eintrag", report.stats.staleAnimals, "nach aktuellem Schwellenwert"],
      ["weit voraus", report.stats.aheadCount, "Zusatzangebot möglich"],
      ["braucht Blick", report.stats.lookCount, "Unterstützung prüfen"]
    ], { headerFill: XLSX_COLORS.aubergineLight, autofilter: false, rowHeight: 28 });
  }

  sheet.mergeCells("A29:H31");
  const note = sheet.getCell("A29");
  note.value = report.includeFirstNames
    ? "Interner Export: Diese Datei enthält optionale Vornamen aus der geschützten Tier-Zuordnung. Bitte geschützt ablegen."
    : "Diese Datei enthält keine Kindernamen. Die Lernstände werden über Tier-Pseudonyme dargestellt.";
  note.fill = solidFill(XLSX_COLORS.cream);
  note.font = { bold: true, size: 12, color: { argb: XLSX_COLORS.text } };
  note.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  applyBorderToRange(sheet, "A29:H31");
  finishWorksheetLayout(sheet, {
    maxVisibleColumn: 8,
    maxVisibleRow: 31,
    printArea: "A1:H31",
    landscape: false
  });
}

function addClassOverviewSheet(workbook, report) {
  const sheet = workbook.addWorksheet("Klassenübersicht");
  setupSheet(sheet, { orientation: "landscape", widths: [20, 28, 28, 20, 22, 30] });
  addTitleBlock(sheet, "Klassenübersicht", `Export für: ${report.scopeLabel}`, report.generatedAt, 6);
  const lastRow = addTable(sheet, 5, ["Tier", "Deutsch letzter Stand", "Mathe letzter Stand", "Letzte Aktivität", "Offener Status", "Hinweis"],
    report.overviewRows.map((row) => [
      row.animal.exportLabel || `${row.animal.tierEmoji} ${row.animal.tierName}`, row.deutsch, row.mathe, row.latestActivity, row.status, row.hint
    ]),
    { statusColumn: 5, hintColumn: 6, rowHeight: 30, animalColumn: 1 });
  finishWorksheetLayout(sheet, {
    maxVisibleColumn: 6,
    maxVisibleRow: Math.max(lastRow + 2, 16),
    printArea: `A1:F${Math.max(lastRow, 16)}`,
    landscape: true,
    freezeRow: 5
  });
}

function addProgressSheet(workbook, report) {
  const sheet = workbook.addWorksheet("Fortschritt");
  setupSheet(sheet, { orientation: "landscape", widths: [20, 14, 24, 14, 14, 16, 18, 14, 18, 30, 18] });
  addTitleBlock(sheet, "Fortschritt und Arbeitstempo", `Export für: ${report.scopeLabel}`, report.generatedAt, 11);
  const lastRow = addTable(sheet, 5, [
    "Tier", "Fach", "Material", "erste Seite", "aktuelle Seite", "Fortschritt", "Gruppenschnitt", "Abstand",
    "letzte Aktivität", "Hinweis", "Balken"
  ], report.progressRows.map((row) => [
    row.animal.exportLabel || `${row.animal.tierEmoji} ${row.animal.tierName}`,
    row.fach,
    row.material,
    row.firstEntry ? entryExportWork(row.firstEntry) : "kein Eintrag",
    row.lastEntry ? entryExportWork(row.lastEntry) : "kein Eintrag",
    row.entryCount > 1 ? row.progressPages : row.entryCount === 1 ? "nur ein Eintrag" : "kein Eintrag",
    row.groupAverage == null ? "–" : row.groupAverage.toFixed(1).replace(".", ","),
    row.groupDistance == null ? "–" : signedNumber(row.groupDistance),
    row.lastActivity ? relativeActivity(row.lastActivity) : "kein Eintrag",
    row.hints.join(", "),
    progressBar(row.progressPages)
  ]), { hintColumn: 10, groupDistanceColumn: 8, animalColumn: 1, rowHeight: 28 });
  finishWorksheetLayout(sheet, {
    maxVisibleColumn: 11,
    maxVisibleRow: Math.max(lastRow + 2, 16),
    printArea: `A1:K${Math.max(lastRow, 16)}`,
    landscape: true,
    freezeRow: 5
  });
}

function addTodaySheet(workbook, report) {
  const sheet = workbook.addWorksheet("Heute");
  setupSheet(sheet, { orientation: "portrait", widths: [12, 20, 14, 26, 10, 22, 12] });
  addTitleBlock(sheet, "Heute bearbeitet", `Export für: ${report.scopeLabel}`, report.generatedAt, 7);
  let lastRow = 8;
  if (!report.todayEntries.length) {
    addEmptyMessage(sheet, "A5:G8", "Heute wurden noch keine Lernstände eingetragen.");
  } else {
    lastRow = addTable(sheet, 5, ["Uhrzeit", "Tier", "Fach", "Material", "Seite/Aufgabe", "Status", "Erledigt"],
    report.todayEntries.map((entry) => [formatExcelTime(entry.datumUhrzeit), entry.tierLabel, entry.fach, entry.materialName, entryExportWork(entry), entry.status, entry.erledigt ? "Ja" : "Nein"]),
      { statusColumn: 6, animalColumn: 2, rowHeight: 28 });
  }
  finishWorksheetLayout(sheet, {
    maxVisibleColumn: 7,
    maxVisibleRow: Math.max(lastRow + 2, 14),
    printArea: `A1:G${Math.max(lastRow, 14)}`,
    landscape: false,
    freezeRow: report.todayEntries.length ? 5 : 0
  });
}

function addHelpSheet(workbook, report) {
  const sheet = workbook.addWorksheet("Hilfe & Kontrolle");
  setupSheet(sheet, { orientation: "portrait", widths: [20, 14, 26, 10, 22, 14, 10, 30] });
  addTitleBlock(sheet, "Offene Hilfe und Kontrolle", `Export für: ${report.scopeLabel}`, report.generatedAt, 8);
  let lastRow = 9;
  if (!report.helpEntries.length) {
    addEmptyMessage(sheet, "A5:H9", "Keine offenen Hilfe- oder Kontrollwünsche.");
  } else {
    lastRow = addTable(sheet, 5, ["Tier", "Fach", "Material", "Seite/Aufgabe", "Status", "Datum", "Uhrzeit", "Hinweis"],
      report.helpEntries.map((entry) => [
        entry.tierLabel, entry.fach, entry.materialName, entryExportWork(entry), entry.status, formatGermanDate(entry.datumUhrzeit), formatExcelTime(entry.datumUhrzeit),
        entry.status === "brauche Hilfe" ? "Hilfewunsch offen" : "Kontrolle offen"
      ]),
      { statusColumn: 5, hintColumn: 8, animalColumn: 1, rowHeight: 30 });
  }
  finishWorksheetLayout(sheet, {
    maxVisibleColumn: 8,
    maxVisibleRow: Math.max(lastRow + 2, 14),
    printArea: `A1:H${Math.max(lastRow, 14)}`,
    landscape: false,
    freezeRow: report.helpEntries.length ? 5 : 0
  });
}

function addTrainingSheet(workbook, report) {
  const sheet = workbook.addWorksheet("Trainingszeit");
  setupSheet(sheet, { orientation: "landscape", widths: [24, 18, 20, 16, 16, 18, 42, 14, 10, 16] });
  addTitleBlock(sheet, "Trainingszeit", `Export für: ${report.scopeLabel}`, report.generatedAt, 10);
  const lastRow = addTable(sheet, 5, ["Tier", "Bereich", "Unterbereich", "Aufgaben-Code", "Fach", "Aufgabe", "Aufgabentext", "Datum", "Uhrzeit", "Status"],
    report.trainingRows.map((row) => [
      row.tierLabel || `${row.tierEmoji} ${row.tierName}`,
      row.trainingArea,
      row.subcategory || "",
      row.taskCode,
      row.subject,
      row.taskTitle || row.taskCode,
      row.taskText,
      row.completedAt ? formatGermanDate(row.completedAt) : "",
      row.completedAt ? formatExcelTime(row.completedAt) : "",
      row.status
    ]),
    { statusColumn: 10, animalColumn: 1, rowHeight: 30 });
  finishWorksheetLayout(sheet, {
    maxVisibleColumn: 10,
    maxVisibleRow: Math.max(lastRow + 2, 16),
    printArea: `A1:J${Math.max(lastRow, 16)}`,
    landscape: true,
    freezeRow: 5
  });
}

function addAssessmentOverviewSheet(workbook, report) {
  const sheet = workbook.addWorksheet("Lernzielkontrollen");
  setupSheet(sheet, { orientation: "landscape", widths: [20, 14, 16, 20, 18, 32, 22, 14, 18, 14, 18, 24] });
  addTitleBlock(sheet, "Lernzielkontrollen", `Export für: ${report.scopeLabel}`, report.generatedAt, 12);
  const lastRow = addTable(sheet, 5, [
    "Klasse/Lerngruppe", "Datum", "Fach", "Bereich", "Typ", "Titel", "Bewertungsart", "Max. Punkte",
    "Anzahl Ergebnisse", "Anzahl fehlt", "Anzahl nachschreiben", "Anzahl nicht teilgenommen"
  ], report.assessments.map((assessment) => {
    const results = report.assessmentResults.filter((result) => result.assessmentId === assessment.id);
    return [
      getClassNameById(assessment.classId),
      assessment.datum ? formatGermanDate(assessment.datum) : "",
      assessment.fach,
      assessment.bereich || "",
      assessment.typ,
      assessment.titel,
      assessment.bewertungsart,
      assessment.maxPunkte || "",
      results.filter((result) => result.status === "eingetragen").length,
      results.filter((result) => result.status === "fehlt").length,
      results.filter((result) => result.status === "nachschreiben").length,
      results.filter((result) => result.status === "nicht teilgenommen").length
    ];
  }), { rowHeight: 28 });
  finishWorksheetLayout(sheet, {
    maxVisibleColumn: 12,
    maxVisibleRow: Math.max(lastRow + 2, 16),
    printArea: `A1:L${Math.max(lastRow, 16)}`,
    landscape: true,
    freezeRow: 5
  });
}

function addAssessmentTasksSheet(workbook, report) {
  const sheet = workbook.addWorksheet("LZK Aufgaben");
  setupSheet(sheet, { orientation: "landscape", widths: [20, 14, 28, 14, 28, 14, 24] });
  addTitleBlock(sheet, "Aufgaben und Maximalpunkte", `Export für: ${report.scopeLabel}`, report.generatedAt, 7);
  const rows = (report.assessmentTasks || []).map((task) => {
    const assessment = report.assessments.find((item) => item.id === task.assessmentId) || {};
    return [
      getClassNameById(task.classId),
      assessment.fach || "",
      assessment.titel || "",
      task.number,
      task.title,
      task.maxPoints,
      task.competency || ""
    ];
  });
  const lastRow = addTable(sheet, 5, ["Klasse/Lerngruppe", "Fach", "Lernzielkontrolle", "Aufgabe", "Inhalt", "Max. Punkte", "Kompetenz"], rows, { rowHeight: 28 });
  finishWorksheetLayout(sheet, {
    maxVisibleColumn: 7,
    maxVisibleRow: Math.max(lastRow + 2, 16),
    printArea: `A1:G${Math.max(lastRow, 16)}`,
    landscape: true,
    freezeRow: 5
  });
}

function addAssessmentResultsSheet(workbook, report) {
  const sheet = workbook.addWorksheet("LZK Ergebnisse");
  setupSheet(sheet, { orientation: "landscape", widths: [20, 20, 16, 20, 30, 14, 12, 14, 12, 18, 10, 18, 10, 10, 10, 22, 28] });
  addTitleBlock(sheet, "LZK Ergebnisse", `Export für: ${report.scopeLabel}`, report.generatedAt, 17);
  const rows = report.assessmentResults.map((result) => {
    const assessment = report.assessments.find((item) => item.id === result.assessmentId) || {};
    const maxPoints = result.maxPunkteSnapshot || assessment.maxPunkte || "";
    return [
      getClassNameById(result.classId),
      result.tierLabel || `${result.tierEmojiSnapshot || ""} ${result.tierNameSnapshot || ""}`.trim(),
      assessment.fach || "",
      assessment.bereich || "",
      assessment.titel || "",
      assessment.datum ? formatGermanDate(assessment.datum) : "",
      result.totalPoints ?? result.punkte ?? "",
      maxPoints,
      assessmentResultPercent(result),
      result.suggestedRating || "",
      result.suggestedNote || "",
      result.finalRating || "",
      result.finalNote || result.note || "",
      result.note || "",
      result.symbol || "",
      result.status || "",
      result.remark || ""
    ];
  });
  const lastRow = addTable(sheet, 5, ["Klasse/Lerngruppe", "Tier", "Fach", "Bereich", "Titel", "Datum", "Punkte", "Max. Punkte", "Prozent", "Bewertungsvorschlag", "Notenvorschlag", "Endgültige Bewertung", "Endgültige Note", "Note", "Symbol", "Status", "Bemerkung"], rows, { statusColumn: 16, animalColumn: 2, rowHeight: 28 });
  finishWorksheetLayout(sheet, {
    maxVisibleColumn: 17,
    maxVisibleRow: Math.max(lastRow + 2, 16),
    printArea: `A1:Q${Math.max(lastRow, 16)}`,
    landscape: true,
    freezeRow: 5
  });
}

function addAssessmentMatrixSheet(workbook, report) {
  const sheet = workbook.addWorksheet("LZK Übersicht");
  const assessments = report.assessments;
  setupSheet(sheet, { orientation: "landscape", widths: [22, ...assessments.map(() => 20)] });
  addTitleBlock(sheet, "LZK Übersicht", `Export für: ${report.scopeLabel}`, report.generatedAt, Math.max(2, assessments.length + 1));
  const rows = report.animals.map((animal) => [
    animal.exportLabel || `${animal.tierEmoji} ${animal.tierName}`,
    ...assessments.map((assessment) => formatAssessmentMatrixExportValue(assessment, report.assessmentResults.find((result) => result.assessmentId === assessment.id && result.animalId === animal.id)))
  ]);
  const headers = ["Tier", ...assessments.map((assessment) => `${assessment.titel}${assessment.datum ? ` ${formatGermanDate(assessment.datum)}` : ""}`)];
  const lastRow = addTable(sheet, 5, headers, rows, { animalColumn: 1, rowHeight: 30 });
  const maxColumn = Math.max(1, headers.length);
  finishWorksheetLayout(sheet, {
    maxVisibleColumn: maxColumn,
    maxVisibleRow: Math.max(lastRow + 2, 16),
    printArea: `A1:${columnLetters(maxColumn)}${Math.max(lastRow, 16)}`,
    landscape: true,
    freezeRow: 5
  });
}

function addDataSheet(workbook, report) {
  const sheet = workbook.addWorksheet("Daten");
  setupSheet(sheet, { orientation: "landscape", widths: [14, 10, 18, 18, 14, 24, 10, 20, 12] });
  addTitleBlock(sheet, "Daten", `Export für: ${report.scopeLabel}`, report.generatedAt, 9);
  const lastRow = addTable(sheet, 5, ["Datum", "Uhrzeit", "Klasse", "Tier", "Fach", "Material", "Seite/Aufgabe", "Status", "Erledigt"],
    report.allEntries.map((entry) => [formatGermanDate(entry.datumUhrzeit), formatExcelTime(entry.datumUhrzeit), entry.klasseName, entry.tierLabel, entry.fach, entry.materialName, entryExportWork(entry), entry.status, entry.erledigt ? "Ja" : "Nein"]),
    { statusColumn: 8 });
  finishWorksheetLayout(sheet, {
    maxVisibleColumn: 9,
    maxVisibleRow: Math.max(lastRow + 2, 16),
    printArea: `A1:I${Math.max(lastRow, 16)}`,
    landscape: true,
    freezeRow: 5
  });
}

function addAssessmentLegendSheet(workbook, report) {
  const sheet = workbook.addWorksheet("Bewertungsschlüssel");
  setupSheet(sheet, { orientation: "portrait", widths: [24, 24, 16, 38] });
  addTitleBlock(sheet, "Bewertungsschlüssel", `Export für: ${report.scopeLabel}`, report.generatedAt, 4);
  const lastRow = addTable(sheet, 5, ["Bewertung", "Prozentwert", "Note", "Erklärung"], [
    ["sehr gut", "100 % bis 96 %", "1", "sicher erreicht"],
    ["gut", "95 % bis 87 %", "2", "weitgehend sicher erreicht"],
    ["befriedigend", "86 % bis 71 %", "3", "grundlegend erreicht"],
    ["ausreichend", "70 % bis 50 %", "4", "teilweise erreicht"],
    ["mangelhaft", "49 % bis 21 %", "5", "Unterstützung prüfen"],
    ["ungenügend", "20 % bis 0 %", "6", "Unterstützung prüfen"],
    ["++", "Symbol", "", "sehr sicher"],
    ["+", "Symbol", "", "sicher"],
    ["o", "Symbol", "", "im Aufbau"],
    ["-", "Symbol", "", "braucht Übung"],
    ["--", "Symbol", "", "Unterstützung prüfen"]
  ], { rowHeight: 28, hintColumn: 4 });
  finishWorksheetLayout(sheet, {
    maxVisibleColumn: 4,
    maxVisibleRow: Math.max(lastRow + 2, 18),
    printArea: `A1:D${Math.max(lastRow, 18)}`,
    landscape: false,
    freezeRow: 5
  });
}

function addPrintSheet(workbook, report) {
  const sheet = workbook.addWorksheet("Druckübersicht");
  setupSheet(sheet, { orientation: "landscape", widths: [22, 32, 32, 24, 40, 4] });
  addTitleBlock(sheet, "Lernstand-Kompass – Druckübersicht", `Export für: ${report.scopeLabel}`, report.generatedAt, 6);
  const lastRow = addTable(sheet, 5, ["Tier", "Deutsch", "Mathe", "Offen", "Notiz"],
    report.printRows.map((row) => [row.tier, row.deutsch, row.mathe, row.open, row.note]),
    { statusColumn: 4, rowHeight: 38, animalColumn: 1 });
  finishWorksheetLayout(sheet, {
    maxVisibleColumn: 6,
    maxVisibleRow: Math.max(lastRow + 2, 16),
    printArea: `A1:F${Math.max(lastRow, 16)}`,
    landscape: true,
    freezeRow: 5
  });
}

function setupSheet(sheet, { orientation, widths, freezeRow = 5 }) {
  sheet.properties.defaultRowHeight = 22;
  sheet.views = freezeRow
    ? [{ state: "frozen", ySplit: freezeRow, topLeftCell: `A${freezeRow + 1}`, activeCell: "A1", showGridLines: false, zoomScale: 100 }]
    : [{ activeCell: "A1", showGridLines: false, zoomScale: 100 }];
  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.fill = solidFill(XLSX_COLORS.cream);
    });
  });
  sheet.pageSetup = {
    orientation,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.35, right: 0.35, top: 0.45, bottom: 0.45, header: 0.2, footer: 0.2 }
  };
  sheet.columns = widths.map((width) => ({ width }));
}

function finishWorksheetLayout(sheet, { maxVisibleColumn, maxVisibleRow, printArea, landscape, freezeRow = 0 }) {
  sheet.views = freezeRow
    ? [{ state: "frozen", ySplit: freezeRow, topLeftCell: `A${freezeRow + 1}`, activeCell: "A1", showGridLines: false, zoomScale: 100 }]
    : [{ activeCell: "A1", showGridLines: false, zoomScale: 100 }];
  for (let column = maxVisibleColumn + 1; column <= 100; column += 1) {
    sheet.getColumn(column).hidden = true;
  }
  for (let row = maxVisibleRow + 1; row <= 200; row += 1) {
    const hiddenRow = sheet.getRow(row);
    hiddenRow.hidden = true;
    hiddenRow.height = 1;
  }
  sheet.pageSetup = {
    ...sheet.pageSetup,
    printArea,
    orientation: landscape ? "landscape" : "portrait",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.35, right: 0.35, top: 0.45, bottom: 0.45, header: 0.2, footer: 0.2 }
  };
}

function addTitleBlock(sheet, title, subtitle, generatedAt, columns) {
  sheet.mergeCells(1, 1, 1, columns);
  sheet.mergeCells(2, 1, 2, columns);
  sheet.mergeCells(3, 1, 3, columns);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = title;
  titleCell.fill = solidFill(XLSX_COLORS.aubergine);
  titleCell.font = { bold: true, size: 22, color: { argb: XLSX_COLORS.white } };
  titleCell.alignment = { vertical: "middle", horizontal: "left" };

  const subCell = sheet.getCell(2, 1);
  subCell.value = subtitle;
  subCell.fill = solidFill(XLSX_COLORS.aubergine);
  subCell.font = { bold: true, size: 13, color: { argb: XLSX_COLORS.white } };

  const dateCell = sheet.getCell(3, 1);
  dateCell.value = `Erstellt am: ${formatGermanDate(generatedAt)} um ${formatExcelTime(generatedAt)} Uhr`;
  dateCell.fill = solidFill(XLSX_COLORS.aubergine);
  dateCell.font = { size: 12, color: { argb: XLSX_COLORS.white } };
  [1, 2, 3].forEach((rowNumber) => {
    const row = sheet.getRow(rowNumber);
    row.height = rowNumber === 1 ? 30 : 22;
    for (let column = 1; column <= columns; column += 1) {
      sheet.getCell(rowNumber, column).fill = solidFill(XLSX_COLORS.aubergine);
    }
  });
}

function addDashboardTitle(sheet, report) {
  sheet.mergeCells("A1:H3");
  const cell = sheet.getCell("A1");
  cell.value = `Lernstand-Kompass\nExport für ${report.scopeLabel} · erstellt am ${formatGermanDate(report.generatedAt)} um ${formatExcelTime(report.generatedAt)} Uhr`;
  cell.fill = solidFill(XLSX_COLORS.aubergine);
  cell.font = { bold: true, size: 22, color: { argb: XLSX_COLORS.white } };
  cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  for (let row = 1; row <= 3; row += 1) {
    sheet.getRow(row).height = row === 1 ? 32 : 24;
    for (let column = 1; column <= 8; column += 1) {
      sheet.getCell(row, column).fill = solidFill(XLSX_COLORS.aubergine);
      sheet.getCell(row, column).border = tableBorder();
    }
  }
}

function addMetricTile(sheet, range, label, value, fillColor) {
  sheet.mergeCells(range);
  const cell = sheet.getCell(range.split(":")[0]);
  cell.value = `${label}\n\n${value}`;
  cell.fill = solidFill(fillColor);
  cell.font = { bold: true, size: 16, color: { argb: XLSX_COLORS.text } };
  cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  applyBorderToRange(sheet, range);
  const [start, end] = range.split(":").map(parseCellAddress);
  for (let row = start.row; row <= end.row; row += 1) {
    sheet.getRow(row).height = 26;
  }
}

function addTable(sheet, startRow, headers, rows, options = {}) {
  const headerRow = sheet.getRow(startRow);
  headerRow.values = ["", ...headers];
  headerRow.height = 26;
  headers.forEach((_, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.fill = solidFill(options.headerFill || XLSX_COLORS.aubergine);
    cell.font = { bold: true, color: { argb: options.headerFill ? XLSX_COLORS.text : XLSX_COLORS.white } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = tableBorder();
  });
  const bodyRows = rows.length ? rows : [["Keine Einträge"]];
  bodyRows.forEach((values, rowIndex) => {
    const row = sheet.getRow(startRow + rowIndex + 1);
    row.values = ["", ...values];
    row.height = options.rowHeight || 24;
    values.forEach((_, columnIndex) => {
      const cell = row.getCell(columnIndex + 1);
      cell.alignment = { vertical: "middle", wrapText: true };
      cell.border = tableBorder();
      cell.fill = solidFill(rowIndex % 2 === 0 ? XLSX_COLORS.white : XLSX_COLORS.softGray);
      if (options.animalColumn === columnIndex + 1) {
        cell.font = { bold: true, size: 13, color: { argb: XLSX_COLORS.text } };
      }
      if (options.statusColumn === columnIndex + 1) applyStatusFill(cell);
      if (options.hintColumn === columnIndex + 1) applyHintFill(cell);
      if (options.groupDistanceColumn === columnIndex + 1 || options.goalDistanceColumn === columnIndex + 1) applyDistanceFill(cell);
      if (options.groupColumn === columnIndex + 1 && rowIndex > 0 && values[columnIndex] !== rows[rowIndex - 1]?.[columnIndex]) {
        row.eachCell((groupCell) => {
          groupCell.border = { ...tableBorder(), top: { style: "medium", color: { argb: XLSX_COLORS.aubergine } } };
        });
      }
    });
  });
  if (options.autofilter !== false) {
    sheet.autoFilter = {
      from: { row: startRow, column: 1 },
      to: { row: startRow, column: headers.length }
    };
  }
  return startRow + bodyRows.length;
}

function addEmptyMessage(sheet, range, message) {
  sheet.mergeCells(range);
  const cell = sheet.getCell(range.split(":")[0]);
  cell.value = message;
  cell.fill = solidFill(XLSX_COLORS.cream);
  cell.font = { bold: true, size: 16, color: { argb: XLSX_COLORS.aubergine } };
  cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  applyBorderToRange(sheet, range);
}

function applyStatusFill(cell) {
  const text = String(cell.value || "");
  if (text === "fertig") cell.fill = solidFill(XLSX_COLORS.done);
  if (text === "brauche Hilfe") cell.fill = solidFill(XLSX_COLORS.help);
  if (text === "bitte kontrollieren") cell.fill = solidFill(XLSX_COLORS.check);
  if (text === "erledigt") cell.fill = solidFill(XLSX_COLORS.neutral);
  if (text === "bearbeitet") cell.fill = solidFill(XLSX_COLORS.done);
  if (text === "offen") cell.fill = solidFill(XLSX_COLORS.stale);
}

function applyHintFill(cell) {
  const text = String(cell.value || "");
  if (text.includes("länger kein Eintrag")) cell.fill = solidFill(XLSX_COLORS.stale);
  else if (text.includes("Hilfe") || text.includes("Kontrolle") || text.includes("Blick") || text.includes("Unterstützung")) cell.fill = solidFill(XLSX_COLORS.help);
  else if (text.includes("Zusatz")) cell.fill = solidFill(XLSX_COLORS.ahead);
  else if (text.includes("Plan") || text.includes("Bereich")) cell.fill = solidFill(XLSX_COLORS.done);
}

function applyDistanceFill(cell) {
  const text = String(cell.value || "");
  if (text.startsWith("+")) cell.fill = solidFill(XLSX_COLORS.done);
  if (/^-\d/.test(text)) {
    const number = Math.abs(Number(text.replace(",", ".")));
    cell.fill = solidFill(number >= 8 ? XLSX_COLORS.stale : XLSX_COLORS.help);
  }
}

function applyBorderToRange(sheet, range) {
  const [start, end] = range.split(":").map(parseCellAddress);
  for (let row = start.row; row <= end.row; row += 1) {
    for (let column = start.column; column <= end.column; column += 1) {
      sheet.getCell(row, column).border = tableBorder();
    }
  }
}

function parseCellAddress(address) {
  const match = String(address).match(/^([A-Z]+)(\d+)$/);
  const letters = match?.[1] || "A";
  const row = Number(match?.[2] || 1);
  let column = 0;
  for (let index = 0; index < letters.length; index += 1) {
    column = column * 26 + letters.charCodeAt(index) - 64;
  }
  return { row, column };
}

function columnLetters(column) {
  let value = "";
  let current = column;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    value = String.fromCharCode(65 + remainder) + value;
    current = Math.floor((current - 1) / 26);
  }
  return value || "A";
}

function assessmentResultPercent(result) {
  const points = Number(result?.totalPoints ?? result?.punkte);
  const maxPoints = Number(result?.maxPunkteSnapshot);
  if (!Number.isFinite(points) || !Number.isFinite(maxPoints) || maxPoints <= 0) return "";
  return `${Math.round((points / maxPoints) * 100)} %`;
}

function formatAssessmentMatrixExportValue(assessment, result) {
  if (!result) return "";
  if (result.status && result.status !== "eingetragen") return result.status;
  const grading = String(assessment?.bewertungsart || "");
  const parts = [];
  if (grading.includes("Punkte") && result.punkte !== "" && result.punkte != null) {
    parts.push(`${result.totalPoints ?? result.punkte}${result.maxPunkteSnapshot ? `/${result.maxPunkteSnapshot}` : ""}`);
  }
  if (result.percentage !== "" && result.percentage != null) parts.push(`${result.percentage} %`);
  if (result.finalRating) parts.push(result.finalRating);
  if (grading.includes("Note") && (result.finalNote || result.note)) parts.push(result.finalNote || result.note);
  if (grading.includes("Symbol") && result.symbol) parts.push(result.symbol);
  return parts.join(" | ");
}

function progressBar(value) {
  const filled = Math.max(0, Math.min(5, Math.round(Number(value) / 2)));
  return `${"▰".repeat(filled)}${"▱".repeat(5 - filled)}`;
}

function solidFill(argb) {
  return { type: "pattern", pattern: "solid", fgColor: { argb } };
}

function tableBorder() {
  return {
    top: { style: "thin", color: { argb: XLSX_COLORS.line } },
    left: { style: "thin", color: { argb: XLSX_COLORS.line } },
    bottom: { style: "thin", color: { argb: XLSX_COLORS.line } },
    right: { style: "thin", color: { argb: XLSX_COLORS.line } }
  };
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function signedNumber(value) {
  const rounded = Math.round(value * 10) / 10;
  return rounded > 0 ? `+${String(rounded).replace(".", ",")}` : String(rounded).replace(".", ",");
}

function entryExportWork(entry) {
  if (entry?.zusatzText) return entry.zusatzText;
  const page = Number(entry?.seite);
  return page > 0 ? page : "";
}

function importActiveClassAsNew(state, backup) {
  if (backup?.type !== "active-class-backup" || !backup.classItem) {
    throw new Error("Diese Datei ist kein Backup einer einzelnen Klasse.");
  }

  const newClassId = makeId();
  const oldToNewAnimal = new Map();
  const className = `${backup.classItem.name} Import`;
  const importedClass = {
    ...backup.classItem,
    id: newClassId,
    name: className,
    erstelltAm: nowIso(),
    aktiv: true
  };

  const animals = (backup.animals || []).map((item) => {
    const newId = makeId();
    oldToNewAnimal.set(item.id, newId);
    return { ...item, id: newId, classId: newClassId };
  });

  const materials = (backup.materials || []).map((item) => ({ ...item, id: makeId(), classId: newClassId }));
  const goals = (backup.goals || []).map((item) => ({ ...item, id: makeId(), classId: newClassId }));
  const oldToNewAssessment = new Map();
  const assessments = (backup.assessments || []).map((item) => {
    const newId = makeId();
    oldToNewAssessment.set(item.id, newId);
    return { ...item, id: newId, classId: newClassId };
  });
  const oldToNewAssessmentTask = new Map();
  const assessmentTasks = (backup.assessmentTasks || []).map((item) => {
    const newId = makeId();
    oldToNewAssessmentTask.set(item.id, newId);
    return {
      ...item,
      id: newId,
      assessmentId: oldToNewAssessment.get(item.assessmentId) || item.assessmentId,
      classId: newClassId
    };
  });
  const assessmentResults = (backup.assessmentResults || []).map((item) => ({
    ...item,
    id: makeId(),
    assessmentId: oldToNewAssessment.get(item.assessmentId) || item.assessmentId,
    classId: newClassId,
    animalId: oldToNewAnimal.get(item.animalId) || item.animalId,
    taskPoints: remapTaskPoints(item.taskPoints, oldToNewAssessmentTask)
  }));
  const trainingCompletions = (backup.trainingCompletions || []).map((item) => ({
    ...item,
    id: makeId(),
    classId: newClassId,
    animalId: oldToNewAnimal.get(item.animalId) || item.animalId
  }));
  const trainingHistory = (backup.trainingHistory || []).map((item) => ({
    ...item,
    id: makeId(),
    classId: newClassId,
    animalId: oldToNewAnimal.get(item.animalId) || item.animalId
  }));
  const oldToNewWorkbookCatalog = new Map();
  const workbookCatalog = (backup.workbookCatalog || []).map((item) => {
    const newId = makeId();
    oldToNewWorkbookCatalog.set(item.id, newId);
    return { ...item, id: newId, classId: newClassId };
  });
  const oldToNewWeeklyPlan = new Map();
  const weeklyPlans = (backup.weeklyPlans || []).map((item) => {
    const newId = makeId();
    oldToNewWeeklyPlan.set(item.id, newId);
    return {
      ...item,
      id: newId,
      classId: newClassId,
      animalIds: (item.animalIds || []).map((animalId) => oldToNewAnimal.get(animalId) || animalId),
      days: remapWeeklyPlanDays(item.days, oldToNewWorkbookCatalog)
    };
  });
  const weeklyPlanStatuses = (backup.weeklyPlanStatuses || []).map((item) => ({
    ...item,
    id: makeId(),
    classId: newClassId,
    planId: oldToNewWeeklyPlan.get(item.planId) || item.planId,
    animalId: oldToNewAnimal.get(item.animalId) || item.animalId,
    workbookCatalogId: oldToNewWorkbookCatalog.get(item.workbookCatalogId) || item.workbookCatalogId
  }));
  const oldToNewWorkbookAssignment = new Map();
  const workbookAssignments = (backup.workbookAssignments || []).map((item) => {
    const newId = makeId();
    oldToNewWorkbookAssignment.set(item.id, newId);
    return {
      ...item,
      id: newId,
      classId: newClassId,
      workbookCatalogId: oldToNewWorkbookCatalog.get(item.workbookCatalogId) || item.workbookCatalogId,
      animalIds: (item.animalIds || []).map((animalId) => oldToNewAnimal.get(animalId) || animalId)
    };
  });
  const workbookAssignmentStatuses = (backup.workbookAssignmentStatuses || []).map((item) => ({
    ...item,
    id: makeId(),
    classId: newClassId,
    assignmentId: oldToNewWorkbookAssignment.get(item.assignmentId) || item.assignmentId,
    animalId: oldToNewAnimal.get(item.animalId) || item.animalId,
    workbookCatalogId: oldToNewWorkbookCatalog.get(item.workbookCatalogId) || item.workbookCatalogId
  }));
  const childWorkbookReports = (backup.childWorkbookReports || []).map((item) => ({
    ...item,
    id: makeId(),
    classId: newClassId,
    animalId: oldToNewAnimal.get(item.animalId) || item.animalId,
    suggestedWorkbookCatalogId: oldToNewWorkbookCatalog.get(item.suggestedWorkbookCatalogId) || item.suggestedWorkbookCatalogId,
    selectedWorkbookCatalogId: oldToNewWorkbookCatalog.get(item.selectedWorkbookCatalogId) || item.selectedWorkbookCatalogId
  }));
  const entries = (backup.entries || []).map((entry) => ({
    ...entry,
    id: makeId(),
    classId: newClassId,
    tierID: oldToNewAnimal.get(entry.tierID) || entry.tierID
  }));
  const oldToNewAnimalGroup = new Map();
  const animalGroups = (backup.animalGroups || []).map((group) => {
    const newId = makeId();
    oldToNewAnimalGroup.set(group.id, newId);
    return {
      ...group,
      id: newId,
      classId: newClassId,
      animalIds: (group.animalIds || []).map((animalId) => oldToNewAnimal.get(animalId) || animalId)
    };
  });
  const activeWorkbookMaterials = (backup.activeWorkbookMaterials || []).map((item) => ({
    ...item,
    id: makeId(),
    classId: newClassId,
    animalId: item.animalId ? oldToNewAnimal.get(item.animalId) || item.animalId : "",
    groupId: item.groupId ? oldToNewAnimalGroup.get(item.groupId) || item.groupId : ""
  }));

  return normalizeState({
    ...state,
    activeClassId: newClassId,
    classes: [...state.classes, importedClass],
    animals: [...state.animals, ...animals],
    animalGroups: [...(state.animalGroups || []), ...animalGroups],
    materials: [...state.materials, ...materials],
    goals: [...state.goals, ...goals],
    assessments: [...(state.assessments || []), ...assessments],
    assessmentTasks: [...(state.assessmentTasks || []), ...assessmentTasks],
    assessmentResults: [...(state.assessmentResults || []), ...assessmentResults],
    trainingTasks: backup.trainingTasks?.length ? mergeTrainingTasks(state.trainingTasks || [], backup.trainingTasks) : state.trainingTasks,
    trainingCompletions: [...(state.trainingCompletions || []), ...trainingCompletions],
    trainingHistory: [...(state.trainingHistory || []), ...trainingHistory],
    workbookCatalog: [...(state.workbookCatalog || []), ...workbookCatalog],
    workbookAssignments: [...(state.workbookAssignments || []), ...workbookAssignments],
    workbookAssignmentStatuses: [...(state.workbookAssignmentStatuses || []), ...workbookAssignmentStatuses],
    childWorkbookReports: [...(state.childWorkbookReports || []), ...childWorkbookReports],
    activeWorkbookMaterials: [...(state.activeWorkbookMaterials || []), ...activeWorkbookMaterials],
    weeklyPlans: [...(state.weeklyPlans || []), ...weeklyPlans],
    weeklyPlanStatuses: [...(state.weeklyPlanStatuses || []), ...weeklyPlanStatuses],
    entries: [...state.entries, ...entries]
  });
}

function restoreFullBackup(backup) {
  if (backup?.type !== "full-backup" || !backup.state) {
    throw new Error("Diese Datei ist kein Gesamtbackup.");
  }
  return normalizeState(backup.state);
}

function stateFromBackup(backup) {
  if (backup?.type === "full-backup" && backup.state) return normalizeState(backup.state);
  if (backup?.type === "active-class-backup" && backup.classItem) {
    return normalizeState({
      ...emptyState(),
      setupComplete: true,
      activeClassId: backup.classItem.id,
      classes: [backup.classItem],
      animals: backup.animals || [],
      animalGroups: backup.animalGroups || [],
      materials: backup.materials || [],
      entries: backup.entries || [],
      goals: backup.goals || [],
      assessments: backup.assessments || [],
      assessmentTasks: backup.assessmentTasks || [],
      assessmentResults: backup.assessmentResults || [],
      trainingTasks: backup.trainingTasks || [],
      trainingCompletions: backup.trainingCompletions || [],
      trainingHistory: backup.trainingHistory || [],
      workbookCatalog: backup.workbookCatalog || [],
      workbookAssignments: backup.workbookAssignments || [],
      workbookAssignmentStatuses: backup.workbookAssignmentStatuses || [],
      childWorkbookReports: backup.childWorkbookReports || [],
      activeWorkbookMaterials: backup.activeWorkbookMaterials || [],
      childViewSettings: backup.childViewSettings || {},
      weeklyPlans: backup.weeklyPlans || [],
      weeklyPlanStatuses: backup.weeklyPlanStatuses || [],
      learningGameSessions: backup.learningGameSessions || [],
      sprachweltTasks: backup.sprachweltTasks || []
    });
  }
  if (backup?.type === "lernpost" && backup.classItem) {
    return normalizeState({
      ...emptyState(),
      setupComplete: true,
      activeClassId: backup.classItem.id,
      classes: [backup.classItem],
      animals: backup.animals || [],
      animalGroups: backup.animalGroups || [],
      materials: backup.materials || [],
      entries: backup.entries || [],
      assessments: [],
      assessmentTasks: [],
      assessmentResults: [],
      trainingTasks: backup.trainingTasks || [],
      trainingCompletions: backup.trainingCompletions || [],
      trainingHistory: backup.trainingHistory || [],
      workbookCatalog: backup.workbookCatalog || [],
      workbookAssignments: backup.workbookAssignments || [],
      workbookAssignmentStatuses: backup.workbookAssignmentStatuses || [],
      childWorkbookReports: backup.childWorkbookReports || [],
      activeWorkbookMaterials: backup.activeWorkbookMaterials || [],
      childViewSettings: backup.childViewSettings || {},
      weeklyPlans: backup.weeklyPlans || [],
      weeklyPlanStatuses: backup.weeklyPlanStatuses || [],
      sprachweltTasks: backup.sprachweltTasks || []
    });
  }
  if (backup?.classes || backup?.entries) return normalizeState(backup);
  throw new Error("Diese Datei ist kein gültiges Lernstand-Kompass-Backup.");
}

function mergeBackupData(currentState, importedBackup) {
  const current = normalizeState(currentState);
  const imported = stateFromBackup(importedBackup);
  const report = {
    addedClasses: 0,
    addedAnimals: 0,
    addedMaterials: 0,
    addedEntries: 0,
    addedGoals: 0,
    addedAssessments: 0,
    addedAssessmentTasks: 0,
    addedAssessmentResults: 0,
    addedTrainingTasks: 0,
    addedTrainingCompletions: 0,
    addedTrainingHistory: 0,
    addedWorkbookCatalog: 0,
    addedWorkbookAssignments: 0,
    addedWorkbookAssignmentStatuses: 0,
    addedChildWorkbookReports: 0,
    addedActiveWorkbookMaterials: 0,
    addedWeeklyPlans: 0,
    addedWeeklyPlanStatuses: 0,
    addedLearningGameSessions: 0,
    skippedDuplicateTrainingCompletions: 0,
    skippedDuplicateAssessments: 0,
    skippedDuplicateAssessmentTasks: 0,
    skippedDuplicateAssessmentResults: 0,
    skippedDuplicateTrainingHistory: 0,
    skippedDuplicateWorkbookCatalog: 0,
    skippedDuplicateWorkbookAssignments: 0,
    skippedDuplicateWorkbookAssignmentStatuses: 0,
    skippedDuplicateChildWorkbookReports: 0,
    skippedDuplicateActiveWorkbookMaterials: 0,
    skippedDuplicateWeeklyPlans: 0,
    skippedDuplicateWeeklyPlanStatuses: 0,
    skippedDuplicateLearningGameSessions: 0,
    skippedDuplicateEntries: 0,
    conflicts: [],
    mergedAt: nowIso()
  };

  const classIds = new Set(current.classes.map((item) => item.id));
  const animalIds = new Set(current.animals.map((item) => item.id));
  const animalGroupIds = new Set((current.animalGroups || []).map((item) => item.id));
  const materialIds = new Set(current.materials.map((item) => item.id));
  const entryIds = new Set(current.entries.map((item) => item.id || item.entryId).filter(Boolean));
  const goalIds = new Set((current.goals || []).map((item) => item.id));
  const assessmentIds = new Set((current.assessments || []).map((item) => item.id));
  const assessmentTaskIds = new Set((current.assessmentTasks || []).map((item) => item.id));
  const assessmentResultIds = new Set((current.assessmentResults || []).map((item) => item.id));
  const trainingTaskCodes = new Set((current.trainingTasks || []).map((item) => item.code));
  const trainingCompletionKeys = new Set((current.trainingCompletions || []).map(trainingCompletionKey));
  const trainingHistoryIds = new Set((current.trainingHistory || []).map((item) => item.id));
  const workbookCatalogIds = new Set((current.workbookCatalog || []).map((item) => item.id));
  const workbookAssignmentIds = new Set((current.workbookAssignments || []).map((item) => item.id));
  const workbookAssignmentStatusIds = new Set((current.workbookAssignmentStatuses || []).map((item) => item.id));
  const childWorkbookReportIds = new Set((current.childWorkbookReports || []).map((item) => item.id));
  const activeWorkbookMaterialIds = new Set((current.activeWorkbookMaterials || []).map((item) => item.id));
  const weeklyPlanIds = new Set((current.weeklyPlans || []).map((item) => item.id));
  const weeklyPlanStatusIds = new Set((current.weeklyPlanStatuses || []).map((item) => item.id));
  const learningGameSessionIds = new Set((current.learningGameSessions || []).map((item) => item.id));
  const existingEntryFingerprints = new Set(current.entries.map(entryFingerprint));
  const qrTokens = new Map(current.animals.filter((animal) => animal.qrToken).map((animal) => [animal.qrToken, animal.id]));

  const next = {
    ...current,
    classes: [...current.classes],
    animals: [...current.animals],
    animalGroups: [...(current.animalGroups || [])],
    materials: [...current.materials],
    entries: [...current.entries],
    goals: [...(current.goals || [])],
    assessments: [...(current.assessments || [])],
    assessmentTasks: [...(current.assessmentTasks || [])],
    assessmentResults: [...(current.assessmentResults || [])],
    trainingTasks: [...(current.trainingTasks || [])],
    trainingCompletions: [...(current.trainingCompletions || [])],
    trainingHistory: [...(current.trainingHistory || [])],
    workbookCatalog: [...(current.workbookCatalog || [])],
    workbookAssignments: [...(current.workbookAssignments || [])],
    workbookAssignmentStatuses: [...(current.workbookAssignmentStatuses || [])],
    childWorkbookReports: [...(current.childWorkbookReports || [])],
    activeWorkbookMaterials: [...(current.activeWorkbookMaterials || [])],
    weeklyPlans: [...(current.weeklyPlans || [])],
    weeklyPlanStatuses: [...(current.weeklyPlanStatuses || [])],
    learningGameSessions: [...(current.learningGameSessions || [])]
  };

  imported.classes.forEach((item) => {
    if (classIds.has(item.id)) return;
    next.classes.push(item);
    classIds.add(item.id);
    report.addedClasses += 1;
  });

  imported.animals.forEach((item) => {
    if (animalIds.has(item.id)) {
      const index = next.animals.findIndex((animal) => animal.id === item.id);
      if (index >= 0 && !next.animals[index].firstName && item.firstName) {
        next.animals[index] = { ...next.animals[index], firstName: item.firstName };
      }
      return;
    }
    const animal = { ...item };
    if (!animal.qrToken) {
      animal.qrToken = makeQrToken(new Set(qrTokens.keys()));
      report.conflicts.push(`Technischer Tier-Code für ${animal.tierEmoji || ""} ${animal.tierName || "Tier"} ergänzt.`);
    } else if (qrTokens.has(animal.qrToken)) {
      animal.qrToken = makeQrToken(new Set(qrTokens.keys()));
      report.conflicts.push(`Doppelter technischer Tier-Code bei ${animal.tierEmoji || ""} ${animal.tierName || "Tier"} neu erzeugt.`);
    }
    next.animals.push(animal);
    animalIds.add(animal.id);
    if (animal.qrToken) qrTokens.set(animal.qrToken, animal.id);
    report.addedAnimals += 1;
  });

  (imported.animalGroups || []).forEach((item) => {
    if (animalGroupIds.has(item.id)) return;
    next.animalGroups.push(item);
    animalGroupIds.add(item.id);
  });

  imported.materials.forEach((item) => {
    if (materialIds.has(item.id)) return;
    next.materials.push(item);
    materialIds.add(item.id);
    report.addedMaterials += 1;
  });

  imported.entries.forEach((item) => {
    const id = item.id || item.entryId;
    const fingerprint = entryFingerprint(item);
    if ((id && entryIds.has(id)) || existingEntryFingerprints.has(fingerprint)) {
      report.skippedDuplicateEntries += 1;
      return;
    }
    const entry = { ...item, id: id || makeId() };
    next.entries.push(entry);
    entryIds.add(entry.id);
    existingEntryFingerprints.add(fingerprint);
    report.addedEntries += 1;
  });

  (imported.goals || []).forEach((item) => {
    if (goalIds.has(item.id)) return;
    next.goals.push(item);
    goalIds.add(item.id);
    report.addedGoals += 1;
  });

  (imported.assessments || []).forEach((item) => {
    if (assessmentIds.has(item.id)) {
      report.skippedDuplicateAssessments += 1;
      return;
    }
    next.assessments.push(item);
    assessmentIds.add(item.id);
    report.addedAssessments += 1;
  });

  (imported.assessmentTasks || []).forEach((item) => {
    if (assessmentTaskIds.has(item.id)) {
      report.skippedDuplicateAssessmentTasks += 1;
      return;
    }
    next.assessmentTasks.push(item);
    assessmentTaskIds.add(item.id);
    report.addedAssessmentTasks += 1;
  });

  (imported.assessmentResults || []).forEach((item) => {
    if (assessmentResultIds.has(item.id)) {
      report.skippedDuplicateAssessmentResults += 1;
      return;
    }
    next.assessmentResults.push(item);
    assessmentResultIds.add(item.id);
    report.addedAssessmentResults += 1;
  });

  (imported.trainingTasks || []).forEach((item) => {
    if (trainingTaskCodes.has(item.code)) return;
    next.trainingTasks.push(item);
    trainingTaskCodes.add(item.code);
    report.addedTrainingTasks += 1;
  });

  (imported.trainingCompletions || []).forEach((item) => {
    const key = trainingCompletionKey(item);
    if (trainingCompletionKeys.has(key)) {
      const index = next.trainingCompletions.findIndex((existing) => trainingCompletionKey(existing) === key);
      const existing = next.trainingCompletions[index];
      if (existing && new Date(item.updatedAt || item.completedAt || 0) > new Date(existing.updatedAt || existing.completedAt || 0)) {
        next.trainingCompletions[index] = item;
        report.conflicts.push(`Trainingsstatus ${item.taskCode || ""} wurde mit neuerem Zeitstempel übernommen.`);
      } else {
        report.skippedDuplicateTrainingCompletions += 1;
      }
      return;
    }
    next.trainingCompletions.push(item);
    trainingCompletionKeys.add(key);
    report.addedTrainingCompletions += 1;
  });

  (imported.trainingHistory || []).forEach((item) => {
    if (trainingHistoryIds.has(item.id)) {
      report.skippedDuplicateTrainingHistory += 1;
      return;
    }
    next.trainingHistory.push(item);
    trainingHistoryIds.add(item.id);
    report.addedTrainingHistory += 1;
  });

  (imported.workbookCatalog || []).forEach((item) => {
    if (workbookCatalogIds.has(item.id)) {
      report.skippedDuplicateWorkbookCatalog += 1;
      return;
    }
    next.workbookCatalog.push(item);
    workbookCatalogIds.add(item.id);
    report.addedWorkbookCatalog += 1;
  });

  (imported.workbookAssignments || []).forEach((item) => {
    if (workbookAssignmentIds.has(item.id)) {
      report.skippedDuplicateWorkbookAssignments += 1;
      return;
    }
    next.workbookAssignments.push(item);
    workbookAssignmentIds.add(item.id);
    report.addedWorkbookAssignments += 1;
  });

  (imported.workbookAssignmentStatuses || []).forEach((item) => {
    if (workbookAssignmentStatusIds.has(item.id)) {
      report.skippedDuplicateWorkbookAssignmentStatuses += 1;
      return;
    }
    next.workbookAssignmentStatuses.push(item);
    workbookAssignmentStatusIds.add(item.id);
    report.addedWorkbookAssignmentStatuses += 1;
  });

  (imported.childWorkbookReports || []).forEach((item) => {
    if (childWorkbookReportIds.has(item.id)) {
      report.skippedDuplicateChildWorkbookReports += 1;
      return;
    }
    next.childWorkbookReports.push(item);
    childWorkbookReportIds.add(item.id);
    report.addedChildWorkbookReports += 1;
  });

  (imported.activeWorkbookMaterials || []).forEach((item) => {
    if (activeWorkbookMaterialIds.has(item.id)) {
      report.skippedDuplicateActiveWorkbookMaterials += 1;
      return;
    }
    next.activeWorkbookMaterials.push(item);
    activeWorkbookMaterialIds.add(item.id);
    report.addedActiveWorkbookMaterials += 1;
  });

  (imported.weeklyPlans || []).forEach((item) => {
    if (weeklyPlanIds.has(item.id)) {
      report.skippedDuplicateWeeklyPlans += 1;
      return;
    }
    next.weeklyPlans.push(item);
    weeklyPlanIds.add(item.id);
    report.addedWeeklyPlans += 1;
  });

  (imported.weeklyPlanStatuses || []).forEach((item) => {
    if (weeklyPlanStatusIds.has(item.id)) {
      report.skippedDuplicateWeeklyPlanStatuses += 1;
      return;
    }
    next.weeklyPlanStatuses.push(item);
    weeklyPlanStatusIds.add(item.id);
    report.addedWeeklyPlanStatuses += 1;
  });
  (imported.learningGameSessions || []).forEach((item) => {
    if (!item?.id || learningGameSessionIds.has(item.id)) {
      report.skippedDuplicateLearningGameSessions += 1;
      return;
    }
    next.learningGameSessions.push(item);
    learningGameSessionIds.add(item.id);
    report.addedLearningGameSessions += 1;
  });

  return { state: normalizeState(next), report };
}

function remapTaskPoints(taskPoints, idMap) {
  if (!taskPoints || typeof taskPoints !== "object") return {};
  return Object.fromEntries(Object.entries(taskPoints).map(([taskId, value]) => [idMap.get(taskId) || taskId, value]));
}

function remapWeeklyPlanDays(days, idMap) {
  if (!days || typeof days !== "object") return days || {};
  return Object.fromEntries(Object.entries(days).map(([day, value]) => [
    day,
    {
      ...value,
      deutschId: idMap.get(value?.deutschId) || value?.deutschId || "",
      matheId: idMap.get(value?.matheId) || value?.matheId || ""
    }
  ]));
}

function mergeTrainingTasks(currentTasks, importedTasks) {
  const byCode = new Map((currentTasks || []).map((task) => [task.code, task]));
  (importedTasks || []).forEach((task) => {
    if (!byCode.has(task.code)) byCode.set(task.code, task);
  });
  return [...byCode.values()];
}

function trainingCompletionKey(item) {
  return `${item.classId || ""}|${item.animalId || ""}|${item.taskCode || ""}`;
}

function entryFingerprint(entry) {
  return [
    entry.classId || "",
    entry.tierID || "",
    entry.fach || "",
    entry.materialName || "",
    entry.seite ?? "",
    entry.zusatzText || "",
    entry.sprachweltTaskId || "",
    entry.status || "",
    entry.datumUhrzeit || ""
  ].join("|");
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function excelCsvEscape(value) {
  const text = String(value ?? "");
  if (/[;"\r\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function formatGermanDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${date.getFullYear()}`;
}

function formatExcelTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function safeFilePart(text) {
  return String(text || "klasse")
    .toLowerCase()
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("ß", "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "klasse";
}
