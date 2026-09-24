/**
 * Срок действия документа. Дата хранится как строка ISO (из <input
 * type="date"> или Date.toISOString()) — сравнение всегда идёт через
 * миллисекунды, без завязки на часовой пояс отображения.
 */
export const EXPIRY_WARNING_DAYS = 10;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Целых дней до срока (может быть отрицательным для просроченных). null — если срок не задан. */
export function daysUntilExpiry(expiryDate, now = Date.now()) {
  if (!expiryDate) return null;
  const target = new Date(expiryDate).getTime();
  if (Number.isNaN(target)) return null;
  return Math.floor((target - now) / DAY_MS);
}

/** 'expired' | 'soon' | 'ok' | null — null означает «срок не задан». */
export function expiryStatus(expiryDate, now = Date.now()) {
  const days = daysUntilExpiry(expiryDate, now);
  if (days === null) return null;
  if (days < 0) return 'expired';
  if (days <= EXPIRY_WARNING_DAYS) return 'soon';
  return 'ok';
}

/** Короткая подпись для карточки/просмотрщика: «истёк», «сегодня», «через N дней». */
export function expiryLabel(expiryDate, now = Date.now()) {
  const days = daysUntilExpiry(expiryDate, now);
  if (days === null) return null;
  if (days < 0) return `Истёк ${formatDate(expiryDate)}`;
  if (days === 0) return 'Истекает сегодня';
  return `Истекает через ${days} ${dayWord(days)} · ${formatDate(expiryDate)}`;
}

function dayWord(n) {
  const last = n % 10;
  const two = n % 100;
  if (two >= 11 && two <= 14) return 'дней';
  if (last === 1) return 'день';
  if (last >= 2 && last <= 4) return 'дня';
  return 'дней';
}

/**
 * Все документы, у которых срок истёк или истекает в ближайшие
 * EXPIRY_WARNING_DAYS дней, по всем людям сразу — самые срочные первыми.
 * Это и есть «уведомление» в офлайн-приложении: заметно при каждом
 * открытии главного экрана, без фоновых служб и системных пуш-разрешений.
 */
export function expiringDocuments(db, now = Date.now()) {
  const byId = new Map(db.people.map((p) => [p.id, p]));
  return db.documents
    .map((doc) => ({ doc, person: byId.get(doc.personId) || null, days: daysUntilExpiry(doc.expiryDate, now) }))
    .filter((x) => x.days !== null && x.days <= EXPIRY_WARNING_DAYS)
    .sort((a, b) => a.days - b.days);
}

function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
