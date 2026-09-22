/** Русские окончания для числительных — вынесены отдельно от компонентов,
 * чтобы экспорт нескомпонентных функций из файлов страниц не ломал
 * React Fast Refresh (Vite перезагружает модуль целиком при смешанных
 * экспортах, что при активной разработке выливается в частые сбросы
 * состояния и подвисания hot-reload). */

export function documentWord(n) {
  const last = n % 10;
  const two = n % 100;
  if (two >= 11 && two <= 14) return 'документов';
  if (last === 1) return 'документ';
  if (last >= 2 && last <= 4) return 'документа';
  return 'документов';
}

export function pageWord(n) {
  const last = n % 10;
  const two = n % 100;
  if (two >= 11 && two <= 14) return 'страниц';
  if (last === 1) return 'страница';
  if (last >= 2 && last <= 4) return 'страницы';
  return 'страниц';
}

export function fileWord(n) {
  const last = n % 10;
  const two = n % 100;
  if (two >= 11 && two <= 14) return 'файлов';
  if (last === 1) return 'файл';
  if (last >= 2 && last <= 4) return 'файла';
  return 'файлов';
}
