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
    app: "Arbeitsheft-Kompass",
    type: "active-class-backup",
    version: APP_VERSION,
    exportedAt: nowIso(),
    classItem,
    animals: state.animals.filter((item) => item.classId === classId),
    materials: state.materials.filter((item) => item.classId === classId),
    entries: state.entries.filter((item) => item.classId === classId),
    goals: state.goals.filter((item) => item.classId === classId),
    assessments: (state.assessments || []).filter((item) => item.classId === classId),
    assessmentResults: (state.assessmentResults || []).filter((item) => item.classId === classId),
    sprachweltTasks: state.sprachweltTasks || []
  };
}

function makeFullBackup(state) {
  return {
    app: "Arbeitsheft-Kompass",
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
    `${entry.tierEmojiSnapshot || ""} ${entry.tierNameSnapshot || ""}`.trim(),
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
  workbook.creator = "Arbeitsheft-Kompass";
  workbook.created = new Date(report.generatedAt);
  workbook.modified = new Date(report.generatedAt);
  workbook.properties.date1904 = false;

  addStartSheet(workbook, report);
  addClassOverviewSheet(workbook, report);
  addProgressSheet(workbook, report);
  addHelpSheet(workbook, report);
  addTodaySheet(workbook, report);
  addPrintSheet(workbook, report);
  addAssessmentOverviewSheet(workbook, report);
  addAssessmentResultsSheet(workbook, report);
  addAssessmentMatrixSheet(workbook, report);
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

  sheet.mergeCells("A15:H15");
  const focusTitle = sheet.getCell("A15");
  focusTitle.value = "Heute im Blick";
  focusTitle.font = { bold: true, size: 16, color: { argb: XLSX_COLORS.aubergine } };
  focusTitle.alignment = { vertical: "middle" };
  sheet.getRow(15).height = 24;

  if (!report.stats.hasEntries) {
    addEmptyMessage(sheet, "A17:H20", "Aktuell keine Einträge.");
  } else {
    addTable(sheet, 17, ["Bereich", "Wert", "Hinweis"], [
      ["Hilfe offen", report.stats.openHelp, "Hilfewünsche im Blick behalten"],
      ["Kontrolle offen", report.stats.openCheck, "Kontrollwünsche gesammelt"],
      ["länger kein Eintrag", report.stats.staleAnimals, "nach aktuellem Schwellenwert"],
      ["weit voraus", report.stats.aheadCount, "Zusatzangebot möglich"],
      ["braucht Blick", report.stats.lookCount, "Unterstützung prüfen"]
    ], { headerFill: XLSX_COLORS.aubergineLight, autofilter: false, rowHeight: 28 });
  }

  sheet.mergeCells("A24:H26");
  const note = sheet.getCell("A24");
  note.value = "Diese Datei enthält keine Kindernamen. Die Arbeitsstände werden über Tier-Pseudonyme dargestellt.";
  note.fill = solidFill(XLSX_COLORS.cream);
  note.font = { bold: true, size: 12, color: { argb: XLSX_COLORS.text } };
  note.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  applyBorderToRange(sheet, "A24:H26");
  finishWorksheetLayout(sheet, {
    maxVisibleColumn: 8,
    maxVisibleRow: 26,
    printArea: "A1:H26",
    landscape: false
  });
}

function addClassOverviewSheet(workbook, report) {
  const sheet = workbook.addWorksheet("Klassenübersicht");
  setupSheet(sheet, { orientation: "landscape", widths: [20, 28, 28, 20, 22, 30] });
  addTitleBlock(sheet, "Klassenübersicht", `Export für: ${report.scopeLabel}`, report.generatedAt, 6);
  const lastRow = addTable(sheet, 5, ["Tier", "Deutsch letzter Stand", "Mathe letzter Stand", "Letzte Aktivität", "Offener Status", "Hinweis"],
    report.overviewRows.map((row) => [
      `${row.animal.tierEmoji} ${row.animal.tierName}`, row.deutsch, row.mathe, row.latestActivity, row.status, row.hint
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
    `${row.animal.tierEmoji} ${row.animal.tierName}`,
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
    addEmptyMessage(sheet, "A5:G8", "Heute wurden noch keine Arbeitsstände eingetragen.");
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

function addAssessmentResultsSheet(workbook, report) {
  const sheet = workbook.addWorksheet("LZK Ergebnisse");
  setupSheet(sheet, { orientation: "landscape", widths: [20, 20, 16, 20, 30, 14, 12, 14, 12, 10, 10, 22] });
  addTitleBlock(sheet, "LZK Ergebnisse", `Export für: ${report.scopeLabel}`, report.generatedAt, 12);
  const rows = report.assessmentResults.map((result) => {
    const assessment = report.assessments.find((item) => item.id === result.assessmentId) || {};
    return [
      getClassNameById(result.classId),
      `${result.tierEmojiSnapshot || ""} ${result.tierNameSnapshot || ""}`.trim(),
      assessment.fach || "",
      assessment.bereich || "",
      assessment.titel || "",
      assessment.datum ? formatGermanDate(assessment.datum) : "",
      result.punkte ?? "",
      result.maxPunkteSnapshot || assessment.maxPunkte || "",
      assessmentResultPercent(result),
      result.note || "",
      result.symbol || "",
      result.status || ""
    ];
  });
  const lastRow = addTable(sheet, 5, ["Klasse/Lerngruppe", "Tier", "Fach", "Bereich", "Titel", "Datum", "Punkte", "Max. Punkte", "Prozent", "Note", "Symbol", "Status"], rows, { statusColumn: 12, animalColumn: 2, rowHeight: 28 });
  finishWorksheetLayout(sheet, {
    maxVisibleColumn: 12,
    maxVisibleRow: Math.max(lastRow + 2, 16),
    printArea: `A1:L${Math.max(lastRow, 16)}`,
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
    `${animal.tierEmoji} ${animal.tierName}`,
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

function addPrintSheet(workbook, report) {
  const sheet = workbook.addWorksheet("Druckübersicht");
  setupSheet(sheet, { orientation: "landscape", widths: [22, 32, 32, 24, 40, 4] });
  addTitleBlock(sheet, "Arbeitsheft-Kompass – Druckübersicht", `Export für: ${report.scopeLabel}`, report.generatedAt, 6);
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
  cell.value = `Arbeitsheft-Kompass\nExport für ${report.scopeLabel} · erstellt am ${formatGermanDate(report.generatedAt)} um ${formatExcelTime(report.generatedAt)} Uhr`;
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
  const points = Number(result?.punkte);
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
    parts.push(`${result.punkte}${result.maxPunkteSnapshot ? `/${result.maxPunkteSnapshot}` : ""}`);
  }
  if (grading.includes("Note") && result.note) parts.push(result.note);
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
  const assessmentResults = (backup.assessmentResults || []).map((item) => ({
    ...item,
    id: makeId(),
    assessmentId: oldToNewAssessment.get(item.assessmentId) || item.assessmentId,
    classId: newClassId,
    animalId: oldToNewAnimal.get(item.animalId) || item.animalId
  }));
  const entries = (backup.entries || []).map((entry) => ({
    ...entry,
    id: makeId(),
    classId: newClassId,
    tierID: oldToNewAnimal.get(entry.tierID) || entry.tierID
  }));

  return normalizeState({
    ...state,
    activeClassId: newClassId,
    classes: [...state.classes, importedClass],
    animals: [...state.animals, ...animals],
    materials: [...state.materials, ...materials],
    goals: [...state.goals, ...goals],
    assessments: [...(state.assessments || []), ...assessments],
    assessmentResults: [...(state.assessmentResults || []), ...assessmentResults],
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
      materials: backup.materials || [],
      entries: backup.entries || [],
      goals: backup.goals || [],
      assessments: backup.assessments || [],
      assessmentResults: backup.assessmentResults || [],
      sprachweltTasks: backup.sprachweltTasks || []
    });
  }
  if (backup?.classes || backup?.entries) return normalizeState(backup);
  throw new Error("Diese Datei ist kein gültiges Arbeitsheft-Kompass-Backup.");
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
    addedAssessmentResults: 0,
    skippedDuplicateAssessments: 0,
    skippedDuplicateAssessmentResults: 0,
    skippedDuplicateEntries: 0,
    conflicts: [],
    mergedAt: nowIso()
  };

  const classIds = new Set(current.classes.map((item) => item.id));
  const animalIds = new Set(current.animals.map((item) => item.id));
  const materialIds = new Set(current.materials.map((item) => item.id));
  const entryIds = new Set(current.entries.map((item) => item.id || item.entryId).filter(Boolean));
  const goalIds = new Set((current.goals || []).map((item) => item.id));
  const assessmentIds = new Set((current.assessments || []).map((item) => item.id));
  const assessmentResultIds = new Set((current.assessmentResults || []).map((item) => item.id));
  const existingEntryFingerprints = new Set(current.entries.map(entryFingerprint));
  const qrTokens = new Map(current.animals.filter((animal) => animal.qrToken).map((animal) => [animal.qrToken, animal.id]));

  const next = {
    ...current,
    classes: [...current.classes],
    animals: [...current.animals],
    materials: [...current.materials],
    entries: [...current.entries],
    goals: [...(current.goals || [])],
    assessments: [...(current.assessments || [])],
    assessmentResults: [...(current.assessmentResults || [])]
  };

  imported.classes.forEach((item) => {
    if (classIds.has(item.id)) return;
    next.classes.push(item);
    classIds.add(item.id);
    report.addedClasses += 1;
  });

  imported.animals.forEach((item) => {
    if (animalIds.has(item.id)) return;
    const animal = { ...item };
    if (!animal.qrToken) {
      animal.qrToken = makeQrToken(new Set(qrTokens.keys()));
      report.conflicts.push(`QR-Code für ${animal.tierEmoji || ""} ${animal.tierName || "Tier"} ergänzt.`);
    } else if (qrTokens.has(animal.qrToken)) {
      animal.qrToken = makeQrToken(new Set(qrTokens.keys()));
      report.conflicts.push(`Doppelter QR-Code bei ${animal.tierEmoji || ""} ${animal.tierName || "Tier"} neu erzeugt.`);
    }
    next.animals.push(animal);
    animalIds.add(animal.id);
    if (animal.qrToken) qrTokens.set(animal.qrToken, animal.id);
    report.addedAnimals += 1;
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

  (imported.assessmentResults || []).forEach((item) => {
    if (assessmentResultIds.has(item.id)) {
      report.skippedDuplicateAssessmentResults += 1;
      return;
    }
    next.assessmentResults.push(item);
    assessmentResultIds.add(item.id);
    report.addedAssessmentResults += 1;
  });

  return { state: normalizeState(next), report };
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
