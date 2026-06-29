import { MENU_ITEM_TYPES, MENU_LOCATIONS } from "@/types/menu";
import type { CmsMenuCreate, CmsMenuUpdate, MenuItem } from "@/types/menu";

export interface MenuValidationError {
  field: string;
  message: string;
}

const MENU_ID_PATTERN = /^[a-z0-9_-]+$/;
const URL_PATTERN = /^https?:\/\/.+/;

export function validateMenuId(id: string): MenuValidationError | null {
  if (!id.trim()) {
    return { field: "_id", message: "El identificador del menú es obligatorio." };
  }
  if (!MENU_ID_PATTERN.test(id)) {
    return {
      field: "_id",
      message: "El identificador solo puede contener minúsculas, números, guiones y guiones bajos.",
    };
  }
  return null;
}

export function validateMenuItem(item: MenuItem, index: number): MenuValidationError[] {
  const errors: MenuValidationError[] = [];
  const prefix = `items[${index}]`;

  if (!item.title.trim()) {
    errors.push({ field: `${prefix}.title`, message: "El título es obligatorio." });
  }

  if (!item.id.trim()) {
    errors.push({ field: `${prefix}.id`, message: "El ID del ítem es obligatorio." });
  }

  if (item.type === "external" && item.url && !URL_PATTERN.test(item.url)) {
    errors.push({ field: `${prefix}.url`, message: "La URL externa no es válida." });
  }

  if (!MENU_ITEM_TYPES.includes(item.type)) {
    errors.push({ field: `${prefix}.type`, message: "Tipo de ítem inválido." });
  }

  return errors;
}

export function validateMenuItems(items: MenuItem[]): MenuValidationError[] {
  const errors: MenuValidationError[] = [];
  const ids = new Set<string>();

  items.forEach((item, index) => {
    errors.push(...validateMenuItem(item, index));

    if (ids.has(item.id)) {
      errors.push({
        field: `items[${index}].id`,
        message: `ID duplicado: ${item.id}`,
      });
    }
    ids.add(item.id);
  });

  for (const item of items) {
    if (item.parent && !ids.has(item.parent)) {
      errors.push({
        field: `items.parent`,
        message: `El padre "${item.parent}" no existe para el ítem "${item.title}".`,
      });
    }
    if (item.parent === item.id) {
      errors.push({
        field: `items.parent`,
        message: `Un ítem no puede ser padre de sí mismo: "${item.title}".`,
      });
    }
  }

  return errors;
}

export function validateMenuCreate(data: CmsMenuCreate): MenuValidationError[] {
  const errors: MenuValidationError[] = [];

  const idError = validateMenuId(data._id);
  if (idError) errors.push(idError);

  if (!data.name.trim()) {
    errors.push({ field: "name", message: "El nombre del menú es obligatorio." });
  }

  if (!data.location.trim()) {
    errors.push({ field: "location", message: "La ubicación es obligatoria." });
  }

  errors.push(...validateMenuItems(data.items ?? []));

  return errors;
}

export function validateMenuUpdate(data: CmsMenuUpdate): MenuValidationError[] {
  const errors: MenuValidationError[] = [];

  if (!data.name.trim()) {
    errors.push({ field: "name", message: "El nombre del menú es obligatorio." });
  }

  if (!data.location.trim()) {
    errors.push({ field: "location", message: "La ubicación es obligatoria." });
  }

  errors.push(...validateMenuItems(data.items ?? []));

  return errors;
}

export function isKnownLocation(location: string): boolean {
  return (MENU_LOCATIONS as readonly string[]).includes(location);
}
