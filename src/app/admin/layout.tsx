import { AdminShell } from "@/components/identity/AdminShell";
import { getInstitutionalRoleLabel } from "@/lib/admin/institutional";
import { getSiteConfig } from "@/lib/cms/config";
import { isIdentityEnforced } from "@/core/identity";
import { ALL_PERMISSION_IDS } from "@/core/identity/permissions/registry";
import { findRolesByIds, resolvePermissionsForRoles } from "@/lib/identity/roles";
import { loadSessionContext } from "@/lib/identity/sessions";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, config] = await Promise.all([loadSessionContext(), getSiteConfig()]);
  let roleLabel = "Colaborador";

  if (session?.membership) {
    const roles = await findRolesByIds(session.session.tenantId, session.membership.roleIds);
    if (roles[0]) roleLabel = getInstitutionalRoleLabel(roles[0].name);
  }

  if (session?.user.jobTitle?.trim()) {
    roleLabel = session.user.jobTitle.trim();
  }

  const compatMode = !isIdentityEnforced();
  const permissions = compatMode
    ? [...ALL_PERMISSION_IDS]
    : session?.membership
      ? await resolvePermissionsForRoles(session.session.tenantId, session.membership.roleIds)
      : [];

  return (
    <AdminShell
      user={
        session
          ? {
              displayName: session.user.displayName,
              email: session.user.email,
              roleLabel,
              institutionName: config?.institution.name,
            }
          : null
      }
      compatMode={compatMode}
      permissions={permissions}
    >
      {children}
    </AdminShell>
  );
}
