import { useEffect, useState } from 'react';
import { getDisplayUrl } from '../lib/files.js';
import Icon from './Icon.jsx';

/**
 * Картинка по идентификатору файла. Если файл стёрли снаружи, показывает
 * заглушку — один потерянный файл не должен ломать весь список.
 */
export default function Thumb({ fileId, alt = '', className, style, fallbackIcon = 'file' }) {
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setUrl(null);
    setFailed(false);
    if (!fileId) { setFailed(true); return; }

    getDisplayUrl(fileId)
      .then((u) => !cancelled && setUrl(u))
      .catch(() => !cancelled && setFailed(true));
    return () => { cancelled = true; };
  }, [fileId]);

  if (failed) {
    return (
      <div className={className} style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-elevated)', color: 'var(--text-hint)' }}>
        <Icon name={fallbackIcon} size={20} />
      </div>
    );
  }

  if (!url) return <div className={className} style={{ ...style, background: 'var(--bg-elevated)' }} />;

  return (
    <img
      src={url}
      alt={alt}
      className={className}
      style={{ ...style, objectFit: 'cover' }}
      onError={() => setFailed(true)}
    />
  );
}
