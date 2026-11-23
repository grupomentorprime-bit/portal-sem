import {
  ensureSpecializedCapabilities,
  SPECIALIZED_APPS,
  type SpecializedAppId,
} from "@/nelzuri/contracts/capabilities";
import { isSpecializedAppId, manifestById } from "@/nelzuri/catalog/registry";

/**
 * Hechos de la persona en el Espacio activo.
 * `unitIds` null: administración central, sin recorte.
 * `unitPathAllowed` lo resuelve la puerta de unidades que ya existe.
 */
export interface SpecializedPerson {
  appId: string;
  tenantId: string;
  permissions: readonly string[];
  unitIds: readonly string[] | null;
  unitPathAllowed: boolean | null;
}

/** La mesa puede dibujar esta capacidad. No contrata y no escribe. */
export function canSeeSpecialized(input: SpecializedPerson): boolean {
  if (!isSpecializedAppId(input.appId)) return false;
  const manifest = manifestById(input.appId);
  if (manifest.contractable || manifest.integration === "pending" || manifest.publication !== "published") {
    return false;
  }
  if (!manifest.requiresSpaceId || input.tenantId !== manifest.requiresSpaceId) return false;
  const door = manifest.door;
  if (!door?.anyPermission.some((code) => input.permissions.includes(code))) return false;
  if (input.unitIds != null) {
    if (input.unitPathAllowed !== true) return false;
    if (door.unitId && !input.unitIds.includes(door.unitId)) return false;
  }
  return true;
}

export function visibleSpecializedIds(
  people: readonly SpecializedPerson[]
): SpecializedAppId[] {
  ensureSpecializedCapabilities();
  const seen = new Set(people.filter(canSeeSpecialized).map((person) => person.appId));
  return SPECIALIZED_APPS.filter((id) => seen.has(id));
}

/** Abre la ruta ya declarada, o niega. No ofrece contratar. */
export function openSpecialized(
  input: SpecializedPerson
): { kind: "open"; href: string } | { kind: "denied" } {
  if (!canSeeSpecialized(input)) return { kind: "denied" };
  const open = manifestById(input.appId).open;
  if (open.type !== "internal") return { kind: "denied" };
  return { kind: "open", href: open.href };
}
