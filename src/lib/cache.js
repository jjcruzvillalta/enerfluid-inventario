const CACHE_DB_NAME = "enerfluid-cache";
const CACHE_STORE = "datasets";
const CACHE_KEY = "all";
const CACHE_VERSION = 2;

const openCacheDb = () => {
  if (!("indexedDB" in window)) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CACHE_DB_NAME, CACHE_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(CACHE_STORE)) {
        db.createObjectStore(CACHE_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const cacheGet = async (key) => {
  const db = await openCacheDb();
  if (!db) return null;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CACHE_STORE, "readonly");
    const store = tx.objectStore(CACHE_STORE);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
};

const cacheSet = async (key, value) => {
  const db = await openCacheDb();
  if (!db) return;
  await new Promise((resolve, reject) => {
    const tx = db.transaction(CACHE_STORE, "readwrite");
    const store = tx.objectStore(CACHE_STORE);
    store.put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const readCachePayload = async () => {
  try {
    const payload = await cacheGet(CACHE_KEY);
    if (!payload || payload.version !== CACHE_VERSION) return null;
    return payload;
  } catch (error) {
    console.warn("cache read", error);
    return null;
  }
};

export const writeCachePayload = async (payload) => {
  try {
    await cacheSet(CACHE_KEY, { ...payload, version: CACHE_VERSION, cachedAt: new Date().toISOString() });
  } catch (error) {
    console.warn("cache write", error);
  }
};

const getLatestLogMap = (logs) => {
  const latest = new Map();
  (logs || []).forEach((row) => {
    if (!latest.has(row.type)) latest.set(row.type, row);
  });
  return latest;
};

export const hasNewerLogs = (cachedLogs, liveLogs) => {
  if (!liveLogs || !liveLogs.length) return false;
  if (!cachedLogs || !cachedLogs.length) return true;
  const cachedMap = getLatestLogMap(cachedLogs);
  const liveMap = getLatestLogMap(liveLogs);
  const types = ["movimientos", "ventas", "items", "catalogo"];
  return types.some((type) => {
    const cached = cachedMap.get(type)?.uploaded_at;
    const live = liveMap.get(type)?.uploaded_at;
    if (!live) return false;
    if (!cached) return true;
    return new Date(live).getTime() > new Date(cached).getTime();
  });
};
