import { useState } from 'react';
import Sheet from './Sheet.jsx';
import Icon from './Icon.jsx';

const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const pad = (n) => String(n).padStart(2, '0');
const toIso = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

/** Дата ISO (ГГГГ-ММ-ДД) → «ДД.ММ.ГГГГ» для показа в поле. */
export function formatIsoDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}.${m}.${y}`;
}

/**
 * Свой календарь вместо системного выбора даты: в цветах приложения.
 * Шторка внутри открывается поверх, значение отдаётся строкой ISO.
 */
export default function DatePicker({ value, onPick, onClose }) {
  const today = new Date();
  const start = value ? new Date(`${value.slice(0, 10)}T00:00:00`) : today;
  const [year, setYear] = useState(start.getFullYear());
  const [month, setMonth] = useState(start.getMonth());

  const firstOffset = (new Date(year, month, 1).getDay() + 6) % 7; // понедельник — первый
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [
    ...Array.from({ length: firstOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const todayIso = toIso(today.getFullYear(), today.getMonth(), today.getDate());

  function shift(delta) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  return (
    <Sheet title="Срок действия" onClose={onClose}>
      <div className="cal-head">
        <button type="button" className="icon-btn" onClick={() => shift(-1)} aria-label="Предыдущий месяц">
          <Icon name="back" size={20} />
        </button>
        <div className="cal-title">{MONTHS[month]} {year}</div>
        <button type="button" className="icon-btn" onClick={() => shift(1)} aria-label="Следующий месяц">
          <Icon name="chevron" size={20} />
        </button>
      </div>

      <div className="cal-grid">
        {WEEKDAYS.map((w) => <div key={w} className="cal-wd">{w}</div>)}
        {cells.map((d, i) => {
          if (d === null) return <div key={`e${i}`} />;
          const iso = toIso(year, month, d);
          const cls = ['cal-day', iso === value ? 'is-selected' : '', iso === todayIso ? 'is-today' : '']
            .filter(Boolean).join(' ');
          return (
            <button type="button" key={iso} className={cls} onClick={() => onPick(iso)}>{d}</button>
          );
        })}
      </div>

      <div className="sheet-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Отмена</button>
        <button type="button" className="btn btn-primary" onClick={() => onPick(todayIso)}>Сегодня</button>
      </div>
    </Sheet>
  );
}
