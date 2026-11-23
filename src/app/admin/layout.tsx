import { SpacePublicOriginProvider } from "@/components/admin/SpacePublicOrigin";
import { AdminShell } from "@/components/identity/AdminShell";
import { isAdminShellV2Enabled } from "@/lib/admin/feature-flags";
import { getInstitutionalRoleLabel } from "@/lib/admin/institutional";
import { isCongressVaronesPlace } from "@/core/congress/place";
import {
  CONGRESS_VARONES_FORMS_ALIAS_PATH,
  CONGRESS_VARONES_HOME_PATH,
  isCongressAllowedAdminPath,
  isStudentAffairsAllowedAdminPath,
  isUnitScopedAdminPathAllowed,
  STUDENT_AFFAIRS_HOME_PATH,
  usesCongressFocusedShell,
  usesStudentAffairsFocusedShell,
} from "@/lib/admin/nav-access";
import { resolveAdminNavBadges } from "@/lib/admin/nav-badges";
import { buildAdminTenantBranding } from "@/lib/admin/tenant-branding";
import { getOperationalSiteConfig } from "@/lib/cms/config";
import { resolveRequestHost } from "@/core/tenant";
import { resolvePublicOriginForTenant } from "@/lib/portal/public-origin";
import { hasPlatformOperatorCapability } from "@/core/identity/platform/capability";
import { decideAdminEntry } from "@/lib/admin/capability-boundary";
import { hasAppKey } from "@/lib/desktop/app-access";
import { specializedForDesk } from "@/lib/desktop/specialized";
import { readSpaceContract } from "@/lib/desktop/store";
import { listAvailableSpacesForUser } from "@/lib/identity/active-space";
import { activeDepartmentName } from "@/lib/identity/place-context";
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
  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-pathname") ?? "";
  const isLoginRoute = pathname === "/admin/login";
  const isNoSpaceRoute = pathname === NO_SPACE_PATH;

  if (!session && !isLoginRoute) {
    const loginUrl = pathname
      ? `/login?next=${encodeURIComponent(pathname)}`
      : "/login";
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
  const departmentName = hasSpace
    ? await activeDepartmentName({
        tenantId: session!.session.tenantId,
        roleCodes,
        unitAccess: session?.membership?.unitAccess,
      })
    : "";
  const spaceDisplayName =
    departmentName ||
    activeSpace?.name?.trim() ||
    config?.institution.name?.trim() ||
    "";
  const branding = spaceDisplayName
    ? {
        ...brandingBase,
        institutionName: spaceDisplayName,
        ...(departmentName ? { institutionShortName: departmentName } : {}),
      }
    : brandingBase;
  const tenant = session?.session.tenantId?.trim() || config?.institution.tenant || "default";
  const tenantId = session?.session.tenantId?.trim() || tenant;
  const permissions = session?.membership
    ? await (async () => {
        const { ensureTenantRoles } = await import("@/lib/identity/roles");
        const { resolvePermissionsForMembership } = await import(
          "@/lib/identity/permission-resolver"
        );
        await ensureTenantRoles(session.session.tenantId);
        return resolvePermissionsForMembership(
          session.session.tenantId,
          session.membership!
        );
      })()
    : [];

  const congressUnitIds =
    session?.membership?.unitAccess?.mode === "units"
      ? session.membership.unitAccess.unitIds
      : null;
  const showCongressVarones = isCongressVaronesPlace({
    tenantId,
    unitIds: congressUnitIds,
  });
  const onCongressAdmin =
    pathname === CONGRESS_VARONES_HOME_PATH ||
    pathname.startsWith(`${CONGRESS_VARONES_HOME_PATH}/`) ||
    pathname === CONGRESS_VARONES_FORMS_ALIAS_PATH ||
    pathname.startsWith(`${CONGRESS_VARONES_FORMS_ALIAS_PATH}/`);

  if (pathname && hasSpace && onCongressAdmin && !showCongressVarones) {
    redirect("/admin");
  }

  if (
    pathname &&
    hasSpace &&
    showCongressVarones &&
    usesCongressFocusedShell(permissions, roleCodes) &&
    !isCongressAllowedAdminPath(pathname)
  ) {
    redirect(CONGRESS_VARONES_HOME_PATH);
  }

  if (
    pathname &&
    hasSpace &&
    usesStudentAffairsFocusedShell(permissions, compatMode, roleCodes) &&
    !isStudentAffairsAllowedAdminPath(pathname, roleCodes)
  ) {
    redirect(STUDENT_AFFAIRS_HOME_PATH);
  }

  let enabledAppIds: string[] | null = null;
  let unitIds: string[] | null = null;
  if (session?.membership?.unitAccess?.mode === "units" && hasSpace) {
    const { getDatabase } = await import("@/lib/mongodb");
    const { listOrgUnits } = await import("@/core/units/repository");
    const { membershipUnitScope } = await import("@/core/units/access");
    const db = await getDatabase();
    const units = await listOrgUnits(db, session.session.tenantId);
    const scope = membershipUnitScope({
      unitAccess: session.membership.unitAccess,
      units,
    });
    unitIds = scope.unitIds;
    enabledAppIds = scope.enabledUnitAppIds;
  }

  let growthOs = false;
  let openedSpecialized: string[] = [];
  if (session?.membership && hasSpace && !isLoginRoute && !isNoSpaceRoute) {
    const activeTenantId = session.session.tenantId.trim();
    const contract = await readSpaceContract(activeTenantId);
    growthOs = hasAppKey("growth-os", {
      contracted: contract.contracted,
      authorizedApps: session.membership.authorizedApps ?? null,
    });
    const desk = {
      tenantId: activeTenantId,
      permissions,
      unitIds,
      enabledUnitAppIds: enabledAppIds,
      roleCodes,
      growthOs,
    };
    openedSpecialized = specializedForDesk(desk);
    const decision = decideAdminEntry({
      pathname,
      ...desk,
    });
    if (decision.kind === "redirect") redirect(decision.href);
  }

  if (
    pathname &&
    hasSpace &&
    !isLoginRoute &&
    !isNoSpaceRoute &&
    !isUnitScopedAdminPathAllowed(pathname, enabledAppIds)
  ) {
    redirect(growthOs ? "/admin" : "/escritorio");
  }

  const publicOrigin = hasSpace
    ? await resolvePublicOriginForTenant(tenantId, {
        requestHost: resolveRequestHost(requestHeaders),
      }).catch(() => null)
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
                institutionName: spaceDisplayName || branding.institutionName,
                activeTenantId: session.session.tenantId || null,
                spaces: spaces.map((s) => ({ tenantId: s.tenantId, name: s.name })),
                canOpenPlatform: hasPlatformOperatorCapability(session.user),
              }
            : null
        }
        compatMode={compatMode}
        permissions={permissions}
        roleCodes={roleCodes}
        shellV2={shellV2}
        branding={branding}
        navBadges={navBadges}
        enabledAppIds={enabledAppIds}
        showCongressVarones={showCongressVarones}
        shellScope={{ growthOs, opened: openedSpecialized }}
      >
        {children}
      </AdminShell>
    </SpacePublicOriginProvider>
  );
}
