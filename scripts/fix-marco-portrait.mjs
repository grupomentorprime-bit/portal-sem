/**
 * Regenera marco-sepulveda.png desde captura del home (retrato mal normalizado).
 */
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOT = path.join(
  process.env.USERPROFILE ?? "",
  ".cursor/projects/c-Users-semip-Proyectos-portal-sem/assets/c__Users_semip_AppData_Roaming_Cursor_User_workspaceStorage_c5cf118625c2c423e4101eebc87e9632_images_image-107fe5ef-2dee-4771-a53b-a4050568fe68.png"
);
const OUT = path.join(__dirname, "../public/images/demo/team/marco-sepulveda.png");
const W = 480;
const H = 640;
const BG = { r: 8, g: 18, b: 30 };

/** Rostro visible dentro del card 4 (captura 1024×540) */
const crop = { left: 738, top: 318, width: 100, height: 125 };
const scale = 1.35;

async function createVignette() {
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
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

const sw = Math.round(W * scale);
const sh = Math.round(H * scale);

const resized = await sharp(SCREENSHOT)
  .extract(crop)
  .resize(sw, sh, { fit: "cover", position: "top" })
  .modulate({ brightness: 0.94, saturation: 0.82 })
  .toBuffer();

const left = Math.max(0, Math.round((sw - W) / 2));
const cropped = await sharp(resized)
  .extract({ left, top: 0, width: Math.min(W, sw), height: Math.min(H, sh) })
  .resize(W, H, { fit: "cover", position: "top" })
  .flatten({ background: BG })
  .toBuffer();

const vignette = await createVignette();

await sharp(cropped)
  .composite([{ input: vignette, blend: "over" }])
  .flatten({ background: BG })
  .png({ quality: 92 })
  .toFile(OUT);

console.log(`✓ ${OUT}`);
