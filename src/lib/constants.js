/** Встроенные типы документов. Порядок здесь задаёт порядок групп на экране. */
export const DOC_TYPES = [
  { id: 'passport', label: 'Паспорт', icon: '🛂' },
  { id: 'birth', label: 'Свидетельство о рождении', icon: '👶' },
  { id: 'marriage', label: 'Свидетельство о браке', icon: '💍' },
  { id: 'diploma', label: 'Диплом', icon: '🎓' },
  { id: 'objectivka', label: 'Объективка', icon: '📄' },
  { id: 'inn', label: 'ИНН', icon: '🔢' },
  { id: 'military', label: 'Военный билет', icon: '🎖' },
  { id: 'medical', label: 'Медицинская справка', icon: '🩺' },
  { id: 'other', label: 'Другое', icon: '📁' },
];

export const FALLBACK_TYPE = 'other';

/** Виды страниц: картинка открывается с зумом, остальное — во внешнем приложении. */
export const PAGE_KINDS = { IMAGE: 'image', PDF: 'pdf', DOC: 'doc' };
