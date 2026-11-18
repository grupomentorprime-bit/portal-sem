/** Unidad interna de un Espacio: departamento, área, sede u otra unidad. */

export const UNIT_KINDS = ["department", "area", "branch", "unit"] as const;
export type UnitKind = (typeof UNIT_KINDS)[number];

export const UNIT_STATUSES = ["active", "inactive", "archived"] as const;
export type UnitStatus = (typeof UNIT_STATUSES)[number];

/**
 * Alcance dentro del Espacio.
 * Ausente: el miembro ve todo el Espacio, igual que antes de existir unidades.
 * `tenant`: administración central. `units`: solo las unidades listadas.
 */
export type UnitAccess =
  | { mode: "tenant" }
  | { mode: "units"; unitIds: string[] };

export interface OrgUnit {
  _id: string;
  tenantId: string;
  unitId: string;
  name: string;
  kind: UnitKind;
  status: UnitStatus;
  responsibleUserIds: string[];
  /** Ids del catálogo de aplicaciones ya existentes del Espacio. */
  enabledAppIds: string[];
  createdAt: string;
  updatedAt: string;
}

export const ORG_UNITS_COLLECTION = "org_units" as const;

export function orgUnitDocumentId(tenantId: string, unitId: string): string {
  return `${tenantId}:${unitId}`;
}
