/**
 * Sidebar V2 — navegación Growth OS (OT-GROWTH-UX-ADMIN-SHELL-002).
 * Misma IAM y rutas; reorganización al patrón maestro aprobado.
 * Módulos futuros: representación visual sin páginas vacías.
 */

import type { AdminNavItem } from "@/lib/admin/institutional";
import { isNavActive } from "@/lib/admin/institutional";
import {
  getNavItemConfigSection,
  isConfigNavPath,
  parseConfigSection,
} from "@/lib/admin/config-nav";

export type NavGroupId =
  | "dashboard"
  | "personas"
  | "ventas"
  | "mensajes"
  | "actividad"
  | "campanas"
  | "automatizaciones"
  | "analitica"
  | "sitio-web"
  | "equipo"
  | "ajustes"
  /** @deprecated Conservados para imports / tipos legacy */
  | "institution"
  | "academic"
  | "formularios"
  | "portal-web"
  | "communications"
  | "configuration"
  | "development"
  | "support";

export interface AdminNavGroup {
  id: NavGroupId;
  label: string;
  icon: string;
  items: AdminNavItem[];
  badge?: number;
}

interface AdminNavGroupDef {
  id: NavGroupId;
  label: string;
  icon: string;
  items: AdminNavItem[];
}

/** Ítem de navegación sin destino — dirección visual (sin página vacía). */
export function isNavPlaceholder(item: AdminNavItem): boolean {
  return item.href == null;
}

/** Enlaces complementarios — breadcrumbs y rutas auxiliares (sin cambios IAM). */
export const ADMIN_SIDEBAR_SUPPLEMENTAL: AdminNavItem[] = [
  {
    href: "/admin/menus",
    label: "Menús",
    icon: "portal",
    matchPrefixes: ["/admin/menus"],
    requiredAnyPermission: ["cms.menus.read"],
  },
  {
    href: "/admin/experience-studio",
    label: "Experience Studio",
    icon: "portal",
    matchPrefixes: ["/admin/experience-studio"],
    requiredAnyPermission: ["cms.pages.update", "experience.forms.manage"],
  },
  {
    href: "/admin/settings/help",
    label: "Ayuda",
    icon: "admin",
    matchPrefixes: ["/admin/settings/help"],
    requiredAnyPermission: ["cms.pages.read", "settings.team", "student-affairs.read"],
  },
  {
    href: "/admin/aek",
    label: "Catálogo AEK",
    icon: "admin",
    matchPrefixes: ["/admin/aek"],
    requiredAnyPermission: ["settings.team"],
  },
  {
    href: "/admin/settings/security",
    label: "Seguridad",
    icon: "admin",
    matchPrefixes: ["/admin/settings/security"],
    requiredAnyPermission: ["settings.team", "cms.pages.read", "student-affairs.read"],
  },
  {
    href: "/admin/settings/channels",
    label: "Canales",
    icon: "messages",
    matchPrefixes: ["/admin/settings/channels"],
    requiredAnyPermission: ["settings.integrations"],
  },
  {
    href: "/admin/settings/integrations",
    label: "Integraciones",
    icon: "admin",
    matchPrefixes: ["/admin/settings/integrations"],
    requiredAnyPermission: ["settings.team"],
  },
  {
    href: "/admin/settings/roles",
    label: "Roles y permisos",
    icon: "admin",
    matchPrefixes: ["/admin/settings/roles"],
    requiredAnyPermission: ["identity.roles.manage"],
  },
];

const ADMIN_NAV_GROUPS: AdminNavGroupDef[] = [
  {
    id: "dashboard",
    label: "Inicio",
    icon: "home",
    items: [
      {
        id: "dashboard-home",
        href: "/admin",
        label: "Inicio",
        icon: "home",
        matchPrefixes: ["/admin"],
        requiredAnyPermission: ["cms.pages.read", "settings.team", "student-affairs.read"],
      },
    ],
  },
  {
    id: "personas",
    label: "Personas",
    icon: "people",
    items: [
      {
        id: "growth-personas",
        href: "/admin/personas",
        label: "Personas",
        icon: "people",
        matchPrefixes: ["/admin/personas"],
        requiredAnyPermission: [
          "cms.pages.read",
          "experience.forms.read",
          "experience.forms.manage",
          "settings.team",
        ],
      },
    ],
  },
  {
    id: "ventas",
    label: "Ventas",
    icon: "sales",
    items: [
      {
        id: "nav-ventas",
        href: "/admin/ventas",
        label: "Ventas",
        icon: "sales",
        matchPrefixes: ["/admin/ventas"],
        requiredAnyPermission: ["growth.sales.read", "growth.sales.operate"],
      },
    ],
  },
  {
    id: "mensajes",
    label: "Mensajes",
    icon: "messages",
    items: [
      {
        id: "nav-mensajes",
        href: "/admin/mensajes",
        label: "Mensajes",
        icon: "messages",
        matchPrefixes: ["/admin/mensajes"],
        requiredAnyPermission: ["growth.sales.read", "growth.sales.operate"],
      },
    ],
  },
  {
    id: "actividad",
    label: "Actividad",
    icon: "activity",
    items: [
      {
        id: "nav-actividad",
        href: "/admin/settings/activity",
        label: "Actividad",
        icon: "activity",
        matchPrefixes: ["/admin/settings/activity"],
        requiredAnyPermission: ["identity.audit.read", "settings.team"],
      },
    ],
  },
  {
    id: "campanas",
    label: "Campañas",
    icon: "campaigns",
    items: [
      {
        id: "nav-campanas",
        href: null,
        label: "Campañas",
        icon: "campaigns",
      },
    ],
  },
  {
    id: "automatizaciones",
    label: "Automatizaciones",
    icon: "automations",
    items: [
      {
        id: "nav-automatizaciones",
        href: "/admin/automatizaciones",
        label: "Automatizaciones",
        icon: "automations",
        matchPrefixes: ["/admin/automatizaciones"],
        requiredAnyPermission: [
          "growth.automations.view",
          "growth.automations.manage",
        ],
      },
    ],
  },
  {
    id: "analitica",
    label: "Analítica",
    icon: "analytics",
    items: [
      {
        id: "nav-analitica",
        href: null,
        label: "Analítica",
        icon: "analytics",
      },
    ],
  },
  {
    id: "sitio-web",
    label: "Sitio web",
    icon: "site",
    items: [
      {
        id: "portal-pages",
        href: "/admin/pages",
        label: "Portal",
        icon: "portal",
        matchPrefixes: ["/admin/pages"],
        requiredAnyPermission: ["cms.pages.read", "cms.pages.update"],
      },
      {
        id: "portal-menus",
        href: "/admin/menus",
        label: "Menús",
        icon: "portal",
        matchPrefixes: ["/admin/menus"],
        requiredAnyPermission: ["cms.menus.read"],
      },
      {
        id: "portal-studio",
        href: "/admin/experience-studio",
        label: "Editor visual",
        icon: "portal",
        matchPrefixes: ["/admin/experience-studio"],
        requiredAnyPermission: ["cms.pages.update", "experience.forms.manage"],
      },
      {
        id: "institution-info",
        href: "/admin/config",
        label: "Institución",
        icon: "institution",
        matchPrefixes: ["/admin/config"],
        requiredAnyPermission: ["settings.update"],
      },
      {
        id: "institution-authorities",
        href: "/admin/content/people",
        label: "Autoridades",
        icon: "people",
        matchPrefixes: ["/admin/content/people", "/admin/content/team"],
        requiredAnyPermission: ["cms.pages.read", "cms.pages.update", "programs.manage"],
      },
      {
        id: "academic-programs",
        href: "/admin/content/programs",
        label: "Programas",
        icon: "programs",
        matchPrefixes: ["/admin/content/programs"],
        requiredAnyPermission: ["programs.manage", "cms.pages.read"],
      },
      {
        id: "academic-courses",
        href: "/admin/content/courses",
        label: "Cursos",
        icon: "programs",
        matchPrefixes: ["/admin/content/courses"],
        requiredAnyPermission: ["programs.manage", "cms.pages.read"],
      },
      {
        id: "convocatorias-config",
        href: "/admin/portal/forms",
        label: "Formularios",
        icon: "admission",
        matchPrefixes: [
          "/admin/portal/forms",
          "/admin/portal/convocatorias/configuracion",
        ],
        requiredAnyPermission: [
          "cms.pages.read",
          "experience.forms.read",
          "experience.forms.manage",
        ],
      },
      {
        id: "convocatorias-resultados",
        href: "/admin/portal/asuntos-estudiantiles",
        label: "Operación de formularios",
        icon: "students",
        matchPrefixes: ["/admin/portal/asuntos-estudiantiles"],
        requiredAnyPermission: [
          "student-affairs.read",
          "student-affairs.checkin",
          "student-affairs.manage",
          "experience.forms.read",
          "experience.forms.manage",
        ],
      },
      {
        id: "portal-admission",
        href: "/admin/portal/admission",
        label: "Centro de admisión",
        icon: "admission",
        matchPrefixes: ["/admin/portal/admission"],
        requiredAnyPermission: [
          "cms.pages.read",
          "experience.forms.read",
          "experience.forms.manage",
          "students.read",
        ],
      },
      {
        id: "communications-hub",
        href: "/admin/content",
        label: "Comunicaciones",
        icon: "communications",
        matchPrefixes: [
          "/admin/content",
          "/admin/content/news",
          "/admin/content/events",
          "/admin/content/library",
          "/admin/content/institutional_notices",
          "/admin/content/academic_agenda",
        ],
        requiredAnyPermission: [
          "cms.pages.read",
          "cms.pages.update",
          "news.publish",
          "content.events.manage",
          "programs.manage",
        ],
      },
      {
        id: "communications-media",
        href: "/admin/media",
        label: "Medios",
        icon: "media",
        matchPrefixes: ["/admin/media"],
        requiredAnyPermission: ["cms.media.read", "cms.media.upload"],
      },
    ],
  },
  {
    id: "equipo",
    label: "Equipo",
    icon: "team",
    items: [
      {
        id: "nav-equipo",
        href: "/admin/settings/team",
        label: "Equipo",
        icon: "team",
        matchPrefixes: ["/admin/settings/team"],
        requiredAnyPermission: ["settings.team"],
      },
    ],
  },
  {
    id: "ajustes",
    label: "Ajustes",
    icon: "settings",
    items: [
      {
        id: "config-administration",
        href: "/admin/settings/users",
        label: "Usuarios",
        icon: "admin",
        matchPrefixes: [
          "/admin/settings/users",
          "/admin/workflows",
          "/admin/events",
          "/admin/experience",
        ],
        requiredAnyPermission: [
          "settings.team",
          "identity.audit.read",
          "workflow.read",
          "identity.roles.manage",
        ],
      },
      {
        id: "config-roles",
        href: "/admin/settings/roles",
        label: "Roles y permisos",
        icon: "admin",
        matchPrefixes: ["/admin/settings/roles"],
        requiredAnyPermission: ["identity.roles.manage"],
      },
      {
        id: "config-security",
        href: "/admin/settings/security",
        label: "Seguridad",
        icon: "admin",
        matchPrefixes: ["/admin/settings/security"],
        requiredAnyPermission: ["settings.team", "identity.roles.manage"],
      },
      {
        id: "config-channels",
        href: "/admin/settings/channels",
        label: "Canales",
        icon: "messages",
        matchPrefixes: ["/admin/settings/channels"],
        requiredAnyPermission: ["settings.integrations"],
      },
      {
        id: "config-integrations",
        href: "/admin/settings/integrations",
        label: "Integraciones",
        icon: "admin",
        matchPrefixes: ["/admin/settings/integrations"],
        requiredAnyPermission: ["settings.team"],
      },
      {
        id: "development-aek",
        href: "/admin/aek",
        label: "Catálogo AEK",
        icon: "admin",
        matchPrefixes: ["/admin/aek"],
        requiredAnyPermission: ["settings.team"],
      },
      {
        id: "support-help",
        href: "/admin/settings/help",
        label: "Ayuda",
        icon: "help",
        matchPrefixes: ["/admin/settings/help"],
        requiredAnyPermission: ["cms.pages.read", "settings.team", "student-affairs.read"],
      },
    ],
  },
];

export function getAllNavTreeItems(): AdminNavItem[] {
  return ADMIN_NAV_GROUPS.flatMap((group) => group.items);
}

export function buildAdminNavGroups(
  visibleItems: AdminNavItem[],
  navBadges?: Record<string, number>
): AdminNavGroup[] {
  const visibleKeys = new Set(visibleItems.map((item) => item.id ?? item.href ?? item.label));

  function itemVisible(item: AdminNavItem): boolean {
    return visibleKeys.has(item.id ?? item.href ?? item.label);
  }

  return ADMIN_NAV_GROUPS.map((group) => {
    const items = group.items.filter(itemVisible).map((item) => ({
      ...item,
      badge: navBadges?.[item.id ?? item.href ?? item.label] ?? item.badge,
    }));

    const groupBadge = items.reduce((sum, item) => sum + (item.badge ?? 0), 0);

    return {
      id: group.id,
      label: group.label,
      icon: group.icon,
      items,
      badge: groupBadge > 0 ? groupBadge : undefined,
    };
  }).filter((group) => group.items.length > 0);
}

/** Resuelve el grupo que contiene la ruta activa. */
export function findActiveNavGroupId(
  pathname: string,
  groups: AdminNavGroup[],
  searchParams?: Pick<URLSearchParams, "get"> | null
): NavGroupId | null {
  for (const group of groups) {
    for (const item of group.items) {
      if (isSidebarItemActive(pathname, item, searchParams)) {
        return group.id;
      }
    }
  }
  return null;
}

/** Activo en sidebar — distingue sub-ítems de /admin/config por ?section=. */
export function isSidebarItemActive(
  pathname: string,
  item: AdminNavItem,
  searchParams?: Pick<URLSearchParams, "get"> | null
): boolean {
  if (isNavPlaceholder(item)) return false;

  if (item.id === "institution-info") {
    return isConfigNavPath(pathname);
  }

  const configSection = getNavItemConfigSection(item);
  if (configSection !== null) {
    if (!isConfigNavPath(pathname)) return false;
    const current = parseConfigSection(searchParams?.get("section") ?? null);
    return configSection === current;
  }

  if (item.id === "convocatorias-resultados") {
    return pathname.startsWith("/admin/portal/asuntos-estudiantiles");
  }

  if (item.id === "convocatorias-config") {
    if (pathname.startsWith("/admin/portal/asuntos-estudiantiles")) return false;
    if (pathname.startsWith("/admin/portal/forms/convocatorias/")) return false;
    if (pathname.startsWith("/admin/portal/convocatorias/configuracion")) return true;
    if (pathname === "/admin/portal/forms") return true;
    return pathname.startsWith("/admin/portal/forms/");
  }

  if (item.id === "config-administration") {
    return isNavActive(pathname, item);
  }

  return isNavActive(pathname, item);
}

/** @deprecated Usar buildAdminNavGroups — conservado para imports legacy. */
export type NavDomainId = NavGroupId;

/** @deprecated Usar AdminNavGroup */
export type AdminSidebarDomain = AdminNavGroup;

/** @deprecated Usar buildAdminNavGroups */
export function groupNavItemsByDomain(
  primaryItems: AdminNavItem[],
  _supplementalItems: AdminNavItem[] = []
): AdminNavGroup[] {
  return buildAdminNavGroups(primaryItems);
}

/** @deprecated */
export interface NavSidebarZone {
  id: string;
  /** Etiqueta de zona (no clicable) */
  label?: string;
  groupIds: NavGroupId[];
}

/**
 * Agrupación visual del sidebar — patrón maestro Growth OS.
 * Core · Crecer · herramientas secundarias.
 */
export const NAV_SIDEBAR_ZONES: NavSidebarZone[] = [
  {
    id: "core",
    groupIds: ["dashboard", "personas", "ventas", "mensajes", "actividad"],
  },
  {
    id: "grow",
    label: "Crecer",
    groupIds: ["campanas", "automatizaciones", "analitica"],
  },
  {
    id: "tools",
    groupIds: ["sitio-web", "equipo", "ajustes"],
  },
];

export function getDomainLabel(id: NavGroupId): string {
  const group = ADMIN_NAV_GROUPS.find((g) => g.id === id);
  return group?.label ?? id;
}

export function flattenNavGroups(groups: AdminNavGroup[]): AdminNavItem[] {
  return groups.flatMap((group) => group.items);
}
