/** Identity & Access Management — AprendeHoy Learning OS */

export const USER_STATUSES = ["active", "suspended", "pending"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const MEMBERSHIP_STATUSES = ["active", "invited", "suspended"] as const;
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
  joinedAt: string;
  invitedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IdentityRole {
  _id: string;
  tenantId: string;
  name: string;
  description: string;
  permissionIds: string[];
  system: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IdentitySession {
  _id: string;
  userId: string;
  tenantId: string;
  ip?: string;
  userAgent?: string;
  createdAt: string;
  expiresAt: string;
  lastActivity: string;
}

export interface IdentityAuditEntry {
  _id: string;
  tenantId: string;
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
  compatMode: boolean;
}
