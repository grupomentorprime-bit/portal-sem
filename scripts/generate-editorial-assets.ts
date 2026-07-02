/**
 * OT-EDITORIAL-ASSETS-001 — Generador de biblioteca gráfica institucional SEM.
 * Colores: únicamente paleta --sem-* (#002A47, #246AA1, #10BCE2, #3ED6AF, #8CE27F).
 * Ejecutar: npx tsx scripts/generate-editorial-assets.ts
 */
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(process.cwd(), "public", "editorial");

const C = {
  primary: "#002A47",
  secondary: "#246AA1",
  accent: "#10BCE2",
  success: "#3ED6AF",
  light: "#8CE27F",
  white: "#FFFFFF",
} as const;

const DIRS = [
  "patterns",
  "textures",
  "gradients",
  "overlays",
  "dividers",
  "seals",
  "icons",
  "backgrounds",
  "illustrations",
] as const;

function ensureDirs() {
  for (const dir of DIRS) {
    const p = join(ROOT, dir);
    if (!existsSync(p)) mkdirSync(p, { recursive: true });
  }
}

function write(rel: string, content: string) {
  writeFileSync(join(ROOT, rel), content.trimStart() + "\n", "utf8");
}

function svgOpen(
  w: number,
  h: number,
  extra = "",
  viewBox?: string
): string {
  const vb = viewBox ?? `0 0 ${w} ${h}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${vb}" fill="none" aria-hidden="true"${extra ? ` ${extra}` : ""}>`;
}

function patternTile(id: string, w: number, h: number, inner: string, opacity = 0.06): string {
  return `${svgOpen(w, h)}
  <defs>
    <pattern id="${id}" width="${w}" height="${h}" patternUnits="userSpaceOnUse">
      ${inner}
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#${id})" opacity="${opacity}"/>
</svg>`;
}

function generatePatterns() {
  const items: Array<[string, string]> = [
    [
      "bible-lines.svg",
      patternTile(
        "p",
        48,
        24,
        `<line x1="0" y1="6" x2="48" y2="6" stroke="${C.primary}" stroke-width="0.5" opacity="0.35"/>
       <line x1="0" y1="12" x2="48" y2="12" stroke="${C.primary}" stroke-width="0.5" opacity="0.25"/>
       <line x1="0" y1="18" x2="48" y2="18" stroke="${C.primary}" stroke-width="0.5" opacity="0.2"/>`
      ),
    ],
    [
      "bible-margin.svg",
      patternTile(
        "p",
        32,
        32,
        `<line x1="8" y1="0" x2="8" y2="32" stroke="${C.secondary}" stroke-width="0.75" opacity="0.3"/>
       <line x1="9.5" y1="0" x2="9.5" y2="32" stroke="${C.secondary}" stroke-width="0.25" opacity="0.2"/>`
      ),
    ],
    [
      "column-classical.svg",
      patternTile(
        "p",
        40,
        40,
        Array.from({ length: 5 }, (_, i) => {
          const x = 4 + i * 8;
          return `<line x1="${x}" y1="0" x2="${x}" y2="40" stroke="${C.primary}" stroke-width="0.5" opacity="0.22"/>`;
        }).join("\n")
      ),
    ],
    [
      "isotype-geometry.svg",
      patternTile(
        "p",
        56,
        56,
        `<circle cx="28" cy="28" r="10" stroke="${C.accent}" stroke-width="0.5" opacity="0.25"/>
       <path d="M28 8 L44 48 L12 48 Z" stroke="${C.secondary}" stroke-width="0.4" opacity="0.18" fill="none"/>`
      ),
    ],
    [
      "editorial-lines.svg",
      patternTile(
        "p",
        64,
        16,
        `<line x1="0" y1="8" x2="64" y2="8" stroke="${C.primary}" stroke-width="0.75" opacity="0.2"/>
       <line x1="0" y1="12" x2="40" y2="12" stroke="${C.secondary}" stroke-width="0.35" opacity="0.15"/>`
      ),
    ],
    [
      "academic-grid.svg",
      patternTile(
        "p",
        24,
        24,
        `<path d="M24 0 V24 M0 24 H24" stroke="${C.primary}" stroke-width="0.35" opacity="0.18"/>`
      ),
    ],
    [
      "cross-minimal.svg",
      patternTile(
        "p",
        32,
        32,
        `<path d="M16 10 V22 M10 16 H22" stroke="${C.secondary}" stroke-width="0.6" opacity="0.2" stroke-linecap="round"/>`
      ),
    ],
    [
      "scripture-dots.svg",
      patternTile(
        "p",
        20,
        20,
        `<circle cx="4" cy="10" r="1" fill="${C.primary}" opacity="0.25"/>
       <circle cx="10" cy="10" r="1" fill="${C.primary}" opacity="0.2"/>
       <circle cx="16" cy="10" r="1" fill="${C.primary}" opacity="0.15"/>`
      ),
    ],
    [
      "sem-diamond.svg",
      patternTile(
        "p",
        48,
        48,
        `<rect x="20" y="20" width="8" height="8" transform="rotate(45 24 24)" stroke="${C.accent}" stroke-width="0.5" opacity="0.22" fill="none"/>`
      ),
    ],
    [
      "page-rhythm.svg",
      patternTile(
        "p",
        80,
        20,
        `<rect x="0" y="4" width="56" height="2" fill="${C.primary}" opacity="0.08"/>
       <rect x="0" y="10" width="72" height="1.5" fill="${C.primary}" opacity="0.06"/>
       <rect x="0" y="15" width="48" height="1.5" fill="${C.primary}" opacity="0.05"/>`
      ),
    ],
    [
      "margin-notes.svg",
      patternTile(
        "p",
        36,
        36,
        `<line x1="28" y1="4" x2="32" y2="4" stroke="${C.accent}" stroke-width="0.5" opacity="0.25"/>
       <line x1="28" y1="12" x2="34" y2="12" stroke="${C.accent}" stroke-width="0.5" opacity="0.2"/>
       <line x1="28" y1="20" x2="30" y2="20" stroke="${C.accent}" stroke-width="0.5" opacity="0.18"/>`
      ),
    ],
    [
      "chapter-mark.svg",
      patternTile(
        "p",
        40,
        40,
        `<path d="M20 8 L24 16 L32 16 L26 21 L28 30 L20 25 L12 30 L14 21 L8 16 L16 16 Z" stroke="${C.light}" stroke-width="0.4" opacity="0.15" fill="none"/>`
      ),
    ],
    [
      "study-grid.svg",
      patternTile(
        "p",
        16,
        16,
        `<rect x="0.5" y="0.5" width="15" height="15" stroke="${C.secondary}" stroke-width="0.35" opacity="0.15" fill="none"/>`
      ),
    ],
    [
      "pillar-flute.svg",
      patternTile(
        "p",
        28,
        48,
        `<ellipse cx="14" cy="24" rx="10" ry="22" stroke="${C.primary}" stroke-width="0.4" opacity="0.12" fill="none"/>
       <line x1="8" y1="4" x2="8" y2="44" stroke="${C.primary}" stroke-width="0.3" opacity="0.1"/>
       <line x1="14" y1="4" x2="14" y2="44" stroke="${C.primary}" stroke-width="0.3" opacity="0.1"/>
       <line x1="20" y1="4" x2="20" y2="44" stroke="${C.primary}" stroke-width="0.3" opacity="0.1"/>`
      ),
    ],
    [
      "woven-lines.svg",
      patternTile(
        "p",
        32,
        32,
        `<path d="M0 16 H32 M16 0 V32" stroke="${C.secondary}" stroke-width="0.35" opacity="0.14"/>
       <path d="M0 0 L32 32 M32 0 L0 32" stroke="${C.secondary}" stroke-width="0.25" opacity="0.08"/>`
      ),
    ],
  ];
  for (const [name, body] of items) write(`patterns/${name}`, body);
}

function generateTextures() {
  const names = [
    "paper-editorial",
    "parchment-modern",
    "canvas-soft",
    "paper-fiber",
    "fine-grain",
    "linen-weave",
    "vellum-soft",
    "cotton-matte",
    "warm-paper",
    "editorial-matte",
  ];
  for (const name of names) {
    const seed = name.length * 7;
    write(
      `textures/${name}.svg`,
      `${svgOpen(200, 200)}
  <defs>
    <filter id="n" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="${seed}" stitchTiles="stitch"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.016 0 0 0 0 0.165 0 0 0 0 0.278 0 0 0 0.08 0"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" filter="url(#n)"/>
</svg>`
    );
  }
}

function gradientSvg(id: string, stops: string, extra = ""): string {
  return `${svgOpen(400, 400, "", "0 0 400 400")}
  <defs>
    <linearGradient id="${id}" x1="0%" y1="0%" x2="0%" y2="100%">
      ${stops}
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#${id})"/>
  ${extra}
</svg>`;
}

function generateGradients() {
  const stops3 = `
      <stop offset="0%" stop-color="${C.primary}"/>
      <stop offset="55%" stop-color="${C.secondary}"/>
      <stop offset="100%" stop-color="${C.accent}"/>`;

  write("gradients/institutional-vertical.svg", gradientSvg("g", stops3));
  write(
    "gradients/institutional-diagonal.svg",
    `${svgOpen(400, 400, "", "0 0 400 400")}
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">${stops3}
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#g)"/>
</svg>`
  );
  write(
    "gradients/institutional-hero.svg",
    `${svgOpen(400, 400, "", "0 0 400 400")}
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="${C.primary}"/>
      <stop offset="40%" stop-color="${C.primary}" stop-opacity="0.92"/>
      <stop offset="75%" stop-color="${C.secondary}" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="${C.secondary}"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#g)"/>
</svg>`
  );
  write(
    "gradients/institutional-cta.svg",
    `${svgOpen(400, 200, "", "0 0 400 200")}
  <defs>
    <linearGradient id="g" x1="0%" y1="50%" x2="100%" y2="50%">
      <stop offset="0%" stop-color="${C.primary}"/>
      <stop offset="50%" stop-color="${C.secondary}"/>
      <stop offset="100%" stop-color="${C.accent}" stop-opacity="0.9"/>
    </linearGradient>
  </defs>
  <rect width="400" height="200" fill="url(#g)"/>
</svg>`
  );
  write(
    "gradients/institutional-footer.svg",
    `${svgOpen(400, 300, "", "0 0 400 300")}
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${C.secondary}" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="${C.primary}"/>
    </linearGradient>
  </defs>
  <rect width="400" height="300" fill="url(#g)"/>
</svg>`
  );

  write(
    "gradients/editorial-gradients.css",
    `/**
 * OT-EDITORIAL-ASSETS-001 — Gradientes institucionales (tokens --sem-*).
 * Consumir en componentes vía class o var(); multi-tenant hereda brand.css.
 */
:root {
  --editorial-gradient-vertical: linear-gradient(
    180deg,
    var(--sem-primary) 0%,
    var(--sem-secondary) 55%,
    var(--sem-accent) 100%
  );
  --editorial-gradient-diagonal: linear-gradient(
    135deg,
    var(--sem-primary) 0%,
    var(--sem-secondary) 50%,
    var(--sem-accent) 100%
  );
  --editorial-gradient-hero: linear-gradient(
    145deg,
    var(--sem-primary) 0%,
    color-mix(in srgb, var(--sem-primary) 88%, var(--sem-secondary)) 45%,
    var(--sem-secondary) 100%
  );
  --editorial-gradient-cta: linear-gradient(
    90deg,
    var(--sem-primary) 0%,
    var(--sem-secondary) 50%,
    color-mix(in srgb, var(--sem-accent) 90%, var(--sem-secondary)) 100%
  );
  --editorial-gradient-footer: linear-gradient(
    180deg,
    var(--sem-secondary) 0%,
    var(--sem-primary) 100%
  );
}
`
  );
}

function generateOverlays() {
  const overlays: Array<[string, string]> = [
    [
      "overlay-editorial-blue.svg",
      `<rect width="100%" height="100%" fill="${C.secondary}" fill-opacity="0.55"/>`,
    ],
    [
      "overlay-dark-blue.svg",
      `<rect width="100%" height="100%" fill="${C.primary}" fill-opacity="0.72"/>`,
    ],
    [
      "overlay-diagonal.svg",
      `<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${C.primary}" stop-opacity="0.85"/>
        <stop offset="100%" stop-color="${C.secondary}" stop-opacity="0.45"/>
      </linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/>`,
    ],
    [
      "overlay-hero.svg",
      `<defs><linearGradient id="g" x1="0%" y1="0%" x2="60%" y2="100%">
        <stop offset="0%" stop-color="${C.primary}" stop-opacity="0.88"/>
        <stop offset="55%" stop-color="${C.primary}" stop-opacity="0.55"/>
        <stop offset="100%" stop-color="${C.secondary}" stop-opacity="0.25"/>
      </linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/>`,
    ],
    [
      "overlay-cta.svg",
      `<defs><linearGradient id="g" x1="0%" y1="50%" x2="100%" y2="50%">
        <stop offset="0%" stop-color="${C.primary}" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="${C.secondary}" stop-opacity="0.65"/>
      </linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/>`,
    ],
    [
      "overlay-footer.svg",
      `<rect width="100%" height="100%" fill="${C.primary}" fill-opacity="0.92"/>`,
    ],
  ];
  for (const [name, inner] of overlays) {
    write(
      `overlays/${name}`,
      `${svgOpen(400, 300, 'preserveAspectRatio="none"', "0 0 400 300")}
  ${inner}
</svg>`
    );
  }
}

function generateDividers() {
  const dividers: Array<[string, string]> = [
    [
      "divider-editorial-line.svg",
      `${svgOpen(320, 24, "", "0 0 320 24")}
  <line x1="0" y1="12" x2="120" y2="12" stroke="${C.secondary}" stroke-width="1" opacity="0.5"/>
  <circle cx="160" cy="12" r="3" fill="${C.accent}" opacity="0.7"/>
  <line x1="200" y1="12" x2="320" y2="12" stroke="${C.secondary}" stroke-width="1" opacity="0.5"/>
</svg>`,
    ],
    [
      "divider-cross.svg",
      `${svgOpen(320, 32, "", "0 0 320 32")}
  <line x1="0" y1="16" x2="140" y2="16" stroke="${C.primary}" stroke-width="0.75" opacity="0.35"/>
  <path d="M160 10 V22 M154 16 H166" stroke="${C.secondary}" stroke-width="1.2" stroke-linecap="round" opacity="0.65"/>
  <line x1="180" y1="16" x2="320" y2="16" stroke="${C.primary}" stroke-width="0.75" opacity="0.35"/>
</svg>`,
    ],
    [
      "divider-academic.svg",
      `${svgOpen(320, 28, "", "0 0 320 28")}
  <rect x="0" y="13" width="320" height="1" fill="${C.primary}" opacity="0.2"/>
  <rect x="148" y="8" width="24" height="12" stroke="${C.secondary}" stroke-width="0.75" fill="none" opacity="0.5"/>
  <line x1="154" y1="14" x2="166" y2="14" stroke="${C.accent}" stroke-width="0.5" opacity="0.6"/>
</svg>`,
    ],
    [
      "divider-biblical.svg",
      `${svgOpen(320, 36, "", "0 0 320 36")}
  <text x="160" y="22" text-anchor="middle" font-family="Georgia, serif" font-size="14" fill="${C.secondary}" opacity="0.55">✦</text>
  <line x1="24" y1="18" x2="136" y2="18" stroke="${C.primary}" stroke-width="0.6" opacity="0.3"/>
  <line x1="184" y1="18" x2="296" y2="18" stroke="${C.primary}" stroke-width="0.6" opacity="0.3"/>
</svg>`,
    ],
    [
      "divider-isotype.svg",
      `${svgOpen(320, 40, "", "0 0 320 40")}
  <line x1="0" y1="20" x2="130" y2="20" stroke="${C.secondary}" stroke-width="0.75" opacity="0.4"/>
  <circle cx="160" cy="20" r="8" stroke="${C.accent}" stroke-width="0.75" fill="none" opacity="0.55"/>
  <path d="M160 14 L165 24 L155 24 Z" fill="${C.accent}" opacity="0.35"/>
  <line x1="190" y1="20" x2="320" y2="20" stroke="${C.secondary}" stroke-width="0.75" opacity="0.4"/>
</svg>`,
    ],
  ];
  for (const [name, body] of dividers) write(`dividers/${name}`, body);
}

function sealSvg(label: string, sub: string, fg: string, bg: string, ring: string): string {
  return `${svgOpen(160, 160, "", "0 0 160 160")}
  <circle cx="80" cy="80" r="72" fill="${bg}" stroke="${ring}" stroke-width="2"/>
  <circle cx="80" cy="80" r="62" fill="none" stroke="${ring}" stroke-width="0.75" opacity="0.45"/>
  <text x="80" y="72" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" font-weight="600" letter-spacing="0.12em" fill="${fg}" opacity="0.9">${label}</text>
  <text x="80" y="92" text-anchor="middle" font-family="Georgia, serif" font-size="11" font-weight="600" fill="${fg}">${sub}</text>
</svg>`;
}

function generateSeals() {
  const seals: Array<[string, string, string]> = [
    ["respaldo-institucional", "RESPALDO", "INSTITUCIONAL"],
    ["cien-online", "100%", "ONLINE"],
    ["comunidad-formativa", "COMUNIDAD", "FORMATIVA"],
    ["formacion-biblica", "FORMACIÓN", "BÍBLICA"],
    ["campus-virtual", "CAMPUS", "VIRTUAL"],
    ["ipn-chile", "IGLESIA PENTECOSTAL", "NAZARETH"],
  ];
  const variants: Array<[string, string, string, string]> = [
    ["blue", C.white, C.secondary, C.primary],
    ["white", C.primary, C.white, C.primary],
    ["warm", C.primary, C.light, C.secondary],
  ];
  for (const [slug, line1, line2] of seals) {
    for (const [variant, fg, bg, ring] of variants) {
      write(`seals/seal-${slug}-${variant}.svg`, sealSvg(line1, line2, fg, bg, ring));
    }
  }
}

function iconPath(d: string, stroke = C.primary): string {
  return `${svgOpen(48, 48, "", "0 0 48 48")}
  <path d="${d}" stroke="${stroke}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;
}

function generateIcons() {
  const icons: Array<[string, string]> = [
    [
      "bible.svg",
      `M14 10 H28 C30 10 32 12 32 14 V38 C32 40 30 42 28 42 H14 C12 42 10 40 10 38 V14 C10 12 12 10 14 10 Z M18 10 V42 M24 16 H28 M24 22 H28`,
    ],
    [
      "discipleship.svg",
      `M18 20 C18 16 21 14 24 14 C27 14 30 16 30 20 M12 36 C12 30 17 26 24 26 C31 26 36 30 36 36 M32 18 C34 17 36 18 36 20 M38 32 C40 31 42 32 42 34`,
    ],
    [
      "ministry.svg",
      `M24 8 V40 M16 16 L24 8 L32 16 M18 28 H30 M20 34 H28`,
    ],
    [
      "church.svg",
      `M24 8 V40 M16 18 H32 M20 18 V40 M28 18 V40 M14 40 H34 M24 8 L28 14 H20 Z`,
    ],
    [
      "community.svg",
      `M16 22 C16 18 19 16 22 16 C25 16 28 18 28 22 M20 34 C20 30 22 28 24 28 C26 28 28 30 28 34 M30 20 C32 19 34 20 34 22 M32 32 C34 31 36 32 36 34`,
    ],
    [
      "service.svg",
      `M14 30 L24 20 L30 26 L38 16 M38 16 V24 M38 16 H30`,
    ],
    [
      "leadership.svg",
      `M24 12 L30 22 H18 Z M16 34 H32 M20 28 H28`,
    ],
    [
      "prayer.svg",
      `M24 10 C20 14 16 18 16 24 C16 28 19 32 24 32 C29 32 32 28 32 24 C32 18 28 14 24 10 M24 32 V40`,
    ],
    [
      "study.svg",
      `M12 14 H30 V36 H12 Z M18 14 V36 M24 18 H28 M24 24 H28`,
    ],
    [
      "vocation.svg",
      `M24 38 C24 38 14 28 14 20 C14 14 18 10 24 10 C30 10 34 14 34 20 C34 28 24 38 24 38 Z`,
    ],
  ];
  for (const [name, d] of icons) write(`icons/${name}`, iconPath(d));
}

function bgSvg(
  patternUrl: string,
  gradientStops: string,
  accent: string
): string {
  return `${svgOpen(800, 600, "", "0 0 800 600")}
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">${gradientStops}</linearGradient>
    <pattern id="pt" width="64" height="64" patternUnits="userSpaceOnUse">${patternUrl}</pattern>
  </defs>
  <rect width="800" height="600" fill="url(#bg)"/>
  <rect width="800" height="600" fill="url(#pt)" opacity="0.06"/>
  ${accent}
</svg>`;
}

function generateBackgrounds() {
  const subtle = `<line x1="0" y1="32" x2="64" y2="32" stroke="${C.primary}" stroke-width="0.5" opacity="0.2"/>`;
  const stopsHero = `
    <stop offset="0%" stop-color="${C.primary}"/>
    <stop offset="100%" stop-color="${C.secondary}" stop-opacity="0.85"/>`;
  const stopsLight = `
    <stop offset="0%" stop-color="#F8FAFB"/>
    <stop offset="100%" stop-color="${C.white}"/>`;
  const stopsMuted = `
    <stop offset="0%" stop-color="${C.white}"/>
    <stop offset="100%" stop-color="${C.primary}" stop-opacity="0.04"/>`;

  write(
    "backgrounds/bg-hero.svg",
    bgSvg(subtle, stopsHero, `<circle cx="680" cy="120" r="180" fill="${C.accent}" opacity="0.08"/>`)
  );
  write(
    "backgrounds/bg-programas.svg",
    bgSvg(
      `<rect x="0" y="0" width="32" height="32" stroke="${C.secondary}" stroke-width="0.35" opacity="0.15" fill="none"/>`,
      stopsMuted,
      ""
    )
  );
  write(
    "backgrounds/bg-equipo.svg",
    bgSvg(subtle, stopsLight, `<ellipse cx="120" cy="500" rx="200" ry="80" fill="${C.secondary}" opacity="0.06"/>`)
  );
  write(
    "backgrounds/bg-biblioteca.svg",
    bgSvg(
      `<line x1="8" y1="0" x2="8" y2="48" stroke="${C.primary}" stroke-width="0.5" opacity="0.12"/>`,
      stopsMuted,
      ""
    )
  );
  write(
    "backgrounds/bg-noticias.svg",
    bgSvg(subtle, stopsLight, `<rect x="600" y="400" width="160" height="120" stroke="${C.accent}" stroke-width="0.5" opacity="0.12" fill="none"/>`)
  );
  write(
    "backgrounds/bg-footer.svg",
    `${svgOpen(800, 400, "", "0 0 800 400")}
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${C.secondary}"/>
      <stop offset="100%" stop-color="${C.primary}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="400" fill="url(#bg)"/>
  <rect width="800" height="400" fill="${C.primary}" opacity="0.08"/>
</svg>`
  );
}

function generateIllustrations() {
  const illus: Array<[string, string]> = [
    [
      "bible-open.svg",
      `${svgOpen(200, 160, "", "0 0 200 160")}
  <path d="M30 30 C50 20 70 20 100 30 C130 20 150 20 170 30 V130 C150 120 130 120 100 130 C70 120 50 120 30 130 Z" stroke="${C.primary}" stroke-width="2" fill="${C.white}" fill-opacity="0.9"/>
  <line x1="100" y1="30" x2="100" y2="130" stroke="${C.secondary}" stroke-width="1"/>
  <line x1="48" y1="50" x2="82" y2="50" stroke="${C.secondary}" stroke-width="0.75" opacity="0.5"/>
  <line x1="118" y1="60" x2="152" y2="60" stroke="${C.secondary}" stroke-width="0.75" opacity="0.5"/>
</svg>`,
    ],
    [
      "community.svg",
      `${svgOpen(200, 160, "", "0 0 200 160")}
  <circle cx="70" cy="62" r="18" stroke="${C.primary}" stroke-width="1.5" fill="none"/>
  <circle cx="130" cy="62" r="18" stroke="${C.primary}" stroke-width="1.5" fill="none"/>
  <path d="M40 120 C40 98 58 86 70 86 C82 86 100 98 100 120 M100 120 C100 98 118 86 130 86 C142 86 160 98 160 120" stroke="${C.secondary}" stroke-width="1.5" fill="none"/>
</svg>`,
    ],
    [
      "study.svg",
      `${svgOpen(200, 160, "", "0 0 200 160")}
  <rect x="50" y="40" width="100" height="80" rx="4" stroke="${C.primary}" stroke-width="1.5" fill="${C.white}"/>
  <line x1="70" y1="60" x2="130" y2="60" stroke="${C.secondary}" stroke-width="1" opacity="0.5"/>
  <line x1="70" y1="75" x2="120" y2="75" stroke="${C.secondary}" stroke-width="1" opacity="0.4"/>
  <path d="M130 100 L150 120 L130 120 Z" fill="${C.accent}" opacity="0.35"/>
</svg>`,
    ],
    [
      "prayer.svg",
      `${svgOpen(200, 160, "", "0 0 200 160")}
  <circle cx="100" cy="50" r="16" stroke="${C.primary}" stroke-width="1.5"/>
  <path d="M70 120 C70 92 82 78 100 78 C118 78 130 92 130 120" stroke="${C.primary}" stroke-width="1.5" fill="none"/>
  <path d="M88 50 C92 42 100 38 108 42" stroke="${C.accent}" stroke-width="1.2" fill="none"/>
</svg>`,
    ],
    [
      "virtual-classroom.svg",
      `${svgOpen(200, 160, "", "0 0 200 160")}
  <rect x="40" y="35" width="120" height="80" rx="6" stroke="${C.primary}" stroke-width="1.5" fill="${C.white}"/>
  <circle cx="100" cy="70" r="14" stroke="${C.secondary}" stroke-width="1.2" fill="none"/>
  <rect x="55" y="95" width="90" height="6" rx="2" fill="${C.accent}" opacity="0.35"/>
  <path d="M30 125 H170" stroke="${C.primary}" stroke-width="1" opacity="0.3"/>
</svg>`,
    ],
    [
      "library.svg",
      `${svgOpen(200, 160, "", "0 0 200 160")}
  <rect x="45" y="35" width="20" height="90" fill="${C.secondary}" opacity="0.25"/>
  <rect x="70" y="45" width="18" height="80" fill="${C.primary}" opacity="0.2"/>
  <rect x="92" y="40" width="22" height="85" fill="${C.secondary}" opacity="0.3"/>
  <rect x="119" y="50" width="16" height="75" fill="${C.primary}" opacity="0.18"/>
  <rect x="140" y="38" width="20" height="87" fill="${C.accent}" opacity="0.22"/>
  <line x1="40" y1="125" x2="165" y2="125" stroke="${C.primary}" stroke-width="1.5"/>
</svg>`,
    ],
  ];
  for (const [name, body] of illus) write(`illustrations/${name}`, body);
}

function generateManifest() {
  const manifest = {
    version: "1.0.0",
    ot: "OT-EDITORIAL-ASSETS-001",
    basePath: "/editorial",
    colors: C,
    categories: DIRS,
    counts: {
      patterns: 15,
      textures: 10,
      gradients: 5,
      overlays: 6,
      dividers: 5,
      seals: 18,
      icons: 10,
      backgrounds: 6,
      illustrations: 6,
    },
  };
  write("manifest.json", JSON.stringify(manifest, null, 2));
}

function main() {
  ensureDirs();
  generatePatterns();
  generateTextures();
  generateGradients();
  generateOverlays();
  generateDividers();
  generateSeals();
  generateIcons();
  generateBackgrounds();
  generateIllustrations();
  generateManifest();
  console.log("✓ Biblioteca editorial SEM generada en public/editorial/");
}

main();
