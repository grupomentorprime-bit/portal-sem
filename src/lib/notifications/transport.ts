import { Resend } from "resend";
import { publicTransactionalEmailError } from "@/lib/notifications/email-errors";

/** Buzón sandbox de Resend — solo transporte, sin nombre de cliente. */
export const DEFAULT_TECHNICAL_MAILBOX = "onboarding@resend.dev";

/**
 * Dominio ya verificado en Resend. Si el proceso no trae EMAIL_FROM, el
 * sandbox rechaza a cualquier destinatario real.
 */
export const VERIFIED_PROCESS_MAILBOX = "no-reply@semipn.cl";

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
function stripWrappingQuotes(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

export function parseTechnicalMailbox(from: string | null | undefined): string {
  const raw = stripWrappingQuotes(from?.trim() ?? "");
  if (!raw) return DEFAULT_TECHNICAL_MAILBOX;

  const angled = raw.match(ANGLE_ADDRESS);
  const candidate = stripWrappingQuotes((angled?.[1] ?? raw).trim());
  if (candidate.includes("@")) return candidate;

  return DEFAULT_TECHNICAL_MAILBOX;
}

export function getTechnicalMailbox(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
): string {
  return parseTechnicalMailbox(env.EMAIL_FROM);
}

/** Buzón de envío. Sin EMAIL_FROM no se usa el sandbox, que solo acepta la cuenta de prueba. */
export function mailboxForSend(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
): string {
  const mailbox = getTechnicalMailbox(env);
  if (mailbox.toLowerCase() === DEFAULT_TECHNICAL_MAILBOX) {
    return VERIFIED_PROCESS_MAILBOX;
  }
  return mailbox;
}

export function emailFailureMessage(error: {
  name?: string;
  message?: string;
}): string {
  return publicTransactionalEmailError(error);
}

/** `From` RFC: nombre visible del Espacio + buzón técnico de Growth OS. */
export function formatFromHeader(displayName: string, mailbox: string): string {
  const name = displayName.trim();
  const address = mailbox.trim();
  const escaped = name.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${escaped}" <${address}>`;
}
