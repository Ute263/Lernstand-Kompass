class AppStorage {
  constructor() {
    this.dbName = "ArbeitsheftKompassDB";
    this.dbVersion = 1;
    this.storeName = "appState";
    this.dbPromise = null;
    this.usesIndexedDB = "indexedDB" in window;
    this.lastStorageType = this.usesIndexedDB ? "IndexedDB" : "localStorage";
    this.localMirrorTimer = null;
    this.pendingLocalMirror = null;
    this.localMirrorDelay = 1200;
    this.installMirrorFlushHooks();
  }

  async load() {
    if (!this.usesIndexedDB) return this.loadFromLocalStorage();
    try {
      const db = await this.openDB();
      const saved = await this.readFirstRecord(db, [STORE_KEY, ...LEGACY_STORE_KEYS]);
      this.lastStorageType = "IndexedDB";
      return normalizeState(saved?.value || this.loadFromLocalStorage());
    } catch (error) {
      console.warn("IndexedDB konnte nicht geladen werden, nutze localStorage.", error);
      this.usesIndexedDB = false;
      this.lastStorageType = "localStorage";
      return this.loadFromLocalStorage();
    }
  }

  async save(state) {
    const savedAt = nowIso();
    const nextState = normalizeState({ ...state, dataVersion: DATA_VERSION, savedAt, lastSavedAt: savedAt });
    if (!this.usesIndexedDB) {
      this.saveToLocalStorage(nextState);
      return nextState;
    }

    try {
      const db = await this.openDB();
      await this.writeRecord(db, { id: STORE_KEY, value: nextState });
      // IndexedDB ist der primaere Speicher. Die zusaetzliche localStorage-Kopie
      // wird zeitversetzt geschrieben, damit kleine Eingaben nicht zweimal den
      // kompletten Datenbestand synchron serialisieren muessen.
      this.scheduleLocalMirror(nextState);
      this.lastStorageType = "IndexedDB";
      return nextState;
    } catch (error) {
      console.warn("IndexedDB konnte nicht speichern, nutze localStorage.", error);
      // Nur nach erfolgreichem Ersatz-Speichern darf die App einen Erfolg melden.
      // Bei vollem localStorage IndexedDB für den nächsten Versuch nicht dauerhaft abschalten.
      try {
        this.saveToLocalStorage(nextState);
      } catch (fallbackError) {
        const failure = new Error("Weder IndexedDB noch localStorage konnten die Daten sichern (Gerätespeicher prüfen).");
        failure.cause = fallbackError;
        throw failure;
      }
      this.usesIndexedDB = false;
      this.lastStorageType = "localStorage";
      return nextState;
    }
  }

  scheduleLocalMirror(state) {
    this.pendingLocalMirror = state;
    if (this.localMirrorTimer) clearTimeout(this.localMirrorTimer);
    this.localMirrorTimer = setTimeout(() => this.flushLocalMirror(), this.localMirrorDelay);
  }

  flushLocalMirror() {
    if (this.localMirrorTimer) {
      clearTimeout(this.localMirrorTimer);
      this.localMirrorTimer = null;
    }
    if (!this.pendingLocalMirror) return;
    const snapshot = this.pendingLocalMirror;
    this.pendingLocalMirror = null;
    try { this.saveToLocalStorage(snapshot); } catch (error) {
      console.warn("Lokale Sicherungskopie konnte nicht geschrieben werden.", error);
    }
  }

  installMirrorFlushHooks() {
    if (typeof window === "undefined") return;
    window.addEventListener("pagehide", () => this.flushLocalMirror());
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") this.flushLocalMirror();
    });
  }

  loadFromLocalStorage() {
    try {
      this.lastStorageType = "localStorage";
      const raw = localStorage.getItem(STORE_KEY) || LEGACY_STORE_KEYS.map((key) => localStorage.getItem(key)).find(Boolean);
      return normalizeState(JSON.parse(raw));
    } catch {
      return emptyState();
    }
  }

  saveToLocalStorage(state) {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  }

  async clear() {
    if (this.localMirrorTimer) clearTimeout(this.localMirrorTimer);
    this.localMirrorTimer = null;
    this.pendingLocalMirror = null;
    localStorage.removeItem(STORE_KEY);
    LEGACY_STORE_KEYS.forEach((key) => localStorage.removeItem(key));
    if (!this.usesIndexedDB) return;
    try {
      const db = await this.openDB();
      await Promise.all([STORE_KEY, ...LEGACY_STORE_KEYS].map((key) => this.deleteRecord(db, key)));
    } catch (error) {
      console.warn("Lokale Daten konnten nicht vollständig gelöscht werden.", error);
    }
  }

  getStorageType() {
    return this.lastStorageType;
  }

  openDB() {
    if (this.dbPromise) return this.dbPromise;
    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: "id" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        this.dbPromise = null;
        reject(request.error);
      };
    });
    return this.dbPromise;
  }

  readRecord(db, id) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, "readonly");
      const request = transaction.objectStore(this.storeName).get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async readFirstRecord(db, ids) {
    for (const id of ids) {
      const record = await this.readRecord(db, id);
      if (record) return record;
    }
    return null;
  }

  writeRecord(db, record) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, "readwrite");
      transaction.objectStore(this.storeName).put(record);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  deleteRecord(db, id) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, "readwrite");
      transaction.objectStore(this.storeName).delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}
