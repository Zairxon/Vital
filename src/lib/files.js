import { newId } from './ids.js';
import { isNative, FILES_DIR, ROOT_DIR } from './platform.js';

/**
 * Байты документов. На телефоне — приватная папка приложения, в браузере —
 * IndexedDB. Наружу оба варианта выглядят одинаково, поэтому интерфейс
 * разрабатывается и проверяется без телефона.
 */

const DB_NAME = 'vital-files';
const STORE = 'blobs';
let webDbPromise = null;
const urlCache = new Map();

// ── Браузер: IndexedDB ────────────────────────────────────────────────

function webDb() {
  if (!webDbPromise) {
    webDbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return webDbPromise;
}

async function webTx(mode, run) {
  const db = await webDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = run(tx.objectStore(STORE));
    tx.onerror = () => reject(tx.error);
    if (req) {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } else {
      tx.oncomplete = () => resolve();
    }
  });
}

// ── Телефон: Filesystem ───────────────────────────────────────────────

async function fs() {
  const { Filesystem, Directory } = await import('@capacitor/filesystem');
  return { Filesystem, Directory };
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64, mime) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return new Blob([bytes], { type: mime });
}

// ── Общий интерфейс ───────────────────────────────────────────────────

/** Расширение по mime-типу — файл на диске должен открываться и снаружи. */
export function extFor(mime, fallbackName = '') {
  const map = {
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  };
  if (map[mime]) return map[mime];
  const fromName = fallbackName.split('.').pop();
  return fromName && fromName.length <= 5 ? fromName.toLowerCase() : 'bin';
}

export async function saveBlob(blob, ext = 'jpg') {
  const fileId = `${newId('f')}.${ext}`;

  if (!isNative()) {
    await webTx('readwrite', (store) => store.put({ blob, size: blob.size, type: blob.type }, fileId));
    return fileId;
  }

  const { Filesystem, Directory } = await fs();
  await Filesystem.mkdir({ path: FILES_DIR, directory: Directory.Data, recursive: true }).catch(() => {});
  await Filesystem.writeFile({
    path: `${FILES_DIR}/${fileId}`,
    directory: Directory.Data,
    data: await blobToBase64(blob),
  });
  return fileId;
}

export async function readBlob(fileId) {
  if (!isNative()) {
    const rec = await webTx('readonly', (store) => store.get(fileId));
    if (!rec) throw new Error('Файл не найден');
    return rec.blob;
  }

  const { Filesystem, Directory } = await fs();
  const res = await Filesystem.readFile({ path: `${FILES_DIR}/${fileId}`, directory: Directory.Data });
  return base64ToBlob(res.data, mimeFor(fileId));
}

function mimeFor(fileId) {
  const ext = fileId.split('.').pop().toLowerCase();
  const map = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic',
    pdf: 'application/pdf', doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  return map[ext] || 'application/octet-stream';
}

/** Адрес для <img src>. Бросает исключение, если файла нет. */
export async function getDisplayUrl(fileId) {
  if (urlCache.has(fileId)) return urlCache.get(fileId);

  let url;
  if (!isNative()) {
    url = URL.createObjectURL(await readBlob(fileId));
  } else {
    const { Filesystem, Directory } = await fs();
    const { uri } = await Filesystem.getUri({ path: `${FILES_DIR}/${fileId}`, directory: Directory.Data });
    url = globalThis.Capacitor.convertFileSrc(uri);
  }
  urlCache.set(fileId, url);
  return url;
}

/** Отсутствие файла не считается ошибкой — удаление должно быть идемпотентным. */
export async function deleteBlob(fileId) {
  if (!fileId) return;
  const cached = urlCache.get(fileId);
  if (cached && cached.startsWith('blob:')) URL.revokeObjectURL(cached);
  urlCache.delete(fileId);

  try {
    if (!isNative()) {
      await webTx('readwrite', (store) => store.delete(fileId));
      return;
    }
    const { Filesystem, Directory } = await fs();
    await Filesystem.deleteFile({ path: `${FILES_DIR}/${fileId}`, directory: Directory.Data });
  } catch {
    /* файла уже нет — это не ошибка */
  }
}

export async function deleteBlobs(fileIds = []) {
  for (const id of fileIds) await deleteBlob(id);
}

/** Сколько места занято — для экрана настроек. */
export async function storageStats() {
  if (!isNative()) {
    const db = await webDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => {
        const all = req.result || [];
        resolve({ count: all.length, bytes: all.reduce((sum, r) => sum + (r.size || 0), 0) });
      };
      req.onerror = () => resolve({ count: 0, bytes: 0 });
    });
  }

  try {
    const { Filesystem, Directory } = await fs();
    const res = await Filesystem.readdir({ path: FILES_DIR, directory: Directory.Data });
    const files = res.files || [];
    return { count: files.length, bytes: files.reduce((sum, f) => sum + (f.size || 0), 0) };
  } catch {
    return { count: 0, bytes: 0 };
  }
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

export { ROOT_DIR };
