/**
 * OT-IAM-002 — Catálogo centralizado de permisos granulares.
 * Todos los permisos del sistema deben registrarse aquí.
 */

export type PermissionModuleId =
  | "convocations"
  | "participants"
  | "portal"
  | "content"
  | "student_affairs"
  | "settings"
  | "identity"
  | "workflow"
  | "events"
  | "academic";

export interface PermissionDefinition {
  code: string;
  label: string;
  description: string;
  module: PermissionModuleId;
  /** Permisos legacy (OT-IAM-SEM-001) que implica este permiso granular */
  impliesLegacy?: string[];
}

export interface PermissionModule {
  id: PermissionModuleId;
  label: string;
  permissions: PermissionDefinition[];
}

export const PERMISSION_MODULES: PermissionModule[] = [
  {
    id: "convocations",
    label: "Convocatorias",
    permissions: [
      {
        code: "convocations.view",
        label: "Ver",
        description: "Ver convocatorias y formularios de experiencia",
        module: "convocations",
        impliesLegacy: ["experience.forms.read"],
      },
      {
        code: "convocations.create",
        label: "Crear",
        description: "Crear nuevas convocatorias",
        module: "convocations",
        impliesLegacy: ["experience.forms.manage"],
      },
      {
        code: "convocations.update",
        label: "Editar",
        description: "Editar convocatorias existentes",
        module: "convocations",
        impliesLegacy: ["experience.forms.manage"],
      },
      {
        code: "convocations.publish",
        label: "Publicar",
        description: "Publicar convocatorias",
        module: "convocations",
        impliesLegacy: ["experience.forms.manage"],
      },
      {
        code: "convocations.close",
        label: "Cerrar",
        description: "Cerrar convocatorias",
        module: "convocations",
        impliesLegacy: ["experience.forms.manage"],
      },
      {
        code: "convocations.delete",
        label: "Eliminar",
        description: "Eliminar convocatorias",
        module: "convocations",
        impliesLegacy: ["experience.forms.manage"],
      },
    ],
  },
  {
    id: "participants",
    label: "Participantes",
    permissions: [
      {
        code: "participants.view",
        label: "Ver",
        description: "Ver participantes e inscripciones",
        module: "participants",
        impliesLegacy: ["student-affairs.read", "students.read"],
      },
      {
        code: "participants.update",
        label: "Editar",
        description: "Editar datos de participantes",
        module: "participants",
        impliesLegacy: ["student-affairs.manage"],
      },
      {
        code: "participants.checkin",
        label: "Check-in",
        description: "Marcar asistencia e inasistencias",
        module: "participants",
        impliesLegacy: ["student-affairs.checkin"],
      },
      {
        code: "participants.export",
        label: "Exportar",
        description: "Exportar listas de asistencia",
        module: "participants",
        impliesLegacy: ["student-affairs.read"],
      },
    ],
  },
  {
    id: "portal",
    label: "Portal",
    permissions: [
      { code: "portal.pages.view", label: "Ver páginas", description: "Ver páginas del portal", module: "portal", impliesLegacy: ["cms.pages.read"] },
      { code: "portal.pages.create", label: "Crear páginas", description: "Crear páginas", module: "portal", impliesLegacy: ["cms.pages.create"] },
      { code: "portal.pages.update", label: "Editar páginas", description: "Editar páginas", module: "portal", impliesLegacy: ["cms.pages.update"] },
      { code: "portal.pages.publish", label: "Publicar páginas", description: "Publicar páginas", module: "portal", impliesLegacy: ["cms.pages.publish"] },
      { code: "portal.pages.delete", label: "Eliminar páginas", description: "Eliminar páginas", module: "portal", impliesLegacy: ["cms.pages.delete"] },
      { code: "portal.media.view", label: "Ver medios", description: "Ver biblioteca de medios", module: "portal", impliesLegacy: ["cms.media.read"] },
      { code: "portal.media.upload", label: "Subir medios", description: "Subir archivos", module: "portal", impliesLegacy: ["cms.media.upload"] },
      { code: "portal.media.update", label: "Editar medios", description: "Editar metadatos de medios", module: "portal", impliesLegacy: ["cms.media.update"] },
      { code: "portal.media.delete", label: "Eliminar medios", description: "Eliminar medios", module: "portal", impliesLegacy: ["cms.media.delete"] },
      { code: "portal.menus.view", label: "Ver menús", description: "Ver menús de navegación", module: "portal", impliesLegacy: ["cms.menus.read"] },
      { code: "portal.menus.manage", label: "Gestionar menús", description: "Administrar menús", module: "portal", impliesLegacy: ["cms.menus.manage"] },
    ],
  },
  {
    id: "content",
    label: "Contenido",
    permissions: [
      { code: "content.programs.manage", label: "Gestionar programas", description: "Administrar programas académicos", module: "content", impliesLegacy: ["programs.manage"] },
      { code: "content.news.manage", label: "Gestionar noticias", description: "Publicar y editar noticias", module: "content", impliesLegacy: ["news.publish"] },
      { code: "content.events.manage", label: "Gestionar eventos", description: "Administrar eventos editoriales", module: "content", impliesLegacy: ["content.events.manage"] },
    ],
  },
  {
    id: "student_affairs",
    label: "Asuntos estudiantiles",
    permissions: [
      { code: "student_affairs.panel.view", label: "Ver panel", description: "Acceder al panel de asuntos estudiantiles", module: "student_affairs", impliesLegacy: ["student-affairs.read"] },
      { code: "student_affairs.scope.manage", label: "Gestionar alcance", description: "Asignar formularios y generaciones", module: "student_affairs", impliesLegacy: ["student-affairs.manage"] },
    ],
  },
  {
    id: "settings",
    label: "Configuración",
    permissions: [
      { code: "settings.institution.update", label: "Configurar institución", description: "Actualizar configuración institucional", module: "settings", impliesLegacy: ["settings.update"] },
      { code: "settings.integrations.manage", label: "Integraciones", description: "Gestionar integraciones", module: "settings", impliesLegacy: ["settings.integrations"] },
      { code: "settings.team.manage", label: "Gestionar equipo", description: "Administrar usuarios e invitaciones", module: "settings", impliesLegacy: ["settings.team"] },
    ],
  },
  {
    id: "identity",
    label: "Identidad",
    permissions: [
      { code: "identity.roles.manage", label: "Gestionar roles", description: "Editar plantillas de permisos por rol", module: "identity", impliesLegacy: ["identity.roles.manage"] },
      { code: "identity.members.manage", label: "Gestionar miembros", description: "Administrar membresías", module: "identity", impliesLegacy: ["identity.members.manage"] },
      { code: "identity.permissions.override", label: "Overrides de permisos", description: "Personalizar permisos por usuario", module: "identity" },
      { code: "identity.audit.read", label: "Ver auditoría", description: "Consultar registro de auditoría", module: "identity", impliesLegacy: ["identity.audit.read"] },
    ],
  },
  {
    id: "workflow",
    label: "Workflows",
    permissions: [
      { code: "workflow.view", label: "Ver workflows", description: "Ver definiciones de workflow", module: "workflow", impliesLegacy: ["workflow.read"] },
      { code: "workflow.manage", label: "Gestionar workflows", description: "Administrar workflows", module: "workflow", impliesLegacy: ["workflow.manage"] },
      { code: "workflow.transition", label: "Ejecutar transiciones", description: "Ejecutar transiciones de workflow", module: "workflow", impliesLegacy: ["workflow.transition"] },
    ],
  },
  {
    id: "events",
    label: "Eventos del bus",
    permissions: [
      { code: "events.view", label: "Ver eventos", description: "Ver eventos del bus", module: "events", impliesLegacy: ["events.read"] },
      { code: "events.manage", label: "Gestionar eventos", description: "Publicar eventos", module: "events", impliesLegacy: ["events.manage"] },
      { code: "events.replay", label: "Replay", description: "Reprocesar eventos", module: "events", impliesLegacy: ["events.replay"] },
    ],
  },
  {
    id: "academic",
    label: "Académico (futuro)",
    permissions: [
      { code: "academic.students.view", label: "Ver estudiantes", description: "Consultar estudiantes", module: "academic", impliesLegacy: ["students.read"] },
      { code: "academic.finance.view", label: "Ver finanzas", description: "Consultar finanzas", module: "academic", impliesLegacy: ["finance.view"] },
      { code: "academic.finance.manage", label: "Gestionar finanzas", description: "Administrar finanzas", module: "academic", impliesLegacy: ["finance.manage"] },
    ],
  },
];

export const ALL_CATALOG_PERMISSION_CODES = PERMISSION_MODULES.flatMap((m) =>
  m.permissions.map((p) => p.code)
);

const catalogByCode = new Map(
  PERMISSION_MODULES.flatMap((m) => m.permissions.map((p) => [p.code, p] as const))
);

export function getPermissionDefinition(code: string): PermissionDefinition | undefined {
  return catalogByCode.get(code);
}

export function isCatalogPermission(code: string): boolean {
  return catalogByCode.has(code);
}

/** Mapa legacy → permisos granulares que lo satisfacen */
export function buildLegacyToGranularMap(): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const def of catalogByCode.values()) {
    for (const legacy of def.impliesLegacy ?? []) {
      const list = map.get(legacy) ?? [];
      list.push(def.code);
      map.set(legacy, list);
    }
  }
  return map;
}

export const LEGACY_TO_GRANULAR = buildLegacyToGranularMap();

export function catalogPermissionsByModule(): PermissionModule[] {
  return PERMISSION_MODULES;
}
