class AppStorage {
  constructor() {
    this.dbName = "ArbeitsheftKompassDB";
    this.dbVersion = 1;
    this.storeName = "appState";
    this.dbPromise = null;
    this.usesIndexedDB = "indexedDB" in window;
    this.lastStorageType = this.usesIndexedDB ? "IndexedDB" : "localStorage";
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
    const nextState = normalizeState({ ...state, lastSavedAt: nowIso() });
    if (!this.usesIndexedDB) {
      this.saveToLocalStorage(nextState);
      return nextState;
    }

    try {
      const db = await this.openDB();
      await this.writeRecord(db, { id: STORE_KEY, value: nextState });
      this.saveToLocalStorage(nextState);
      this.lastStorageType = "IndexedDB";
      return nextState;
    } catch (error) {
      console.warn("IndexedDB konnte nicht speichern, nutze localStorage.", error);
      this.usesIndexedDB = false;
      this.lastStorageType = "localStorage";
      this.saveToLocalStorage(nextState);
      return nextState;
    }
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
      request.onerror = () => reject(request.error);
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
