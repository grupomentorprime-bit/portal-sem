import { IPN_CHILE_TENANT_ID, IPN_CHILE_VARONES } from "@/core/units/ipn-chile";
import { CONGRESS_VARONES_FORM_ID } from "@/lib/experience/forms/already-enrolled";
import type { SpecializedDoor } from "@/nelzuri/catalog/types";
import type { SpecializedManifestRegistration } from "@/nelzuri";

const CONGRESS_FORMS_ALIAS = `/admin/portal/forms/panel/${CONGRESS_VARONES_FORM_ID}`;

/** Congreso de Varones. El Espacio y la unidad los declara esta ficha. */
export const CONGRESS_DOOR: SpecializedDoor = {
  anyPermission: ["congress.view", "congress.operate"],
  unitId: IPN_CHILE_VARONES.unitId,
};

export const CONGRESS_REGISTRATION: SpecializedManifestRegistration = {
  manifest: {
    id: "congreso",
    class: "specialized",
    integration: "internal",
    version: "1",
    publication: "published",
    label: "Congreso de Varones",
    blurb: "Congreso de Varones de IPN Chile. No se contrata.",
    contractable: false,
    defaultContract: { when: "never" },
    requiresSpaceId: IPN_CHILE_TENANT_ID,
    door: CONGRESS_DOOR,
    open: { type: "internal", href: "/admin/portal/congreso-varones" },
  },
  aliases: [CONGRESS_FORMS_ALIAS],
  insertNavAfter: "convocatorias-config",
  navGroupId: "sitio-web",
  navSequence: 0,
  navItem: {
    id: "congreso-varones",
    href: "/admin/portal/congreso-varones",
    label: "Congreso de Varones",
    icon: "students",
    matchPrefixes: ["/admin/portal/congreso-varones", CONGRESS_FORMS_ALIAS],
    requiredAnyPermission: [...CONGRESS_DOOR.anyPermission],
  },
};
