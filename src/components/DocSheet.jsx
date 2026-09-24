import { useEffect, useMemo, useRef, useState } from 'react';
import Sheet, { Confirm } from './Sheet.jsx';
import Icon from './Icon.jsx';
import Thumb from './Thumb.jsx';
import { saveBlob, deleteBlobs, extFor, formatBytes } from '../lib/files.js';
import { makeThumbnail } from '../lib/image.js';
import { allTypes } from '../lib/model.js';
import { PAGE_KINDS } from '../lib/constants.js';

const NEW_TYPE = '__new';

export function kindOf(mime) {
  if (mime?.startsWith('image/')) return PAGE_KINDS.IMAGE;
  if (mime === 'application/pdf') return PAGE_KINDS.PDF;
  return PAGE_KINDS.DOC;
}

/**
 * Создание и редактирование документа. Байты пишутся на диск только при
 * сохранении — если модалку закрыли, на диске не остаётся мусора.
 */
export default function DocSheet({ db, doc, picked = [], startWithConfirm = false, onCreate, onUpdate, onRemove, onAddType, onClose }) {
  const [title, setTitle] = useState(doc?.title || '');
  const [type, setType] = useState(doc?.type || 'passport');
  const [newType, setNewType] = useState('');
  const [note, setNote] = useState(doc?.note || '');
  const [expiryDate, setExpiryDate] = useState(doc?.expiryDate || '');
  const [pages, setPages] = useState(() => [
    ...(doc?.pages || []).map((p) => ({ kind: 'saved', page: p })),
    ...picked.map((p) => ({ kind: 'fresh', ...p, previewUrl: URL.createObjectURL(p.blob) })),
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(startWithConfirm);
  const [pickingType, setPickingType] = useState(false);

  // Ссылки на превью освобождаются один раз при закрытии модалки: если
  // чистить их на каждое изменение pages, удаление одной страницы погасит
  // превью всех остальных.
  const pagesRef = useRef(pages);
  pagesRef.current = pages;
  useEffect(() => () => {
    pagesRef.current.forEach((p) => p.previewUrl && URL.revokeObjectURL(p.previewUrl));
  }, []);

  const types = useMemo(() => allTypes(db), [db]);
  const canSave = title.trim().length > 0 && (type !== NEW_TYPE || newType.trim().length > 0);
  const typeLabel = type === NEW_TYPE
    ? 'Свой тип…'
    : (types.find((t) => t.id === type)?.label || 'Выберите тип');

  function removePage(index) {
    setPages((prev) => prev.filter((_, i) => i !== index));
  }

  async function save() {
    setBusy(true);
    setError(null);
    const written = [];
    try {
      let typeId = type;
      if (type === NEW_TYPE) typeId = onAddType(newType.trim());

      const finalPages = [];
      for (const item of pages) {
        if (item.kind === 'saved') { finalPages.push(item.page); continue; }

        const ext = extFor(item.mime, item.name);
        const fileId = await saveBlob(item.blob, ext);
        written.push(fileId);

        let thumbId = null;
        if (kindOf(item.mime) === PAGE_KINDS.IMAGE) {
          try {
            thumbId = await saveBlob(await makeThumbnail(item.blob), 'jpg');
            written.push(thumbId);
          } catch {
            thumbId = null; // без миниатюры список просто покажет полное фото
          }
        }

        finalPages.push({
          fileId, thumbId, kind: kindOf(item.mime), mime: item.mime,
          size: item.blob.size, name: item.name,
        });
      }

      // Страницы, которые убрали при редактировании, стираем с диска.
      const keptIds = new Set(finalPages.flatMap((p) => [p.fileId, p.thumbId]).filter(Boolean));
      const dropped = (doc?.pages || [])
        .flatMap((p) => [p.fileId, p.thumbId])
        .filter((id) => id && !keptIds.has(id));

      const data = {
        type: typeId, title: title.trim(), note: note.trim(),
        expiryDate: expiryDate || null, pages: finalPages,
      };
      if (doc) onUpdate(doc.id, data);
      else onCreate(data);

      if (dropped.length) await deleteBlobs(dropped);
      onClose();
    } catch (e) {
      // Записанное до ошибки убираем — в базе этих страниц всё равно нет.
      await deleteBlobs(written);
      setError(e?.message?.includes('space') || e?.name === 'QuotaExceededError'
        ? 'Не хватает места в телефоне. Освободите место и попробуйте снова.'
        : 'Не удалось сохранить документ. Попробуйте ещё раз.');
      setBusy(false);
    }
  }

  if (confirming) {
    return (
      <Confirm
        title="Удалить документ?"
        text={`«${doc.title}» и все его страницы (${doc.pages.length}) будут стёрты без возможности восстановить.`}
        onConfirm={onRemove}
        onClose={onClose}
      />
    );
  }

  if (pickingType) {
    return (
      <Sheet title="Тип документа" onClose={() => setPickingType(false)}>
        <div className="type-picker-list">
          {types.map((t) => (
            <button
              key={t.id}
              className={`type-picker-row ${type === t.id ? 'is-selected' : ''}`}
              onClick={() => { setType(t.id); setPickingType(false); }}
            >
              <span className="type-picker-icon">{t.icon || '📁'}</span>
              <span className="type-picker-label">{t.label}</span>
              {type === t.id && <Icon name="chevron" size={16} style={{ color: 'var(--accent)', transform: 'rotate(90deg)' }} />}
            </button>
          ))}
          <button
            className={`type-picker-row ${type === NEW_TYPE ? 'is-selected' : ''}`}
            onClick={() => { setType(NEW_TYPE); setPickingType(false); }}
          >
            <span className="type-picker-icon"><Icon name="plus" size={16} /></span>
            <span className="type-picker-label">Свой тип…</span>
          </button>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet title={doc ? 'Изменить документ' : 'Новый документ'} onClose={busy ? () => {} : onClose}>
      {pages.length > 0 && (
        <div className="page-grid">
          {pages.map((item, i) => (
            <div className="page-tile" key={i}>
              {item.kind === 'fresh'
                ? (kindOf(item.mime) === PAGE_KINDS.IMAGE
                  ? <img src={item.previewUrl} alt="" />
                  : <FileTile name={item.name} size={item.blob.size} />)
                : (item.page.kind === PAGE_KINDS.IMAGE
                  ? <Thumb fileId={item.page.thumbId || item.page.fileId} style={{ width: '100%', height: '100%' }} />
                  : <FileTile name={item.page.name} size={item.page.size} />)}
              <button className="page-tile-remove" onClick={() => removePage(i)} aria-label="Убрать страницу">
                <Icon name="close" size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="field">
        <label htmlFor="doc-type-btn">Тип документа</label>
        <button
          id="doc-type-btn"
          type="button"
          className="type-picker-trigger"
          onClick={() => setPickingType(true)}
        >
          <span>{typeLabel}</span>
          <Icon name="chevron" size={16} style={{ color: 'var(--text-hint)', transform: 'rotate(90deg)' }} />
        </button>
      </div>

      {type === NEW_TYPE && (
        <div className="field">
          <label htmlFor="doc-newtype">Название типа</label>
          <input id="doc-newtype" value={newType} placeholder="Например, Загранпаспорт"
            onChange={(e) => setNewType(e.target.value)} />
        </div>
      )}

      <div className="field">
        <label htmlFor="doc-title">Название</label>
        <input id="doc-title" value={title} placeholder="Например, Паспорт AA1234567"
          onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="field">
        <label htmlFor="doc-note">Заметка</label>
        <input id="doc-note" value={note} placeholder="Необязательно"
          onChange={(e) => setNote(e.target.value)} />
      </div>

      <div className="field">
        <label htmlFor="doc-expiry">Срок действия</label>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <input
            id="doc-expiry"
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            style={{ flex: 1 }}
          />
          {expiryDate && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setExpiryDate('')}
              aria-label="Убрать срок действия"
            >
              <Icon name="close" size={16} />
            </button>
          )}
        </div>
        <div className="field-hint">Необязательно. Напомним за 10 дней до истечения.</div>
      </div>

      {error && (
        <div className="banner" style={{ margin: '0 0 var(--space-3)' }}>{error}</div>
      )}

      <div className="sheet-actions">
        <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Отмена</button>
        <button className="btn btn-primary" disabled={!canSave || busy} onClick={save}>
          {busy ? 'Сохраняю…' : 'Сохранить'}
        </button>
      </div>

      {doc && (
        <button className="btn btn-danger btn-block" style={{ marginTop: 'var(--space-2)' }}
          onClick={() => setConfirming(true)}>
          Удалить документ
        </button>
      )}
    </Sheet>
  );
}

function FileTile({ name, size }) {
  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 2,
      color: 'var(--text-muted)', fontSize: 10, padding: 4, textAlign: 'center',
    }}>
      <Icon name="file" size={18} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
        {name}
      </span>
      <span>{formatBytes(size)}</span>
    </div>
  );
}
