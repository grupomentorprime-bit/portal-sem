const LANDLINE_AREA_CODES = [
  "32",
  "33",
  "34",
  "35",
  "41",
  "42",
  "43",
  "45",
  "51",
  "52",
  "53",
  "55",
  "57",
  "58",
  "61",
  "63",
  "64",
  "65",
  "67",
  "71",
  "72",
  "73",
  "75",
] as const;

export const CHILE_PHONE_EXAMPLE = "+56 9 1234 5678";

export const CHILE_PHONE_INVALID_MESSAGE = `Ingresa un teléfono chileno válido (ej. ${CHILE_PHONE_EXAMPLE})`;

/** Dígitos nacionales sin código de país (+56). */
export function extractChileNationalDigits(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("56")) digits = digits.slice(2);
  while (digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

export function isValidChilePhone(value: string): boolean {
  const national = extractChileNationalDigits(value);
  if (!national) return false;
  if (/^9\d{8}$/.test(national)) return true;
  if (/^2\d{8}$/.test(national)) return true;
  return LANDLINE_AREA_CODES.some(
    (areaCode) => national.startsWith(areaCode) && national.length === 9
  );
}

/** Formato canónico de visualización: +56 9 1234 5678 */
export function formatChilePhoneDisplay(value: string): string {
  const national = extractChileNationalDigits(value);
  if (!national) return "";

  if (national.startsWith("9")) {
    const mobile = national.slice(0, 9);
    let result = "+56 9";
    const rest = mobile.slice(1);
    if (rest.length > 0) result += ` ${rest.slice(0, 4)}`;
    if (rest.length > 4) result += ` ${rest.slice(4, 8)}`;
    return result;
  }

  if (national.startsWith("2")) {
    const landline = national.slice(0, 9);
    let result = "+56 2";
    const rest = landline.slice(1);
    if (rest.length > 0) result += ` ${rest.slice(0, 4)}`;
    if (rest.length > 4) result += ` ${rest.slice(4, 8)}`;
    return result;
  }

  for (const areaCode of LANDLINE_AREA_CODES) {
    if (!national.startsWith(areaCode)) continue;
    const landline = national.slice(0, 9);
    let result = `+56 ${areaCode}`;
    const rest = landline.slice(areaCode.length);
    if (rest.length > 0) result += ` ${rest.slice(0, 3)}`;
    if (rest.length > 3) result += ` ${rest.slice(3, 6)}`;
    return result;
  }

  return `+56 ${national}`;
}

export function normalizeChilePhone(value: string): string | null {
  if (!isValidChilePhone(value)) return null;
  return formatChilePhoneDisplay(value);
}

export function formatChilePhoneInput(value: string): string {
  return formatChilePhoneDisplay(value);
}
