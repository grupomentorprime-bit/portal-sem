const TITLE_PREFIX_RE =
  /^(?:hno\.?|hermano|pastor(?:a)?|pte\.?|presidente)\s+/i;

/** True si el nombre ya empieza con Hno / Hermano / Pastor / etc. */
export function hasBrotherOrTitlePrefix(fullName: string): boolean {
  return TITLE_PREFIX_RE.test(fullName.trim());
}

/**
 * Asegura prefijo "Hno " para visualización operativa.
 * Si ya trae Hno/Hermano/Pastor, no duplica: normaliza a "Hno " + resto.
 * Pastor también se muestra como Hno (regla del evento).
 */
export function displayBrotherName(fullName: string): string {
  const trimmed = fullName.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  const without = trimmed.replace(TITLE_PREFIX_RE, "").trim();
  const base = without || trimmed;
  return `Hno ${base}`;
}

/** Persiste el prefijo Hno si faltaba (acción del operador). */
export function ensureHnoPrefix(fullName: string): string {
  return displayBrotherName(fullName);
}
