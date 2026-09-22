import Sheet from './Sheet.jsx';
import Icon from './Icon.jsx';

/** Откуда взять страницы документа. */
export default function AddSheet({ onPick, onClose, allowFiles = false }) {
  const items = [
    { id: 'camera', icon: 'camera', label: 'Снять камерой', hint: 'Сфотографировать документ' },
    { id: 'gallery', icon: 'image', label: 'Выбрать из галереи', hint: 'Можно несколько фото сразу' },
    {
      id: 'file', icon: 'file', label: 'Файл с телефона',
      hint: allowFiles ? 'PDF или Word' : 'скоро',
      disabled: !allowFiles,
    },
  ];

  return (
    <Sheet title="Добавить документ" onClose={onClose}>
      {items.map((item) => (
        <button
          key={item.id}
          className="source-item"
          disabled={item.disabled}
          onClick={() => { onClose(); onPick(item.id); }}
        >
          <span className="source-icon"><Icon name={item.icon} size={22} /></span>
          <span>
            <span className="source-label" style={{ display: 'block' }}>{item.label}</span>
            <span className="source-hint">{item.hint}</span>
          </span>
        </button>
      ))}
    </Sheet>
  );
}
