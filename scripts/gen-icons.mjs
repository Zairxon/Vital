// Генерирует иконку Vital (документ с фото внутри, тема Botanical Earth)
// для всех плотностей Android — без внешних инструментов, чистым Node.
// Растеризация: заливка многоугольников со сканлайнами + 2x-суперсэмплинг
// для сглаживания краёв. PNG кодируется вручную через встроенный zlib.

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RES = join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

// ── Растеризация полигонов ──────────────────────────────────────────────

function polygonFill(pixels, size, points, color) {
  const [r, g, b, a] = color;
  const ys = points.map((p) => p[1]);
  const yMin = Math.max(0, Math.floor(Math.min(...ys)));
  const yMax = Math.min(size - 1, Math.ceil(Math.max(...ys)));

  for (let y = yMin; y <= yMax; y++) {
    const yc = y + 0.5;
    const xs = [];
    for (let i = 0; i < points.length; i++) {
      const [x1, y1] = points[i];
      const [x2, y2] = points[(i + 1) % points.length];
      if ((y1 <= yc && y2 > yc) || (y2 <= yc && y1 > yc)) {
        xs.push(x1 + ((yc - y1) / (y2 - y1)) * (x2 - x1));
      }
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) {
      const xStart = Math.max(0, Math.round(xs[i]));
      const xEnd = Math.min(size - 1, Math.round(xs[i + 1]) - 1);
      for (let x = xStart; x <= xEnd; x++) {
        const idx = (y * size + x) * 4;
        // Простое альфа-смешение поверх уже нарисованного (для сглаживания краёв).
        pixels[idx] = r; pixels[idx + 1] = g; pixels[idx + 2] = b; pixels[idx + 3] = a;
      }
    }
  }
}

function hex(c) {
  const v = c.replace('#', '');
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16), 255];
}

/** Рисует иконку в буфере size×size (с суперсэмплингом ssize = size*scale). */
function renderIcon(size, withBackground) {
  const scale = 4; // суперсэмплинг для сглаживания
  const ss = size * scale;
  const px = new Uint8ClampedArray(ss * ss * 4); // изначально прозрачный (alpha=0)

  if (withBackground) {
    for (let i = 0; i < px.length; i += 4) {
      const [r, g, b, a] = hex('#1C1612');
      px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = a;
    }
  }

  const s = ss / 108;
  const scalePts = (pts) => pts.map(([x, y]) => [x * s, y * s]);

  polygonFill(px, ss, scalePts([[32, 20], [64, 20], [76, 32], [76, 88], [32, 88]]), hex('#C4933F'));
  polygonFill(px, ss, scalePts([[64, 20], [76, 32], [64, 32]]), hex('#A97A32'));
  polygonFill(px, ss, scalePts([[42, 40], [66, 40], [66, 64], [42, 64]]), hex('#F5EDE0'));

  // Даунсэмплинг: усредняем блоки scale×scale в финальные пиксели.
  const out = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const idx = ((y * scale + dy) * ss + (x * scale + dx)) * 4;
          r += px[idx]; g += px[idx + 1]; b += px[idx + 2]; a += px[idx + 3];
        }
      }
      const n = scale * scale;
      const oidx = (y * size + x) * 4;
      out[oidx] = r / n; out[oidx + 1] = g / n; out[oidx + 2] = b / n; out[oidx + 3] = a / n;
    }
  }
  return out;
}

// ── Минимальный PNG-энкодер (8-бит RGBA, без палитры) ────────────────────

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(pixels, size) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // Каждая строка — байт фильтра (0 = None) + RGBA-пиксели.
  const raw = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + size * 4);
    raw[rowStart] = 0;
    for (let x = 0; x < size; x++) {
      const srcIdx = (y * size + x) * 4;
      const dstIdx = rowStart + 1 + x * 4;
      raw[dstIdx] = pixels[srcIdx];
      raw[dstIdx + 1] = pixels[srcIdx + 1];
      raw[dstIdx + 2] = pixels[srcIdx + 2];
      raw[dstIdx + 3] = pixels[srcIdx + 3];
    }
  }

  const idat = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function savePng(size, withBackground, path) {
  const pixels = renderIcon(size, withBackground);
  writeFileSync(path, encodePng(pixels, size));
}

// ── Генерация всех плотностей ────────────────────────────────────────────

const densities = {
  mdpi: { legacy: 48, fg: 108 },
  hdpi: { legacy: 72, fg: 162 },
  xhdpi: { legacy: 96, fg: 216 },
  xxhdpi: { legacy: 144, fg: 324 },
  xxxhdpi: { legacy: 192, fg: 432 },
};

for (const [name, { legacy, fg }] of Object.entries(densities)) {
  const dir = join(RES, `mipmap-${name}`);
  mkdirSync(dir, { recursive: true });
  savePng(legacy, true, join(dir, 'ic_launcher.png'));
  savePng(legacy, true, join(dir, 'ic_launcher_round.png'));
  savePng(fg, false, join(dir, 'ic_launcher_foreground.png'));
  console.log(`${name}: legacy ${legacy}px, foreground ${fg}px`);
}

console.log('Готово.');
