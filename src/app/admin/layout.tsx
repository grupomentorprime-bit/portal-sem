import { SpacePublicOriginProvider } from "@/components/admin/SpacePublicOrigin";
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
import { getOperationalSiteConfig } from "@/lib/cms/config";
import { resolvePublicOriginForTenant } from "@/lib/portal/public-origin";
import { listAvailableSpacesForUser } from "@/lib/identity/active-space";
import { findRolesByIds, getRoleCode } from "@/lib/identity/roles";
import { loadSessionContext } from "@/lib/identity/sessions";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const NO_SPACE_PATH = "/admin/sin-espacio";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, config] = await Promise.all([
    loadSessionContext(),
    getOperationalSiteConfig(),
  ]);
  const pathname = (await headers()).get("x-pathname") ?? "";
  const isLoginRoute = pathname === "/admin/login";
  const isNoSpaceRoute = pathname === NO_SPACE_PATH;

  if (!session && !isLoginRoute) {
    const loginUrl = pathname
      ? `/admin/login?next=${encodeURIComponent(pathname)}`
      : "/admin/login";
    redirect(loginUrl);
  }

  const hasSpace = Boolean(session?.membership && session.session.tenantId?.trim());

  // Cero Espacios → estado dedicado; nunca cascarón vacío.
  if (session && !hasSpace && !isLoginRoute && !isNoSpaceRoute) {
    redirect(NO_SPACE_PATH);
  }

  if (session && hasSpace && isNoSpaceRoute) {
    redirect("/admin");
  }

  let roleLabel = "Colaborador";
  let roleCodes: string[] = [];
  const spaces = session ? await listAvailableSpacesForUser(session.user._id) : [];
  const activeSpace = spaces.find((s) => s.tenantId === session?.session.tenantId);

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

  const compatMode = false;
  const shellV2 = isAdminShellV2Enabled();
  const brandingBase = buildAdminTenantBranding(config);
  const spaceDisplayName =
    activeSpace?.name?.trim() ||
    config?.institution.name?.trim() ||
    "";
  const branding = spaceDisplayName
    ? { ...brandingBase, institutionName: spaceDisplayName }
    : brandingBase;
  const tenant = session?.session.tenantId?.trim() || config?.institution.tenant || "default";
  const tenantId = session?.session.tenantId?.trim() || tenant;
  const permissions = session?.membership
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

  if (
    pathname &&
    hasSpace &&
    usesStudentAffairsFocusedShell(permissions, compatMode, roleCodes) &&
    !isStudentAffairsAllowedAdminPath(pathname, roleCodes)
  ) {
    redirect(STUDENT_AFFAIRS_HOME_PATH);
  }

  const publicOrigin = hasSpace
    ? await resolvePublicOriginForTenant(tenantId).catch(() => null)
    : null;

  const navBadges =
    shellV2 && hasSpace
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

  // Sin espacio: sin cascarón (solo el estado).
  if (isNoSpaceRoute || isLoginRoute) {
    return <>{children}</>;
  }

  return (
    <SpacePublicOriginProvider origin={publicOrigin}>
      <AdminShell
        user={
          session
            ? {
                displayName: session.user.displayName,
                email: session.user.email,
                roleLabel,
                institutionName:
                  activeSpace?.name?.trim() ||
                  config?.institution.name?.trim() ||
                  branding.institutionName,
                activeTenantId: session.session.tenantId || null,
                spaces: spaces.map((s) => ({ tenantId: s.tenantId, name: s.name })),
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
    </SpacePublicOriginProvider>
  );
}
