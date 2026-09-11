/**
 * OT-GROWTH-CORE-005 — extracción mínima de contacto desde payloads de captación.
 * Sin inventar identidad: si no hay email ni teléfono, Growth no proyecta.
 */

function asString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

export interface GrowthContactFields {
  email?: string;
  phone?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
}

/** Lee campos típicos de Experience Forms (fullName / firstName / email / phone). */
export function extractGrowthContactFromFormData(
  data: Record<string, unknown>
): GrowthContactFields {
  const email = asString(data.email);
  const phone = asString(data.phone);
  const firstName = asString(data.firstName);
  const lastName = asString(data.lastName);
  const fullName = asString(data.fullName) ?? asString(data.name);

  let displayName = fullName;
  if (!displayName && (firstName || lastName)) {
    displayName = [firstName, lastName].filter(Boolean).join(" ");
  }

  return {
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {}),
    ...(displayName ? { displayName } : {}),
    ...(firstName ? { firstName } : {}),
    ...(lastName ? { lastName } : {}),
  };
}
