import type { MediaFolder } from "@/types/media";
import type { HeroMediaContext } from "@/lib/cms/media-hero";

export interface MediaFolderHint {
  title: string;
  recommendations: string[];
  accept?: string;
  heroMode?: boolean;
}

export const MEDIA_FOLDER_HINTS: Partial<Record<MediaFolder, MediaFolderHint>> = {
  Logos: {
    title: "Aún no existen logos en esta carpeta",
    recommendations: [
      "Formato: PNG o SVG con fondo transparente",
      "Resolución recomendada: 1200 × 1200 px",
      "Peso: menor a 500 KB",
    ],
  },
  Hero: {
    title: "Aún no existen imágenes para el Hero",
    recommendations: [
      "Resolución: 1920 × 900 px",
      "Formato: JPG / WEBP",
      "Peso recomendado: menor a 1 MB",
      "Relación: 16:9",
    ],
    heroMode: true,
  },
  Programas: {
    title: "Aún no hay imágenes de programas",
    recommendations: [
      "Resolución recomendada: 1200 × 800 px",
      "Formato: JPG / WEBP",
      "Relación: 3:2",
    ],
  },
  Profesores: {
    title: "Aún no hay fotos de profesores",
    recommendations: [
      "Resolución recomendada: 800 × 800 px",
      "Formato: JPG / WEBP",
      "Relación: 1:1 (cuadrada)",
    ],
  },
  Noticias: {
    title: "Aún no hay imágenes de noticias",
    recommendations: [
      "Resolución recomendada: 1200 × 675 px",
      "Formato: JPG / WEBP",
      "Relación: 16:9",
    ],
  },
  Documentos: {
    title: "Aún no hay documentos",
    recommendations: [
      "Formatos: PDF, DOCX",
      "Peso máximo: 50 MB",
      "Use nombres descriptivos",
    ],
  },
  Landing: {
    title: "Aún no hay recursos para landing pages",
    recommendations: [
      "Imágenes: 1920 × 1080 px · JPG/WEBP",
      "Iconos: SVG o PNG",
    ],
  },
  Videos: {
    title: "Aún no hay videos",
    recommendations: ["Formato: MP4", "Peso máximo: 300 MB"],
  },
  Audio: {
    title: "Aún no hay archivos de audio",
    recommendations: ["Formato: MP3", "Peso máximo: 100 MB"],
  },
};

export const DEFAULT_FOLDER_HINT: MediaFolderHint = {
  title: "Esta carpeta está vacía",
  recommendations: [
    "Arrastre archivos o use el botón de subida",
    "Formatos: JPG, PNG, WEBP, SVG, PDF, MP4, MP3",
  ],
};

export function getFolderHint(folder?: string): MediaFolderHint {
  if (!folder) return DEFAULT_FOLDER_HINT;
  return MEDIA_FOLDER_HINTS[folder as MediaFolder] ?? {
    ...DEFAULT_FOLDER_HINT,
    title: `Aún no hay archivos en ${folder}`,
  };
}

export interface MediaContextHint {
  label: string;
  detail: string;
}

export function getPickerContextHint(
  pickerContext?: string,
  defaultFolder?: string
): MediaContextHint | null {
  if (
    pickerContext === "hero-desktop" ||
    pickerContext === "hero-mobile" ||
    defaultFolder === "Hero"
  ) {
    const mobile = pickerContext === "hero-mobile";
    return {
      label: "Hero recomendado",
      detail: mobile
        ? "1080×1350 px · JPG/WEBP · 4:5"
        : "1920×900 px · JPG/WEBP · 16:9",
    };
  }
  if (defaultFolder === "Logos") {
    return {
      label: "Logo recomendado",
      detail: "SVG o PNG transparente · 1200×1200 px",
    };
  }
  if (defaultFolder === "Programas") {
    return { label: "Programa recomendado", detail: "1200×800 px · JPG/WEBP" };
  }
  if (defaultFolder === "Profesores") {
    return { label: "Profesor recomendado", detail: "800×800 px · JPG/WEBP" };
  }
  if (defaultFolder === "Noticias") {
    return { label: "Noticia recomendada", detail: "1200×675 px · JPG/WEBP" };
  }
  return null;
}

export type { HeroMediaContext };
