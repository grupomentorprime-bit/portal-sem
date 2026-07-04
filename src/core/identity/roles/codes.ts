/** Códigos oficiales de roles — identificadores estables en inglés (OT-IAM-SEM-001) */

export const ROLE_CODES = {
  SUPER_ADMIN: "super_admin",
  INSTITUTION_ADMIN: "institution_admin",
  SUPPORT: "support",
  ADMISSIONS: "admissions",
  STUDENT_AFFAIRS: "student_affairs",
  COMMUNICATIONS: "communications",
  REVIEWER: "reviewer",
  GUEST: "guest",
  /** Roles reservados para futuro ERP Académico — deshabilitados en tenant portal */
  TEACHER: "teacher",
  FINANCE: "finance",
  STUDENT: "student",
} as const;

export type RoleCode = (typeof ROLE_CODES)[keyof typeof ROLE_CODES];

export type PortalRoleCode =
  | typeof ROLE_CODES.SUPER_ADMIN
  | typeof ROLE_CODES.INSTITUTION_ADMIN
  | typeof ROLE_CODES.SUPPORT
  | typeof ROLE_CODES.ADMISSIONS
  | typeof ROLE_CODES.STUDENT_AFFAIRS
  | typeof ROLE_CODES.COMMUNICATIONS
  | typeof ROLE_CODES.REVIEWER
  | typeof ROLE_CODES.GUEST;

export const PORTAL_ROLE_CODES: PortalRoleCode[] = [
  ROLE_CODES.SUPER_ADMIN,
  ROLE_CODES.INSTITUTION_ADMIN,
  ROLE_CODES.SUPPORT,
  ROLE_CODES.ADMISSIONS,
  ROLE_CODES.STUDENT_AFFAIRS,
  ROLE_CODES.COMMUNICATIONS,
  ROLE_CODES.REVIEWER,
  ROLE_CODES.GUEST,
];

export const ERP_ROLE_CODES: RoleCode[] = [
  ROLE_CODES.TEACHER,
  ROLE_CODES.FINANCE,
  ROLE_CODES.STUDENT,
];

/** Mapeo de nombres legacy (pre OT-IAM-SEM-001) → código oficial */
export const LEGACY_ROLE_NAME_TO_CODE: Record<string, RoleCode> = {
  "Tenant Owner": ROLE_CODES.SUPER_ADMIN,
  "Super Admin": ROLE_CODES.SUPER_ADMIN,
  "Institution Admin": ROLE_CODES.INSTITUTION_ADMIN,
  Support: ROLE_CODES.SUPPORT,
  Admissions: ROLE_CODES.ADMISSIONS,
  "Student Affairs": ROLE_CODES.STUDENT_AFFAIRS,
  Editor: ROLE_CODES.COMMUNICATIONS,
  Communications: ROLE_CODES.COMMUNICATIONS,
  Reviewer: ROLE_CODES.REVIEWER,
  Guest: ROLE_CODES.GUEST,
  Teacher: ROLE_CODES.TEACHER,
  Finance: ROLE_CODES.FINANCE,
  Student: ROLE_CODES.STUDENT,
};

export function resolveRoleCode(nameOrCode: string): RoleCode | null {
  const trimmed = nameOrCode.trim();
  if ((PORTAL_ROLE_CODES as string[]).includes(trimmed)) return trimmed as RoleCode;
  if ((ERP_ROLE_CODES as string[]).includes(trimmed)) return trimmed as RoleCode;
  return LEGACY_ROLE_NAME_TO_CODE[trimmed] ?? null;
}

export function isSuperAdminCode(code: string | undefined | null): boolean {
  return code === ROLE_CODES.SUPER_ADMIN;
}

export function isProtectedRoleCode(code: string | undefined | null): boolean {
  return isSuperAdminCode(code);
}
