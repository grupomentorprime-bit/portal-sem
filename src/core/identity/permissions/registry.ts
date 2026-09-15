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

  // Experience Forms
  "experience.forms.read": "Ver formularios de experiencia",
  "experience.forms.manage": "Gestionar formularios de experiencia",

  // Student Affairs
  "student-affairs.read": "Ver panel de asuntos estudiantiles",
  "student-affairs.checkin": "Marcar asistencia y gestionar inasistencias",
  "student-affairs.manage": "Asignar alcance de asuntos estudiantiles",

  // Content
  "programs.manage": "Gestionar programas",
  "news.publish": "Publicar noticias",
  "content.events.manage": "Gestionar eventos de contenido",

  // Settings
  "settings.update": "Actualizar configuración",
  "settings.integrations": "Gestionar integraciones de plataforma",
  "settings.team": "Gestionar equipo e invitaciones",

  // Identity
  "identity.roles.manage": "Gestionar roles",
  "identity.members.manage": "Gestionar miembros",
  "identity.audit.read": "Ver auditoría",

  // Workflow
  "workflow.read": "Ver workflows",
  "workflow.manage": "Gestionar definiciones de workflow",
  "workflow.transition": "Ejecutar transiciones de workflow",

  // Events
  "events.read": "Ver eventos del bus",
  "events.manage": "Publicar y gestionar eventos",
  "events.replay": "Reprocesar eventos (replay)",

  // Growth / Ventas (OT-GROWTH-SALES-001)
  "growth.sales.read": "Ver cola de Ventas (Oportunidades)",
  "growth.sales.operate": "Operar Oportunidades (estado, seguimiento, próxima acción)",

  // Growth / Automatizaciones (OT-GROWTH-AUTOMATION-002)
  "growth.automations.view": "Ver definiciones de Automatizaciones del Espacio",
  "growth.automations.manage": "Crear, versionar, publicar y activar Automatizaciones",

  // Growth / Campañas (OT-GROWTH-CAMPAIGNS-003)
  "growth.campaigns.view": "Ver campañas del Espacio",
  "growth.campaigns.manage": "Crear y editar campañas del Espacio",

  // Growth / Analítica (OT-GROWTH-ANALYTICS-IMPLEMENT-003)
  "growth.analytics.view": "Ver Analítica del Espacio",

  // Growth / Personas (OT-GROWTH-PERSONAS-IMPLEMENT-003)
  "growth.people.view": "Ver Personas del Espacio",
  "growth.people.manage": "Gestionar Personas del Espacio",

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
