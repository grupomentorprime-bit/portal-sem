import { SEM_TENANT_ID } from "@/core/tenant/constants";
import type { SpecializedDoor } from "@/nelzuri/catalog/types";
import type { SpecializedManifestRegistration } from "@/nelzuri";

/**
 * Panel de Asuntos Estudiantiles.
 * La misma lista que ya acepta el panel.
 * `experience.forms.manage` sigue hasta una decisión aparte.
 */
export const STUDENT_AFFAIRS_DOOR: SpecializedDoor = {
  anyPermission: [
    "student-affairs.read",
    "student-affairs.checkin",
    "student-affairs.manage",
    "experience.forms.manage",
  ],
};

export const STUDENT_AFFAIRS_REGISTRATION: SpecializedManifestRegistration = {
  manifest: {
    id: "asuntos-estudiantiles",
    class: "specialized",
    integration: "internal",
    version: "1",
    publication: "published",
    label: "Asuntos Estudiantiles",
    blurb: "Operación de formularios del Seminario. No se contrata.",
    contractable: false,
    defaultContract: { when: "never" },
    requiresSpaceId: SEM_TENANT_ID,
    door: STUDENT_AFFAIRS_DOOR,
    open: { type: "internal", href: "/admin/portal/asuntos-estudiantiles" },
  },
  insertNavAfter: "institution-branding",
  navGroupId: "institucion",
  navSequence: 1,
  navItem: {
    id: "convocatorias-resultados",
    href: "/admin/portal/asuntos-estudiantiles",
    label: "Operación de formularios",
    icon: "students",
    matchPrefixes: ["/admin/portal/asuntos-estudiantiles"],
    requiredAnyPermission: [...STUDENT_AFFAIRS_DOOR.anyPermission],
  },
};
