import type { FeatureFlags } from "@/types/cms";
import type { BlockType } from "@/types/page";

const BLOCK_TYPE_FEATURES: Partial<Record<BlockType, keyof FeatureFlags>> = {
  news: "news",
  events: "events",
  academic_agenda: "academicAgenda",
  institutional_notices: "institutionalNotices",
  library: "library",
  resources: "library",
  experience_form: "forms",
  contact: "forms",
  contact_hub: "forms",
  quick_contact: "forms",
  admission_process: "applications",
  scholarships: "applications",
};

const ROUTE_FEATURES: Array<{ prefix: string; feature: keyof FeatureFlags }> = [
  { prefix: "/noticias", feature: "news" },
  { prefix: "/eventos", feature: "events" },
  { prefix: "/biblioteca", feature: "library" },
  { prefix: "/agenda-academica", feature: "academicAgenda" },
  { prefix: "/avisos", feature: "institutionalNotices" },
  { prefix: "/formularios", feature: "forms" },
  { prefix: "/admision", feature: "applications" },
  { prefix: "/postulacion", feature: "applications" },
  { prefix: "/blog", feature: "blog" },
  { prefix: "/tienda", feature: "store" },
];

export const ADMIN_SECTION_FEATURES: Record<string, keyof FeatureFlags> = {
  "/admin/content/news": "news",
  "/admin/content/events": "events",
  "/admin/content/library": "library",
  "/admin/content/academic-agenda": "academicAgenda",
  "/admin/content/avisos": "institutionalNotices",
  "/admin/portal/forms": "forms",
  "/admin/portal/admission": "applications",
};

/** Funciones reservadas — el toggle se guarda; la ruta pública aún no existe */
export const FEATURES_WITHOUT_PUBLIC_ROUTE: Array<keyof FeatureFlags> = [
  "blog",
  "store",
  "onlinePayments",
];

export function isFeatureEnabled(
  features: FeatureFlags,
  key: keyof FeatureFlags
): boolean {
  return Boolean(features[key]);
}

export function getFeatureForPath(pathname: string): keyof FeatureFlags | null {
  const path = pathname.split("?")[0];
  for (const { prefix, feature } of ROUTE_FEATURES) {
    if (path === prefix || path.startsWith(`${prefix}/`)) {
      return feature;
    }
  }
  return null;
}

export function isPathEnabled(features: FeatureFlags, pathname: string): boolean {
  const feature = getFeatureForPath(pathname);
  if (!feature) return true;
  return isFeatureEnabled(features, feature);
}

export function getFeatureForBlockType(type: BlockType): keyof FeatureFlags | undefined {
  return BLOCK_TYPE_FEATURES[type];
}

export function isBlockTypeEnabled(
  features: FeatureFlags,
  type: BlockType
): boolean {
  const feature = getFeatureForBlockType(type);
  if (!feature) return true;
  return isFeatureEnabled(features, feature);
}

export function filterLinksByFeatures<T extends { href: string }>(
  links: T[],
  features: FeatureFlags
): T[] {
  return links.filter((link) => isPathEnabled(features, link.href));
}

export function isAdminSectionEnabled(
  features: FeatureFlags,
  href: string
): boolean {
  const feature = ADMIN_SECTION_FEATURES[href];
  if (!feature) return true;
  return isFeatureEnabled(features, feature);
}
