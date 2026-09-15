/**
 * OT-GROWTH-UX-ADMIN-MASTER-001 — navegación maestra (definición visual).
 * No migra rutas legacy ni crea módulos inexistentes.
 */

export type MasterNavHref = string | null;

export interface MasterNavItem {
  id: string;
  label: string;
  href: MasterNavHref;
  icon: MasterNavIcon;
}

export type MasterNavIcon =
  | "home"
  | "people"
  | "sales"
  | "messages"
  | "activity"
  | "campaigns"
  | "automations"
  | "analytics"
  | "site"
  | "team"
  | "settings";

/** Rutas reales existentes. `null` = solo dirección visual. */
export const GROWTH_OS_MASTER_NAV = {
  primary: [
    { id: "inicio", label: "Inicio", href: "/dev-preview/admin-master", icon: "home" },
    { id: "personas", label: "Personas", href: "/admin/personas", icon: "people" },
    { id: "ventas", label: "Ventas", href: null, icon: "sales" },
    { id: "mensajes", label: "Mensajes", href: null, icon: "messages" },
    { id: "actividad", label: "Actividad", href: "/admin/actividad", icon: "activity" },
  ] satisfies MasterNavItem[],
  grow: {
    label: "Crecer",
    items: [
      { id: "campanas", label: "Campañas", href: "/admin/campanas", icon: "campaigns" },
      { id: "automatizaciones", label: "Automatizaciones", href: null, icon: "automations" },
      { id: "analitica", label: "Analítica", href: "/admin/analitica", icon: "analytics" },
    ] satisfies MasterNavItem[],
  },
  tools: [
    { id: "sitio", label: "Sitio web", href: "/admin/pages", icon: "site" },
    { id: "equipo", label: "Equipo", href: "/admin/settings/team", icon: "team" },
    { id: "ajustes", label: "Ajustes", href: "/admin/settings/users", icon: "settings" },
  ] satisfies MasterNavItem[],
} as const;

export function masterNavLabels(): string[] {
  return [
    ...GROWTH_OS_MASTER_NAV.primary.map((item) => item.label),
    GROWTH_OS_MASTER_NAV.grow.label,
    ...GROWTH_OS_MASTER_NAV.grow.items.map((item) => item.label),
    ...GROWTH_OS_MASTER_NAV.tools.map((item) => item.label),
  ];
}
