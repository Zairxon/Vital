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

/** Разбивает текст на куски; «номером» считается слово, где есть цифра и хотя бы 4 символа. */
export function splitCopyable(text) {
  const parts = [];
  const re = /[^\s,;:()]+/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    const word = m[0];
    if (word.length >= 4 && /\d/.test(word)) {
      if (m.index > last) parts.push({ text: text.slice(last, m.index) });
      parts.push({ text: word, copy: true });
      last = m.index + word.length;
    }
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}
