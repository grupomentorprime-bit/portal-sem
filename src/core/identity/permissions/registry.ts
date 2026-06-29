/** Catálogo de permisos — sin lógica, solo identificadores */

export const PERMISSIONS = {
  // CMS Pages
  "cms.pages.read": "Ver páginas",
  "cms.pages.create": "Crear páginas",
  "cms.pages.update": "Editar páginas",
  "cms.pages.publish": "Publicar páginas",
  "cms.pages.delete": "Eliminar páginas",

  // CMS Media
  "cms.media.read": "Ver biblioteca de medios",
  "cms.media.upload": "Subir medios",
  "cms.media.update": "Editar metadatos de medios",
  "cms.media.delete": "Eliminar medios",

  // CMS Menus
  "cms.menus.read": "Ver menús",
  "cms.menus.manage": "Gestionar menús",

  // Content
  "programs.manage": "Gestionar programas",
  "news.publish": "Publicar noticias",
  "events.manage": "Gestionar eventos",

  // Settings
  "settings.update": "Actualizar configuración",
  "settings.team": "Gestionar equipo e invitaciones",

  // Identity
  "identity.roles.manage": "Gestionar roles",
  "identity.members.manage": "Gestionar miembros",
  "identity.audit.read": "Ver auditoría",

  // Academic (futuro)
  "students.read": "Ver estudiantes",
  "finance.view": "Ver finanzas",
  "finance.manage": "Gestionar finanzas",
} as const;

export type PermissionId = keyof typeof PERMISSIONS;

export const ALL_PERMISSION_IDS = Object.keys(PERMISSIONS) as PermissionId[];

export function isValidPermission(id: string): id is PermissionId {
  return id in PERMISSIONS;
}
