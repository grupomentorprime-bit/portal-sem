import { IPN_CHILE_TENANT_ID, IPN_CHILE_VARONES } from "@/core/units/ipn-chile";

/**
 * El Congreso de Varones vive solo en IPN Chile,
 * Departamento Nacional de Varones.
 * `unitIds === null` es el Espacio completo de ese cliente.
 * Una lista limita a los departamentos de la persona.
 */
export function isCongressVaronesPlace(input: {
  tenantId?: string | null;
  unitIds?: readonly string[] | null;
}): boolean {
  if (input.tenantId?.trim() !== IPN_CHILE_TENANT_ID) return false;
  if (input.unitIds == null) return true;
  return input.unitIds.includes(IPN_CHILE_VARONES.unitId);
}
