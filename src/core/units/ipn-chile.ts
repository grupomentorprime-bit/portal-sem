import { allUnitAppIds } from "@/core/units/apps";
import type { UnitKind } from "@/core/units/types";

export { normalizeEnabledAppIds } from "@/core/units/apps";

/** Cliente IPN Chile. No es el Seminario ni un Espacio hijo de otro cliente. */
export const IPN_CHILE_TENANT_ID = "ipn-chile" as const;
export const IPN_CHILE_TENANT_CODE = "IPN_CHILE" as const;
export const IPN_CHILE_SITE_ID = "ipn-chile" as const;
export const IPN_CHILE_DEV_HOST_DEFAULT = "ipn-chile.localhost:3000" as const;

export const IPN_CHILE_VARONES = {
  unitId: "departamento-nacional-de-varones",
  name: "Departamento Nacional de Varones",
  kind: "department",
} as const satisfies { unitId: string; name: string; kind: UnitKind };

export interface IpnChileFoundationSpec {
  tenantId: typeof IPN_CHILE_TENANT_ID;
  name: "IPN Chile";
  slug: typeof IPN_CHILE_TENANT_ID;
  code: typeof IPN_CHILE_TENANT_CODE;
  siteId: typeof IPN_CHILE_SITE_ID;
  siteName: "IPN Chile";
  type: "community";
  organization: "IPN Chile";
  unit: {
    unitId: typeof IPN_CHILE_VARONES.unitId;
    name: typeof IPN_CHILE_VARONES.name;
    kind: typeof IPN_CHILE_VARONES.kind;
    enabledAppIds: string[];
  };
}

export function ipnChileFoundationSpec(): IpnChileFoundationSpec {
  return {
    tenantId: IPN_CHILE_TENANT_ID,
    name: "IPN Chile",
    slug: IPN_CHILE_TENANT_ID,
    code: IPN_CHILE_TENANT_CODE,
    siteId: IPN_CHILE_SITE_ID,
    siteName: "IPN Chile",
    type: "community",
    organization: "IPN Chile",
    unit: {
      unitId: IPN_CHILE_VARONES.unitId,
      name: IPN_CHILE_VARONES.name,
      kind: IPN_CHILE_VARONES.kind,
      enabledAppIds: allUnitAppIds(),
    },
  };
}
