import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDb } from '../state/DbContext.jsx';
import { peopleSorted } from '../lib/search.js';
import { documentsOf } from '../lib/model.js';
import Icon from '../components/Icon.jsx';
import Thumb from '../components/Thumb.jsx';
import PersonSheet from '../components/PersonSheet.jsx';

export default function People() {
  const { db, warning, actions } = useDb();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(null); // null | 'new' | person

  const people = peopleSorted(db);

  return (
    <div className="screen">
      <div className="topbar">
        <div className="topbar-title">Vital</div>
      </div>

      {warning && (
        <div className="banner">
          <span style={{ flex: 1 }}>{warning}</span>
          <button onClick={actions.dismissWarning} aria-label="Скрыть"><Icon name="close" size={16} /></button>
        </div>
      )}

      <div className="screen-body">
        {people.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">👤</div>
            <div className="empty-title">Пока никого нет</div>
            <div className="empty-text">
              Добавьте первого человека — себя или родителей,<br />
              а потом загрузите его документы.
            </div>
          </div>
        ) : (
          people.map((person) => {
            const count = documentsOf(db, person.id).length;
            return (
              <button
                key={person.id}
                className="person-card"
                onClick={() => navigate(`/person/${person.id}`)}
              >
                <div className="avatar">
                  {person.avatarFileId
                    ? <Thumb fileId={person.avatarFileId} alt="" style={{ width: '100%', height: '100%' }} />
                    : (person.name[0] || '?').toUpperCase()}
                </div>
                <div className="person-info">
                  <div className="person-name">{person.name}</div>
                  <div className="person-meta">
                    {person.relation ? `${person.relation} · ` : ''}
                    {count === 0 ? 'нет документов' : `${count} ${plural(count)}`}
                  </div>
                </div>
                <Icon name="chevron" size={18} style={{ color: 'var(--text-hint)' }} />
              </button>
            );
          })
        )}
      </div>

      <button className="fab" onClick={() => setEditing('new')}>
        <Icon name="plus" size={20} />
        Человек
      </button>

      {editing && (
        <PersonSheet
          person={editing === 'new' ? null : editing}
          docCount={editing === 'new' ? 0 : documentsOf(db, editing.id).length}
          onSave={(data) => {
            if (editing === 'new') actions.addPerson(data);
            else actions.updatePerson(editing.id, data);
          }}
          onRemove={() => actions.removePerson(editing.id)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

export function plural(n) {
  const last = n % 10;
  const two = n % 100;
  if (two >= 11 && two <= 14) return 'документов';
  if (last === 1) return 'документ';
  if (last >= 2 && last <= 4) return 'документа';
  return 'документов';
}
