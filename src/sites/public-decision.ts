import type { ContactInfo, SocialLinks } from "@/types/cms";

export type PublicSiteDecision =
  | { kind: "platform" }
  | { kind: "coming-soon" }
  | { kind: "passthrough" }
  | { kind: "portal" }
  | { kind: "page"; path: string }
  | { kind: "not-found" };

/**
 * El módulo de sitio no es el registro de carpetas en código.
 * Un sitio codificado de este repositorio cuenta como módulo de ese Espacio.
 * `siteEnabled: false` niega el portal aunque alguien publique.
 * Sin el campo, un sitio ya publicado conserva el portal (compatibilidad).
 * Un cliente nuevo nace con `siteEnabled: false` y no recibe sitio por defecto.
 */
export function isContractedSiteModule(input: {
  hasCodedSite: boolean;
  siteEnabled: boolean | undefined;
  sitePublished: boolean;
}): boolean {
  if (input.hasCodedSite) return true;
  if (input.siteEnabled === true) return true;
  if (input.siteEnabled === false) return false;
  return input.sitePublished === true;
}

function normalizePublicPath(pathname: string): string {
  const path = pathname.split("?")[0]?.split("#")[0] ?? "/";
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path || "/";
}

function isDirectFormPath(pathname: string): boolean {
  const path = normalizePublicPath(pathname);
  return path === "/formularios" || path.startsWith("/formularios/");
}

function isHelpPath(pathname: string): boolean {
  return normalizePublicPath(pathname) === "/ayuda";
}

export function decidePublicSite(input: {
  hasTenant: boolean;
  sitePublished: boolean;
  hasSiteModule: boolean;
  pathname: string;
  registeredPaths: string[];
  /** false: el módulo habilitado se sirve por el portal, no por una carpeta de código. */
  hasCodedSite?: boolean;
}): PublicSiteDecision {
  if (!input.hasTenant) return { kind: "platform" };
  if (isDirectFormPath(input.pathname) || isHelpPath(input.pathname)) return { kind: "passthrough" };
  if (!input.sitePublished || !input.hasSiteModule) return { kind: "coming-soon" };
  if (input.hasCodedSite === false) return { kind: "portal" };

  const path = normalizePublicPath(input.pathname);
  const registered = new Set(input.registeredPaths.map(normalizePublicPath));
  if (registered.has(path)) return { kind: "page", path };
  return { kind: "not-found" };
}

export interface ComingSoonLine {
  label: string;
  value: string;
  href?: string;
}

export interface ComingSoonModel {
  institutionName: string;
  message: "Este sitio está por comenzar";
  lines: ComingSoonLine[];
}

function line(label: string, value: string, href?: string): ComingSoonLine | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return href ? { label, value: trimmed, href } : { label, value: trimmed };
}

export function comingSoonModel(input: {
  institutionName: string;
  contact: ContactInfo;
  social: SocialLinks;
}): ComingSoonModel {
  const { contact, social } = input;
  const lines = [
    line("Correo", contact.email, contact.email.trim() ? `mailto:${contact.email.trim()}` : undefined),
    line("Teléfono", contact.phone, contact.phone.trim() ? `tel:${contact.phone.trim()}` : undefined),
    line("WhatsApp", contact.whatsapp),
    line("Dirección", contact.address),
    line("Región", contact.region ?? ""),
    line("Ciudad", contact.city),
    line("País", contact.country),
    line("Horario", contact.hours),
    line("Facebook", social.facebook, social.facebook.trim() || undefined),
    line("Instagram", social.instagram, social.instagram.trim() || undefined),
    line("YouTube", social.youtube, social.youtube.trim() || undefined),
    line("LinkedIn", social.linkedin, social.linkedin.trim() || undefined),
    line("TikTok", social.tiktok, social.tiktok.trim() || undefined),
    line("Spotify", social.spotify, social.spotify.trim() || undefined),
  ].filter((item): item is ComingSoonLine => item !== null);

  return {
    institutionName: input.institutionName.trim(),
    message: "Este sitio está por comenzar",
    lines,
  };
}
