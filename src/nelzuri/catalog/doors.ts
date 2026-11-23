import type { SpecializedDoor } from "@/nelzuri/catalog/types";

/**
 * Puertas institucionales.
 * El catálogo, la navegación y el shell leen esta lista.
 * No contrata, no crea un permiso y la llave de Growth OS no la modifica.
 */

/** Centro de admisión. La lectura del centro exige este permiso. */
export const ADMISSION_DOOR: SpecializedDoor = {
  anyPermission: ["cms.pages.read"],
};

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

/**
 * Formularios, dentro del shell de Growth OS.
 * No es una capacidad del escritorio.
 */
export const FORMS_DOOR: SpecializedDoor = {
  anyPermission: ["experience.forms.read", "experience.forms.manage"],
};

/** Congreso de Varones. El Espacio lo declara el manifiesto. */
export const CONGRESS_DOOR: SpecializedDoor = {
  anyPermission: ["congress.view", "congress.operate"],
  unitId: "departamento-nacional-de-varones",
};
