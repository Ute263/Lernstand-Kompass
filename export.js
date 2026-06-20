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
    goals: state.goals.filter((item) => item.classId === classId)
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
  const header = ["Datum", "Uhrzeit", "Klasse", "Tier", "Fach", "Material", "Seite", "Status", "Erledigt"];
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
      entry.seite,
      entry.status,
      entry.erledigt ? "ja" : "nein"
    ]);
  return [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

function exportToExcelCsv(entries, filename) {
  const rows = [...entries].sort((a, b) => new Date(b.datumUhrzeit) - new Date(a.datumUhrzeit));
  if (!rows.length) return false;

  const header = ["Datum", "Uhrzeit", "Klasse", "Tier", "Fach", "Material", "Seite", "Status", "Erledigt"];
  const csvRows = rows.map((entry) => [
    formatGermanDate(entry.datumUhrzeit),
    formatExcelTime(entry.datumUhrzeit),
    entry.klasseName || getClassNameForEntry(entry),
    `${entry.tierEmojiSnapshot || ""} ${entry.tierNameSnapshot || ""}`.trim(),
    entry.fach || "",
    entry.materialName || "",
    entry.seite ?? "",
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

  addDashboardSheet(workbook, report);
  addOverviewSheet(workbook, report);
  addProgressSheet(workbook, report);
  addTrailSheet(workbook, report);
  addTodaySheet(workbook, report);
  addHelpSheet(workbook, report);
  addAllEntriesSheet(workbook, report);
  addPrintSheet(workbook, report);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  downloadBlob(blob, report.filename);
  return true;
}

const XLSX_COLORS = {
  aubergine: "FF4C2A57",
  aubergineLight: "FFE9DDF0",
  cream: "FFFFFBF2",
  softGray: "FFF6F7FA",
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

function addDashboardSheet(workbook, report) {
  const sheet = workbook.addWorksheet("Start Dashboard");
  setupSheet(sheet, { orientation: "portrait", widths: [20, 18, 18, 18, 18, 18, 24, 24] });
  addTitleBlock(sheet, "Arbeitsheft-Kompass", `Export für: ${report.scopeLabel}`, report.generatedAt, 8);

  addMetricTile(sheet, "A5:B8", "Tiere mit Eintrag", report.stats.animalsWithEntry, XLSX_COLORS.deutsch);
  addMetricTile(sheet, "C5:D8", "Einträge heute", report.stats.todayCount, XLSX_COLORS.mathe);
  addMetricTile(sheet, "E5:F8", "Offene Hilfe", report.stats.openHelp, XLSX_COLORS.help);
  addMetricTile(sheet, "G5:H8", "Offene Kontrolle", report.stats.openCheck, XLSX_COLORS.check);
  addMetricTile(sheet, "A10:B13", "Länger kein Eintrag", report.stats.staleAnimals, XLSX_COLORS.stale);

  sheet.mergeCells("A15:H15");
  const overviewTitle = sheet.getCell("A15");
  overviewTitle.value = "Kurzer Überblick";
  overviewTitle.font = { bold: true, size: 16, color: { argb: XLSX_COLORS.aubergine } };

  addTable(sheet, 17, ["Bereich", "Wert", "Hinweis"], [
    ["Letzter Eintrag", report.stats.latestEntry, "neueste gespeicherte Meldung"],
    ["Meistbearbeitetes Material", report.stats.mostMaterial, "nach Anzahl der Einträge"],
    ["Anzahl Klassen", report.stats.classCount, "im Export enthalten"],
    ["Anzahl Materialien", report.stats.materialCount, "im Export enthalten"],
    ["Anzahl offener Aufgaben", report.stats.openTasks, "Hilfe oder Kontrolle offen"]
  ], { headerFill: XLSX_COLORS.aubergineLight, widths: [28, 34, 38], autofilter: false });

  sheet.mergeCells("A25:H26");
  const note = sheet.getCell("A25");
  note.value = "Diese Datei enthält keine Kindernamen. Die Arbeitsstände werden über Tier-Pseudonyme dargestellt.";
  note.fill = solidFill(XLSX_COLORS.cream);
  note.font = { bold: true, color: { argb: XLSX_COLORS.text } };
  note.alignment = { vertical: "middle", wrapText: true };
  applyBorderToRange(sheet, "A25:H26");
}

function addOverviewSheet(workbook, report) {
  const sheet = workbook.addWorksheet("Übersicht");
  setupSheet(sheet, { orientation: "landscape", widths: [18, 18, 24, 24, 18, 22, 28] });
  addTitleBlock(sheet, "Aktueller Arbeitsstand", `Export für: ${report.scopeLabel}`, report.generatedAt, 7);
  addTable(sheet, 5, ["Tier", "Klasse", "Deutsch letzter Stand", "Mathe letzter Stand", "Letzte Aktivität", "Offener Status", "Hinweis"],
    report.overviewRows.map((row) => [
      `${row.animal.tierEmoji} ${row.animal.tierName}`, row.klasse, row.deutsch, row.mathe, row.latestActivity, row.status, row.hint
    ]),
    { statusColumn: 6, hintColumn: 7 });
}

function addProgressSheet(workbook, report) {
  const sheet = workbook.addWorksheet("Fortschritt");
  setupSheet(sheet, { orientation: "landscape", widths: [18, 18, 14, 24, 16, 16, 18, 18, 16, 18, 14, 16, 18, 28] });
  addTitleBlock(sheet, "Fortschritt und Arbeitstempo", `Export für: ${report.scopeLabel}`, report.generatedAt, 14);
  addTable(sheet, 5, [
    "Tier", "Klasse", "Fach", "Material", "Erste Seite im Zeitraum", "Letzte Seite im Zeitraum", "Fortschritt in Seiten",
    "Letzte Aktivität", "Gruppenschnitt", "Abstand zur Gruppe", "Soll-Seite", "Abstand zum Soll", "Status", "Pädagogischer Hinweis"
  ], report.progressRows.map((row) => [
    `${row.animal.tierEmoji} ${row.animal.tierName}`,
    getClassNameById(row.classId),
    row.fach,
    row.material,
    row.firstEntry ? `S. ${row.firstEntry.seite}` : "kein Eintrag",
    row.lastEntry ? `S. ${row.lastEntry.seite}` : "kein Eintrag",
    row.entryCount > 1 ? `${row.progressPages} ${progressBar(row.progressPages)}` : row.entryCount === 1 ? "nur ein Eintrag" : "kein Eintrag",
    row.lastActivity ? relativeActivity(row.lastActivity) : "kein Eintrag",
    row.groupAverage == null ? "–" : row.groupAverage.toFixed(1).replace(".", ","),
    row.groupDistance == null ? "–" : signedNumber(row.groupDistance),
    row.goal ? `S. ${row.goal.sollSeite}` : "kein Soll festgelegt",
    row.goalDistance == null ? "–" : signedNumber(row.goalDistance),
    row.openEntry ? row.openEntry.status : row.lastEntry?.status || "–",
    row.hints.join(", ")
  ]), { statusColumn: 13, hintColumn: 14, groupDistanceColumn: 10, goalDistanceColumn: 12 });
}

function addTrailSheet(workbook, report) {
  const sheet = workbook.addWorksheet("Tier-Verläufe");
  setupSheet(sheet, { orientation: "landscape", widths: [18, 18, 14, 10, 14, 24, 10, 20, 12] });
  addTitleBlock(sheet, "Chronologische Verläufe je Tier", `Export für: ${report.scopeLabel}`, report.generatedAt, 9);
  addTable(sheet, 5, ["Klasse", "Tier", "Datum", "Uhrzeit", "Fach", "Material", "Seite", "Status", "Erledigt"],
    report.trailEntries.map((entry) => [entry.klasseName, entry.tierLabel, formatGermanDate(entry.datumUhrzeit), formatExcelTime(entry.datumUhrzeit), entry.fach, entry.materialName, entry.seite, entry.status, entry.erledigt ? "Ja" : "Nein"]),
    { statusColumn: 8, groupColumn: 2 });
}

function addTodaySheet(workbook, report) {
  const sheet = workbook.addWorksheet("Heute");
  setupSheet(sheet, { orientation: "portrait", widths: [10, 18, 18, 14, 24, 10, 20, 12] });
  addTitleBlock(sheet, "Heute bearbeitet", `Export für: ${report.scopeLabel}`, report.generatedAt, 8);
  if (!report.todayEntries.length) {
    addEmptyMessage(sheet, "A5:H8", "Heute wurden noch keine Arbeitsstände eingetragen.");
    return;
  }
  addTable(sheet, 5, ["Uhrzeit", "Klasse", "Tier", "Fach", "Material", "Seite", "Status", "Erledigt"],
    report.todayEntries.map((entry) => [formatExcelTime(entry.datumUhrzeit), entry.klasseName, entry.tierLabel, entry.fach, entry.materialName, entry.seite, entry.status, entry.erledigt ? "Ja" : "Nein"]),
    { statusColumn: 7 });
}

function addHelpSheet(workbook, report) {
  const sheet = workbook.addWorksheet("Hilfe & Kontrolle");
  setupSheet(sheet, { orientation: "portrait", widths: [14, 10, 18, 18, 14, 24, 10, 20, 28] });
  addTitleBlock(sheet, "Offene Hilfe und Kontrolle", `Export für: ${report.scopeLabel}`, report.generatedAt, 9);
  if (!report.helpEntries.length) {
    addEmptyMessage(sheet, "A5:I8", "Keine offenen Hilfe- oder Kontrollwünsche.");
    return;
  }
  addTable(sheet, 5, ["Datum", "Uhrzeit", "Klasse", "Tier", "Fach", "Material", "Seite", "Status", "Hinweis"],
    report.helpEntries.map((entry) => [
      formatGermanDate(entry.datumUhrzeit), formatExcelTime(entry.datumUhrzeit), entry.klasseName, entry.tierLabel,
      entry.fach, entry.materialName, entry.seite, entry.status, entry.status === "brauche Hilfe" ? "Hilfewunsch offen" : "Kontrolle offen"
    ]),
    { statusColumn: 8, hintColumn: 9 });
}

function addAllEntriesSheet(workbook, report) {
  const sheet = workbook.addWorksheet("Alle Einträge");
  setupSheet(sheet, { orientation: "landscape", widths: [14, 10, 18, 18, 14, 24, 10, 20, 12] });
  addTitleBlock(sheet, "Alle Arbeitsstand-Einträge", `Export für: ${report.scopeLabel}`, report.generatedAt, 9);
  addTable(sheet, 5, ["Datum", "Uhrzeit", "Klasse", "Tier", "Fach", "Material", "Seite", "Status", "Erledigt"],
    report.allEntries.map((entry) => [formatGermanDate(entry.datumUhrzeit), formatExcelTime(entry.datumUhrzeit), entry.klasseName, entry.tierLabel, entry.fach, entry.materialName, entry.seite, entry.status, entry.erledigt ? "Ja" : "Nein"]),
    { statusColumn: 8 });
}

function addPrintSheet(workbook, report) {
  const sheet = workbook.addWorksheet("Druckliste");
  setupSheet(sheet, { orientation: "landscape", widths: [18, 28, 28, 18, 22, 34] });
  addTitleBlock(sheet, "Arbeitsheft-Kompass – Druckübersicht", `Export für: ${report.scopeLabel}`, report.generatedAt, 6);
  addTable(sheet, 5, ["Tier", "Deutsch", "Mathe", "Letzte Aktivität", "Offen", "Notizfeld leer"],
    report.printRows.map((row) => [row.tier, row.deutsch, row.mathe, row.latestActivity, row.open, row.note]),
    { statusColumn: 5, rowHeight: 34 });
}

function setupSheet(sheet, { orientation, widths }) {
  sheet.properties.defaultRowHeight = 22;
  sheet.views = [{ state: "frozen", ySplit: 5 }];
  sheet.pageSetup = {
    orientation,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.35, right: 0.35, top: 0.45, bottom: 0.45, header: 0.2, footer: 0.2 }
  };
  sheet.columns = widths.map((width) => ({ width }));
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

function addMetricTile(sheet, range, label, value, fillColor) {
  sheet.mergeCells(range);
  const cell = sheet.getCell(range.split(":")[0]);
  cell.value = `${label}\n${value}`;
  cell.fill = solidFill(fillColor);
  cell.font = { bold: true, size: 15, color: { argb: XLSX_COLORS.text } };
  cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  applyBorderToRange(sheet, range);
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

function exportProgressWorkbook({ progressRows, trailEntries, filename, entryRows = [] }) {
  if (!progressRows.length && !trailEntries.length && !entryRows.length) return false;
  const workbook = [
    '<?xml version="1.0"?>',
    '<?mso-application progid="Excel.Sheet"?>',
    '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">',
    '<Styles>',
    '<Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Top"/><Font ss:FontName="Arial" ss:Size="11"/></Style>',
    '<Style ss:ID="Header"><Font ss:Bold="1"/><Interior ss:Color="#DFF3FF" ss:Pattern="Solid"/></Style>',
    '<Style ss:ID="Done"><Interior ss:Color="#DFF6E8" ss:Pattern="Solid"/></Style>',
    '<Style ss:ID="Help"><Interior ss:Color="#FFF1CB" ss:Pattern="Solid"/></Style>',
    '<Style ss:ID="Check"><Interior ss:Color="#DDEAFF" ss:Pattern="Solid"/></Style>',
    '<Style ss:ID="Hint"><Interior ss:Color="#F8E4E4" ss:Pattern="Solid"/></Style>',
    '<Style ss:ID="Ahead"><Interior ss:Color="#EAF5FF" ss:Pattern="Solid"/></Style>',
    '</Styles>',
    excelSheet("Arbeitsstände", makeEntrySheetRows(entryRows), ["Datum", "Uhrzeit", "Klasse", "Tier", "Fach", "Material", "Seite", "Status", "Erledigt"]),
    excelSheet("Fortschritt", makeProgressSheetRows(progressRows), [
      "Klasse", "Tier", "Fach", "Material", "erster Eintrag im Zeitraum", "letzter Eintrag im Zeitraum", "niedrigste Seite", "höchste Seite",
      "Fortschritt in Seiten", "letzte Aktivität", "Gruppenschnitt", "Abstand zur Gruppe", "Soll-Seite", "Abstand zum Soll", "offener Status", "Hinweis"
    ]),
    excelSheet("Tier-Verläufe", makeTrailSheetRows(trailEntries), ["Klasse", "Tier", "Datum", "Uhrzeit", "Fach", "Material", "Seite", "Status", "Erledigt"]),
    "</Workbook>"
  ].join("");
  const blob = new Blob([workbook], { type: "application/vnd.ms-excel;charset=utf-8" });
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

function makeEntrySheetRows(entries) {
  return entries.map((entry) => ({
    cells: [
      formatGermanDate(entry.datumUhrzeit),
      formatExcelTime(entry.datumUhrzeit),
      entry.klasseName || getClassNameForEntry(entry),
      `${entry.tierEmojiSnapshot || ""} ${entry.tierNameSnapshot || ""}`.trim(),
      entry.fach || "",
      entry.materialName || "",
      entry.seite ?? "",
      entry.status || "",
      entry.erledigt ? "Ja" : "Nein"
    ],
    style: statusStyle(entry.status)
  }));
}

function makeProgressSheetRows(rows) {
  return rows.map((row) => ({
    cells: [
      getClassNameById(row.classId),
      `${row.animal.tierEmoji} ${row.animal.tierName}`,
      row.fach,
      row.material,
      row.firstEntry ? `S. ${row.firstEntry.seite} (${formatGermanDate(row.firstEntry.datumUhrzeit)} ${formatExcelTime(row.firstEntry.datumUhrzeit)})` : "kein Eintrag",
      row.lastEntry ? `S. ${row.lastEntry.seite} (${formatGermanDate(row.lastEntry.datumUhrzeit)} ${formatExcelTime(row.lastEntry.datumUhrzeit)})` : "kein Eintrag",
      row.minPage ?? "",
      row.maxPage ?? "",
      row.entryCount > 1 ? row.progressPages : row.entryCount === 1 ? "nur ein Eintrag" : "",
      row.lastActivity ? relativeActivity(row.lastActivity) : "kein Eintrag",
      row.groupAverage == null ? "" : row.groupAverage.toFixed(1).replace(".", ","),
      row.groupDistance == null ? "" : signedNumber(row.groupDistance),
      row.goal ? row.goal.sollSeite : "",
      row.goalDistance == null ? "" : signedNumber(row.goalDistance),
      row.openEntry ? row.openEntry.status : row.lastEntry?.status || "",
      row.hints.join(", ")
    ],
    style: row.hints.some((hint) => hint.includes("Unterstützung") || hint.includes("offen") || hint.includes("Blick")) ? "Hint" : row.hints.some((hint) => hint.includes("Zusatz")) ? "Ahead" : statusStyle(row.openEntry?.status || row.lastEntry?.status)
  }));
}

function makeTrailSheetRows(entries) {
  return entries.map((entry) => ({
    cells: [
      entry.klasseName || getClassNameForEntry(entry),
      `${entry.tierEmojiSnapshot || ""} ${entry.tierNameSnapshot || ""}`.trim(),
      formatGermanDate(entry.datumUhrzeit),
      formatExcelTime(entry.datumUhrzeit),
      entry.fach || "",
      entry.materialName || "",
      entry.seite ?? "",
      entry.status || "",
      entry.erledigt ? "Ja" : "Nein"
    ],
    style: statusStyle(entry.status)
  }));
}

function excelSheet(name, rows, headers) {
  const allRows = [
    `<Row>${headers.map((header) => excelCell(header, "Header")).join("")}</Row>`,
    ...(rows.length ? rows : [{ cells: ["Keine Einträge"], style: "" }]).map((row) => `<Row>${row.cells.map((cell) => excelCell(cell, row.style)).join("")}</Row>`)
  ];
  const columns = headers.map(() => '<Column ss:AutoFitWidth="1" ss:Width="130"/>').join("");
  return `
    <Worksheet ss:Name="${xmlEscape(name)}">
      <Table>${columns}${allRows.join("")}</Table>
      <AutoFilter x:Range="R1C1:R${Math.max(2, rows.length + 1)}C${headers.length}" xmlns="urn:schemas-microsoft-com:office:excel"/>
      <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><FreezePanes/><FrozenNoSplit/><SplitHorizontal>1</SplitHorizontal><TopRowBottomPane>1</TopRowBottomPane><ActivePane>2</ActivePane></WorksheetOptions>
    </Worksheet>
  `;
}

function excelCell(value, style = "") {
  const styleAttribute = style ? ` ss:StyleID="${style}"` : "";
  return `<Cell${styleAttribute}><Data ss:Type="String">${xmlEscape(value)}</Data></Cell>`;
}

function statusStyle(status) {
  if (status === "brauche Hilfe") return "Help";
  if (status === "bitte kontrollieren") return "Check";
  if (status === "fertig") return "Done";
  return "";
}

function signedNumber(value) {
  const rounded = Math.round(value * 10) / 10;
  return rounded > 0 ? `+${String(rounded).replace(".", ",")}` : String(rounded).replace(".", ",");
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
    entries: [...state.entries, ...entries]
  });
}

function restoreFullBackup(backup) {
  if (backup?.type !== "full-backup" || !backup.state) {
    throw new Error("Diese Datei ist kein Gesamtbackup.");
  }
  return normalizeState(backup.state);
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

function xmlEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
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
