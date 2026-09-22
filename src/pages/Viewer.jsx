import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useDb } from '../state/DbContext.jsx';
import { PAGE_KINDS } from '../lib/constants.js';
import { formatBytes, openExternally } from '../lib/files.js';
import Icon from '../components/Icon.jsx';
import ZoomImage from '../components/ZoomImage.jsx';
import DocSheet from '../components/DocSheet.jsx';

export default function Viewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { db, actions } = useDb();
  const [index, setIndex] = useState(0);
  const [editing, setEditing] = useState(false);
  const [openError, setOpenError] = useState(null);

  const doc = db.documents.find((d) => d.id === id);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, (doc?.pages.length || 1) - 1));
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0));
      if (e.key === 'Escape') navigate(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [doc, navigate]);

  if (!doc) return <Navigate to="/" replace />;

  const page = doc.pages[index];
  const total = doc.pages.length;

  function step(delta) {
    setIndex((i) => Math.min(Math.max(i + delta, 0), total - 1));
  }

  async function open() {
    setOpenError(null);
    try {
      await openExternally(page.fileId);
    } catch {
      setOpenError('На телефоне нет приложения, которое открывает такой файл. Установите Word или PDF-читалку.');
    }
  }

  return (
    <div className="viewer">
      <div className="viewer-top">
        <button className="icon-btn" style={{ color: '#fff' }} onClick={() => navigate(-1)} aria-label="Назад">
          <Icon name="back" />
        </button>
        <div className="viewer-counter">
          {doc.title}
          {total > 1 && <div style={{ opacity: .7, fontSize: 'var(--text-xs)' }}>{index + 1} / {total}</div>}
        </div>
        <button
          className={`icon-btn ${doc.pinned ? 'is-active' : ''}`}
          style={{ color: doc.pinned ? 'var(--accent)' : '#fff' }}
          onClick={() => actions.togglePin(doc.id)}
          aria-label={doc.pinned ? 'Открепить' : 'Закрепить'}
        >
          <Icon name="star" filled={doc.pinned} />
        </button>
      </div>

      <div className="viewer-stage">
        {!page ? (
          <div className="viewer-external">
            <Icon name="file" size={40} />
            <div>В документе нет страниц. Добавьте их через «Изменить».</div>
          </div>
        ) : page.kind === PAGE_KINDS.IMAGE ? (
          <ZoomImage key={page.fileId} fileId={page.fileId} alt={doc.title} onSwipe={step} />
        ) : (
          <div className="viewer-external">
            <Icon name="file" size={44} />
            <div>
              <div style={{ fontWeight: 600 }}>{page.name}</div>
              <div style={{ opacity: .7, fontSize: 'var(--text-sm)' }}>{formatBytes(page.size || 0)}</div>
            </div>
            <button className="btn btn-primary" onClick={open}>
              Открыть {page.kind === PAGE_KINDS.PDF ? 'PDF' : 'в Word'}
            </button>
            {openError && <div style={{ fontSize: 'var(--text-sm)', color: '#E08B72' }}>{openError}</div>}
          </div>
        )}

        {total > 1 && (
          <>
            <NavArrow side="left" disabled={index === 0} onClick={() => step(-1)} />
            <NavArrow side="right" disabled={index === total - 1} onClick={() => step(1)} />
          </>
        )}
      </div>

      <div className="viewer-bottom">
        <button className="viewer-action" disabled style={{ opacity: .45 }}>
          <Icon name="share" size={20} />
          Отправить
        </button>
        <button className="viewer-action" onClick={() => setEditing(true)}>
          <Icon name="edit" size={20} />
          Изменить
        </button>
        <button className="viewer-action" style={{ color: '#E08B72' }} onClick={() => setEditing('remove')}>
          <Icon name="trash" size={20} />
          Удалить
        </button>
      </div>

      {editing && (
        <DocSheet
          db={db}
          doc={doc}
          startWithConfirm={editing === 'remove'}
          onUpdate={(docId, data) => {
            actions.updateDocument(docId, data);
            setIndex((i) => Math.min(i, Math.max(data.pages.length - 1, 0)));
          }}
          onRemove={() => { actions.removeDocument(doc.id); navigate(-1); }}
          onAddType={(label) => {
            const next = actions.addCustomType(label);
            return next.customTypes[next.customTypes.length - 1].id;
          }}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}

function NavArrow({ side, disabled, onClick }) {
  if (disabled) return null;
  return (
    <button
      onClick={onClick}
      aria-label={side === 'left' ? 'Предыдущая страница' : 'Следующая страница'}
      style={{
        position: 'absolute', top: '50%', [side]: 8, transform: 'translateY(-50%)',
        width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,.45)',
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Icon name={side === 'left' ? 'back' : 'chevron'} size={20} />
    </button>
  );
}
