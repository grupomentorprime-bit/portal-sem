/** Medidas y reglas del fondo propio. Sin archivos ni base de datos. */

export const WALLPAPER_RECOMMENDED = { width: 1920, height: 1080 } as const;
export const WALLPAPER_MIN = { width: 640, height: 360 } as const;
export const WALLPAPER_MAX_EDGE = 2560;
export const WALLPAPER_MAX_BYTES = 8 * 1024 * 1024;
export const WALLPAPER_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const WALLPAPER_SIZE_HINT =
  "Medida recomendada: 1920 × 1080 px. JPG, PNG o WebP, hasta 8 MB.";

export function customWallpaperUrl(version?: string | null): string {
  const stamp = version?.trim() || "1";
  return `/api/desktop/wallpaper/file?v=${encodeURIComponent(stamp)}`;
}

export function wallpaperFileError(file: { type: string; size: number }): string | null {
  if (file.type && !(WALLPAPER_TYPES as readonly string[]).includes(file.type)) {
    return `Ese archivo no sirve como fondo. ${WALLPAPER_SIZE_HINT}`;
  }
  if (file.size > WALLPAPER_MAX_BYTES) {
    return `La imagen pesa demasiado. ${WALLPAPER_SIZE_HINT}`;
  }
  if (file.size < 1) {
    return `La imagen está vacía. ${WALLPAPER_SIZE_HINT}`;
  }
  return null;
}

export function wallpaperDimensionError(width: number, height: number): string | null {
  if (width < WALLPAPER_MIN.width || height < WALLPAPER_MIN.height) {
    return `Tu imagen mide ${width} × ${height} px. Hace falta al menos ${WALLPAPER_MIN.width} × ${WALLPAPER_MIN.height} px. Lo recomendado es ${WALLPAPER_RECOMMENDED.width} × ${WALLPAPER_RECOMMENDED.height} px.`;
  }
  return null;
}

export function wallpaperLoadedText(input: {
  width: number;
  height: number;
  savedWidth?: number;
  savedHeight?: number;
}): string {
  const loaded = `Tu imagen mide ${input.width} × ${input.height} px.`;
  const recommended = `Lo recomendado es ${WALLPAPER_RECOMMENDED.width} × ${WALLPAPER_RECOMMENDED.height} px.`;
  if (
    input.savedWidth &&
    input.savedHeight &&
    (input.savedWidth !== input.width || input.savedHeight !== input.height)
  ) {
    return `${loaded} Se ajustó a ${input.savedWidth} × ${input.savedHeight} px para el escritorio. ${recommended}`;
  }
  return `${loaded} ${recommended}`;
}
