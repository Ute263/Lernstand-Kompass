const APP_VERSION = 1;
const STORE_KEY = "arbeitsheftKompass_v1";
const LEGACY_STORE_KEYS = ["arbeitsheft-kompass-state-v2"];

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

function makeQrToken(usedTokens = new Set()) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const bytes = new Uint8Array(8);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (let index = 0; index < bytes.length; index += 1) {
        bytes[index] = Math.floor(Math.random() * 256);
      }
    }
    const token = `ak-${Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("")}`;
    if (!usedTokens.has(token)) return token;
  }
  return `ak-${Date.now().toString(36).toUpperCase()}`;
}

function nowIso() {
  return new Date().toISOString();
}

function emptyState() {
  return {
    version: APP_VERSION,
    setupComplete: false,
    pinHash: "",
    recoveryKeyHash: "",
    activeClassId: null,
    classes: [],
    animals: [],
    materials: [],
    entries: [],
    qrScannerEnabled: true,
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
  const usedTokens = new Set();
  return DEFAULT_ANIMALS.map(([tierName, tierEmoji]) => {
    const qrToken = makeQrToken(usedTokens);
    usedTokens.add(qrToken);
    return {
      id: makeId(),
      classId,
      tierName,
      tierEmoji,
      aktiv: true,
      qrToken
    };
  });
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

function createInitialState({ pinHash, recoveryKeyHash, className, description }) {
  const firstClass = createClassItem(className, description);
  return {
    version: APP_VERSION,
    setupComplete: true,
    pinHash,
    recoveryKeyHash,
    activeClassId: firstClass.id,
    classes: [firstClass],
    animals: createDefaultAnimals(firstClass.id),
    materials: createDefaultMaterials(firstClass.id),
    entries: [],
    qrScannerEnabled: true,
    lastSavedAt: null
  };
}

function normalizeState(candidate) {
  if (!candidate || typeof candidate !== "object") return emptyState();
  const state = {
    ...emptyState(),
    ...candidate,
    version: APP_VERSION,
    pinHash: candidate.pinHash || "",
    recoveryKeyHash: candidate.recoveryKeyHash || "",
    classes: Array.isArray(candidate.classes) ? candidate.classes : [],
    animals: Array.isArray(candidate.animals) ? candidate.animals : [],
    materials: Array.isArray(candidate.materials) ? candidate.materials : [],
    entries: Array.isArray(candidate.entries) ? candidate.entries : [],
    qrScannerEnabled: candidate.qrScannerEnabled !== false
  };

  const usedTokens = new Set();
  state.animals = state.animals.map((animal) => ({
    ...animal,
    qrToken: normalizeQrToken(animal.qrToken, usedTokens)
  }));

  if (!state.classes.some((item) => item.id === state.activeClassId)) {
    state.activeClassId = state.classes[0]?.id || null;
  }
  state.setupComplete = Boolean(state.setupComplete && state.activeClassId);
  return state;
}

function normalizeQrToken(token, usedTokens) {
  if (token && !usedTokens.has(token)) {
    usedTokens.add(token);
    return token;
  }
  const nextToken = makeQrToken(usedTokens);
  usedTokens.add(nextToken);
  return nextToken;
}

function makeRecoveryKey() {
  const words = ["HEFT", "KIND", "LERN", "TAFEL", "STIFT", "BUCH", "KLASSE", "KOMPASS"];
  const numberA = String(randomInt(1000, 9999));
  const numberB = String(randomInt(10, 99));
  return `AK-${numberA}-${words[randomInt(0, words.length - 1)]}-${numberB}`;
}

function randomInt(min, max) {
  const range = max - min + 1;
  const bytes = new Uint32Array(1);
  if (window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(bytes);
    return min + (bytes[0] % range);
  }
  return min + Math.floor(Math.random() * range);
}

function normalizeSecret(value) {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, "");
}

async function hashSecret(value, purpose = "pin") {
  const input = `arbeitsheft-kompass:${purpose}:${normalizeSecret(value)}`;
  if (window.crypto?.subtle) {
    const data = new TextEncoder().encode(input);
    const digest = await window.crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  return fallbackHash(input);
}

function fallbackHash(input) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fallback-${(hash >>> 0).toString(16)}`;
}
