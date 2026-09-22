/**
 * Единственное место, где приложение узнаёт, что оно внутри APK.
 * Проверка идёт через глобальный объект, который подставляет Capacitor, —
 * так модули не тянут плагины при работе в браузере.
 */
export function isNative() {
  return Boolean(globalThis.Capacitor?.isNativePlatform?.());
}

/** Папка приложения внутри приватной директории данных. */
export const ROOT_DIR = 'vital';
export const FILES_DIR = `${ROOT_DIR}/files`;
export const DB_PATH = `${ROOT_DIR}/db.json`;
export const DB_BAK_PATH = `${ROOT_DIR}/db.json.bak`;
