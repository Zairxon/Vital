import { useEffect, useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { getDisplayUrl } from '../lib/files.js';
import Icon from './Icon.jsx';

/**
 * Страница-картинка на весь экран. Пока масштаб равен 1, горизонтальный
 * свайп листает страницы; после увеличения свайп двигает саму картинку —
 * иначе при разглядывании печати лист уезжает на следующую страницу.
 */
export default function ZoomImage({ fileId, alt, onSwipe, onScaleChange }) {
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);
  const [scale, setScale] = useState(1);
  const [touchStart, setTouchStart] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setUrl(null);
    setFailed(false);
    getDisplayUrl(fileId)
      .then((u) => !cancelled && setUrl(u))
      .catch(() => !cancelled && setFailed(true));
    return () => { cancelled = true; };
  }, [fileId]);

  if (failed) {
    return (
      <div className="viewer-external">
        <Icon name="image" size={40} />
        <div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Файл не найден</div>
          <div style={{ fontSize: 'var(--text-sm)', opacity: .7 }}>
            Похоже, его удалили из памяти телефона.<br />Замените страницу через «Изменить».
          </div>
        </div>
      </div>
    );
  }

  if (!url) return <div className="viewer-external" style={{ opacity: .6 }}>Загрузка…</div>;

  return (
    <div
      style={{ width: '100%', height: '100%' }}
      onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchStart === null || scale > 1.05) return;
        const dx = e.changedTouches[0].clientX - touchStart;
        if (Math.abs(dx) > 60) onSwipe(dx < 0 ? 1 : -1);
        setTouchStart(null);
      }}
    >
      <TransformWrapper
        doubleClick={{ mode: 'toggle', step: 1.5 }}
        maxScale={6}
        onTransformed={(ref) => {
          setScale(ref.state.scale);
          onScaleChange?.(ref.state.scale);
        }}
      >
        <TransformComponent
          wrapperStyle={{ width: '100%', height: '100%' }}
          contentStyle={{ width: '100%', height: '100%' }}
        >
          <img
            src={url}
            alt={alt}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onError={() => setFailed(true)}
          />
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}
