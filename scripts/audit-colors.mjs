import fs from "fs";
import path from "path";

const OFFICIAL = new Set(["#002a47", "#246aa1", "#10bce2", "#3ed6af", "#8ce27f"]);
const NEUTRAL = new Set(["#ffffff", "#fff", "#000000", "#000", "transparent"]);

function walk(dir, files = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!["node_modules", ".next", ".git", "dist", "build"].includes(e.name)) walk(p, files);
    } else if (/\.(tsx?|css|scss|jsx|js)$/.test(e.name)) files.push(p);
  }
  return files;
}

const colorMap = new Map();
const tailwindMap = new Map();
const cssVarMap = new Map();
const rgbMap = new Map();
const inlineStyleMap = new Map();

const hexRe = /#([0-9A-Fa-f]{3,8})\b/g;
const rgbRe = /rgba?\(\s*([^)]+)\)/g;
const hslRe = /hsla?\(\s*([^)]+)\)/g;
const twRe =
  /\b(?:bg|text|border|ring|from|to|via|fill|stroke|outline|decoration|shadow|divide|placeholder)-(?:blue|sky|cyan|indigo|yellow|amber|orange|purple|pink|red|emerald|teal|lime|green|violet|fuchsia|rose|slate|gray|grey|zinc|neutral|stone|gold)(?:-\d+)?(?:\/\d+)?\b/g;
const cssVarRe = /--(?:sem-|color-|primary|secondary|accent|fp-|cursor-|brand-)[a-zA-Z0-9-]+/g;
const inlineRe = /(?:background(?:Color)?|color|borderColor)\s*:\s*["'`#][^"'`]+/g;

function normHex(h) {
  h = h.toLowerCase();
  if (h.length === 4) return "#" + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
  if (h.length === 9) return h.slice(0, 7);
  return h;
}

function add(map, key, file) {
  if (!map.has(key)) map.set(key, { count: 0, files: new Set() });
  const e = map.get(key);
  e.count++;
  e.files.add(file.replace(root + path.sep, "").replace(/\\/g, "/"));
}

const root = process.cwd();
const files = walk(path.join(root, "src"));

for (const f of files) {
  const content = fs.readFileSync(f, "utf8");
  let m;
  while ((m = hexRe.exec(content))) add(colorMap, normHex("#" + m[1]), f);
  while ((m = rgbRe.exec(content))) add(rgbMap, "rgb(" + m[1].trim() + ")", f);
  while ((m = hslRe.exec(content))) add(rgbMap, "hsl(" + m[1].trim() + ")", f);
  while ((m = twRe.exec(content))) add(tailwindMap, m[0], f);
  while ((m = cssVarRe.exec(content))) add(cssVarMap, m[0], f);
  while ((m = inlineRe.exec(content))) add(inlineStyleMap, m[0].slice(0, 80), f);
}

function sortMap(map) {
  return [...map.entries()].sort((a, b) => b[1].count - a[1].count);
}

const official = [];
const nonOfficial = [];
const neutral = [];

for (const [c, d] of sortMap(colorMap)) {
  if (OFFICIAL.has(c)) official.push({ color: c, ...d, files: [...d.files] });
  else if (NEUTRAL.has(c)) neutral.push({ color: c, ...d, files: [...d.files] });
  else nonOfficial.push({ color: c, ...d, files: [...d.files] });
}

const totalDistinct =
  colorMap.size +
  rgbMap.size +
  tailwindMap.size;

const report = {
  summary: {
    hexDistinct: colorMap.size,
    officialHex: official.length,
    nonOfficialHex: nonOfficial.length,
    neutralHex: neutral.length,
    rgbDistinct: rgbMap.size,
    tailwindDistinct: tailwindMap.size,
    tailwindOccurrences: [...tailwindMap.values()].reduce((s, v) => s + v.count, 0),
    cssVarDistinct: cssVarMap.size,
    inlineStyleDistinct: inlineStyleMap.size,
  },
  official,
  nonOfficial,
  neutral,
  tailwind: sortMap(tailwindMap).map(([k, v]) => ({ class: k, count: v.count, files: [...v.files] })),
  cssVars: sortMap(cssVarMap).map(([k, v]) => ({ var: k, count: v.count, files: [...v.files].slice(0, 5) })),
  rgb: sortMap(rgbMap).map(([k, v]) => ({ value: k, count: v.count, files: [...v.files].slice(0, 3) })),
  inline: sortMap(inlineStyleMap).map(([k, v]) => ({ value: k, count: v.count, files: [...v.files] })),
};

fs.writeFileSync("scripts/audit-colors-output.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.summary, null, 2));
console.log("\nTop non-official:");
nonOfficial.slice(0, 25).forEach((x) => console.log(x.color, x.count));
