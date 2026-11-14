/** Языки интерфейса: русский, английский, узбекский латиница и кириллица. */
export const LANGS = [
  { id: 'ru', label: 'Русский' },
  { id: 'en', label: 'English' },
  { id: 'uz', label: 'Oʻzbekcha' },
  { id: 'uzc', label: 'Ўзбекча' },
];

export const STRINGS = {
  ru: {
    settings: 'Настройки', back: 'Назад', protection: 'Защита', changePin: 'Сменить PIN',
    fingerprint: 'Вход по отпечатку', noScreenshots: 'Запрет скриншотов',
    noScreenshotsHint: 'Документы не попадут в снимки экрана',
    backup: 'Резервная копия', exportZip: 'Экспорт всего в ZIP', importZip: 'Импорт из ZIP',
    language: 'Язык', about: 'О приложении', version: 'Версия',
    updateAvailable: 'Есть обновление', updateButton: 'Обновить', newVersion: 'Новая версия',
    upToDate: 'Установлена последняя версия', checkUpdate: 'Проверить обновления', checking: 'Проверяю…',
    pinChanged: 'PIN изменён.', hide: 'Скрыть', preparing: 'Готовлю архив…', restoring: 'Восстанавливаю…',
    diskUsed: 'Занято на диске', filesWord: '', copied: 'Скопировано ✓',
  },
  en: {
    settings: 'Settings', back: 'Back', protection: 'Security', changePin: 'Change PIN',
    fingerprint: 'Fingerprint login', noScreenshots: 'Block screenshots',
    noScreenshotsHint: 'Documents will not appear in screenshots',
    backup: 'Backup', exportZip: 'Export everything to ZIP', importZip: 'Import from ZIP',
    language: 'Language', about: 'About', version: 'Version',
    updateAvailable: 'Update available', updateButton: 'Update', newVersion: 'New version',
    upToDate: 'You have the latest version', checkUpdate: 'Check for updates', checking: 'Checking…',
    pinChanged: 'PIN changed.', hide: 'Hide', preparing: 'Preparing archive…', restoring: 'Restoring…',
    diskUsed: 'Used on disk', filesWord: 'files', copied: 'Copied ✓',
  },
  uz: {
    settings: 'Sozlamalar', back: 'Orqaga', protection: 'Himoya', changePin: 'PIN-kodni oʻzgartirish',
    fingerprint: 'Barmoq izi bilan kirish', noScreenshots: 'Skrinshotni taqiqlash',
    noScreenshotsHint: 'Hujjatlar ekran tasviriga tushmaydi',
    backup: 'Zaxira nusxa', exportZip: 'Hammasini ZIP ga eksport qilish', importZip: 'ZIP dan import qilish',
    language: 'Til', about: 'Ilova haqida', version: 'Versiya',
    updateAvailable: 'Yangilanish bor', updateButton: 'Yangilash', newVersion: 'Yangi versiya',
    upToDate: 'Oxirgi versiya oʻrnatilgan', checkUpdate: 'Yangilanishni tekshirish', checking: 'Tekshirilmoqda…',
    pinChanged: 'PIN-kod oʻzgartirildi.', hide: 'Yashirish', preparing: 'Arxiv tayyorlanmoqda…', restoring: 'Tiklanmoqda…',
    diskUsed: 'Diskda band', filesWord: 'fayl', copied: 'Nusxalandi ✓',
  },
  uzc: {
    settings: 'Созламалар', back: 'Орқага', protection: 'Ҳимоя', changePin: 'PIN-кодни ўзгартириш',
    fingerprint: 'Бармоқ изи билан кириш', noScreenshots: 'Скриншотни тақиқлаш',
    noScreenshotsHint: 'Ҳужжатлар экран тасвирига тушмайди',
    backup: 'Заҳира нусха', exportZip: 'Ҳаммасини ZIP га экспорт қилиш', importZip: 'ZIP дан импорт қилиш',
    language: 'Тил', about: 'Илова ҳақида', version: 'Версия',
    updateAvailable: 'Янгиланиш бор', updateButton: 'Янгилаш', newVersion: 'Янги версия',
    upToDate: 'Охирги версия ўрнатилган', checkUpdate: 'Янгиланишни текшириш', checking: 'Текширилмоқда…',
    pinChanged: 'PIN-код ўзгартирилди.', hide: 'Яшириш', preparing: 'Архив тайёрланмоқда…', restoring: 'Тикланмоқда…',
    diskUsed: 'Дискда банд', filesWord: 'файл', copied: 'Нусхаланди ✓',
  },
};
