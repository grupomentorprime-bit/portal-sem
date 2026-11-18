import { normalizeChilePhone } from "@/lib/experience/forms/phone-chile";

export const ACCOUNT_PHONE_INVALID =
  "Revisa el teléfono. En Chile: +56 9 1234 5678. Desde otro país incluye el código, por ejemplo +54, +51 o +1.";

export const ACCOUNT_PHONE_CHILE_INVALID =
  "Ese número de Chile no es válido. Ejemplo: +56 9 1234 5678.";

/** Códigos de llamada, del más largo al más corto, para separar el país del resto. */
const CALLING_CODES = [
  "998", "996", "995", "994", "993", "992",
  "977", "976", "975", "974", "973", "972", "971", "970", "968", "967", "966", "965", "964", "963", "962", "961", "960",
  "886", "880", "856", "855", "853", "852", "850",
  "692", "691", "690", "689", "688", "687", "686", "685", "683", "682", "681", "680", "679", "678", "677", "676", "675", "674", "673", "672", "670",
  "598", "597", "596", "595", "594", "593", "592", "591",
  "509", "507", "506", "505", "504", "503", "502", "501",
  "423", "421", "420",
  "389", "387", "386", "385", "382", "381", "380", "378", "377", "376", "375", "374", "373", "372", "371", "370",
  "359", "358", "357", "356", "355", "354", "353", "352", "351",
  "218", "216", "213", "212",
  "98", "95", "94", "93", "92", "91", "90",
  "86", "84", "82", "81",
  "66", "65", "64", "63", "62", "61", "60",
  "58", "57", "56", "55", "54", "53", "52", "51",
  "49", "48", "47", "46", "45", "44", "43", "41", "40", "39", "36", "34", "33", "32", "31", "30",
  "27", "20",
  "7", "1",
];

export type AccountPhoneResult =
  | { ok: true; phone: string }
  | { ok: false; error: string };

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function groupNational(national: string): string {
  const length = national.length;
  if (length <= 4) return national;

  const sizes: number[] = [];
  if (length % 3 === 0) {
    for (let index = 0; index < length; index += 3) sizes.push(3);
  } else if (length % 3 === 1) {
    for (let index = 0; index < length - 4; index += 3) sizes.push(3);
    sizes.push(4);
  } else if (length === 5) {
    sizes.push(2, 3);
  } else if (length === 8) {
    sizes.push(4, 4);
  } else {
    sizes.push(3);
    for (let index = 3; index < length; index += 4) sizes.push(4);
  }

  const parts: string[] = [];
  let cursor = 0;
  for (const size of sizes) {
    parts.push(national.slice(cursor, cursor + size));
    cursor += size;
  }
  return parts.join(" ");
}

function formatInternational(digits: string): string {
  for (const code of CALLING_CODES) {
    if (!digits.startsWith(code)) continue;
    const national = digits.slice(code.length);
    if (national.length < 4 || national.length > 12) continue;
    return `+${code} ${groupNational(national)}`;
  }
  return `+${digits}`;
}

/**
 * Teléfono de la cuenta.
 * Chile se acepta con o sin +56 y queda como +56 9 1234 5678.
 * Otro país se acepta con código internacional (+54, +1, 00…).
 * Vacío es válido: el teléfono no es obligatorio.
 */
export function normalizeAccountPhone(raw: string): AccountPhoneResult {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, phone: "" };

  let source = trimmed.replace(/[().-]/g, " ").replace(/\s+/g, " ");
  if (source.startsWith("00")) source = `+${source.slice(2).trim()}`;
  const hasPlus = source.startsWith("+");
  const digits = digitsOnly(source);
  if (!digits || /[^\d+\s]/.test(source)) {
    return { ok: false, error: ACCOUNT_PHONE_INVALID };
  }

  if (digits.startsWith("56") || (!hasPlus && digits.length <= 11)) {
    const chileSource = digits.startsWith("56") ? `+${digits}` : digits;
    const chile = normalizeChilePhone(chileSource);
    if (chile) return { ok: true, phone: chile };
    if (digits.startsWith("56") || !hasPlus) {
      return { ok: false, error: digits.startsWith("56") ? ACCOUNT_PHONE_CHILE_INVALID : ACCOUNT_PHONE_INVALID };
    }
  }

  if (!hasPlus) return { ok: false, error: ACCOUNT_PHONE_INVALID };
  if (!/^[1-9]\d{7,14}$/.test(digits)) return { ok: false, error: ACCOUNT_PHONE_INVALID };
  return { ok: true, phone: formatInternational(digits) };
}
