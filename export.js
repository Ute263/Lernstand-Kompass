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
