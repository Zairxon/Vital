import { useEffect, useRef, useState } from 'react';
import Sheet, { Confirm } from './Sheet.jsx';
import Icon from './Icon.jsx';
import Thumb from './Thumb.jsx';
import { saveBlob, deleteBlob } from '../lib/files.js';
import { makeThumbnail } from '../lib/image.js';
import { pickFromGallery, takePhoto } from '../lib/pick.js';

const AVATAR_SIZE = 320;

/**
 * Добавление и редактирование человека вместе с его мини-фото.
 * Фото пишется на диск только при сохранении — если карточку закрыли,
 * на диске не остаётся лишних файлов.
 */
export default function PersonSheet({ person, docCount = 0, onSave, onRemove, onClose }) {
  const [name, setName] = useState(person?.name || '');
  const [relation, setRelation] = useState(person?.relation || '');
  const [avatarFileId, setAvatarFileId] = useState(person?.avatarFileId || null);
  const [draft, setDraft] = useState(null); // { blob, previewUrl } — новое фото
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(false);

  const draftRef = useRef(null);
  draftRef.current = draft;
  useEffect(() => () => {
    if (draftRef.current?.previewUrl) URL.revokeObjectURL(draftRef.current.previewUrl);
  }, []);

  const canSave = name.trim().length > 0;

  async function pickAvatar(source) {
    setError(null);
    try {
      const picked = source === 'camera' ? await takePhoto() : await pickFromGallery();
      const first = picked[0];
      if (!first) return;
      if (draft?.previewUrl) URL.revokeObjectURL(draft.previewUrl);
      setDraft({ blob: first.blob, previewUrl: URL.createObjectURL(first.blob) });
    } catch (e) {
      setError(
        String(e?.message || '').toLowerCase().includes('permission')
          ? 'Нет доступа к камере или галерее. Разрешите доступ в настройках телефона.'
          : 'Не удалось получить фото. Попробуйте ещё раз.'
      );
    }
  }

  function dropAvatar() {
    if (draft?.previewUrl) URL.revokeObjectURL(draft.previewUrl);
    setDraft(null);
    setAvatarFileId(null);
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      let nextAvatar = avatarFileId;

      if (draft) {
        // Мини-фото показывается кружком 52 px — хранить полный снимок незачем.
        const small = await makeThumbnail(draft.blob, AVATAR_SIZE);
        nextAvatar = await saveBlob(small, 'jpg');
      }

      onSave({ name: name.trim(), relation: relation.trim(), avatarFileId: nextAvatar });

      // Старое фото убираем только после того, как новое записано и сохранено.
      const old = person?.avatarFileId;
      if (old && old !== nextAvatar) await deleteBlob(old);

      onClose();
    } catch {
      setError('Не удалось сохранить фото. Возможно, не хватает места в телефоне.');
      setBusy(false);
    }
  }

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

  const hasPhoto = Boolean(draft || avatarFileId);

  return (
    <Sheet title={person ? 'Изменить' : 'Новый человек'} onClose={busy ? () => {} : onClose}>
      <div className="avatar-edit">
        <div className="avatar-big">
          {draft
            ? <img src={draft.previewUrl} alt="" />
            : avatarFileId
              ? <Thumb fileId={avatarFileId} alt="" style={{ width: '100%', height: '100%' }} fallbackIcon="image" />
              : <span>{(name.trim()[0] || '?').toUpperCase()}</span>}
        </div>

        <div className="avatar-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => pickAvatar('gallery')} disabled={busy}>
            <Icon name="image" size={16} />
            {hasPhoto ? 'Заменить фото' : 'Выбрать фото'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => pickAvatar('camera')} disabled={busy}>
            <Icon name="camera" size={16} />
            Снять
          </button>
          {hasPhoto && (
            <button className="btn btn-danger btn-sm" onClick={dropAvatar} disabled={busy}>
              Убрать
            </button>
          )}
        </div>
      </div>

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

      {error && <div className="banner" style={{ margin: '0 0 var(--space-3)' }}>{error}</div>}

      <div className="sheet-actions">
        <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Отмена</button>
        <button className="btn btn-primary" disabled={!canSave || busy} onClick={save}>
          {busy ? 'Сохраняю…' : 'Сохранить'}
        </button>
      </div>

      {person && (
        <button
          className="btn btn-danger btn-block"
          style={{ marginTop: 'var(--space-2)' }}
          onClick={() => setConfirming(true)}
          disabled={busy}
        >
          Удалить человека
        </button>
      )}
    </Sheet>
  );
}
