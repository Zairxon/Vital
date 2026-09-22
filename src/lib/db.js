import { emptyDb, DB_VERSION } from './model.js';
import { isNative, DB_PATH, DB_BAK_PATH, ROOT_DIR } from './platform.js';

const WEB_KEY = 'vital.db';
let loadError = null;

/**
 * Разбирает текст базы. Возвращает null на любом мусоре — вызывающий код
 * после этого пробует резервную копию.
 */
export function parseDb(text) {
  if (!text) return null;
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (!raw || !Array.isArray(raw.people) || !Array.isArray(raw.documents)) return null;

  return {
    version: raw.version || DB_VERSION,
    people: raw.people,
    documents: raw.documents,
    customTypes: Array.isArray(raw.customTypes) ? raw.customTypes : [],
  };
}

export function lastLoadError() {
  return loadError;
}

async function fs() {
  const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
  return { Filesystem, Directory, Encoding };
}

async function readText(path) {
  const { Filesystem, Directory, Encoding } = await fs();
  try {
    const res = await Filesystem.readFile({ path, directory: Directory.Data, encoding: Encoding.UTF8 });
    return res.data;
  } catch {
    return null; // файла ещё нет — это нормальный первый запуск
  }
}

export async function loadDb() {
  loadError = null;

  if (!isNative()) {
    const parsed = parseDb(localStorage.getItem(WEB_KEY));
    if (parsed) return parsed;
    const backup = parseDb(localStorage.getItem(WEB_KEY + '.bak'));
    if (backup) {
      loadError = 'Основной файл данных повреждён, восстановлена резервная копия.';
      return backup;
    }
    return emptyDb();
  }

  const main = parseDb(await readText(DB_PATH));
  if (main) return main;

  const backup = parseDb(await readText(DB_BAK_PATH));
  if (backup) {
    loadError = 'Основной файл данных повреждён, восстановлена резервная копия.';
    return backup;
  }
  return emptyDb();
}

export async function saveDb(db) {
  const text = JSON.stringify(db);

  if (!isNative()) {
    const previous = localStorage.getItem(WEB_KEY);
    if (previous) localStorage.setItem(WEB_KEY + '.bak', previous);
    localStorage.setItem(WEB_KEY, text);
    return;
  }

  const { Filesystem, Directory, Encoding } = await fs();
  await Filesystem.mkdir({ path: ROOT_DIR, directory: Directory.Data, recursive: true }).catch(() => {});

  // Резервная копия пишется ДО перезаписи основного файла: если запись
  // оборвётся, предыдущее состояние останется целым.
  const previous = await readText(DB_PATH);
  if (previous) {
    await Filesystem.writeFile({
      path: DB_BAK_PATH, directory: Directory.Data, encoding: Encoding.UTF8, data: previous,
    });
  }

  await Filesystem.writeFile({
    path: DB_PATH, directory: Directory.Data, encoding: Encoding.UTF8, data: text,
  });
}
