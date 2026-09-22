import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate';
import { loadDb, saveDb } from './db.js';
import { readBlob, restoreBlob } from './files.js';

/**
 * Экспорт и импорт всей базы одним ZIP-файлом: db.json в корне и все
 * файлы документов в files/. Единственный способ перенести данные на
 * новый телефон — облака в приложении нет.
 */

/** Проверка, что распакованный JSON похож на базу Vital, а не мусор. */
export function validateBackup(json) {
  return Boolean(json) && Array.isArray(json.people) && Array.isArray(json.documents);
}

/** Все fileId, на которые ссылается база: аватары и страницы документов. */
function referencedFileIds(db) {
  const ids = new Set();
  for (const person of db.people) {
    if (person.avatarFileId) ids.add(person.avatarFileId);
  }
  for (const doc of db.documents) {
    for (const page of doc.pages || []) {
      if (page.fileId) ids.add(page.fileId);
      if (page.thumbId) ids.add(page.thumbId);
    }
  }
  return [...ids];
}

export async function exportZip() {
  const db = await loadDb();
  const entries = { 'db.json': strToU8(JSON.stringify(db)) };

  for (const fileId of referencedFileIds(db)) {
    try {
      const blob = await readBlob(fileId);
      entries[`files/${fileId}`] = new Uint8Array(await blob.arrayBuffer());
    } catch {
      // Файл потерян — пропускаем его, а не рушим весь экспорт из-за одной пропажи.
    }
  }

  return new Blob([zipSync(entries, { level: 6 })], { type: 'application/zip' });
}

/** Пишет распакованный архив поверх текущих данных, без проверок и отката. */
async function applyZip(unzipped) {
  const parsed = JSON.parse(strFromU8(unzipped['db.json']));
  for (const [path, data] of Object.entries(unzipped)) {
    if (!path.startsWith('files/') || path.endsWith('/')) continue;
    await restoreBlob(path.slice('files/'.length), new Blob([data]));
  }
  await saveDb(parsed);
  return parsed;
}

/**
 * Заменяет текущие данные содержимым архива. Перед заменой снимает
 * снимок текущего состояния в памяти — если что-то посреди записи
 * сломается, прежние данные восстанавливаются из этого снимка.
 */
export async function importZip(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let unzipped;
  try {
    unzipped = unzipSync(bytes);
  } catch {
    throw new Error('Файл повреждён или это не резервная копия Vital.');
  }

  let parsed = null;
  try {
    parsed = unzipped['db.json'] ? JSON.parse(strFromU8(unzipped['db.json'])) : null;
  } catch {
    parsed = null;
  }
  if (!validateBackup(parsed)) {
    throw new Error('Файл повреждён или это не резервная копия Vital.');
  }

  const safety = await exportZip();
  try {
    await applyZip(unzipped);
    return { people: parsed.people, documents: parsed.documents };
  } catch {
    let rolledBack = true;
    try {
      const safetyBytes = new Uint8Array(await safety.arrayBuffer());
      await applyZip(unzipSync(safetyBytes));
    } catch {
      rolledBack = false;
    }
    throw new Error(
      rolledBack
        ? 'Не удалось восстановить резервную копию. Прежние данные не пострадали.'
        : 'Не удалось восстановить резервную копию, и откат тоже не удался. Проверьте данные в приложении.'
    );
  }
}
