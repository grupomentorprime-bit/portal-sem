/** Identity & Access Management — Growth OS */

export const USER_STATUSES = ["active", "suspended", "pending"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const MEMBERSHIP_STATUSES = ["active", "invited", "suspended", "archived"] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

export const IDENTITY_PROVIDERS = [
  "email",
  "oidc",
  "google",
  "microsoft",
  "apple",
  "github",
  "saml",
] as const;
export type IdentityProvider = (typeof IDENTITY_PROVIDERS)[number];

export const INVITATION_STATUSES = ["pending", "accepted", "expired", "revoked"] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

export interface IdentityUser {
  _id: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  photoMediaId?: string;
  jobTitle?: string;
  phone?: string;
  timezone?: string;
  locale?: string;
  status: UserStatus;
  /** Cuenta reservada del sistema — protegida como Super Admin */
  isSystemAccount?: boolean;
  /**
   * Capacidad global de Growth OS (`platform_owner` / `platform_operator`).
   * Independiente de membresías y del Espacio activo. No autoriza por email ni `isSystemAccount`.
   */
  platformRoles?: Array<"platform_owner" | "platform_operator">;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IdentityCredential {
  _id: string;
  userId: string;
  provider: IdentityProvider;
  providerUserId: string;
  providerData?: Record<string, unknown>;
  passwordHash?: string;
  createdAt: string;
  updatedAt: string;
}

/** Alcance operativo para encargadas de asuntos estudiantiles. */
export interface StudentAffairsScope {
  formIds: string[];
  generationCodes: string[];
}

export interface IdentityMembership {
  _id: string;
  tenantId: string;
  userId: string;
  roleIds: string[];
  status: MembershipStatus;
  /** Formularios y generaciones asignados (rol Asuntos Estudiantiles). */
  studentAffairsScope?: StudentAffairsScope;
  /** Overrides granulares OT-IAM-002 — equivalente a user_permissions */
  permissionOverrides?: Record<string, boolean>;
  joinedAt: string;
  invitedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IdentityRole {
  _id: string;
  tenantId: string;
  name: string;
  /** Código estable — OT-IAM-SEM-001 */
  code?: string;
  /** Plantilla granular OT-IAM-002 — equivalente a role_permissions */
  permissionMap?: Record<string, boolean>;
  description: string;
  permissionIds: string[];
  system: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IdentitySession {
  _id: string;
  userId: string;
  /**
   * Espacio activo (ADR-008 `activeTenantId`).
   * Vacío cuando la cuenta no tiene membresías activas (“sin espacio”).
   */
  tenantId: string;
  ip?: string;
  userAgent?: string;
  createdAt: string;
  expiresAt: string;
  lastActivity: string;
}

export interface IdentityAuditEntry {
  _id: string;
  /** Espacio de la acción. Ausente en auditoría global (`scope: "platform"`). */
  tenantId?: string;
  /** `platform` = acción de Growth OS; omitido = auditoría de Espacio (histórico). */
  scope?: "tenant" | "platform";
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface IdentityInvitation {
  _id: string;
  tenantId: string;
  email: string;
  displayName: string;
  roleIds: string[];
  token: string;
  status: InvitationStatus;
  invitedBy: string;
  expiresAt: string;
  acceptedAt?: string;
  acceptedBy?: string;
  createdAt: string;
}

export interface AuthContext {
  user: IdentityUser;
  session: IdentitySession;
  membership: IdentityMembership | null;
  permissions: string[];
  tenantId: string;
  /** Copia de `user.platformRoles` cuando el contexto viene de sesión. */
  platformRoles?: Array<"platform_owner" | "platform_operator">;
  compatMode: boolean;
}
