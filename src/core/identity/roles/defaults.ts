import type { PermissionId } from "@/core/identity/permissions/registry";

export interface RoleTemplate {
  name: string;
  description: string;
  permissionIds: PermissionId[];
  system: boolean;
}

/** Roles globales de plataforma (tenantId = platform) */
export const PLATFORM_ROLES: RoleTemplate[] = [
  {
    name: "Platform Owner",
    description: "Control total de la plataforma",
    permissionIds: [
      "cms.pages.read", "cms.pages.create", "cms.pages.update", "cms.pages.publish", "cms.pages.delete",
      "cms.media.read", "cms.media.upload", "cms.media.update", "cms.media.delete",
      "cms.menus.read", "cms.menus.manage",
      "programs.manage", "news.publish", "events.manage",
      "settings.update", "settings.team",
      "identity.roles.manage", "identity.members.manage", "identity.audit.read",
      "workflow.read", "workflow.manage", "workflow.transition",
      "students.read", "finance.view", "finance.manage",
    ],
    system: true,
  },
  {
    name: "Platform Admin",
    description: "Administración de plataforma sin finanzas",
    permissionIds: [
      "cms.pages.read", "cms.pages.create", "cms.pages.update", "cms.pages.publish",
      "cms.media.read", "cms.media.upload", "cms.media.update",
      "cms.menus.read", "cms.menus.manage",
      "programs.manage", "news.publish", "events.manage",
      "settings.update", "settings.team",
      "identity.members.manage", "identity.audit.read",
    ],
    system: true,
  },
  {
    name: "Support",
    description: "Soporte de solo lectura",
    permissionIds: [
      "cms.pages.read", "cms.media.read", "cms.menus.read",
      "identity.audit.read", "students.read",
    ],
    system: true,
  },
];

/** Roles por tenant */
export const TENANT_ROLES: RoleTemplate[] = [
  {
    name: "Tenant Owner",
    description: "Propietario de la institución",
    permissionIds: [
      "cms.pages.read", "cms.pages.create", "cms.pages.update", "cms.pages.publish", "cms.pages.delete",
      "cms.media.read", "cms.media.upload", "cms.media.update", "cms.media.delete",
      "cms.menus.read", "cms.menus.manage",
      "programs.manage", "news.publish", "events.manage",
      "settings.update", "settings.team",
      "identity.roles.manage", "identity.members.manage", "identity.audit.read",
      "workflow.read", "workflow.manage", "workflow.transition",
      "finance.view", "finance.manage",
    ],
    system: true,
  },
  {
    name: "Institution Admin",
    description: "Administrador institucional",
    permissionIds: [
      "cms.pages.read", "cms.pages.create", "cms.pages.update", "cms.pages.publish",
      "cms.media.read", "cms.media.upload", "cms.media.update",
      "cms.menus.read", "cms.menus.manage",
      "programs.manage", "news.publish", "events.manage",
      "settings.update", "settings.team",
      "identity.members.manage",
    ],
    system: true,
  },
  {
    name: "Editor",
    description: "Editor de contenido",
    permissionIds: [
      "cms.pages.read", "cms.pages.update",
      "cms.media.read", "cms.media.upload",
      "programs.manage", "news.publish", "events.manage",
    ],
    system: true,
  },
  {
    name: "Reviewer",
    description: "Revisor de contenido",
    permissionIds: [
      "cms.pages.read", "cms.media.read",
      "programs.manage", "news.publish", "events.manage",
    ],
    system: true,
  },
  {
    name: "Teacher",
    description: "Docente",
    permissionIds: ["cms.pages.read", "cms.media.read", "students.read"],
    system: true,
  },
  {
    name: "Admissions",
    description: "Admisiones",
    permissionIds: ["cms.pages.read", "students.read"],
    system: true,
  },
  {
    name: "Finance",
    description: "Finanzas",
    permissionIds: ["finance.view", "finance.manage"],
    system: true,
  },
  {
    name: "Student",
    description: "Estudiante",
    permissionIds: ["cms.pages.read"],
    system: true,
  },
  {
    name: "Guest",
    description: "Invitado de solo lectura",
    permissionIds: ["cms.pages.read", "cms.media.read"],
    system: true,
  },
];

export function roleSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}
