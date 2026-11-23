import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";

export type SelectionKind = "congress" | "roster";

export interface SelectionSubject {
  kind: SelectionKind;
  tenantId: string;
  subjectId: string;
  exp: number;
}

const VERSION = "v1";

function deriveKey(secret: string): Buffer {
  return createHash("sha256").update(secret).digest();
}

/** Cifra el id interno. La respuesta pública no lo muestra en claro. */
export function sealSelectionRef(subject: SelectionSubject, secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(secret), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(subject), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    VERSION,
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function openSelectionRef(
  token: string,
  secret: string,
  nowMs: number
): { ok: true; subject: SelectionSubject } | { ok: false; error: "invalid" | "expired" } {
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== VERSION) return { ok: false, error: "invalid" };
  try {
    const iv = Buffer.from(parts[1], "base64url");
    const tag = Buffer.from(parts[2], "base64url");
    const encrypted = Buffer.from(parts[3], "base64url");
    const decipher = createDecipheriv("aes-256-gcm", deriveKey(secret), iv);
    decipher.setAuthTag(tag);
    const json = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
    const subject = JSON.parse(json) as SelectionSubject;
    if (
      (subject.kind !== "congress" && subject.kind !== "roster") ||
      typeof subject.tenantId !== "string" ||
      typeof subject.subjectId !== "string" ||
      typeof subject.exp !== "number"
    ) {
      return { ok: false, error: "invalid" };
    }
    if (subject.exp <= nowMs) return { ok: false, error: "expired" };
    return { ok: true, subject };
  } catch {
    return { ok: false, error: "invalid" };
  }
}

let ephemeralSecret: string | null = null;

/** Secreto de proceso. No es un control de borde ni una clave de producción acreditada. */
export function selectionRefSecret(): string {
  const configured = process.env.SELECTION_REF_KEY?.trim();
  if (configured) return configured;
  if (!ephemeralSecret) ephemeralSecret = randomBytes(32).toString("base64url");
  return ephemeralSecret;
}
