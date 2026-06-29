/** Separación Layout → Portal → Bloques */

export type PortalLayoutVariant = "default" | "landing" | "minimal";

export interface PortalLayoutConfig {
  variant: PortalLayoutVariant;
  showBreadcrumb?: boolean;
  showPageHeader?: boolean;
}

export const DEFAULT_PORTAL_LAYOUT: PortalLayoutConfig = {
  variant: "default",
  showBreadcrumb: false,
  showPageHeader: false,
};

export function resolveLayoutConfig(template?: string): PortalLayoutConfig {
  if (template === "landing") {
    return { variant: "landing", showBreadcrumb: false, showPageHeader: false };
  }
  if (template === "contact") {
    return { variant: "default", showBreadcrumb: true, showPageHeader: false };
  }
  return DEFAULT_PORTAL_LAYOUT;
}
