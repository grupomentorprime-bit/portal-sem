import { AdminShell } from "@/components/identity/AdminShell";
import { isAdminShellV2Enabled } from "@/lib/admin/feature-flags";
import { getInstitutionalRoleLabel } from "@/lib/admin/institutional";
import {
  isStudentAffairsAllowedAdminPath,
  STUDENT_AFFAIRS_HOME_PATH,
  usesStudentAffairsFocusedShell,
} from "@/lib/admin/nav-access";
import { resolveAdminNavBadges } from "@/lib/admin/nav-badges";
import { buildAdminTenantBranding } from "@/lib/admin/tenant-branding";
import { getSiteConfig } from "@/lib/cms/config";
import { isIdentityEnforced } from "@/core/identity";
import { ALL_PERMISSION_IDS } from "@/core/identity/permissions/registry";
import { findRolesByIds, getRoleCode } from "@/lib/identity/roles";
import { loadSessionContext } from "@/lib/identity/sessions";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, config] = await Promise.all([loadSessionContext(), getSiteConfig()]);
  let roleLabel = "Colaborador";
  let roleCodes: string[] = [];

  if (session?.membership) {
    const roles = await findRolesByIds(session.session.tenantId, session.membership.roleIds);
    if (roles[0]) {
      const code = getRoleCode(roles[0]);
      roleLabel = getInstitutionalRoleLabel(roles[0].name, code ?? undefined);
    }
    roleCodes = roles.map((r) => getRoleCode(r)).filter(Boolean) as string[];
  }

  if (session?.user.jobTitle?.trim()) {
    roleLabel = session.user.jobTitle.trim();
  }

  const compatMode = !isIdentityEnforced();
  const shellV2 = isAdminShellV2Enabled();
  const branding = buildAdminTenantBranding(config);
  const tenant = config?.institution.tenant ?? session?.session.tenantId ?? "default";
  const tenantId = session?.session.tenantId ?? tenant;
  const permissions = compatMode
    ? [...ALL_PERMISSION_IDS]
    : session?.membership
      ? await (async () => {
          const { resolvePermissionsForMembership } = await import(
            "@/lib/identity/permission-resolver"
          );
          return resolvePermissionsForMembership(
            session.session.tenantId,
            session.membership!
          );
        })()
      : [];

  const pathname = (await headers()).get("x-pathname") ?? "";
  if (
    pathname &&
    usesStudentAffairsFocusedShell(permissions, compatMode, roleCodes) &&
    !isStudentAffairsAllowedAdminPath(pathname, roleCodes)
  ) {
    redirect(STUDENT_AFFAIRS_HOME_PATH);
  }

  const navBadges = shellV2
    ? await resolveAdminNavBadges({
        tenant,
        tenantId,
        permissions,
        compatMode,
        roleCodes,
        session: session?.session ?? null,
        user: session?.user ?? null,
        membership: session?.membership ?? null,
      }).catch((): Record<string, number> => ({}))
    : undefined;

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
      roleCodes={roleCodes}
      shellV2={shellV2}
      branding={branding}
      navBadges={navBadges}
    >
      {children}
    </AdminShell>
  );
}
