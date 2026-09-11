import { GrowthOsAdminHomeMaster } from "@/components/admin/preview/growth-os-master";
import { loadGrowthOsHomeSnapshot } from "@/components/admin/preview/growth-os-master/load-home-snapshot";
import { PLATFORM_SPACE_FALLBACK, displayInstitutionName } from "@/core/branding";
import { usesStudentAffairsFocusedShell, STUDENT_AFFAIRS_HOME_PATH } from "@/lib/admin/nav-access";
import { getOperationalSiteConfig } from "@/lib/cms/config";
import { listAvailableSpacesForUser } from "@/lib/identity/active-space";
import { findRolesByIds, getRoleCode } from "@/lib/identity/roles";
import { loadSessionContext } from "@/lib/identity/sessions";
import {
  firstNameFromDisplayName,
  timeOfDayGreeting,
} from "@/lib/platform/space-labels";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ empty?: string }>;
}

/**
 * Inicio del Espacio — OT-GROWTH-UX-HOME-003 (evolución visual sobre SHELL-002).
 * Datos reales de Growth Core; sin tendencias inventadas.
 * `?empty=1` solo en desarrollo: proyección vacía para capturas (no muta Mongo).
 */
export default async function AdminHomePage({ searchParams }: PageProps) {
  const [config, session] = await Promise.all([
    getOperationalSiteConfig(),
    loadSessionContext(),
  ]);
  const tenant = config?.institution.tenant ?? session?.session.tenantId ?? "default";
  const tenantId = session?.session.tenantId ?? tenant;
  const compatMode = false;

  let roleCodes: string[] = [];
  let permissions: string[] = [];

  if (session?.membership) {
    const roles = await findRolesByIds(session.session.tenantId, session.membership.roleIds);
    roleCodes = roles.map((role) => getRoleCode(role)).filter(Boolean) as string[];
    const { resolvePermissionsForMembership } = await import(
      "@/lib/identity/permission-resolver"
    );
    permissions = await resolvePermissionsForMembership(
      session.session.tenantId,
      session.membership
    );
  }

  if (usesStudentAffairsFocusedShell(permissions, compatMode, roleCodes)) {
    redirect(STUDENT_AFFAIRS_HOME_PATH);
  }

  const spaces = session ? await listAvailableSpacesForUser(session.user._id) : [];
  const activeSpace = spaces.find((s) => s.tenantId === tenantId);
  const spaceName =
    activeSpace?.name?.trim() ||
    displayInstitutionName(config?.institution.name, PLATFORM_SPACE_FALLBACK);

  const displayName =
    session?.user.displayName?.trim() || session?.user.email || "Administrador";
  const firstName = firstNameFromDisplayName(displayName) || displayName;

  const forceEmpty =
    process.env.NODE_ENV === "development" &&
    (await searchParams).empty === "1";
  const home = await loadGrowthOsHomeSnapshot(tenantId, forceEmpty);

  return (
    <GrowthOsAdminHomeMaster
      greeting={timeOfDayGreeting()}
      firstName={firstName}
      spaceName={spaceName}
      home={home}
    />
  );
}
