# Vital — краткая справка по проекту

Хранилище документов семьи на Android. Всё лежит в телефоне, офлайн.
**Все 14 задач плана выполнены**, APK собирается и устанавливается.

- **Спека:** `docs/superpowers/specs/2026-09-22-vital-design.md`
- **План работ:** `docs/superpowers/plans/2026-09-22-vital.md` (14 задач, 5 этапов — все отмечены выполненными)
- **Стек:** React 19 + Vite + Capacitor 8, тема Botanical Earth, шрифт Inter (локальный, без сети)
- **Тесты:** `npm run test` (vitest, 46 тестов, чистая логика в `src/lib/`)
- **Дев-сервер:** `npm run dev` → http://localhost:5173

## Сборка APK

```bash
npm run build
npx cap sync android
cd android
JAVA_HOME="C:/Users/User/.jdks/jdk-21.0.12.1+1" ./gradlew.bat assembleDebug
```

Готовый файл: `android/app/build/outputs/apk/debug/app-debug.apk`.

**Нужен именно JDK 21** для сборки (не JDK 17, который стоит в системе как
основной) — Capacitor 8 жёстко прописывает `sourceCompatibility 21` в своём
`build.gradle`, это не обходится через toolchain-автоподбор. JDK 21 (Temurin)
установлен отдельно в `C:\Users\User\.jdks\jdk-21.0.12.1+1`, системный JDK 17
не трогали. `android/local.properties` с путём к Android SDK не в git
(машинно-специфичный) — создаётся заново при необходимости:
```
sdk.dir=C\:\\Users\\User\\AppData\\Local\\Android\\Sdk
```

Иконка сгенерирована скриптом `scripts/gen-icons.mjs` (чистый Node,
собственный PNG-энкодер — внешних инструментов вроде ImageMagick на машине
не было). Перегенерировать: `node scripts/gen-icons.mjs`.

## Отклонения от исходного плана (сознательные, из-за реальных ограничений)

| План | По факту | Почему |
|---|---|---|
| Capacitor 7 | Capacitor 8 | На момент установки 7 уже не последняя; интерфейс тот же |
| minSdk 23 | minSdk 24 | Capacitor 8 сам требует минимум 24, ниже не даёт собраться |
| — | JDK 21 отдельно от системного JDK 17 | Требование Capacitor 8 (см. выше) |

## Где что лежит

| Слой | Файлы |
|---|---|
| Чистая логика | `src/lib/model.js`, `search.js`, `auth.js`, `backup.js` — покрыты тестами |
| Хранилище | `src/lib/db.js` (метаданные), `files.js` (байты), `image.js` (миниатюры) |
| Разница телефон/браузер | только внутри `db.js`, `files.js`, `pick.js`; признак — `src/lib/platform.js` |
| Защита | `src/lib/auth.js` (PIN, биометрия, авто-блокировка), `src/pages/Lock.jsx` |
| Резервная копия | `src/lib/backup.js` (ZIP через fflate), `src/pages/Settings.jsx` |
| Состояние | `src/state/DbContext.jsx` — единственное место, где меняется база |
| Экраны | `src/pages/People.jsx`, `Person.jsx`, `Viewer.jsx`, `Lock.jsx`, `Settings.jsx` |

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

## Возможные следующие шаги (не запланированы, но легко лягут поверх)

Облачная синхронизация, OCR документов, напоминания об истечении срока
действия, совместный доступ для родственников — см. раздел «Сознательно не
делаем сейчас» в спеке.
