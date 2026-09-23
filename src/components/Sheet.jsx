import { useEffect } from 'react';
import { registerBackHandler } from '../lib/backButton.js';

/** Шторка снизу — единственный вид модалки в приложении. */
export default function Sheet({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Жест «назад» закрывает шторку, а не уводит с экрана целиком —
  // одна регистрация здесь покрывает все шторки приложения разом.
  useEffect(() => registerBackHandler(() => { onClose(); return true; }), [onClose]);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        {title && <div className="sheet-title">{title}</div>}
        {children}
      </div>
    </div>
  );
}

/** Подтверждение необратимого действия. Текст всегда говорит, что пропадёт. */
export function Confirm({ title, text, confirmLabel = 'Удалить', onConfirm, onClose }) {
  return (
    <Sheet title={title} onClose={onClose}>
      <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>{text}</p>
      <div className="sheet-actions">
        <button className="btn btn-ghost" onClick={onClose}>Отмена</button>
        <button
          className="btn"
          style={{ background: 'var(--danger)', color: '#fff' }}
          onClick={() => { onConfirm(); onClose(); }}
        >
          {confirmLabel}
        </button>
      </div>
    </Sheet>
  );
}
