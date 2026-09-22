import { useEffect } from 'react';

/** Шторка снизу — единственный вид модалки в приложении. */
export default function Sheet({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

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
