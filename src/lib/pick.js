import { isNative } from './platform.js';

/**
 * Выбор изображений. На телефоне — плагин камеры, в браузере — обычный
 * <input type="file">. Наружу в обоих случаях уходят Blob-ы, поэтому
 * остальной код про разницу не знает.
 */

function pickViaInput({ accept, multiple = false, capture = null }) {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = multiple;
    if (capture) input.capture = capture;
    input.style.display = 'none';
    document.body.appendChild(input);

    input.onchange = () => {
      const files = Array.from(input.files || []);
      input.remove();
      resolve(files.map((f) => ({ blob: f, name: f.name, mime: f.type || 'application/octet-stream' })));
    };
    // Отмена в системном диалоге не вызывает onchange ни в одном браузере
    // одинаково — поэтому подчищаем элемент при возврате фокуса на окно.
    window.addEventListener('focus', () => setTimeout(() => input.remove(), 1000), { once: true });
    input.click();
  });
}

async function camera() {
  const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
  return { Camera, CameraResultType, CameraSource };
}

async function webPathToBlob(webPath) {
  const res = await fetch(webPath);
  return res.blob();
}

/** Снять камерой одну страницу. */
export async function takePhoto() {
  if (!isNative()) {
    return pickViaInput({ accept: 'image/*', capture: 'environment' });
  }
  const { Camera, CameraResultType, CameraSource } = await camera();
  const photo = await Camera.getPhoto({
    quality: 85,
    allowEditing: false,
    resultType: CameraResultType.Uri,
    source: CameraSource.Camera,
    promptLabelHeader: 'Снимок документа',
  });
  const blob = await webPathToBlob(photo.webPath);
  return [{ blob, name: `photo.${photo.format || 'jpg'}`, mime: blob.type || 'image/jpeg' }];
}

/** Типы файлов, которые приложение принимает помимо фотографий. */
export const FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

/** Выбрать файлы с телефона — сканы PDF и объективки в Word. */
export async function pickFiles() {
  if (!isNative()) {
    return pickViaInput({ accept: FILE_TYPES.join(','), multiple: true });
  }

  const { FilePicker } = await import('@capawesome/capacitor-file-picker');
  const result = await FilePicker.pickFiles({ types: FILE_TYPES, readData: true });

  const out = [];
  for (const file of result.files || []) {
    const bytes = Uint8Array.from(atob(file.data), (c) => c.charCodeAt(0));
    const mime = file.mimeType || 'application/octet-stream';
    out.push({ blob: new Blob([bytes], { type: mime }), name: file.name, mime });
  }
  return out;
}

/** Выбрать одно или несколько фото из галереи. */
export async function pickFromGallery() {
  if (!isNative()) {
    return pickViaInput({ accept: 'image/*', multiple: true });
  }
  const { Camera } = await camera();
  const result = await Camera.pickImages({ quality: 85 });
  const out = [];
  for (const photo of result.photos || []) {
    const blob = await webPathToBlob(photo.webPath);
    out.push({ blob, name: `photo.${photo.format || 'jpg'}`, mime: blob.type || 'image/jpeg' });
  }
  return out;
}
