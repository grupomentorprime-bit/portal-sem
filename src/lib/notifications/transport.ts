import { Resend } from "resend";
import { publicTransactionalEmailError } from "@/lib/notifications/email-errors";
import { customDomainHostSet } from "@/core/tenant/custom-domain-records";
import {
  isDevLoopbackSpaceHost,
  isLoopbackHost,
  normalizeHost,
  resolvePlatformBaseDomain,
} from "@/core/tenant/hosts";

/** Buzón sandbox de Resend — solo transporte, sin nombre de cliente. */
export const DEFAULT_TECHNICAL_MAILBOX = "onboarding@resend.dev";

/**
 * Dominio ya verificado en Resend. Si el proceso no trae EMAIL_FROM, el
 * sandbox rechaza a cualquier destinatario real.
 */
export const VERIFIED_PROCESS_MAILBOX = "no-reply@semipn.cl";

/** Parte local del From. El dominio se elige aparte. */
export const PLATFORM_MAILBOX_LOCAL_PART = "no-reply";

/**
 * Dominio de envío de la plataforma.
 * Los dominios de cada cliente no sustituyen este valor.
 */
export const PRINCIPAL_SENDING_DOMAIN = "mentorprime.cl";

export interface SendingDomainHint {
  host: string;
  tenantId: string;
  siteId: string;
  isPrimary?: boolean;
  kind?: string;
}

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

function isPlatformHostname(hostname: string, base: string | null): boolean {
  if (!base) return false;
  return hostname === base || hostname.endsWith(`.${base}`);
}

/** Dominio principal de envío. No lee el buzón de un cliente. */
export function principalSendingDomain(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
): string {
  return resolvePlatformBaseDomain(env) ?? PRINCIPAL_SENDING_DOMAIN;
}

/**
 * Dominio propio de este Espacio.
 * Un subdominio de plataforma (`{slug}.mentorprime.cl`) no es dominio de cliente.
 */
export function ownedSendingDomain(
  input: {
    tenantId: string;
    siteId: string;
    domains: SendingDomainHint[];
  },
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
): string | null {
  const tenantId = input.tenantId.trim();
  const siteId = input.siteId.trim();
  if (!tenantId || !siteId) return null;

  const base = principalSendingDomain(env);
  const candidates = input.domains.flatMap((domain) => {
    if (domain.tenantId.trim() !== tenantId || domain.siteId.trim() !== siteId) return [];
    if (domain.kind === "platform_subdomain") return [];
    if (domain.kind && domain.kind !== "custom" && domain.kind !== "legacy") return [];

    const host = normalizeHost(domain.host);
    const hostname = host?.split(":")[0] ?? "";
    if (!host || !hostname || isLoopbackHost(host) || isDevLoopbackSpaceHost(host)) return [];
    if (isPlatformHostname(hostname, base)) return [];

    return [{ hostname, isPrimary: Boolean(domain.isPrimary) }];
  });

  const picked = candidates.find((domain) => domain.isPrimary) ?? candidates[0];
  if (!picked) return null;
  return customDomainHostSet(picked.hostname).canonical;
}

/**
 * From del correo.
 * Dominio del cliente si ese Espacio ya lo tiene cargado.
 * Si no, el principal (`no-reply@mentorprime.cl`).
 * `EMAIL_FROM` no elige el dominio: un cliente no presta el suyo a los demás.
 */
export function resolveSendingMailbox(
  input: {
    tenantId: string;
    siteId: string;
    domains: SendingDomainHint[];
    env?: NodeJS.ProcessEnv | Record<string, string | undefined>;
  }
): string {
  const env = input.env ?? process.env;
  const domain = ownedSendingDomain(input, env) ?? principalSendingDomain(env);
  return `${PLATFORM_MAILBOX_LOCAL_PART}@${domain}`;
}

/** `From` RFC: nombre visible del Espacio + buzón de ese Espacio o de la plataforma. */
export function formatFromHeader(displayName: string, mailbox: string): string {
  const name = displayName.trim();
  const address = mailbox.trim();
  const escaped = name.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${escaped}" <${address}>`;
}
