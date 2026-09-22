import { useState } from 'react';
import Sheet, { Confirm } from './Sheet.jsx';

/** Добавление и редактирование человека. */
export default function PersonSheet({ person, docCount = 0, onSave, onRemove, onClose }) {
  const [name, setName] = useState(person?.name || '');
  const [relation, setRelation] = useState(person?.relation || '');
  const [confirming, setConfirming] = useState(false);

  const canSave = name.trim().length > 0;

  if (confirming) {
    return (
      <Confirm
        title="Удалить человека?"
        text={`${person.name} и все его документы (${docCount}) будут удалены. Файлы будут стёрты без возможности восстановить.`}
        onConfirm={onRemove}
        onClose={onClose}
      />
    );
  }

  return (
    <Sheet title={person ? 'Изменить' : 'Новый человек'} onClose={onClose}>
      <div className="field">
        <label htmlFor="person-name">Имя</label>
        <input
          id="person-name"
          value={name}
          autoFocus
          placeholder="Например, Алишер"
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="person-relation">Кем приходится</label>
        <input
          id="person-relation"
          value={relation}
          placeholder="Отец, мать, сын…"
          onChange={(e) => setRelation(e.target.value)}
        />
      </div>

      <div className="sheet-actions">
        <button className="btn btn-ghost" onClick={onClose}>Отмена</button>
        <button
          className="btn btn-primary"
          disabled={!canSave}
          onClick={() => { onSave({ name: name.trim(), relation: relation.trim() }); onClose(); }}
        >
          Сохранить
        </button>
      </div>

      {person && (
        <button
          className="btn btn-danger btn-block"
          style={{ marginTop: 'var(--space-2)' }}
          onClick={() => setConfirming(true)}
        >
          Удалить человека
        </button>
      )}
    </Sheet>
  );
}
