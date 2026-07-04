import type { PermissionId } from "@/core/identity/permissions/registry";
import { ROLE_CODES, type RoleCode } from "@/core/identity/roles/codes";

export interface RoleTemplate {
  code: RoleCode;
  name: string;
  description: string;
  permissionIds: PermissionId[];
  system: boolean;
  /** Si true, solo se sincroniza en tenants ERP (futuro). */
  erpOnly?: boolean;
}

const CMS_FULL: PermissionId[] = [
  "cms.pages.read", "cms.pages.create", "cms.pages.update", "cms.pages.publish", "cms.pages.delete",
  "cms.media.read", "cms.media.upload", "cms.media.update", "cms.media.delete",
  "cms.menus.read", "cms.menus.manage",
];

const FORMS_FULL: PermissionId[] = [
  "experience.forms.read", "experience.forms.manage",
];

const STUDENT_AFFAIRS_FULL: PermissionId[] = [
  "student-affairs.read", "student-affairs.checkin", "student-affairs.manage",
];

const CONTENT_FULL: PermissionId[] = [
  "programs.manage", "news.publish", "content.events.manage",
];

const SETTINGS_ADMIN: PermissionId[] = [
  "settings.update", "settings.integrations", "settings.team",
];

const IDENTITY_IAM: PermissionId[] = [
  "identity.roles.manage", "identity.members.manage", "identity.audit.read",
];

const WORKFLOW_FULL: PermissionId[] = [
  "workflow.read", "workflow.manage", "workflow.transition",
];

const EVENTS_FULL: PermissionId[] = [
  "events.read", "events.manage", "events.replay",
];

/** Roles oficiales del Portal Institucional + CRM + Convocatorias (OT-IAM-SEM-001) */
export const PORTAL_TENANT_ROLES: RoleTemplate[] = [
  {
    code: ROLE_CODES.SUPER_ADMIN,
    name: "Super Admin",
    description: "Control absoluto de la plataforma — invisible para otros roles",
    permissionIds: [
      ...CMS_FULL,
      ...FORMS_FULL,
      ...STUDENT_AFFAIRS_FULL,
      ...CONTENT_FULL,
      ...SETTINGS_ADMIN,
      ...IDENTITY_IAM,
      ...WORKFLOW_FULL,
      ...EVENTS_FULL,
    ],
    system: true,
  },
  {
    code: ROLE_CODES.INSTITUTION_ADMIN,
    name: "Institution Admin",
    description: "Administrador institucional",
    permissionIds: [
      ...CMS_FULL.filter((p) => p !== "cms.pages.delete"),
      ...FORMS_FULL,
      ...STUDENT_AFFAIRS_FULL,
      ...CONTENT_FULL,
      ...SETTINGS_ADMIN,
      "identity.members.manage",
    ],
    system: true,
  },
  {
    code: ROLE_CODES.SUPPORT,
    name: "Support",
    description: "Soporte operativo — sin gestión de administradores ni IAM",
    permissionIds: [
      ...CMS_FULL.filter((p) => p !== "cms.pages.delete"),
      ...FORMS_FULL,
      ...STUDENT_AFFAIRS_FULL,
      ...CONTENT_FULL,
      ...SETTINGS_ADMIN.filter((p) => p !== "settings.team"),
      "settings.team",
      "identity.members.manage",
      "identity.audit.read",
    ],
    system: true,
  },
  {
    code: ROLE_CODES.ADMISSIONS,
    name: "Admissions",
    description: "Admisiones",
    permissionIds: [
      "cms.pages.read",
      "experience.forms.read",
      "students.read",
    ],
    system: true,
  },
  {
    code: ROLE_CODES.STUDENT_AFFAIRS,
    name: "Student Affairs",
    description: "Asuntos estudiantiles — convocatorias y check-in",
    permissionIds: ["student-affairs.read", "student-affairs.checkin"],
    system: true,
  },
  {
    code: ROLE_CODES.COMMUNICATIONS,
    name: "Communications",
    description: "Comunicaciones y contenido editorial",
    permissionIds: [
      "cms.pages.read", "cms.pages.update",
      "cms.media.read", "cms.media.upload",
      ...FORMS_FULL,
      ...STUDENT_AFFAIRS_FULL,
      ...CONTENT_FULL,
    ],
    system: true,
  },
  {
    code: ROLE_CODES.REVIEWER,
    name: "Reviewer",
    description: "Revisor de contenido",
    permissionIds: [
      "cms.pages.read", "cms.media.read",
      ...CONTENT_FULL,
    ],
    system: true,
  },
  {
    code: ROLE_CODES.GUEST,
    name: "Guest",
    description: "Consulta de solo lectura",
    permissionIds: ["cms.pages.read", "cms.media.read"],
    system: true,
  },
];

/** Roles reservados para futuro ERP Académico — no se sincronizan en tenant portal */
export const ERP_TENANT_ROLES: RoleTemplate[] = [
  {
    code: ROLE_CODES.TEACHER,
    name: "Teacher",
    description: "Docente",
    permissionIds: ["cms.pages.read", "cms.media.read", "students.read"],
    system: true,
    erpOnly: true,
  },
  {
    code: ROLE_CODES.FINANCE,
    name: "Finance",
    description: "Finanzas",
    permissionIds: ["finance.view", "finance.manage"],
    system: true,
    erpOnly: true,
  },
  {
    code: ROLE_CODES.STUDENT,
    name: "Student",
    description: "Estudiante",
    permissionIds: ["cms.pages.read"],
    system: true,
    erpOnly: true,
  },
];

/** Roles globales de plataforma (tenantId = platform) */
export const PLATFORM_ROLES: RoleTemplate[] = [
  {
    code: ROLE_CODES.SUPER_ADMIN,
    name: "Platform Owner",
    description: "Control total de la plataforma",
    permissionIds: [
      ...CMS_FULL,
      ...FORMS_FULL,
      ...STUDENT_AFFAIRS_FULL,
      ...CONTENT_FULL,
      ...SETTINGS_ADMIN,
      ...IDENTITY_IAM,
      ...WORKFLOW_FULL,
      ...EVENTS_FULL,
      "students.read", "finance.view", "finance.manage",
    ],
    system: true,
  },
  {
    code: ROLE_CODES.INSTITUTION_ADMIN,
    name: "Platform Admin",
    description: "Administración de plataforma sin finanzas",
    permissionIds: [
      "cms.pages.read", "cms.pages.create", "cms.pages.update", "cms.pages.publish",
      "cms.media.read", "cms.media.upload", "cms.media.update",
      "cms.menus.read", "cms.menus.manage",
      ...FORMS_FULL,
      ...STUDENT_AFFAIRS_FULL,
      ...CONTENT_FULL,
      ...SETTINGS_ADMIN,
      "identity.members.manage", "identity.audit.read",
    ],
    system: true,
  },
  {
    code: ROLE_CODES.SUPPORT,
    name: "Support",
    description: "Soporte de solo lectura",
    permissionIds: [
      "cms.pages.read", "cms.media.read", "cms.menus.read",
      "identity.audit.read", "students.read",
    ],
    system: true,
  },
];

/** Todos los roles de tenant (portal + ERP) — compatibilidad */
export const TENANT_ROLES: RoleTemplate[] = [...PORTAL_TENANT_ROLES, ...ERP_TENANT_ROLES];

export type TenantRoleSyncMode = "portal" | "full";

export function getTenantRolesForSync(mode: TenantRoleSyncMode = "portal"): RoleTemplate[] {
  if (mode === "full") return TENANT_ROLES;
  return PORTAL_TENANT_ROLES;
}

export function roleSlug(nameOrCode: string): string {
  return nameOrCode.toLowerCase().replace(/\s+/g, "-").replace(/_/g, "-");
}

export function roleIdForTenant(tenantId: string, code: RoleCode): string {
  return `role-${tenantId}-${code.replace(/_/g, "-")}`;
}
