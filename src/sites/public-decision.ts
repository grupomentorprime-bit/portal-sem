import type { ContactInfo, SocialLinks } from "@/types/cms";

export type PublicSiteDecision =
  | { kind: "platform" }
  | { kind: "coming-soon" }
  | { kind: "page"; path: string }
  | { kind: "not-found" };

function normalizePublicPath(pathname: string): string {
  const path = pathname.split("?")[0]?.split("#")[0] ?? "/";
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path || "/";
}

export function decidePublicSite(input: {
  hasTenant: boolean;
  sitePublished: boolean;
  hasSiteModule: boolean;
  pathname: string;
  registeredPaths: string[];
}): PublicSiteDecision {
  if (!input.hasTenant) return { kind: "platform" };
  if (!input.sitePublished || !input.hasSiteModule) return { kind: "coming-soon" };

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
