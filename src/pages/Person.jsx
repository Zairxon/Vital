import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useDb } from '../state/DbContext.jsx';
import { documentsOf } from '../lib/model.js';
import { groupByType } from '../lib/search.js';
import { takePhoto, pickFromGallery, pickFiles } from '../lib/pick.js';
import { PAGE_KINDS } from '../lib/constants.js';
import CopyText from '../components/CopyText.jsx';
import Icon from '../components/Icon.jsx';
import Thumb from '../components/Thumb.jsx';
import AddSheet from '../components/AddSheet.jsx';
import DocSheet from '../components/DocSheet.jsx';
import PersonSheet from '../components/PersonSheet.jsx';
import ExpiryBadge from '../components/ExpiryBadge.jsx';
import { documentWord, pageWord } from '../lib/format.js';

export default function Person() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { db, actions } = useDb();

  const [choosing, setChoosing] = useState(false);
  const [draft, setDraft] = useState(null); // выбранные страницы для нового документа
  const [editingPerson, setEditingPerson] = useState(false);
  const [error, setError] = useState(null);

  const person = db.people.find((p) => p.id === id);
  if (!person) return <Navigate to="/" replace />;

  const docs = documentsOf(db, person.id);
  const groups = groupByType(db, docs);

  async function pick(source) {
    setError(null);
    try {
      const picked = source === 'camera' ? await takePhoto()
        : source === 'file' ? await pickFiles()
          : await pickFromGallery();
      if (picked.length) setDraft(picked);
    } catch (e) {
      const permission = String(e?.message || '').toLowerCase().includes('permission');
      setError(
        permission
          ? 'Нет доступа к камере, галерее или файлам. Разрешите доступ в настройках телефона.'
          : source === 'file'
            ? 'Не удалось прочитать файл. Попробуйте выбрать другой.'
            : 'Не удалось получить фото. Попробуйте ещё раз.'
      );
    }
  }

  const metaText = `${person.relation ? `${person.relation} · ` : ''}${
    docs.length === 0 ? 'нет документов' : `${docs.length} ${documentWord(docs.length)}`
  }`;

  // Кнопки «назад» здесь нет нарочно — с этого экрана уходят только жестом
  // (или системной кнопкой назад), это ловит BackButtonRouter в App.jsx.
  return (
    <div className="screen">
      <div className="person-top">
        <button className="icon-btn" onClick={() => setEditingPerson(true)} aria-label="Изменить">
          <Icon name="edit" size={20} />
        </button>
      </div>

      <div className="person-hero-wrap">
        <div className="person-hero-frame">
          {person.avatarFileId
            ? <Thumb fileId={person.avatarFileId} alt="" className="person-hero-img" fallbackIcon="image" />
            : (person.name[0] || '?').toUpperCase()}
        </div>
        <div className="person-hero-name">{person.name}</div>
        <div className="person-hero-sub">{metaText}</div>
      </div>

      {error && (
        <div className="banner">
          <span style={{ flex: 1 }}>{error}</span>
          <button onClick={() => setError(null)} aria-label="Скрыть"><Icon name="close" size={16} /></button>
        </div>
      )}

      <div className="screen-body">
        {docs.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📄</div>
            <div className="empty-title">Документов нет</div>
            <div className="empty-text">
              Снимите паспорт камерой или выберите готовые фото из галереи.
            </div>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.typeId}>
              <div className="group-title">
                {group.typeId === '__pinned' && <Icon name="star" size={13} filled />}
                {group.label}
              </div>
              {group.items.map((doc) => (
                <button key={doc.id} className="doc-card" onClick={() => navigate(`/doc/${doc.id}`)}>
                  <DocThumb doc={doc} />
                  <div className="doc-info">
                    <div className="doc-title">{doc.title}</div>
                    <div className="doc-meta">
                      {doc.pages.length === 0 ? 'нет страниц' : `${doc.pages.length} ${pageWord(doc.pages.length)}`}
                      {doc.note && <> · <CopyText text={doc.note} /></>}
                    </div>
                    <ExpiryBadge expiryDate={doc.expiryDate} />
                  </div>
                  {doc.pinned && <Icon name="star" size={16} filled style={{ color: 'var(--accent)' }} />}
                </button>
              ))}
            </div>
          ))
        )}
      </div>

      <button className="fab" onClick={() => setChoosing(true)}>
        <Icon name="plus" size={20} />
        Документ
      </button>

      {choosing && <AddSheet onPick={pick} onClose={() => setChoosing(false)} />}

      {draft && (
        <DocSheet
          db={db}
          picked={draft}
          onCreate={(data) => actions.addDocument({ personId: person.id, ...data })}
          onAddType={(label) => {
            const next = actions.addCustomType(label);
            return next.customTypes[next.customTypes.length - 1].id;
          }}
          onClose={() => setDraft(null)}
        />
      )}

      {editingPerson && (
        <PersonSheet
          person={person}
          docCount={docs.length}
          onSave={(data) => actions.updatePerson(person.id, data)}
          onRemove={() => { actions.removePerson(person.id); navigate('/'); }}
          onClose={() => setEditingPerson(false)}
        />
      )}
    </div>
  );
}

function DocThumb({ doc }) {
  const first = doc.pages[0];
  if (!first) return <div className="doc-thumb" />;
  if (first.kind === PAGE_KINDS.IMAGE) {
    return <Thumb className="doc-thumb" fileId={first.thumbId || first.fileId} alt={doc.title} fallbackIcon="image" />;
  }
  return (
    <div className="doc-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
      <Icon name="file" size={22} />
    </div>
  );
}
