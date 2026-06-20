class AppStorage {
  constructor() {
    this.dbName = "ArbeitsheftKompassDB";
    this.dbVersion = 1;
    this.storeName = "appState";
    this.dbPromise = null;
    this.usesIndexedDB = "indexedDB" in window;
  }

  async load() {
    if (!this.usesIndexedDB) return this.loadFromLocalStorage();
    try {
      const db = await this.openDB();
      const saved = await this.readRecord(db, STORE_KEY);
      return normalizeState(saved?.value || this.loadFromLocalStorage());
    } catch (error) {
      console.warn("IndexedDB konnte nicht geladen werden, nutze localStorage.", error);
      this.usesIndexedDB = false;
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
      return nextState;
    } catch (error) {
      console.warn("IndexedDB konnte nicht speichern, nutze localStorage.", error);
      this.usesIndexedDB = false;
      this.saveToLocalStorage(nextState);
      return nextState;
    }
  }

  loadFromLocalStorage() {
    try {
      return normalizeState(JSON.parse(localStorage.getItem(STORE_KEY)));
    } catch {
      return emptyState();
    }
  }

  saveToLocalStorage(state) {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
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

  writeRecord(db, record) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, "readwrite");
      transaction.objectStore(this.storeName).put(record);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}
