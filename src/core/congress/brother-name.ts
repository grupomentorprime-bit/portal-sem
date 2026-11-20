const TITLE_PREFIX_RE =
  /^(?:hno\.?|hermano|pastor(?:a)?|pte\.?|presidente|di[aá]cono)\.?\s+/i;

/** Solo el trato de hermano. Pastor y otros títulos no se tocan. */
const HNO_PREFIX_RE = /^(?:hno\.?|hermano)\.?\s+/i;

/** True si el nombre ya empieza con Hno / Hermano / Pastor / etc. */
export function hasBrotherOrTitlePrefix(fullName: string): boolean {
  return TITLE_PREFIX_RE.test(fullName.trim());
}

/** Nombre en minúsculas, sin título, conservando acentos. */
export function congressPersonSpellingKey(fullName: string): string {
  return fullName
    .trim()
    .replace(TITLE_PREFIX_RE, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Clave plegada para detectar la misma persona (sin título ni acentos). */
export function foldCongressPersonName(fullName: string): string {
  return congressPersonSpellingKey(fullName)
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/**
 * Nombre para mostrar y guardar, sin el prefijo Hno/Hermano.
 * Pastor, diácono y presidente se conservan: no todos son hermanos.
 */
export function displayBrotherName(fullName: string): string {
  const trimmed = fullName.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  return trimmed.replace(HNO_PREFIX_RE, "").trim();
}

/** Quita el prefijo Hno al guardar. El nombre de la función se conserva por la API. */
export function ensureHnoPrefix(fullName: string): string {
  return displayBrotherName(fullName);
}
