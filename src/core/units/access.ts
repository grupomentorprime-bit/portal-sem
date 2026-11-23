import type { OrgUnit, UnitAccess } from "@/core/units/types";

function uniqueIds(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of ids) {
    const id = raw.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

/** null = sin filtro: administración central o un Espacio sin alcance de unidad. */
export function documentListUnitIds(
  access: UnitAccess | null | undefined
): string[] | null {
  if (!access || access.mode === "tenant") return null;
  return access.unitIds;
}

export function canReadUnitDocument(
  access: UnitAccess | null | undefined,
  documentUnitId: string | null | undefined
): boolean {
  if (!access || access.mode === "tenant") return true;
  if (!documentUnitId) return false;
  return access.unitIds.includes(documentUnitId);
}

/**
 * Suma una autorización.
 * Quien ya ve todo el Espacio (administración central o membresía sin alcance) no queda reducido a una unidad.
 */
export function grantUnitAccess(
  current: UnitAccess | null | undefined,
  grant: UnitAccess
): UnitAccess {
  if (!current || current.mode === "tenant" || grant.mode === "tenant") return { mode: "tenant" };
  const grantedIds = grant.mode === "units" ? grant.unitIds : [];
  return { mode: "units", unitIds: uniqueIds([...current.unitIds, ...grantedIds]) };
}

/** Quita una unidad. No estrecha a quien administra todo el Espacio ni a quien no tiene alcance. */
export function revokeUnitAccess(
  current: UnitAccess | null | undefined,
  unitId: string
): UnitAccess | undefined {
  if (!current || current.mode === "tenant") return current ?? undefined;
  return {
    mode: "units",
    unitIds: current.unitIds.filter((id) => id !== unitId),
  };
}

export function memberVisibleTo(
  caller: UnitAccess | null | undefined,
  target: UnitAccess | null | undefined
): boolean {
  if (!caller || caller.mode === "tenant") return true;
  if (!target || target.mode === "tenant") return true;
  return target.unitIds.some((id) => caller.unitIds.includes(id));
}

export function invitationVisibleTo(
  caller: UnitAccess | null | undefined,
  invitationAccess: UnitAccess | null | undefined
): boolean {
  if (!caller || caller.mode === "tenant") return true;
  if (!invitationAccess || invitationAccess.mode !== "units") return false;
  return invitationAccess.unitIds.some((id) => caller.unitIds.includes(id));
}

export function isCentralUnitAdmin(access: UnitAccess | null | undefined): boolean {
  return !access || access.mode === "tenant";
}

/**
 * Recorte que ya usa el admin.
 * null: administración central. La lista solo junta aplicaciones de unidades activas.
 */
export function membershipUnitScope(input: {
  unitAccess: UnitAccess | null | undefined;
  units: readonly Pick<OrgUnit, "unitId" | "status" | "enabledAppIds">[];
}): { unitIds: string[] | null; enabledUnitAppIds: string[] | null } {
  if (!input.unitAccess || input.unitAccess.mode === "tenant") {
    return { unitIds: null, enabledUnitAppIds: null };
  }
  const allowed = new Set(input.unitAccess.unitIds);
  return {
    unitIds: [...input.unitAccess.unitIds],
    enabledUnitAppIds: [
      ...new Set(
        input.units
          .filter((unit) => unit.status === "active" && allowed.has(unit.unitId))
          .flatMap((unit) => unit.enabledAppIds)
      ),
    ],
  };
}

export function resolveUploadUnitId(
  access: UnitAccess | null | undefined,
  requested: string | null
): { ok: true; unitId?: string } | { ok: false } {
  const unitId = requested?.trim() || "";
  if (!access || access.mode === "tenant") {
    return unitId ? { ok: true, unitId } : { ok: true };
  }
  if (unitId) {
    return access.unitIds.includes(unitId) ? { ok: true, unitId } : { ok: false };
  }
  if (access.unitIds.length === 1) return { ok: true, unitId: access.unitIds[0] };
  return { ok: false };
}
