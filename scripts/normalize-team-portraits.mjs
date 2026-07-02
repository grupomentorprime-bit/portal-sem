/**
 * Normaliza retratos demo del equipo: mismo encuadre, fondo oscuro institucional.
 * Uso: node scripts/normalize-team-portraits.mjs
 */
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEAM_DIR = path.join(__dirname, "../public/images/demo/team");
const SCREENSHOT = path.join(
  process.env.USERPROFILE ?? "",
  ".cursor/projects/c-Users-semip-Proyectos-portal-sem/assets/c__Users_semip_AppData_Roaming_Cursor_User_workspaceStorage_c5cf118625c2c423e4101eebc87e9632_images_image-33e0316b-0109-43e6-bb4c-2e02555e36c9.png"
);

const W = 480;
const H = 640;
/** Fondo unificado — azul noche SEM */
const BG = { r: 8, g: 18, b: 30 };

const PORTRAITS = [
  { file: "jose-gonzalez.png", scale: 1.02, brightness: 0.95, saturation: 0.84 },
  { file: "hebert-cuevas.png", scale: 1.34, brightness: 0.94, saturation: 0.78 },
  { file: "carolina-cisterna.png", scale: 1.04, brightness: 0.95, saturation: 0.84 },
  { file: "marco-sepulveda.png", scale: 1.12, brightness: 0.94, saturation: 0.8, note: "Usar scripts/fix-marco-portrait.mjs si falta fuente original" },
];

async function createVignette() {
  const svg = `
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="v" cx="50%" cy="42%" r="68%">
          <stop offset="0%" stop-color="rgb(8,18,30)" stop-opacity="0"/>
          <stop offset="72%" stop-color="rgb(8,18,30)" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="rgb(8,18,30)" stop-opacity="0.72"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#v)"/>
    </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function normalizePortrait({ file, scale, brightness, saturation, tint, fromScreenshot, crop }) {
  const outPath = path.join(TEAM_DIR, file);
  let input = fromScreenshot ? SCREENSHOT : outPath;

  if (fromScreenshot) {
    const box = crop ?? { left: 778, top: 98, width: 118, height: 158 };
    await sharp(input).extract(box).toFile(outPath);
    input = outPath;
  }

  const sw = Math.round(W * scale);
  const sh = Math.round(H * scale);

  const resized = await sharp(input)
    .resize(sw, sh, { fit: "cover", position: "top" })
    .modulate({ brightness: brightness ?? 0.95, saturation: saturation ?? 0.84 })
    .toBuffer();

  const left = Math.max(0, Math.round((sw - W) / 2));
  const cropped = await sharp(resized)
    .extract({ left, top: 0, width: Math.min(W, sw), height: Math.min(H, sh) })
    .resize(W, H, { fit: "cover", position: "top" })
    .flatten({ background: BG })
    .toBuffer();

  const vignette = await createVignette();

  const composites = [{ input: vignette, blend: "over" }];
  if (tint && tint > 0) {
    const tintLayer = await sharp({
      create: {
        width: W,
        height: H,
        channels: 4,
        background: { r: BG.r, g: BG.g, b: BG.b, alpha: Math.round(tint * 255) },
      },
    })
      .png()
      .toBuffer();
    composites.push({ input: tintLayer, blend: "multiply" });
  }

  await sharp(cropped)
    .composite(composites)
    .flatten({ background: BG })
    .png({ quality: 92 })
    .toFile(outPath);

  console.log(`✓ ${file}`);
}

for (const portrait of PORTRAITS) {
  await normalizePortrait(portrait);
}

console.log("Retratos normalizados en public/images/demo/team/");
