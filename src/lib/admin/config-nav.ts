import type { AdminNavItem } from "@/lib/admin/institutional";
import { getConfigSectionLabel } from "@/lib/admin/institutional";
import { CONFIG_SECTIONS, type ConfigSectionId } from "@/types/cms";

const VALID_SECTIONS = new Set<string>(CONFIG_SECTIONS.map((section) => section.id));

export function parseConfigSection(value: string | null | undefined): ConfigSectionId {
  if (value && VALID_SECTIONS.has(value)) {
    return value as ConfigSectionId;
  }
  return "general";
}

export function isConfigNavPath(pathname: string): boolean {
  return pathname === "/admin/config" || pathname.startsWith("/admin/config/");
}

export function getNavItemConfigSection(item: AdminNavItem): ConfigSectionId | null {
  if (!item.href.includes("/admin/config")) return null;

  try {
    const url = new URL(item.href, "http://localhost");
    return parseConfigSection(url.searchParams.get("section"));
  } catch {
    return item.href.startsWith("/admin/config") ? "general" : null;
  }
}

export function configSectionHref(section: ConfigSectionId): string {
  return `/admin/config?section=${section}`;
}

/** Secciones de config expuestas en el sidebar V2 (Institución). */
export interface InstitutionConfigNavDef {
  id: string;
  section: ConfigSectionId;
  /** Etiqueta en sidebar; por defecto usa CONFIG_SECTION_LABELS */
  label?: string;
}

export const INSTITUTION_CONFIG_NAV: InstitutionConfigNavDef[] = [
  { id: "institution-info", section: "general", label: "Información institucional" },
  { id: "institution-branding", section: "branding" },
  { id: "institution-contact", section: "contact" },
  { id: "institution-social", section: "social" },
  { id: "institution-seo", section: "seo" },
  { id: "institution-features", section: "features" },
  { id: "institution-status", section: "status" },
];

export function buildInstitutionConfigNavItems(
  requiredAnyPermission: NonNullable<AdminNavItem["requiredAnyPermission"]>
): AdminNavItem[] {
  return INSTITUTION_CONFIG_NAV.map((def) => ({
    id: def.id,
    href: configSectionHref(def.section),
    label: def.label ?? getConfigSectionLabel(def.section),
    icon: "institution",
    matchPrefixes: ["/admin/config"],
    requiredAnyPermission,
  }));
}

/** Secciones mostradas en el nav interno legacy (Shell V1). */
export const LEGACY_CONFIG_SECTION_NAV = CONFIG_SECTIONS;
