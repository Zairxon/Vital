import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';

const FRAME = 280; // размер превью на экране, px
const OUTPUT = 480; // сторона итогового квадрата, px

/**
 * Перемещение и масштабирование фото перед сохранением в аватар:
 * перетаскивание пальцем/мышью центрирует нужную часть снимка, ползунок
 * увеличивает. Результат — всегда квадратный Blob размером OUTPUT×OUTPUT,
 * который на разных экранах показывается то кругом, то прямоугольником.
 */
export default function AvatarCropper({ blob, onConfirm, onCancel }) {
  const [img, setImg] = useState(null);
  // Зум 1.0 — это ровно «cover»: одна из сторон всегда впритык к рамке,
  // и вдоль неё перетаскивать некуда (свободный ход только по другой оси).
  // Небольшой запас сразу даёт возможность двигать в обе стороны.
  const [zoom, setZoom] = useState(1.2);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);

  useEffect(() => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => setImg(image);
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  if (!img) {
    return (
      <div className="cropper-overlay">
        <div className="empty-text" style={{ color: '#fff' }}>Загрузка фото…</div>
      </div>
    );
  }

  // "cover": вписываем меньшую сторону так, чтобы кадр был закрыт целиком.
  const coverScale = Math.max(FRAME / img.naturalWidth, FRAME / img.naturalHeight);
  const scale = coverScale * zoom;
  const scaledW = img.naturalWidth * scale;
  const scaledH = img.naturalHeight * scale;
  const maxOffsetX = Math.max(0, (scaledW - FRAME) / 2);
  const maxOffsetY = Math.max(0, (scaledH - FRAME) / 2);

  function clampOffset(x, y) {
    return {
      x: Math.min(maxOffsetX, Math.max(-maxOffsetX, x)),
      y: Math.min(maxOffsetY, Math.max(-maxOffsetY, y)),
    };
  }

  function onPointerDown(e) {
    dragRef.current = { startX: e.clientX, startY: e.clientY, origin: offset };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e) {
    if (!dragRef.current) return;
    const { startX, startY, origin } = dragRef.current;
    setOffset(clampOffset(origin.x + (e.clientX - startX), origin.y + (e.clientY - startY)));
  }
  function onPointerUp() {
    dragRef.current = null;
  }

  function confirm() {
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext('2d');
    const k = OUTPUT / FRAME;
    const outScale = scale * k;
    const outW = img.naturalWidth * outScale;
    const outH = img.naturalHeight * outScale;
    const dx = OUTPUT / 2 - outW / 2 + offset.x * k;
    const dy = OUTPUT / 2 - outH / 2 + offset.y * k;
    ctx.drawImage(img, dx, dy, outW, outH);
    canvas.toBlob((out) => onConfirm(out), 'image/jpeg', 0.9);
  }

  return (
    <div className="cropper-overlay">
      <div className="cropper-top">
        <button className="icon-btn" style={{ color: '#fff' }} onClick={onCancel} aria-label="Отмена">
          <Icon name="close" size={22} />
        </button>
        <div style={{ color: '#fff', fontWeight: 600 }}>Расположите фото</div>
        <button className="icon-btn" style={{ color: 'var(--accent)' }} onClick={confirm} aria-label="Готово">
          Готово
        </button>
      </div>

      <div className="cropper-stage">
        <div
          className="cropper-frame"
          style={{ width: FRAME, height: FRAME }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <img
            src={img.src}
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              left: '50%', top: '50%',
              width: scaledW, height: scaledH,
              transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`,
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>

      <div className="cropper-controls">
        <Icon name="image" size={16} style={{ color: 'rgba(255,255,255,.6)' }} />
        <input
          type="range"
          min="1" max="2.5" step="0.01"
          value={zoom}
          onChange={(e) => {
            const nextZoom = Number(e.target.value);
            const nextScale = coverScale * nextZoom;
            const nextMaxX = Math.max(0, (img.naturalWidth * nextScale - FRAME) / 2);
            const nextMaxY = Math.max(0, (img.naturalHeight * nextScale - FRAME) / 2);
            setZoom(nextZoom);
            setOffset((o) => ({
              x: Math.min(nextMaxX, Math.max(-nextMaxX, o.x)),
              y: Math.min(nextMaxY, Math.max(-nextMaxY, o.y)),
            }));
          }}
        />
        <Icon name="image" size={22} style={{ color: 'rgba(255,255,255,.6)' }} />
      </div>
    </div>
  );
}
