import { isAdmissionsOperator, isUnitScopedAdminPathAllowed } from "@/lib/admin/nav-access";
import { canManageAppKeys, desktopBands } from "@/lib/desktop/app-access";
import { desktopDock, type DockAppId } from "@/lib/desktop/catalog";
import type { MentorAppId } from "@/nelzuri";
import {
  canSeeSpecialized,
  manifestById,
  openSpecialized,
  SPECIALIZED_APPS,
  type SpecializedAppId,
  type SpecializedPerson,
} from "@/nelzuri";

export interface DeskSpecializedInput {
  tenantId: string;
  permissions: readonly string[];
  unitIds: readonly string[] | null;
  enabledUnitAppIds: readonly string[] | null;
  roleCodes?: readonly string[];
  /**
   * false: no hay llave de Growth OS.
   * El rol de Admisión queda solo en su capacidad. Ausente: no recorta.
   */
  growthOs?: boolean;
}

function personFor(appId: SpecializedAppId, input: DeskSpecializedInput): SpecializedPerson {
  const manifest = manifestById(appId);
  const href = manifest.open.type === "internal" ? manifest.open.href : "";
  const unitPathAllowed =
    input.unitIds == null
      ? null
      : isUnitScopedAdminPathAllowed(href, input.enabledUnitAppIds ?? []);
  return {
    appId,
    tenantId: input.tenantId,
    permissions: input.permissions,
    unitIds: input.unitIds,
    unitPathAllowed,
  };
}

/** Capacidades del Espacio activo que esta persona ya puede abrir. */
export function specializedForDesk(input: DeskSpecializedInput): SpecializedAppId[] {
  const opened = SPECIALIZED_APPS.filter((appId) => canSeeSpecialized(personFor(appId, input)));
  if (input.growthOs !== false) return opened;
  if (!isAdmissionsOperator(input.roleCodes ?? [])) return opened;
  return opened.filter((appId) => appId === "admision");
}

export function openSpecializedFromDesk(
  appId: string,
  input: DeskSpecializedInput
): { kind: "open"; href: string } | { kind: "denied" } {
  if (!specializedForDesk(input).includes(appId as SpecializedAppId)) return { kind: "denied" };
  return openSpecialized(personFor(appId as SpecializedAppId, input));
}

/** Mesa del cliente: lo contratado y autorizado, más las capacidades de su Espacio. */
export function clientDeskApps(input: DeskSpecializedInput & {
  owner: boolean;
  spaceType: string | null | undefined;
  contracted: readonly MentorAppId[];
  authorizedApps?: readonly MentorAppId[] | null;
}): DockAppId[] {
  if (input.owner) return desktopDock(true);
  const bands = desktopBands({
    spaceType: input.spaceType,
    contracted: input.contracted,
    authorizedApps: input.authorizedApps,
    canRequestPlan: canManageAppKeys(input.permissions),
  });
  return [...bands.mine, ...specializedForDesk(input), "mensajes"];
}
