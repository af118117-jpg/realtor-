/**
 * Admin Panel — IndexedDB wrapper for binary media (images/videos/documents).
 * ------------------------------------------------------------------------
 * Binary files are kept out of localStorage (small quota, synchronous API —
 * unsuitable for photos/video) and out of the public site entirely. This
 * store is admin-only, local to this browser, per docs/DATA_MODEL.md's
 * existing localStorage-only pattern for non-personal client-side state.
 */

const AdminDB = (function () {
  "use strict";

  let dbPromise = null;

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(ADMIN_CONFIG.db.name, ADMIN_CONFIG.db.version);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(ADMIN_CONFIG.db.store)) {
          const store = db.createObjectStore(ADMIN_CONFIG.db.store, { keyPath: "id" });
          store.createIndex("propertyId", "propertyId", { unique: false });
          store.createIndex("kind", "kind", { unique: false });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  function tx(mode) {
    return open().then((db) => db.transaction(ADMIN_CONFIG.db.store, mode).objectStore(ADMIN_CONFIG.db.store));
  }

  function genId() {
    return "media-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 9);
  }

  /**
   * Saves a File/Blob. record = { kind: 'image'|'video'|'document', name, mimeType,
   * size, blob, propertyId, isPrivate }. Returns the generated media id.
   */
  async function put(record) {
    const store = await tx("readwrite");
    const id = record.id || genId();
    return new Promise((resolve, reject) => {
      const req = store.put({ ...record, id, createdAt: record.createdAt || new Date().toISOString() });
      req.onsuccess = () => resolve(id);
      req.onerror = () => reject(req.error);
    });
  }

  async function get(id) {
    const store = await tx("readonly");
    return new Promise((resolve, reject) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async function remove(id) {
    const store = await tx("readwrite");
    return new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async function all() {
    const store = await tx("readonly");
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  // In-memory cache of created object URLs so we revoke rather than leak them.
  const urlCache = new Map();
  function objectUrlFor(mediaRecord) {
    if (!mediaRecord || !mediaRecord.blob) return null;
    if (urlCache.has(mediaRecord.id)) return urlCache.get(mediaRecord.id);
    const url = URL.createObjectURL(mediaRecord.blob);
    urlCache.set(mediaRecord.id, url);
    return url;
  }

  return { put, get, remove, all, objectUrlFor };
})();
