const APP_VERSION = 2;
const STORE_KEY = "arbeitsheft-kompass-state-v2";

const SUBJECTS = ["Deutsch", "Mathe"];
const STATUSES = ["fertig", "brauche Hilfe", "bitte kontrollieren"];

const STATUS_META = {
  fertig: { label: "fertig", childLabel: "fertig", icon: "✅", className: "done" },
  "brauche Hilfe": { label: "brauche Hilfe", childLabel: "ich brauche Hilfe", icon: "🟡", className: "help" },
  "bitte kontrollieren": { label: "bitte kontrollieren", childLabel: "bitte kontrollieren", icon: "🔵", className: "check" }
};

const DEFAULT_ANIMALS = [
  ["Fuchs", "🦊"], ["Schildkröte", "🐢"], ["Eule", "🦉"], ["Frosch", "🐸"], ["Bär", "🐻"],
  ["Igel", "🦔"], ["Hase", "🐰"], ["Pinguin", "🐧"], ["Tiger", "🐯"], ["Löwe", "🦁"],
  ["Koala", "🐨"], ["Panda", "🐼"], ["Affe", "🐵"], ["Schmetterling", "🦋"], ["Marienkäfer", "🐞"],
  ["Delfin", "🐬"], ["Wal", "🐳"], ["Giraffe", "🦒"], ["Zebra", "🦓"], ["Elefant", "🐘"],
  ["Eichhörnchen", "🐿️"], ["Waschbär", "🦝"], ["Faultier", "🦥"], ["Flamingo", "🦩"], ["Robbe", "🦭"],
  ["Krake", "🐙"], ["Krebs", "🦀"], ["Fisch", "🐠"], ["Ente", "🦆"], ["Adler", "🦅"]
];

const DEFAULT_MATERIALS = [
  ["Deutsch", "Arbeitsheft Blau"],
  ["Deutsch", "Arbeitsheft Rot"],
  ["Deutsch", "Schreibheft"],
  ["Deutsch", "Lesebuch"],
  ["Deutsch", "Zusatzaufgabe"],
  ["Mathe", "Arbeitsheft"],
  ["Mathe", "Buch"],
  ["Mathe", "Rechenheft"],
  ["Mathe", "Zusatzaufgabe"]
];

function makeId() {
  if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function makeQrToken() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(8);
  if (window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  return `ak-${Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("")}`;
}

function nowIso() {
  return new Date().toISOString();
}

function emptyState() {
  return {
    version: APP_VERSION,
    setupComplete: false,
    pin: "",
    activeClassId: null,
    classes: [],
    animals: [],
    materials: [],
    entries: [],
    lastSavedAt: null
  };
}

function createClassItem(name, beschreibung = "") {
  return {
    id: makeId(),
    name: name.trim(),
    beschreibung: beschreibung.trim(),
    erstelltAm: nowIso(),
    aktiv: true
  };
}

function createDefaultAnimals(classId) {
  return DEFAULT_ANIMALS.map(([tierName, tierEmoji]) => ({
    id: makeId(),
    classId,
    tierName,
    tierEmoji,
    aktiv: true,
    qrToken: makeQrToken()
  }));
}

function createDefaultMaterials(classId) {
  return DEFAULT_MATERIALS.map(([fach, materialName]) => ({
    id: makeId(),
    classId,
    fach,
    materialName,
    aktiv: true
  }));
}

function createInitialState({ pin, className, description }) {
  const firstClass = createClassItem(className, description);
  return {
    version: APP_VERSION,
    setupComplete: true,
    pin,
    activeClassId: firstClass.id,
    classes: [firstClass],
    animals: createDefaultAnimals(firstClass.id),
    materials: createDefaultMaterials(firstClass.id),
    entries: [],
    lastSavedAt: null
  };
}

function normalizeState(candidate) {
  if (!candidate || typeof candidate !== "object") return emptyState();
  const state = {
    ...emptyState(),
    ...candidate,
    version: APP_VERSION,
    classes: Array.isArray(candidate.classes) ? candidate.classes : [],
    animals: Array.isArray(candidate.animals) ? candidate.animals : [],
    materials: Array.isArray(candidate.materials) ? candidate.materials : [],
    entries: Array.isArray(candidate.entries) ? candidate.entries : []
  };

  state.animals = state.animals.map((animal) => ({
    ...animal,
    qrToken: animal.qrToken || makeQrToken()
  }));

  if (!state.classes.some((item) => item.id === state.activeClassId)) {
    state.activeClassId = state.classes[0]?.id || null;
  }
  state.setupComplete = Boolean(state.setupComplete && state.activeClassId);
  return state;
}
