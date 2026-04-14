// ── IndexedDB: folder handle ─────────────────────────────
const DB_NAME = 'simp_player';
const DB_VERSION = 1;
const STORE = 'kv';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbSet<T>(key: string, value: T): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

// ── localStorage: last track / position ─────────────────

const LS_INDEX = 'sp_last_index';
const LS_POSITION = 'sp_last_position';

export function lsSaveTrack(index: number, position: number): void {
  localStorage.setItem(LS_INDEX, String(index));
  localStorage.setItem(LS_POSITION, String(position));
}

export function lsLoadTrack(): { index: number; position: number } | null {
  const idx = localStorage.getItem(LS_INDEX);
  const pos = localStorage.getItem(LS_POSITION);
  if (idx === null) return null;
  return { index: parseInt(idx, 10), position: parseFloat(pos ?? '0') };
}
