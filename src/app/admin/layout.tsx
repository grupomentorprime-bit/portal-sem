import { AdminShell } from "@/components/identity/AdminShell";
import { getInstitutionalRoleLabel } from "@/lib/admin/institutional";
import { getSiteConfig } from "@/lib/cms/config";
import { isIdentityEnforced } from "@/core/identity";
import { findRolesByIds } from "@/lib/identity/roles";
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
      compatMode={!isIdentityEnforced()}
    >
      {children}
    </AdminShell>
  );
}
