import fs from "node:fs";
import zlib from "node:zlib";

const source = "c:/Users/semip/Downloads/SEM(1).ai";
const b = fs.readFileSync(source);
const start = b.indexOf(Buffer.from("9 0 obj"));
let p = b.indexOf(Buffer.from("stream"), start) + 6;
if (b[p] === 13) p++;
if (b[p] === 10) p++;
const text = zlib.inflateSync(b.slice(p, p + 92656)).toString("latin1");
const tokens = text.split(/\s+/).filter(Boolean);

function mul(m, n) {
  const [a, b0, c, d, e, f] = m;
  const [a2, b2, c2, d2, e2, f2] = n;
  return [
    a * a2 + c * b2,
    b0 * a2 + d * b2,
    a * c2 + c * d2,
    b0 * c2 + d * d2,
    a * e2 + c * f2 + e,
    b0 * e2 + d * f2 + f,
  ];
}

function apply(m, x, y) {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

let ctm = [1, 0, 0, 1, 0, 0];
const stack = [];
let path = [];
let color = "#002A47";
const shapes = [];

function setColorFrom(kind, nums) {
  if (kind === "g") {
    const v = Math.round(Number(nums[0]) * 255);
    color = `rgb(${v},${v},${v})`;
    return;
  }
  const [r, g, bl] = nums.slice(-3).map((n) => Math.round(Number(n) * 255));
  color = `rgb(${r},${g},${bl})`;
}

let i = 0;
while (i < tokens.length) {
  const t = tokens[i];
  if (t === "q") {
    stack.push({ ctm: [...ctm], color });
    i += 1;
    continue;
  }
  if (t === "Q") {
    const saved = stack.pop();
    if (saved) {
      ctm = saved.ctm;
      color = saved.color;
    }
    i += 1;
    continue;
  }
  if (t === "cm") {
    ctm = mul(ctm, tokens.slice(i - 6, i).map(Number));
    i += 1;
    continue;
  }
  if (t === "m" || t === "l") {
    const [x, y] = apply(ctm, ...tokens.slice(i - 2, i).map(Number));
    path.push(`${t === "m" ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`);
    i += 1;
    continue;
  }
  if (t === "c") {
    const n = tokens.slice(i - 6, i).map(Number);
    const p1 = apply(ctm, n[0], n[1]);
    const p2 = apply(ctm, n[2], n[3]);
    const p3 = apply(ctm, n[4], n[5]);
    path.push(
      `C${p1[0].toFixed(2)} ${p1[1].toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)} ${p3[0].toFixed(2)} ${p3[1].toFixed(2)}`
    );
    i += 1;
    continue;
  }
  if (t === "h") {
    path.push("Z");
    i += 1;
    continue;
  }
  if (t === "re") {
    const [x, y, w, h] = tokens.slice(i - 4, i).map(Number);
    const a = apply(ctm, x, y);
    const br = apply(ctm, x + w, y);
    const tr = apply(ctm, x + w, y + h);
    const tl = apply(ctm, x, y + h);
    path.push(
      `M${a[0].toFixed(2)} ${a[1].toFixed(2)} L${br[0].toFixed(2)} ${br[1].toFixed(2)} L${tr[0].toFixed(2)} ${tr[1].toFixed(2)} L${tl[0].toFixed(2)} ${tl[1].toFixed(2)} Z`
    );
    i += 1;
    continue;
  }
  if (t === "g") {
    setColorFrom("g", [tokens[i - 1]]);
    i += 1;
    continue;
  }
  if (t === "rg" || t === "scn") {
    const count = t === "rg" ? 3 : 3;
    setColorFrom(t, tokens.slice(i - count, i));
    i += 1;
    continue;
  }
  if (t === "f" || t === "f*") {
    if (path.length) {
      const nums = path.join(" ").match(/-?\d+\.?\d*/g)?.map(Number) ?? [];
      const xs = [];
      const ys = [];
      for (let k = 0; k < nums.length; k += 2) {
        xs.push(nums[k]);
        ys.push(nums[k + 1]);
      }
      shapes.push({
        color,
        d: path.join(" "),
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minY: Math.min(...ys),
        maxY: Math.max(...ys),
      });
    }
    path = [];
    i += 1;
    continue;
  }
  if (t === "n" || t === "S" || t === "B" || t === "b") {
    path = [];
    i += 1;
    continue;
  }
  i += 1;
}

const colors = {};
for (const shape of shapes) colors[shape.color] = (colors[shape.color] || 0) + 1;
console.log("shapes", shapes.length, colors);

let minX = Infinity;
let minY = Infinity;
let maxX = -Infinity;
let maxY = -Infinity;
for (const shape of shapes) {
  if (shape.maxX - shape.minX > 2000 && shape.maxY - shape.minY > 2000) continue;
  minX = Math.min(minX, shape.minX);
  minY = Math.min(minY, shape.minY);
  maxX = Math.max(maxX, shape.maxX);
  maxY = Math.max(maxY, shape.maxY);
}
console.log("content bbox", { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY });

const buckets = new Map();
for (const shape of shapes) {
  const key = `${Math.round(shape.minX / 400)}:${Math.round(shape.minY / 400)}`;
  const bucket = buckets.get(key) ?? { key, n: 0, colors: {}, minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  bucket.n += 1;
  bucket.colors[shape.color] = (bucket.colors[shape.color] || 0) + 1;
  bucket.minX = Math.min(bucket.minX, shape.minX);
  bucket.minY = Math.min(bucket.minY, shape.minY);
  bucket.maxX = Math.max(bucket.maxX, shape.maxX);
  bucket.maxY = Math.max(bucket.maxY, shape.maxY);
  buckets.set(key, bucket);
}
const columns = new Map();
for (const shape of shapes) {
  const cx = (shape.minX + shape.maxX) / 2;
  const cy = (shape.minY + shape.maxY) / 2;
  const key = `${Math.round(cx / 700)}:${cy < 3000 ? "top" : "bot"}`;
  const bucket = columns.get(key) ?? {
    key,
    n: 0,
    colors: {},
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  };
  bucket.n += 1;
  bucket.colors[shape.color] = (bucket.colors[shape.color] || 0) + 1;
  bucket.minX = Math.min(bucket.minX, shape.minX);
  bucket.minY = Math.min(bucket.minY, shape.minY);
  bucket.maxX = Math.max(bucket.maxX, shape.maxX);
  bucket.maxY = Math.max(bucket.maxY, shape.maxY);
  columns.set(key, bucket);
}
for (const bucket of [...columns.values()].sort((a, b) => a.minX - b.minX)) {
  console.log(
    bucket.key,
    "n",
    bucket.n,
    "box",
    Math.round(bucket.minX),
    Math.round(bucket.minY),
    Math.round(bucket.maxX),
    Math.round(bucket.maxY),
    bucket.colors
  );
}

function writeCrop(filename, selected) {
  let cMinX = Infinity;
  let cMinY = Infinity;
  let cMaxX = -Infinity;
  let cMaxY = -Infinity;
  for (const shape of selected) {
    cMinX = Math.min(cMinX, shape.minX);
    cMinY = Math.min(cMinY, shape.minY);
    cMaxX = Math.max(cMaxX, shape.maxX);
    cMaxY = Math.max(cMaxY, shape.maxY);
  }
  const pad = 12;
  const vbW = cMaxX - cMinX + pad * 2;
  const vbH = cMaxY - cMinY + pad * 2;
  const body = selected
    .map((shape) => {
      const d = shape.d.replace(/-?\d+\.\d+/g, (raw) => {
        const value = Number(raw);
        const index = shape.d.indexOf(raw);
        return raw;
      });
      return `<path fill="${shape.color}" d="${shape.d}"/>`;
    })
    .join("\n");
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${(cMinX - pad).toFixed(2)} ${(-cMaxY - pad).toFixed(2)} ${vbW.toFixed(2)} ${vbH.toFixed(2)}">
<g transform="scale(1,-1)">
${body}
</g>
</svg>
`;
  fs.writeFileSync(filename, svg);
  console.log("wrote", filename, selected.length, "bytes", svg.length);
}

const navy = shapes.filter((shape) => {
  const cx = (shape.minX + shape.maxX) / 2;
  const cy = (shape.minY + shape.maxY) / 2;
  return shape.color.startsWith("rgb(1,42") && cy < 1700 && cx > 800 && cx < 1600;
});
const light = shapes.filter((shape) => {
  const cx = (shape.minX + shape.maxX) / 2;
  const cy = (shape.minY + shape.maxY) / 2;
  return cy > 2700 && cy < 3600 && cx < 1200;
});

writeCrop("c:/Users/semip/Proyectos/portal-sem/public/images/logo-sem-isotipo.svg", navy);
writeCrop("c:/Users/semip/Proyectos/portal-sem/public/images/logo-sem-isotipo-light.svg", light);
