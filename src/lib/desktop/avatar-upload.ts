/** Medidas y reglas de la foto de avatar. Sin archivos ni base de datos. */

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_MIN_EDGE = 128;
export const AVATAR_MAX_EDGE = 512;
export const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const AVATAR_SIZE_HINT =
  "Medida recomendada: 512 × 512 px. JPG, PNG o WebP, hasta 2 MB.";

export function avatarFileError(file: { type: string; size: number }): string | null {
  if (file.type && !(AVATAR_TYPES as readonly string[]).includes(file.type)) {
    return `Ese archivo no sirve como foto de avatar. ${AVATAR_SIZE_HINT}`;
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return `La imagen pesa demasiado. ${AVATAR_SIZE_HINT}`;
  }
  if (file.size < 1) {
    return `La imagen está vacía. ${AVATAR_SIZE_HINT}`;
  }
  return null;
}

export function avatarDimensionError(width: number, height: number): string | null {
  if (width < AVATAR_MIN_EDGE || height < AVATAR_MIN_EDGE) {
    return `Tu imagen mide ${width} × ${height} px. Hace falta al menos ${AVATAR_MIN_EDGE} × ${AVATAR_MIN_EDGE} px. Lo recomendado es ${AVATAR_MAX_EDGE} × ${AVATAR_MAX_EDGE} px.`;
  }
  return null;
}
