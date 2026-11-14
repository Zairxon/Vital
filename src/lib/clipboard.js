/** Копирует текст в буфер обмена. Возвращает true при успехе. */
export async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* пробуем запасной способ */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/** Заметки документа: каждая — отдельная строка. */
export function noteLines(note) {
  return String(note || '').split('\n').map((l) => l.trim()).filter(Boolean);
}

/**
 * Что копируется по нажатию на заметку. «Название: значение» (двоеточие и
 * пробел) — копируется только значение; всё остальное, включая номер
 * кадастра вида 12:34:56, — строка целиком.
 */
export function noteValue(line) {
  const m = line.match(/^[^:]*?:\s+(.+)$/);
  return m ? m[1].trim() : line;
}
