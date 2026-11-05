/**
 * Genera public/images/platform/mark.png — favicon genérico de Growth OS.
 * No es el isotipo de SEM.
 */
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { fileURLToPath } from "url";

const PRIMARY = [0x6d, 0x28, 0xd9, 255];
const ACCENT = [0x22, 0xd3, 0xee, 255];
const WHITE = [255, 255, 255, 255];
const CLEAR = [0, 0, 0, 0];

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crcBuf]);
}

function starPoly(cx, cy, outer, inner) {
  const pts = [];
  const rot = -Math.PI / 2;
  for (let i = 0; i < 8; i++) {
    const rad = i % 2 === 0 ? outer : inner;
    const a = rot + (i * Math.PI) / 4;
    pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
  }
  return pts;
}

function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0];
    const yi = poly[i][1];
    const xj = poly[j][0];
    const yj = poly[j][1];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 0.0) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function insideRoundRect(px, py, size, radius) {
  const r = radius;
  const cx = Math.min(Math.max(px, r), size - r);
  const cy = Math.min(Math.max(py, r), size - r);
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= r * r;
}

function sample(x, y, size) {
  const radius = size * 0.3;
  const corner = size * 0.34;
  if (!insideRoundRect(x, y, size, radius)) return CLEAR;

  const stars = [
    starPoly(size * 0.46, size * 0.46, size * 0.28, size * 0.11),
    starPoly(size * 0.74, size * 0.24, size * 0.09, size * 0.035),
    starPoly(size * 0.26, size * 0.72, size * 0.055, size * 0.022),
  ];
  for (const poly of stars) {
    if (pointInPoly(x, y, poly)) return WHITE;
  }

  if (x >= size - corner && y >= size - corner) return ACCENT;
  return PRIMARY;
}

function blend(samples) {
  let r = 0;
  let g = 0;
  let b = 0;
  let a = 0;
  for (const s of samples) {
    r += s[0] * s[3];
    g += s[1] * s[3];
    b += s[2] * s[3];
    a += s[3];
  }
  if (a === 0) return CLEAR;
  const n = samples.length;
  return [
    Math.round(r / a),
    Math.round(g / a),
    Math.round(b / a),
    Math.round(a / n),
  ];
}

function png(size) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  const step = 1 / 3;
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < size; x++) {
      const samples = [];
      for (let sy = 0; sy < 3; sy++) {
        for (let sx = 0; sx < 3; sx++) {
          samples.push(sample(x + (sx + 0.5) * step, y + (sy + 0.5) * step, size));
        }
      }
      const [r, g, b, a] = blend(samples);
      const i = row + 1 + x * 4;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
      raw[i + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "public", "images", "platform");
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, "mark.png"), png(64));
console.log("wrote public/images/platform/mark.png");
