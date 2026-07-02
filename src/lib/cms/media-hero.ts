/** Constantes y utilidades OT-PORTAL-015 — Hero ↔ Biblioteca Multimedia */

export const HERO_DESKTOP_TARGET = { width: 1920, height: 900, ratio: 16 / 9 } as const;
export const HERO_MOBILE_TARGET = { width: 1080, height: 1350, ratio: 4 / 5 } as const;
export const HERO_UPLOAD_MAX_BYTES = 1024 * 1024; // 1 MB recomendado (advertencia, no bloqueo)

export const MEDIA_TAG_SUGGESTIONS = [
  "Hero",
  "Online",
  "Biblia",
  "Estudiantes",
  "Docentes",
  "Graduación",
  "Certificación",
  "Comunidad",
  "Portada",
  "Admisión",
  "Noticias",
  "Programas",
] as const;

export type HeroMediaContext = "hero-desktop" | "hero-mobile";

export interface HeroAspectWarning {
  message: string;
  severity: "info" | "warning";
}

function ratioDiff(actual: number, target: number): number {
  return Math.abs(actual - target) / target;
}

export function checkHeroAspectRatio(
  width: number | undefined,
  height: number | undefined,
  context: HeroMediaContext
): HeroAspectWarning | null {
  if (!width || !height) return null;

  const target =
    context === "hero-desktop" ? HERO_DESKTOP_TARGET : HERO_MOBILE_TARGET;
  const actualRatio = width / height;
  const diff = ratioDiff(actualRatio, target.ratio);

  if (diff <= 0.08) return null;

  const label = context === "hero-desktop" ? "16:9 (1920×900)" : "4:5 (1080×1350)";
  return {
    severity: "warning",
    message: `La imagen (${width}×${height}) no coincide con la relación recomendada ${label}. Se mostrará con recorte automático.`,
  };
}

export function formatMediaSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatMediaDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-CL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatMediaDimensions(
  width?: number,
  height?: number
): string {
  if (!width || !height) return "—";
  return `${width}×${height}`;
}
