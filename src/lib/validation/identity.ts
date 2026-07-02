const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

export function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  if (trimmed.length > 254) return false;
  return EMAIL_RE.test(trimmed);
}

/** Nombre completo: al menos nombre y apellido separados por espacio. */
export function isValidFullName(name: string): boolean {
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (trimmed.length < 3 || trimmed.length > 120) return false;
  const parts = trimmed.split(" ");
  return parts.length >= 2 && parts.every((p) => p.length >= 2);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeFullName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}
