# Vital — краткая справка по проекту

Хранилище документов семьи на Android. Всё лежит в телефоне, офлайн.

- **Спека:** `docs/superpowers/specs/2026-09-22-vital-design.md`
- **План работ:** `docs/superpowers/plans/2026-09-22-vital.md` (14 задач, 5 этапов)
- **Стек:** React 19 + Vite + Capacitor 8, тема Botanical Earth, шрифт Inter
- **Тесты:** `npm run test` (vitest, чистая логика в `src/lib/`)
- **Дев-сервер:** `npm run dev` → http://localhost:5173

## Где что лежит

| Слой | Файлы |
|---|---|
| Чистая логика | `src/lib/model.js`, `search.js` — покрыты тестами |
| Хранилище | `src/lib/db.js` (метаданные), `files.js` (байты), `image.js` (миниатюры) |
| Разница телефон/браузер | только внутри `db.js`, `files.js`, `pick.js`; признак — `src/lib/platform.js` |
| Состояние | `src/state/DbContext.jsx` — единственное место, где меняется база |
| Экраны | `src/pages/People.jsx`, `Person.jsx`, `Viewer.jsx` |

## Что сделано (этапы 1 и 2)

Люди с мини-фото, документы с несколькими страницами, добавление из камеры,
галереи и файлов телефона (PDF, Word), просмотр фото с зумом и листанием,
открытие PDF и Word во внешнем приложении, закрепление важного, общий поиск,
порядок людей.

## Что дальше

Этап 3 — PIN и отпечаток (задачи 10–11); этап 4 — отправка и ZIP-бэкап
(задачи 12–13); этап 5 — сборка APK (задача 14). Подробности — в плане.

## Проверка без телефона

Дев-сервер работает на IndexedDB и localStorage. Системный диалог выбора
файла в браузере можно подменить, чтобы прогнать добавление документа:

```js
// в консоли страницы
const orig = HTMLInputElement.prototype.click;
HTMLInputElement.prototype.click = function () {
  if (this.type !== 'file') return orig.call(this);
  const blob = new Blob([new Uint8Array(1000)], { type: 'application/pdf' });
  const dt = new DataTransfer();
  dt.items.add(new File([blob], 'test.pdf', { type: blob.type }));
  this.files = dt.files;
  this.dispatchEvent(new Event('change'));
};
```
