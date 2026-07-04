import type { AuditTimelineEntry } from "@/components/admin/AuditTimeline";
import type { AdminTenantBranding } from "@/components/admin/shell-v2/types";
import type { AdminUserSummary } from "@/components/admin/AdminUserMenuPanel";

export const MOCK_BRANDING: AdminTenantBranding = {
  institutionName: "Seminario Eclesiástico Mayor",
  institutionShortName: "SEM",
  logoUrl: "/images/logo-sem-isotype.png",
  centerLabel: "Centro SEM",
};

export const MOCK_USER: AdminUserSummary = {
  displayName: "Marco Antonio Sepulveda Bustos",
  email: "msepulvedabustos@gmail.com",
  roleLabel: "Super Admin",
  institutionName: "Seminario Eclesiástico Mayor",
};

export const MOCK_PERMISSIONS = [
  "cms.pages.read",
  "cms.pages.update",
  "settings.team",
  "student-affairs.read",
  "programs.manage",
  "experience.forms.read",
];

export const MOCK_AUDIT: AuditTimelineEntry[] = [
  {
    id: "1",
    action: "auth.login",
    entity: "user",
    actorName: "Marco Antonio Sepulveda Bustos",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "2",
    action: "user.invite",
    entity: "user",
    actorName: "Marco Antonio Sepulveda Bustos",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    metadata: { email: "contacto@mentorprime.cl" },
  },
  {
    id: "3",
    action: "membership.roles.update",
    entity: "user",
    actorName: "Marco Antonio Sepulveda Bustos",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    metadata: { role: "student_affairs" },
  },
];

export const MOCK_DASHBOARD_PROPS = {
  portalStatus: "active",
  institutionName: "Seminario Eclesiástico Mayor",
  displayName: "Marco Antonio Sepulveda Bustos",
  roleLabel: "Super Admin",
  lastLoginAt: new Date(Date.now() - 7200000).toISOString(),
  newsCount: 3,
  programsCount: 3,
  invitationsPending: 2,
  recentActivityCount: 6,
  memberCount: 3,
  auditPreview: MOCK_AUDIT,
  compatMode: false,
};
