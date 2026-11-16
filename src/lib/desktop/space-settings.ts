/**
 * Accesos de Ajustes de empresa en NELZURI.
 *
 * Presencia:
 * - Mi empresa y Marca editan la SiteConfig del Espacio, sin abrir Growth OS.
 * - Sitio web administra la presencia pública cuando el plan incluye esa
 *   funcionalidad (Growth OS). No hay una segunda ficha ni datos duplicados.
 * El resto enlaza pantallas existentes. La seguridad personal vive en Mi cuenta.
 */

import type { MentorAppId } from "@/lib/desktop/catalog";

export type SpaceSettingId =
  | "empresa"
  | "marca"
  | "sitio"
  | "equipo"
  | "roles"
  | "canales"
  | "integraciones";

export type SpacePresencePanelId = "empresa" | "marca" | "sitio";
export type SpaceTeamPanelId = "equipo" | "roles";
export type SpacePanelId = SpacePresencePanelId | SpaceTeamPanelId;

type SpaceSettingBase = {
  id: SpaceSettingId;
  label: string;
  text: string;
  mark: string;
  tone: string;
  /** Al menos uno de estos permisos (legacy Identity). */
  requiredAny: readonly string[];
  /** Si está, solo visible cuando esa app está en el plan del Espacio. */
  requiresApp?: MentorAppId;
};

export type SpaceSettingItem =
  | (SpaceSettingBase & { kind: "panel"; panel: SpacePanelId })
  | (SpaceSettingBase & { kind: "link"; href: string });

export type SpaceSettingGroup = {
  title: string;
  items: SpaceSettingItem[];
};

export const SPACE_SETTING_GROUPS: SpaceSettingGroup[] = [
  {
    title: "Presencia",
    items: [
      {
        id: "empresa",
        kind: "panel",
        panel: "empresa",
        label: "Mi empresa",
        text: "Información general de este Espacio.",
        mark: "empresa",
        tone: "mark-site",
        requiredAny: ["settings.update"],
      },
      {
        id: "marca",
        kind: "panel",
        panel: "marca",
        label: "Marca",
        text: "Identidad visual de la organización.",
        mark: "marca",
        tone: "mark-brand",
        requiredAny: ["settings.update"],
      },
      {
        id: "sitio",
        kind: "panel",
        panel: "sitio",
        label: "Sitio web",
        text: "Presencia pública, cuando el plan la incluye.",
        mark: "sitio",
        tone: "mark-links",
        requiredAny: ["settings.update", "cms.pages.read"],
        requiresApp: "growth-os",
      },
    ],
  },
  {
    title: "Personas",
    items: [
      {
        id: "equipo",
        kind: "panel",
        panel: "equipo",
        label: "Equipo",
        text: "Personas de este cliente y apps que pueden abrir.",
        mark: "equipo",
        tone: "mark-team",
        requiredAny: ["settings.team"],
      },
      {
        id: "roles",
        kind: "panel",
        panel: "roles",
        label: "Roles y permisos",
        text: "Perfiles de la empresa. No cambian el plan ni el interior de cada aplicación.",
        mark: "roles",
        tone: "mark-roles",
        requiredAny: ["identity.roles.manage"],
      },
    ],
  },
  {
    title: "Conexión",
    items: [
      {
        id: "canales",
        kind: "link",
        href: "/admin/settings/channels",
        label: "Canales",
        text: "Correo y WhatsApp.",
        mark: "canales",
        tone: "mark-channels",
        requiredAny: ["settings.integrations"],
      },
      {
        id: "integraciones",
        kind: "link",
        href: "/admin/settings/integrations",
        label: "Integraciones",
        text: "Conexiones externas.",
        mark: "integraciones",
        tone: "mark-links",
        requiredAny: ["settings.integrations"],
      },
    ],
  },
];

export type SpaceSettingFilterInput = {
  permissions: readonly string[];
  contractedApps?: readonly MentorAppId[] | null;
};

export function canSeeSpaceSetting(
  item: SpaceSettingItem,
  input: SpaceSettingFilterInput | readonly string[]
): boolean {
  const permissions = Array.isArray(input) ? input : input.permissions;
  const contractedApps = Array.isArray(input) ? null : input.contractedApps;
  if (!item.requiredAny.length) return false;
  if (!item.requiredAny.some((permission) => permissions.includes(permission))) {
    return false;
  }
  if (item.requiresApp) {
    const apps = contractedApps ?? [];
    if (!apps.includes(item.requiresApp)) return false;
  }
  return true;
}

/** Grupos con solo las filas autorizadas. Omite grupos vacíos. */
export function filterSpaceSettingGroups(
  permissions: readonly string[],
  groups: readonly SpaceSettingGroup[] = SPACE_SETTING_GROUPS,
  contractedApps?: readonly MentorAppId[] | null
): SpaceSettingGroup[] {
  const input: SpaceSettingFilterInput = { permissions, contractedApps };
  return groups
    .map((group) => ({
      title: group.title,
      items: group.items.filter((item) => canSeeSpaceSetting(item, input)),
    }))
    .filter((group) => group.items.length > 0);
}

export function hasAnySpaceSetting(
  permissions: readonly string[],
  contractedApps?: readonly MentorAppId[] | null
): boolean {
  return filterSpaceSettingGroups(permissions, SPACE_SETTING_GROUPS, contractedApps).length > 0;
}

export function spaceSettingHref(item: SpaceSettingItem): string | null {
  return item.kind === "link" ? item.href : null;
}
