import { APP_VERSION, RELEASES_API } from './version.js';

/** «v1.5.0» / «1.5.0» → [1, 5, 0]. */
function parts(v) {
  return String(v).replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
}

/** true, если версия a новее версии b. */
export function isNewer(a, b) {
  const x = parts(a);
  const y = parts(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] || 0) - (y[i] || 0);
    if (d !== 0) return d > 0;
  }
  return false;
}

/**
 * Спрашивает у GitHub последний релиз. Возвращает { version, url }, если он
 * новее установленной версии, иначе null. Без сети или при ошибке — null:
 * приложение работает офлайн и не должно из-за этого ругаться.
 */
export async function checkForUpdate(current = APP_VERSION, fetchFn = fetch) {
  try {
    const res = await fetchFn(RELEASES_API, { headers: { Accept: 'application/vnd.github+json' } });
    if (!res.ok) return null;
    const rel = await res.json();
    const version = String(rel.tag_name || '').replace(/^v/i, '');
    if (!version || !isNewer(version, current)) return null;
    const apk = (rel.assets || []).find((a) => /\.apk$/i.test(a.name));
    return { version, url: apk?.browser_download_url || rel.html_url };
  } catch {
    return null;
  }
}
