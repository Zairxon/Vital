import { newId } from './ids.js';
import { DOC_TYPES, FALLBACK_TYPE } from './constants.js';

/**
 * Чистые функции над базой. Каждая возвращает новый объект и не трогает
 * переданный — состояние в React меняется только заменой ссылки.
 *
 * Db = { version, people[], documents[], customTypes[] }
 * Person = { id, name, relation, avatarFileId, order, createdAt }
 * Document = { id, personId, type, title, note, expiryDate, pinned, order, createdAt, pages[] }
 * Page = { fileId, kind, mime, size, name, thumbId }
 */

export const DB_VERSION = 1;

export function emptyDb() {
  return { version: DB_VERSION, people: [], documents: [], customTypes: [] };
}

/** Все файлы документа: сами страницы и их миниатюры. */
function filesOfDocument(doc) {
  const ids = [];
  for (const page of doc.pages || []) {
    if (page.fileId) ids.push(page.fileId);
    if (page.thumbId) ids.push(page.thumbId);
  }
  return ids;
}

function renumber(items) {
  return items.map((item, index) => ({ ...item, order: index }));
}

// ── Люди ───────────────────────────────────────────────────────────────

export function addPerson(db, { name, relation = '', avatarFileId = null }) {
  const person = {
    id: newId('p'),
    name: (name || '').trim(),
    relation: relation.trim(),
    avatarFileId,
    order: db.people.length,
    createdAt: Date.now(),
  };
  return { ...db, people: [...db.people, person] };
}

export function updatePerson(db, id, patch) {
  return {
    ...db,
    people: db.people.map((p) => (p.id === id ? { ...p, ...patch } : p)),
  };
}

/** Удаляет человека и все его документы. Файлы стирает вызывающий код. */
export function removePerson(db, id) {
  const doomed = db.documents.filter((d) => d.personId === id);
  const orphanFileIds = doomed.flatMap(filesOfDocument);
  const person = db.people.find((p) => p.id === id);
  if (person?.avatarFileId) orphanFileIds.push(person.avatarFileId);

  return {
    db: {
      ...db,
      people: renumber(db.people.filter((p) => p.id !== id)),
      documents: db.documents.filter((d) => d.personId !== id),
    },
    orphanFileIds,
  };
}

/** delta = -1 (выше) или +1 (ниже). За границами списка ничего не меняет. */
export function movePerson(db, id, delta) {
  const sorted = [...db.people].sort((a, b) => a.order - b.order);
  const from = sorted.findIndex((p) => p.id === id);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= sorted.length) return db;

  const moved = [...sorted];
  [moved[from], moved[to]] = [moved[to], moved[from]];
  return { ...db, people: renumber(moved) };
}

// ── Документы ──────────────────────────────────────────────────────────

export function documentsOf(db, personId) {
  return db.documents.filter((d) => d.personId === personId);
}

export function addDocument(db, { personId, type, title, note = '', expiryDate = null, pages = [] }) {
  const doc = {
    id: newId('d'),
    personId,
    type: type || FALLBACK_TYPE,
    title: (title || '').trim(),
    note: note.trim(),
    expiryDate,
    pinned: false,
    order: documentsOf(db, personId).length,
    createdAt: Date.now(),
    pages,
  };
  return { ...db, documents: [...db.documents, doc] };
}

export function updateDocument(db, id, patch) {
  return {
    ...db,
    documents: db.documents.map((d) => (d.id === id ? { ...d, ...patch } : d)),
  };
}

export function removeDocument(db, id) {
  const doc = db.documents.find((d) => d.id === id);
  return {
    db: { ...db, documents: db.documents.filter((d) => d.id !== id) },
    orphanFileIds: doc ? filesOfDocument(doc) : [],
  };
}

export function togglePin(db, id) {
  return {
    ...db,
    documents: db.documents.map((d) => (d.id === id ? { ...d, pinned: !d.pinned } : d)),
  };
}

// ── Типы документов ────────────────────────────────────────────────────

export function addCustomType(db, label) {
  const type = { id: newId('t'), label: label.trim() };
  return { ...db, customTypes: [...db.customTypes, type] };
}

export function allTypes(db) {
  return [...DOC_TYPES, ...(db.customTypes || [])];
}

export function typeLabel(db, typeId) {
  const found = allTypes(db).find((t) => t.id === typeId);
  if (found) return found.label;
  return DOC_TYPES.find((t) => t.id === FALLBACK_TYPE).label;
}
