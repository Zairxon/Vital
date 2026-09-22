import { DOC_TYPES } from './constants.js';
import { typeLabel } from './model.js';

const PINNED_GROUP = '__pinned';

/** Всё, по чему документ можно найти, одной строкой в нижнем регистре. */
function haystack(db, doc, person) {
  return [
    person?.name,
    person?.relation,
    doc.title,
    doc.note,
    typeLabel(db, doc.type),
  ].filter(Boolean).join(' ').toLowerCase();
}

export function searchDocuments(db, query) {
  const needle = (query || '').trim().toLowerCase();
  if (!needle) return [];

  const byId = new Map(db.people.map((p) => [p.id, p]));
  return db.documents
    .filter((doc) => haystack(db, doc, byId.get(doc.personId)).includes(needle))
    .map((doc) => ({ doc, person: byId.get(doc.personId) || null }));
}

/** Закреплённые — наверх, внутри — по порядку добавления. */
export function sortDocuments(docs) {
  return [...docs].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return (a.order ?? 0) - (b.order ?? 0);
  });
}

/**
 * Группы для экрана человека: сначала «Важное» (закреплённые),
 * затем типы в порядке справочника, свои типы — в конце.
 */
export function groupByType(db, docs) {
  const groups = [];
  const pinned = docs.filter((d) => d.pinned);
  if (pinned.length) {
    groups.push({ typeId: PINNED_GROUP, label: 'Важное', items: sortDocuments(pinned) });
  }

  const rest = docs.filter((d) => !d.pinned);
  const order = [...DOC_TYPES.map((t) => t.id), ...(db.customTypes || []).map((t) => t.id)];
  const seen = new Set();

  for (const typeId of order) {
    const items = rest.filter((d) => d.type === typeId);
    if (!items.length) continue;
    seen.add(typeId);
    groups.push({ typeId, label: typeLabel(db, typeId), items: sortDocuments(items) });
  }

  // Документы с типом, которого уже нет в справочнике, не должны исчезать.
  const orphans = rest.filter((d) => !seen.has(d.type));
  if (orphans.length) {
    groups.push({ typeId: 'other', label: 'Другое', items: sortDocuments(orphans) });
  }

  return groups;
}

export function peopleSorted(db) {
  return [...db.people].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}
