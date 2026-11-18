export const CHILE_RUT_EXAMPLE = "12.345.678-5";

export const CHILE_RUT_INVALID_MESSAGE = `Ingresa un RUT chileno válido (ej. ${CHILE_RUT_EXAMPLE})`;

/** Solo dígitos y K, en minúscula. */
export function extractChileRutBody(value: string): { body: string; dv: string } | null {
  const cleaned = value.toLowerCase().replace(/[^0-9k]/g, "");
  if (cleaned.length < 2) return null;
  return {
    body: cleaned.slice(0, -1),
    dv: cleaned.slice(-1),
  };
}

function expectedChileRutDv(body: string): string {
  let sum = 0;
  let multiplier = 2;
  for (let index = body.length - 1; index >= 0; index -= 1) {
    sum += Number(body[index]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const remainder = 11 - (sum % 11);
  if (remainder === 11) return "0";
  if (remainder === 10) return "k";
  return String(remainder);
}

export function isValidChileRut(value: string): boolean {
  const parts = extractChileRutBody(value);
  if (!parts) return false;
  if (!/^\d{7,8}$/.test(parts.body)) return false;
  if (!/^[0-9k]$/.test(parts.dv)) return false;
  return expectedChileRutDv(parts.body) === parts.dv;
}

/** Formato canónico: 12.345.678-9 */
export function formatChileRutDisplay(value: string): string {
  const parts = extractChileRutBody(value);
  if (!parts) return "";

  const body = parts.body.slice(0, 8);
  const groups: string[] = [];
  let rest = body;
  while (rest.length > 3) {
    groups.unshift(rest.slice(-3));
    rest = rest.slice(0, -3);
  }
  if (rest) groups.unshift(rest);

  const dv = parts.dv.toUpperCase();
  return `${groups.join(".")}-${dv}`;
}

export function normalizeChileRut(value: string): string | null {
  if (!isValidChileRut(value)) return null;
  return formatChileRutDisplay(value);
}

/** Mientras se escribe: conserva el primer carácter y arma puntos y guion. */
export function formatChileRutInput(value: string): string {
  const cleaned = value.toLowerCase().replace(/[^0-9k]/g, "").slice(0, 9);
  if (!cleaned) return "";
  if (cleaned.length === 1) return cleaned.toUpperCase();

  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1).toUpperCase();
  const groups: string[] = [];
  let rest = body;
  while (rest.length > 3) {
    groups.unshift(rest.slice(-3));
    rest = rest.slice(0, -3);
  }
  if (rest) groups.unshift(rest);

  return `${groups.join(".")}-${dv}`;
}
