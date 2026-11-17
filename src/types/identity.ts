import type { UnitAccess } from "@/core/units/types";

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
  avatarPresetId?: string;
  avatarPhoto?: boolean;
  avatarPhotoUpdatedAt?: string;
  desktopWallpaper?: "mar" | "valle" | "volcan" | "kepler" | "noche" | "custom";
  /** Hay una imagen propia guardada, aunque el fondo activo sea del catálogo. */
  desktopWallpaperCustom?: boolean;
  desktopWallpaperUpdatedAt?: string;
  /** Iconos sueltos en la mesa. Ausente: todavía no los acomodó. */
  desktopLayout?: { appId: string; x: number; y: number }[];
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
  /**
   * Llaves de aplicación en este Espacio (`growth-os` | `cumple` | `aprende-hoy` | `rrhh`).
   * Solo cuentan las que también están en el plan del Espacio. Ausente = legado (todo el techo)
   * hasta la migración; lista vacía = ninguna llave.
   */
  authorizedApps?: Array<"growth-os" | "cumple" | "aprende-hoy" | "rrhh">;
  /** Formularios y generaciones asignados (rol Asuntos Estudiantiles). */
  studentAffairsScope?: StudentAffairsScope;
  /**
   * Alcance dentro del Espacio. Ausente = todo el Espacio (clientes sin unidades).
   * `tenant` = administración central. `units` = solo esas unidades.
   */
  unitAccess?: UnitAccess;
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
  /**
   * Ausente = escritorio / Growth OS.
   * `cumple` solo reconoce el host de Cumple y no abre el escritorio ni el admin.
   */
  audience?: "desk" | "cumple";
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
  /** Llaves a copiar en la membresía al aceptar (solo dentro del techo). */
  authorizedApps?: Array<"growth-os" | "cumple" | "aprende-hoy" | "rrhh">;
  /** Si viene, al aceptar se autoriza ese alcance. Ausente = membresía del Espacio completo. */
  unitAccess?: UnitAccess;
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
