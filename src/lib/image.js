/**
 * Миниатюры для списков: полные фото паспортов весят мегабайты, и держать
 * их в памяти ради плитки 80×80 нельзя — список начнёт тормозить.
 */
export const THUMB_WIDTH = 400;

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Не удалось прочитать изображение'));
    img.src = url;
  });
}

export async function makeThumbnail(blob, maxWidth = THUMB_WIDTH) {
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, maxWidth / img.naturalWidth);
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(img, 0, 0, width, height);

    return await new Promise((resolve, reject) => {
      canvas.toBlob(
        (out) => (out ? resolve(out) : reject(new Error('Не удалось создать миниатюру'))),
        'image/jpeg',
        0.8
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
