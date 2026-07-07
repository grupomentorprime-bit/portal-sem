import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";
import type { AuditTimelineEntry } from "@/components/admin/AuditTimeline";
import { getInstitutionalRoleLabel } from "@/lib/admin/institutional";
import { usesStudentAffairsFocusedShell, STUDENT_AFFAIRS_HOME_PATH } from "@/lib/admin/nav-access";
import { getSiteConfig } from "@/lib/cms/config";
import { countContentDocuments } from "@/lib/content/query";
import { isIdentityEnforced } from "@/core/identity";
import { listAuditByTenant } from "@/lib/identity/audit";
import type { IdentityAuditEntry } from "@/types/identity";
import { listInvitationsByTenant } from "@/lib/identity/invitations";
import { countMembershipsByTenant } from "@/lib/identity/memberships";
import { findRolesByIds, getRoleCode } from "@/lib/identity/roles";
import { loadSessionContext } from "@/lib/identity/sessions";
import { listUsersByIds } from "@/lib/identity/users";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const [config, session] = await Promise.all([getSiteConfig(), loadSessionContext()]);
  const tenant = config?.institution.tenant ?? session?.session.tenantId ?? "default";
  const tenantId = session?.session.tenantId ?? tenant;
  const compatMode = !isIdentityEnforced();

  let roleLabel = "Colaborador";
  let roleCodes: string[] = [];
  let permissions: string[] = [];

  if (session?.membership) {
    const roles = await findRolesByIds(session.session.tenantId, session.membership.roleIds);
    roleCodes = roles.map((role) => getRoleCode(role)).filter(Boolean) as string[];
    if (roles[0]) roleLabel = getInstitutionalRoleLabel(roles[0].name);
    if (!compatMode) {
      const { resolvePermissionsForMembership } = await import(
        "@/lib/identity/permission-resolver"
      );
      permissions = await resolvePermissionsForMembership(
        session.session.tenantId,
        session.membership
      );
    }
  }
  if (session?.user.jobTitle?.trim()) {
    roleLabel = session.user.jobTitle.trim();
  }

  if (usesStudentAffairsFocusedShell(permissions, compatMode, roleCodes)) {
    redirect(STUDENT_AFFAIRS_HOME_PATH);
  }

  const [
    newsCount,
    programsCount,
    invitationsPending,
    recentAudit,
    memberCount,
  ] = await Promise.all([
    countContentDocuments(tenant, "content_news", { includeDraft: true }).catch(() => 0),
    countContentDocuments(tenant, "academy_programs", { includeDraft: true }).catch(() => 0),
    listInvitationsByTenant(tenantId)
      .then((invitations) => invitations.length)
      .catch(() => 0),
    listAuditByTenant(tenantId, 6).catch((): IdentityAuditEntry[] => []),
    countMembershipsByTenant(tenantId).catch(() => 0),
  ]);

  let auditPreview: AuditTimelineEntry[] = [];
  if (recentAudit.length > 0) {
    const auditUserIds = [...new Set(recentAudit.map((entry) => entry.userId))];
    const users = await listUsersByIds(auditUserIds);
    const userMap = new Map(users.map((user) => [user._id, user]));
    auditPreview = recentAudit.map((entry) => ({
      id: entry._id,
      action: entry.action,
      entity: entry.entity,
      actorName:
        userMap.get(entry.userId)?.displayName ||
        userMap.get(entry.userId)?.email ||
        "Usuario",
      createdAt: entry.createdAt,
      metadata: entry.metadata,
    }));
  }

  return (
    <AdminDashboardClient
      portalStatus={config?.institution.status ?? "active"}
      institutionName={config?.institution.name ?? "SEM"}
      displayName={session?.user.displayName || session?.user.email || "Administrador"}
      roleLabel={roleLabel}
      lastLoginAt={session?.user.lastLoginAt}
      newsCount={newsCount}
      programsCount={programsCount}
      invitationsPending={invitationsPending}
      recentActivityCount={recentAudit.length}
      memberCount={memberCount}
      auditPreview={auditPreview}
      compatMode={compatMode}
    />
  );
}
