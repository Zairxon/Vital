import { Preferences } from '@capacitor/preferences';

/**
 * PIN и (в задаче 11) биометрия. Экраны видят только эти функции — ни один
 * компонент не читает Preferences напрямую. Preferences сам работает и на
 * телефоне, и в браузере (через localStorage), поэтому здесь нет ветвления
 * platform.js, как в db.js/files.js.
 */

const PIN_HASH_KEY = 'vital.pinHash';

/** Пауза после подряд неверных вводов. Первые три попытки — без паузы. */
export function nextDelayMs(failCount) {
  return failCount >= 3 ? 30000 : 0;
}

/** SHA-256 в hex. Сам PIN на диск никогда не пишется — только хеш. */
export async function hashPin(pin) {
  const bytes = new TextEncoder().encode(pin);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function hasPin() {
  const { value } = await Preferences.get({ key: PIN_HASH_KEY });
  return Boolean(value);
}

export async function setPin(pin) {
  await Preferences.set({ key: PIN_HASH_KEY, value: await hashPin(pin) });
}

export async function checkPin(pin) {
  const { value } = await Preferences.get({ key: PIN_HASH_KEY });
  if (!value) return false;
  return value === (await hashPin(pin));
}

/** Только для настроек — полный сброс защиты. */
export async function clearPin() {
  await Preferences.remove({ key: PIN_HASH_KEY });
}

// ── Авто-блокировка при уходе в фон ─────────────────────────────────────

const LOCK_AFTER_MS = 60_000;

/**
 * lastBackgroundAt — момент ухода в фон (null, если не уходило).
 * Порог в минуту: короткое переключение на другое приложение (например,
 * чтобы скопировать текст) не должно требовать PIN заново.
 */
export function shouldLock(lastBackgroundAt, now) {
  if (!lastBackgroundAt) return false;
  return now - lastBackgroundAt >= LOCK_AFTER_MS;
}

// ── Биометрия ────────────────────────────────────────────────────────────

export async function canUseBiometric() {
  try {
    const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth');
    const result = await BiometricAuth.checkBiometry();
    return result.isAvailable;
  } catch {
    return false; // плагин не работает в браузере — это ожидаемо, не ошибка
  }
}

export async function unlockByBiometric() {
  try {
    const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth');
    await BiometricAuth.authenticate({
      reason: 'Подтвердите вход в Vital',
      cancelTitle: 'Ввести PIN',
      androidTitle: 'Vital',
      androidSubtitle: 'Подтвердите вход',
    });
    return true;
  } catch {
    return false; // отмена или ошибка сканера — просто остаёмся на экране PIN
  }
}
