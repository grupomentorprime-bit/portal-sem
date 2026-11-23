import { SEM_TENANT_ID } from "@/core/tenant/constants";
import type { SpecializedDoor } from "@/nelzuri/catalog/types";
import type { SpecializedManifestRegistration } from "@/nelzuri";

/** Centro de admisión. La lectura del centro exige este permiso. */
export const ADMISSION_DOOR: SpecializedDoor = {
  anyPermission: ["cms.pages.read"],
};

export const ADMISSION_REGISTRATION: SpecializedManifestRegistration = {
  manifest: {
    id: "admision",
    class: "specialized",
    integration: "internal",
    version: "1",
    publication: "published",
    label: "Admisión",
    blurb: "Centro de admisión del Seminario. No se contrata.",
    contractable: false,
    defaultContract: { when: "never" },
    requiresSpaceId: SEM_TENANT_ID,
    door: ADMISSION_DOOR,
    open: { type: "internal", href: "/admin/portal/admission" },
  },
  insertNavAfter: "institution-branding",
  navGroupId: "institucion",
  navSequence: 0,
  navItem: {
    id: "portal-admission",
    href: "/admin/portal/admission",
    label: "Centro de admisión",
    icon: "admission",
    matchPrefixes: ["/admin/portal/admission"],
    requiredAnyPermission: [...ADMISSION_DOOR.anyPermission],
  },
};
