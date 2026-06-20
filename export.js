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
    entries: state.entries.filter((item) => item.classId === classId)
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
