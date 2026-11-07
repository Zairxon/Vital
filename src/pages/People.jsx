import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDb } from '../state/DbContext.jsx';
import { peopleSorted, searchDocuments } from '../lib/search.js';
import { documentsOf, typeLabel } from '../lib/model.js';
import { PAGE_KINDS } from '../lib/constants.js';
import { registerBackHandler } from '../lib/backButton.js';
import { expiringDocuments, expiryLabel } from '../lib/expiry.js';
import UpdateBanner from "../components/UpdateBanner.jsx";
import Icon from '../components/Icon.jsx';
import Thumb from '../components/Thumb.jsx';
import PersonSheet from '../components/PersonSheet.jsx';
import { documentWord } from '../lib/format.js';

export default function People() {
  const { db, warning, actions } = useDb();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(null); // null | 'new' | person
  const [query, setQuery] = useState('');
  const [reordering, setReordering] = useState(false);

  const people = peopleSorted(db);
  const searching = query.trim().length > 0;
  const results = searching ? searchDocuments(db, query) : [];
  const expiring = expiringDocuments(db);

  // Жест «назад» во время поиска закрывает поиск, а не выходит из
  // приложения — регистрируем перехватчик, пока есть что закрывать.
  useEffect(() => {
    if (!searching) return;
    return registerBackHandler(() => { setQuery(''); return true; });
  }, [searching]);

  return (
    <div className="screen">
      <div className="topbar">
        <div className="topbar-title">Vital</div>
        {people.length > 1 && !searching && (
          <button
            className={`icon-btn ${reordering ? 'is-active' : ''}`}
            onClick={() => setReordering((v) => !v)}
            aria-label="Изменить порядок"
          >
            <Icon name={reordering ? 'close' : 'up'} size={20} />
          </button>
        )}
        {!searching && !reordering && (
          <button className="icon-btn" onClick={() => navigate('/settings')} aria-label="Настройки">
            <Icon name="settings" size={20} />
          </button>
        )}
      </div>

      <UpdateBanner />

      {warning && (
        <div className="banner">
          <span style={{ flex: 1 }}>{warning}</span>
          <button onClick={actions.dismissWarning} aria-label="Скрыть"><Icon name="close" size={16} /></button>
        </div>
      )}

      {!searching && expiring.length > 0 && (
        <div className="expiry-notice">
          <div className="expiry-notice-title">
            <Icon name="warning" size={16} />
            Истекают документы ({expiring.length})
          </div>
          {expiring.slice(0, 3).map(({ doc, person, days }) => (
            <button key={doc.id} className="expiry-notice-row" onClick={() => navigate(`/doc/${doc.id}`)}>
              <span className="expiry-notice-name">
                {doc.title}{person ? ` · ${person.name}` : ''}
              </span>
              <span style={{ color: days < 0 ? 'var(--danger)' : 'var(--warning)', flexShrink: 0 }}>
                {expiryLabel(doc.expiryDate)}
              </span>
            </button>
          ))}
        </div>
      )}

      {people.length > 0 && (
        <div style={{ padding: 'var(--space-3) var(--space-4) 0' }}>
          <div className="search-wrap">
            <span className="search-icon"><Icon name="search" size={18} /></span>
            <input
              value={query}
              placeholder="Найти документ или человека"
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="screen-body">
        {searching ? (
          results.length === 0 ? (
            <div className="empty">
              <div className="empty-title">Ничего не найдено</div>
              <div className="empty-text">Попробуйте другое слово — имя, тип или номер документа.</div>
            </div>
          ) : (
            results.map(({ doc, person }) => (
              <button key={doc.id} className="doc-card" onClick={() => navigate(`/doc/${doc.id}`)}>
                <ResultThumb doc={doc} />
                <div className="doc-info">
                  <div className="doc-title">{doc.title}</div>
                  <div className="doc-meta">
                    {typeLabel(db, doc.type)}{person ? ` · ${person.name}` : ''}
                  </div>
                </div>
                {doc.pinned && <Icon name="star" size={16} filled style={{ color: 'var(--accent)' }} />}
              </button>
            ))
          )
        ) : people.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">👤</div>
            <div className="empty-title">Пока никого нет</div>
            <div className="empty-text">
              Добавьте первого человека — себя или родителей,<br />
              а потом загрузите его документы.
            </div>
          </div>
        ) : (
          people.map((person, i) => {
            const count = documentsOf(db, person.id).length;
            return (
              <div key={person.id} className="person-card" onClick={() => !reordering && navigate(`/person/${person.id}`)}>
                <div className="avatar">
                  {person.avatarFileId
                    ? <Thumb fileId={person.avatarFileId} alt="" style={{ width: '100%', height: '100%' }} />
                    : (person.name[0] || '?').toUpperCase()}
                </div>
                <div className="person-info">
                  <div className="person-name">{person.name}</div>
                  <div className="person-meta">
                    {person.relation ? `${person.relation} · ` : ''}
                    {count === 0 ? 'нет документов' : `${count} ${documentWord(count)}`}
                  </div>
                </div>
                {reordering ? (
                  <div className="reorder-btns">
                    <button disabled={i === 0} onClick={() => actions.movePerson(person.id, -1)} aria-label="Выше">
                      <Icon name="up" size={16} />
                    </button>
                    <button disabled={i === people.length - 1} onClick={() => actions.movePerson(person.id, 1)} aria-label="Ниже">
                      <Icon name="down" size={16} />
                    </button>
                  </div>
                ) : (
                  <Icon name="chevron" size={18} style={{ color: 'var(--text-hint)' }} />
                )}
              </div>
            );
          })
        )}
      </div>

      {!searching && !reordering && (
        <button className="fab" onClick={() => setEditing('new')}>
          <Icon name="plus" size={20} />
          Человек
        </button>
      )}

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

function ResultThumb({ doc }) {
  const first = doc.pages[0];
  if (first?.kind === PAGE_KINDS.IMAGE) {
    return <Thumb className="doc-thumb" fileId={first.thumbId || first.fileId} alt={doc.title} fallbackIcon="image" />;
  }
  return (
    <div className="doc-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
      <Icon name="file" size={22} />
    </div>
  );
}
