import { Resend } from "resend";

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

export function emailFailureMessage(error: { name?: string; message?: string }): string {
  const detail = error.message ?? "";
  if (/testing emails|verify a domain/i.test(detail)) {
    return "El remitente del correo no está configurado.";
  }

  switch (error.name) {
    case "missing_api_key":
    case "invalid_api_key":
    case "restricted_api_key":
      return "El correo transaccional no está configurado.";
    case "invalid_from_address":
      return "El remitente del correo no está verificado.";
    case "monthly_quota_exceeded":
    case "daily_quota_exceeded":
      return "Se alcanzó el límite de correos. Intenta más tarde.";
    case "rate_limit_exceeded":
      return "Hay demasiados envíos seguidos. Espera un momento e intenta de nuevo.";
    case "validation_error":
    case "invalid_parameter":
    case "missing_required_field":
      return "El correo no se pudo armar. Revisa el destinatario y vuelve a intentar.";
    case "application_error":
      return "El servicio de correo no respondió. Intenta de nuevo.";
    default:
      return "No se pudo enviar el correo.";
  }
}

/** `From` RFC: nombre visible del Espacio + buzón técnico de Growth OS. */
export function formatFromHeader(displayName: string, mailbox: string): string {
  const name = displayName.trim();
  const address = mailbox.trim();
  const escaped = name.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${escaped}" <${address}>`;
}
