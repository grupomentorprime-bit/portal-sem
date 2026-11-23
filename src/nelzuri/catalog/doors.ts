import type { SpecializedDoor } from "@/nelzuri/catalog/types";

/**
 * Formularios, dentro del shell de Growth OS.
 * No es una capacidad del escritorio. Las puertas institucionales viven con su dueño.
 */
export const FORMS_DOOR: SpecializedDoor = {
  anyPermission: ["experience.forms.read", "experience.forms.manage"],
};
