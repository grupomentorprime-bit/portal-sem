/**
 * OT-MEDIA-SEM-001 — Genera biblioteca fotográfica institucional SEM.
 * Rasteriza fuentes editoriales provisionales, optimiza AVIF/WebP/JPEG y publica catalog.json.
 *
 * Uso: npm run build:institutional-media
 */
import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, basename } from "node:path";
import sharp from "sharp";
import type {
  InstitutionalPhotoAsset,
  InstitutionalPhotoCatalog,
  InstitutionalPhotoOrientation,
} from "../src/types/institutional-photo";

const ROOT = join(process.cwd(), "public", "media");
const EDITORIAL = join(process.cwd(), "public", "editorial");
const WIDTHS = [400, 768, 1080, 1440, 1920] as const;

const CATEGORIES = [
  "formation",
  "bible",
  "community",
  "faculty",
  "students",
  "library",
  "worship",
  "graduation",
  "resources",
  "hero",
  "backgrounds",
] as const;

interface SeedDef {
  id: string;
  category: (typeof CATEGORIES)[number];
  subcategory: string;
  title: string;
  description: string;
  orientation: InstitutionalPhotoOrientation;
  recommended_section: InstitutionalPhotoAsset["recommended_section"];
  keywords: string[];
  photographer: string;
  license: string;
  status: InstitutionalPhotoAsset["status"];
  /** SVG editorial en public/editorial/ */
  editorialSource?: string;
  /** Fotografía provisional en scripts/media-sources/ (prioridad sobre editorialSource) */
  photoSource?: string;
  focal_point?: InstitutionalPhotoAsset["focal_point"];
  notes?: string;
}

const SEED_ASSETS: SeedDef[] = [
  {
    id: "formation-virtual-classroom",
    category: "formation",
    subcategory: "aula-virtual",
    title: "Aula virtual SEM",
    description:
      "Entorno de formación online con material bíblico — la tecnología como soporte del estudio ministerial.",
    orientation: "landscape",
    recommended_section: ["modality", "programs", "hero"],
    keywords: ["formación", "aula virtual", "campus", "online"],
    photographer: "SEM Editorial",
    license: "SEM-EDITORIAL-PLACEHOLDER",
    status: "provisional",
    editorialSource: "illustrations/virtual-classroom.svg",
    focal_point: { x: 0.5, y: 0.45 },
    notes: "Reemplazar por fotografía real de seminarista en estudio con Biblia.",
  },
  {
    id: "formation-study-session",
    category: "formation",
    subcategory: "material-formativo",
    title: "Sesión de estudio formativo",
    description: "Estudiante profundizando en material académico del seminario.",
    orientation: "landscape",
    recommended_section: ["programs", "card", "biblioteca"],
    keywords: ["estudio", "formación", "material formativo"],
    photographer: "SEM Editorial",
    license: "SEM-EDITORIAL-PLACEHOLDER",
    status: "provisional",
    editorialSource: "illustrations/study.svg",
    focal_point: { x: 0.55, y: 0.4 },
  },
  {
    id: "bible-open-scripture",
    category: "bible",
    subcategory: "biblia-abierta",
    title: "Biblia abierta",
    description: "Las Escrituras como fundamento visual de la identidad formativa del SEM.",
    orientation: "landscape",
    recommended_section: ["hero", "programs", "biblioteca"],
    keywords: ["biblia", "escrituras", "estudio bíblico"],
    photographer: "SEM Editorial",
    license: "SEM-EDITORIAL-PLACEHOLDER",
    status: "provisional",
    editorialSource: "illustrations/bible-open.svg",
    focal_point: { x: 0.5, y: 0.5 },
  },
  {
    id: "bible-study-notes",
    category: "bible",
    subcategory: "estudio-biblico",
    title: "Estudio bíblico con anotaciones",
    description: "Profundidad en el texto sagrado — composición con espacio para titulares.",
    orientation: "landscape",
    recommended_section: ["programs", "card", "modality"],
    keywords: ["estudio bíblico", "anotaciones", "hermenéutica"],
    photographer: "SEM Editorial",
    license: "SEM-EDITORIAL-PLACEHOLDER",
    status: "provisional",
    editorialSource: "illustrations/study.svg",
  },
  {
    id: "bible-personal-reading",
    category: "bible",
    subcategory: "lectura-personal",
    title: "Lectura personal de las Escrituras",
    description: "Devoción y formación espiritual en el ritmo del seminarista.",
    orientation: "portrait",
    recommended_section: ["testimonials", "card"],
    keywords: ["lectura", "devoción", "biblia"],
    photographer: "SEM Editorial",
    license: "SEM-EDITORIAL-PLACEHOLDER",
    status: "provisional",
    editorialSource: "illustrations/bible-open.svg",
    focal_point: { x: 0.5, y: 0.35 },
  },
  {
    id: "community-fellowship",
    category: "community",
    subcategory: "companerismo",
    title: "Compañerismo seminarista",
    description: "Comunidad cristiana en diálogo y formación conjunta.",
    orientation: "landscape",
    recommended_section: ["testimonials", "gallery", "equipo"],
    keywords: ["comunidad", "compañerismo", "diálogo"],
    photographer: "SEM Editorial",
    license: "SEM-EDITORIAL-PLACEHOLDER",
    status: "provisional",
    editorialSource: "illustrations/community.svg",
  },
  {
    id: "community-group-prayer",
    category: "community",
    subcategory: "oracion-grupo",
    title: "Oración en comunidad",
    description: "Vida espiritual compartida — discernimiento y acompañamiento.",
    orientation: "landscape",
    recommended_section: ["testimonials", "admission", "hero"],
    keywords: ["oración", "comunidad", "discernimiento"],
    photographer: "SEM Editorial",
    license: "SEM-EDITORIAL-PLACEHOLDER",
    status: "provisional",
    editorialSource: "illustrations/prayer.svg",
    focal_point: { x: 0.5, y: 0.3 },
  },
  {
    id: "community-collaborative",
    category: "community",
    subcategory: "trabajo-colaborativo",
    title: "Trabajo colaborativo",
    description: "Seminaristas en estudio grupal con enfoque ministerial.",
    orientation: "landscape",
    recommended_section: ["gallery", "programs"],
    keywords: ["colaboración", "grupo", "estudio"],
    photographer: "SEM Editorial",
    license: "SEM-EDITORIAL-PLACEHOLDER",
    status: "provisional",
    editorialSource: "illustrations/community.svg",
  },
  {
    id: "faculty-teaching",
    category: "faculty",
    subcategory: "docente-ensenando",
    title: "Docente en formación bíblica",
    description: "Autoridad académica y pastoral al servicio de la Iglesia.",
    orientation: "landscape",
    recommended_section: ["equipo", "card", "programs"],
    keywords: ["docente", "enseñanza", "teología"],
    photographer: "SEM Editorial",
    license: "SEM-EDITORIAL-PLACEHOLDER",
    status: "provisional",
    editorialSource: "illustrations/study.svg",
    notes: "Prioridad: retrato real de docente SEM con Biblia o pizarra.",
  },
  {
    id: "students-notes",
    category: "students",
    subcategory: "toma-apuntes",
    title: "Estudiante tomando apuntes",
    description: "Compromiso académico del seminarista en formación.",
    orientation: "landscape",
    recommended_section: ["programs", "card", "modality"],
    keywords: ["estudiantes", "apuntes", "formación"],
    photographer: "SEM Editorial",
    license: "SEM-EDITORIAL-PLACEHOLDER",
    status: "provisional",
    editorialSource: "illustrations/study.svg",
  },
  {
    id: "library-shelves",
    category: "library",
    subcategory: "biblioteca",
    title: "Biblioteca institucional",
    description: "Recursos académicos y teológicos para la formación ministerial.",
    orientation: "landscape",
    recommended_section: ["biblioteca", "programs"],
    keywords: ["biblioteca", "libros", "recursos"],
    photographer: "SEM Editorial",
    license: "SEM-EDITORIAL-PLACEHOLDER",
    status: "provisional",
    editorialSource: "illustrations/library.svg",
  },
  {
    id: "library-books",
    category: "library",
    subcategory: "libros",
    title: "Material bibliográfico",
    description: "Obras de referencia para el estudio teológico.",
    orientation: "landscape",
    recommended_section: ["biblioteca", "card"],
    keywords: ["libros", "teología", "material académico"],
    photographer: "SEM Editorial",
    license: "SEM-EDITORIAL-PLACEHOLDER",
    status: "provisional",
    editorialSource: "illustrations/library.svg",
  },
  {
    id: "worship-prayer",
    category: "worship",
    subcategory: "oracion",
    title: "Momento de oración",
    description: "Vida devocional y discernimiento vocacional.",
    orientation: "portrait",
    recommended_section: ["testimonials", "admission", "hero"],
    keywords: ["oración", "adoración", "vocación"],
    photographer: "SEM Editorial",
    license: "SEM-EDITORIAL-PLACEHOLDER",
    status: "provisional",
    editorialSource: "illustrations/prayer.svg",
  },
  {
    id: "worship-ministry",
    category: "worship",
    subcategory: "servicio",
    title: "Servicio cristiano",
    description: "Vocación al ministerio y servicio en la Iglesia.",
    orientation: "landscape",
    recommended_section: ["programs", "cta"],
    keywords: ["ministerio", "servicio", "iglesia"],
    photographer: "SEM Editorial",
    license: "SEM-EDITORIAL-PLACEHOLDER",
    status: "provisional",
    editorialSource: "illustrations/community.svg",
    notes: "Reemplazar por fotografía de servicio pastoral real.",
  },
  {
    id: "graduation-ceremony",
    category: "graduation",
    subcategory: "graduaciones",
    title: "Ceremonia de graduación",
    description: "Entrega de certificación y celebración de la promoción.",
    orientation: "landscape",
    recommended_section: ["noticias", "gallery", "hero"],
    keywords: ["graduación", "certificación", "promoción"],
    photographer: "SEM Editorial",
    license: "SEM-EDITORIAL-PLACEHOLDER",
    status: "pending",
    editorialSource: "backgrounds/bg-equipo.svg",
    notes: "Pendiente sesión fotográfica de graduación real.",
  },
  {
    id: "resources-notebooks",
    category: "resources",
    subcategory: "cuadernos",
    title: "Cuadernos y material de estudio",
    description: "Recursos físicos y digitales del proceso formativo.",
    orientation: "landscape",
    recommended_section: ["biblioteca", "card"],
    keywords: ["cuadernos", "material", "recursos"],
    photographer: "SEM Editorial",
    license: "SEM-EDITORIAL-PLACEHOLDER",
    status: "provisional",
    editorialSource: "illustrations/study.svg",
  },
  {
    id: "hero-ministerial-call",
    category: "hero",
    subcategory: "llamado-ministerial",
    title: "Llamado al ministerio",
    description: "Imagen principal — formación bíblica con espacio negativo para titular.",
    orientation: "landscape",
    recommended_section: ["hero"],
    keywords: ["hero", "vocación", "ministerio", "formación"],
    photographer: "SEM Editorial",
    license: "SEM-EDITORIAL-PLACEHOLDER",
    status: "provisional",
    photoSource: "admission-hero-provisional.jpg",
    editorialSource: "backgrounds/bg-hero.svg",
    focal_point: { x: 0.62, y: 0.45 },
    notes: "Provisional — reemplazar vía CMS (Imagen hero) o scripts/media-sources/admission-hero-provisional.jpg",
  },
  {
    id: "background-programs",
    category: "backgrounds",
    subcategory: "programas",
    title: "Fondo programas formativos",
    description: "Textura editorial para sección de programas.",
    orientation: "landscape",
    recommended_section: ["programs"],
    keywords: ["fondo", "programas", "editorial"],
    photographer: "SEM Editorial",
    license: "SEM-INTERNAL",
    status: "approved",
    editorialSource: "backgrounds/bg-programas.svg",
  },
  {
    id: "background-equipo",
    category: "backgrounds",
    subcategory: "equipo",
    title: "Fondo equipo docente",
    description: "Fondo institucional para página de equipo.",
    orientation: "landscape",
    recommended_section: ["equipo"],
    keywords: ["fondo", "docentes", "equipo"],
    photographer: "SEM Editorial",
    license: "SEM-INTERNAL",
    status: "approved",
    editorialSource: "backgrounds/bg-equipo.svg",
  },
  {
    id: "background-biblioteca",
    category: "backgrounds",
    subcategory: "biblioteca",
    title: "Fondo biblioteca",
    description: "Fondo para sección de biblioteca institucional.",
    orientation: "landscape",
    recommended_section: ["biblioteca"],
    keywords: ["fondo", "biblioteca"],
    photographer: "SEM Editorial",
    license: "SEM-INTERNAL",
    status: "approved",
    editorialSource: "backgrounds/bg-biblioteca.svg",
  },
  {
    id: "background-noticias",
    category: "backgrounds",
    subcategory: "noticias",
    title: "Fondo noticias",
    description: "Fondo editorial para actualidad institucional.",
    orientation: "landscape",
    recommended_section: ["noticias"],
    keywords: ["fondo", "noticias"],
    photographer: "SEM Editorial",
    license: "SEM-INTERNAL",
    status: "approved",
    editorialSource: "backgrounds/bg-noticias.svg",
  },
];

const MEDIA_SOURCES = join(process.cwd(), "scripts", "media-sources");

async function rasterizeSource(
  seed: SeedDef,
  outPath: string
): Promise<{ width: number; height: number }> {
  const baseW = seed.orientation === "portrait" ? 1200 : 1920;
  const baseH = seed.orientation === "portrait" ? 2560 : 1080;

  if (seed.photoSource) {
    const photoPath = join(MEDIA_SOURCES, seed.photoSource);
    if (!existsSync(photoPath)) {
      throw new Error(`Fuente fotográfica no encontrada: ${photoPath}`);
    }
    await sharp(photoPath)
      .resize(baseW, baseH, { fit: "cover", position: "centre" })
      .jpeg({ quality: 90, mozjpeg: true })
      .toFile(outPath);
  } else if (seed.editorialSource) {
    const srcPath = join(EDITORIAL, seed.editorialSource);
    if (!existsSync(srcPath)) {
      throw new Error(`Fuente editorial no encontrada: ${srcPath}`);
    }
    const buf = readFileSync(srcPath);
    await sharp(buf)
      .resize(baseW, baseH, {
        fit: "cover",
        background: { r: 248, g: 250, b: 251 },
      })
      .jpeg({ quality: 90, mozjpeg: true })
      .toFile(outPath);
  } else {
    throw new Error(`Seed ${seed.id} requiere editorialSource o photoSource`);
  }

  const meta = await sharp(outPath).metadata();
  return { width: meta.width ?? baseW, height: meta.height ?? baseH };
}

async function generateVariants(
  sourcePath: string,
  outDir: string
): Promise<{
  avif: Record<string, string>;
  webp: Record<string, string>;
  jpeg: Record<string, string>;
  blurDataURL: string;
}> {
  const avif: Record<string, string> = {};
  const webp: Record<string, string> = {};
  const jpeg: Record<string, string> = {};

  const source = sharp(sourcePath);

  for (const width of WIDTHS) {
    const key = `w${width}`;
    const avifPath = join(outDir, `${key}.avif`);
    const webpPath = join(outDir, `${key}.webp`);
    const jpegPath = join(outDir, `${key}.jpg`);

    await source
      .clone()
      .resize({ width, withoutEnlargement: true })
      .avif({ quality: 62 })
      .toFile(avifPath);
    avif[key] = `/media/${outDir.replace(ROOT + "\\", "").replace(ROOT + "/", "").replace(/\\/g, "/")}/${key}.avif`;

    await source
      .clone()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(webpPath);
    webp[key] = `/media/${outDir.replace(ROOT + "\\", "").replace(ROOT + "/", "").replace(/\\/g, "/")}/${key}.webp`;

    await source
      .clone()
      .resize({ width, withoutEnlargement: true })
      .jpeg({ quality: 85, mozjpeg: true })
      .toFile(jpegPath);
    jpeg[key] = `/media/${outDir.replace(ROOT + "\\", "").replace(ROOT + "/", "").replace(/\\/g, "/")}/${key}.jpg`;
  }

  const blurBuf = await source
    .clone()
    .resize(16)
    .jpeg({ quality: 40 })
    .toBuffer();
  const blurDataURL = `data:image/jpeg;base64,${blurBuf.toString("base64")}`;

  return { avif, webp, jpeg, blurDataURL };
}

function mediaUrl(category: string, id: string, file: string): string {
  return `/media/${category}/${id}/${file}`;
}

async function processSeed(seed: SeedDef): Promise<InstitutionalPhotoAsset> {
  const assetDir = join(ROOT, seed.category, seed.id);
  const variantsDir = join(assetDir, "variants");
  mkdirSync(variantsDir, { recursive: true });

  const sourceFile = join(assetDir, "source.jpg");
  const { width, height } = await rasterizeSource(seed, sourceFile);

  const { avif, webp, jpeg, blurDataURL } = await generateVariants(
    sourceFile,
    variantsDir
  );

  // Fix URLs to use forward slashes
  const fixUrls = (map: Record<string, string>) => {
    const fixed: Record<string, string> = {};
    for (const [k, v] of Object.entries(map)) {
      fixed[k] = v.replace(/\\/g, "/");
    }
    return fixed;
  };

  return {
    id: seed.id,
    category: seed.category,
    subcategory: seed.subcategory,
    title: seed.title,
    description: seed.description,
    orientation: seed.orientation,
    recommended_section: seed.recommended_section,
    keywords: seed.keywords,
    photographer: seed.photographer,
    license: seed.license,
    status: seed.status,
    focal_point: seed.focal_point,
    notes: seed.notes,
    source: mediaUrl(seed.category, seed.id, "source.jpg"),
    width,
    height,
    variants: {
      avif: fixUrls(avif),
      webp: fixUrls(webp),
      jpeg: fixUrls(webp),
    },
    blurDataURL,
  };
}

function fixVariantUrls(
  category: string,
  id: string,
  variants: { avif: Record<string, string>; webp: Record<string, string>; jpeg: Record<string, string> }
) {
  const prefix = `/media/${category}/${id}/variants`;
  const mapKeys = (ext: string) =>
    Object.fromEntries(WIDTHS.map((w) => [`w${w}`, `${prefix}/w${w}.${ext}`]));
  return {
    avif: mapKeys("avif"),
    webp: mapKeys("webp"),
    jpeg: mapKeys("jpg"),
  };
}

async function main() {
  for (const cat of CATEGORIES) {
    mkdirSync(join(ROOT, cat), { recursive: true });
  }

  const assets: InstitutionalPhotoAsset[] = [];

  for (const seed of SEED_ASSETS) {
    console.log(`  → ${seed.category}/${seed.id}`);
    const assetDir = join(ROOT, seed.category, seed.id);
    const variantsDir = join(assetDir, "variants");
    mkdirSync(variantsDir, { recursive: true });

    const sourceFile = join(assetDir, "source.jpg");
    const { width, height } = await rasterizeSource(seed, sourceFile);

    await generateVariants(sourceFile, variantsDir);

    const blurBuf = await sharp(sourceFile).resize(16).jpeg({ quality: 40 }).toBuffer();
    const blurDataURL = `data:image/jpeg;base64,${blurBuf.toString("base64")}`;

    assets.push({
      id: seed.id,
      category: seed.category,
      subcategory: seed.subcategory,
      title: seed.title,
      description: seed.description,
      orientation: seed.orientation,
      recommended_section: seed.recommended_section,
      keywords: seed.keywords,
      photographer: seed.photographer,
      license: seed.license,
      status: seed.status,
      focal_point: seed.focal_point,
      notes: seed.notes,
      source: `/media/${seed.category}/${seed.id}/source.jpg`,
      width,
      height,
      variants: fixVariantUrls(seed.category, seed.id, { avif: {}, webp: {}, jpeg: {} }),
      blurDataURL,
    });
  }

  const catalog: InstitutionalPhotoCatalog = {
    version: "1.0.0",
    ot: "OT-MEDIA-SEM-001",
    updatedAt: new Date().toISOString(),
    assets,
  };

  writeFileSync(join(ROOT, "catalog.json"), JSON.stringify(catalog, null, 2), "utf8");
  console.log(`\n✓ ${assets.length} assets · catalog.json publicado`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
