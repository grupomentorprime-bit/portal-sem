import { Resend } from "resend";

/** Buzón sandbox de Resend — solo transporte, sin nombre de cliente. */
export const DEFAULT_TECHNICAL_MAILBOX = "onboarding@resend.dev";

const ANGLE_ADDRESS = /<([^>]+)>/;

export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  return new Resend(apiKey);
}

/**
 * Dirección técnica de proceso (ENV). Ignora cualquier nombre visible en EMAIL_FROM.
 * El nombre del remitente sale de la identidad del Espacio, no de este valor.
 */
export function parseTechnicalMailbox(from: string | null | undefined): string {
  const raw = from?.trim() ?? "";
  if (!raw) return DEFAULT_TECHNICAL_MAILBOX;

  const angled = raw.match(ANGLE_ADDRESS);
  const candidate = (angled?.[1] ?? raw).trim();
  if (candidate.includes("@")) return candidate;

  return DEFAULT_TECHNICAL_MAILBOX;
}

export function getTechnicalMailbox(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
): string {
  return parseTechnicalMailbox(env.EMAIL_FROM);
}

/** `From` RFC: nombre visible del Espacio + buzón técnico de Growth OS. */
export function formatFromHeader(displayName: string, mailbox: string): string {
  const name = displayName.trim();
  const address = mailbox.trim();
  const escaped = name.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${escaped}" <${address}>`;
}
