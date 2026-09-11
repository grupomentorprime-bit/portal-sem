import { PLATFORM_DISPLAY_NAME, trimText } from "@/core/branding/display";
import { normalizeHost } from "@/core/tenant/hosts";
import { isValidEmail } from "@/lib/validation/identity";
import type { SiteConfig } from "@/types/cms";

export interface EmailIdentity {
  tenantId: string;
  siteId: string;
  /** Nombre visible del remitente y del cuerpo. Nunca SEM por default. */
  displayName: string;
  /** Reply-To del Espacio cuando `contact.email` es válido. */
  replyTo?: string;
  /** Origen público del Site que origina el correo (sin slash final). */
  origin: string;
}

export interface EmailDomainHint {
  host: string;
  tenantId: string;
  siteId: string;
  isPrimary?: boolean;
}

function isLocalHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".localhost")
  );
}

/** Host de Domain → origen absoluto. Loopback / *.localhost en http. */
export function originFromHost(host: string): string {
  const normalized = normalizeHost(host);
  if (!normalized) return "";
  const hostname = normalized.split(":")[0] ?? normalized;
  const protocol = isLocalHostname(hostname) ? "http" : "https";
  return `${protocol}://${normalized}`;
}

/**
 * Origen del Site dueño del correo. Solo dominios de ese tenant+site.
 * No usa APP_URL ni hosts de otro Espacio.
 */
export function pickEmailOrigin(input: {
  tenantId: string;
  siteId: string;
  domains: EmailDomainHint[];
  website?: string | null;
}): string {
  const tenantId = input.tenantId.trim();
  const siteId = input.siteId.trim();
  if (!tenantId || !siteId) return "";

  const owned = input.domains.filter(
    (domain) => domain.tenantId.trim() === tenantId && domain.siteId.trim() === siteId
  );
  const primary = owned.find((domain) => domain.isPrimary) ?? owned[0];
  if (primary?.host) {
    const origin = originFromHost(primary.host);
    if (origin) return origin;
  }

  const website = trimText(input.website);
  if (/^https?:\/\//i.test(website)) {
    return website.replace(/\/$/, "");
  }

  return "";
}

export function resolveEmailIdentity(input: {
  config?: SiteConfig | null;
  tenantId?: string;
  siteId?: string;
  origin?: string;
}): EmailIdentity {
  const tenantId =
    trimText(input.config?.institution.tenant) || trimText(input.tenantId);
  const siteId = trimText(input.siteId) || tenantId;
  const displayName =
    trimText(input.config?.institution.name) || PLATFORM_DISPLAY_NAME;
  const replyCandidate = trimText(input.config?.contact.email);
  const replyTo = isValidEmail(replyCandidate) ? replyCandidate : undefined;
  const origin = (input.origin ?? "").replace(/\/$/, "");

  return { tenantId, siteId, displayName, replyTo, origin };
}

export function emailAbsoluteUrl(
  identity: Pick<EmailIdentity, "origin">,
  pathOrUrl: string
): string {
  const trimmed = pathOrUrl.trim();
  if (!trimmed) return identity.origin;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  const origin = identity.origin.replace(/\/$/, "");
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return origin ? `${origin}${path}` : path;
}
