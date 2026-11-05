import { Suspense } from "react";
import { GrowthOsAdminHomeMaster } from "@/components/admin/preview/growth-os-master";
import { loadGrowthOsHomeSnapshot } from "@/components/admin/preview/growth-os-master/load-home-snapshot";
import type { GrowthOsHomeCapabilities } from "@/components/admin/preview/growth-os-master/project-home";
import { can } from "@/core/identity/policies/engine";
import { PLATFORM_SPACE_FALLBACK, displayInstitutionName } from "@/core/branding";
import { usesStudentAffairsFocusedShell, STUDENT_AFFAIRS_HOME_PATH } from "@/lib/admin/nav-access";
import { getOperationalSiteConfig } from "@/lib/cms/config";
import {
  ANALYTICS_PERIOD_PRESETS,
  type AnalyticsPeriodPreset,
} from "@/lib/growth/analytics-period";
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
  searchParams: Promise<{ empty?: string; preset?: string; from?: string; to?: string }>;
}

function resolvePreset(raw: string | undefined): AnalyticsPeriodPreset {
  const value = (raw ?? "last_30d").trim();
  if ((ANALYTICS_PERIOD_PRESETS as readonly string[]).includes(value) && value !== "custom") {
    return value as AnalyticsPeriodPreset;
  }
  return "last_30d";
}

/**
 * Inicio del Espacio — OT-GROWTH-UX-HOME-004 (maqueta Growth OS + datos reales).
 * Conversion Engine, Panel comercial y Actividad. La variación del encabezado usa la ventana anterior.
 * `?empty=1` solo en desarrollo: proyección vacía para capturas (no muta Mongo).
 */
export default async function AdminHomePage({ searchParams }: PageProps) {
  const params = await searchParams;
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

  const { readPlatformRoles } = await import("@/core/identity/platform/capability");
  const authCtx =
    session?.membership && session.user && session.session
      ? {
          user: session.user,
          session: session.session,
          membership: session.membership,
          permissions,
          tenantId,
          platformRoles: readPlatformRoles(session.user),
          compatMode: false,
        }
      : null;

  const capabilities: GrowthOsHomeCapabilities = {
    salesView: authCtx ? can(authCtx, "growth.sales.view") : false,
    salesOperate: authCtx ? can(authCtx, "growth.sales.operate") : false,
    salesRead: authCtx ? can(authCtx, "growth.sales.read") : false,
    campaignsView: authCtx
      ? can(authCtx, "growth.campaigns.view") || can(authCtx, "growth.campaigns.manage")
      : false,
    analyticsView: authCtx ? can(authCtx, "growth.analytics.view") : false,
    peopleView: authCtx
      ? can(authCtx, "growth.people.view") || can(authCtx, "growth.people.manage")
      : false,
    activityView: true,
  };

  const forceEmpty =
    process.env.NODE_ENV === "development" && params.empty === "1";
  const periodPreset = resolvePreset(params.preset);

  const home = await loadGrowthOsHomeSnapshot({
    tenantId,
    userId: session?.user._id ?? "",
    empty: forceEmpty,
    periodQuery: {
      preset: periodPreset,
      from: params.from,
      to: params.to,
    },
    capabilities,
  });

  return (
    <Suspense fallback={null}>
      <GrowthOsAdminHomeMaster
        greeting={timeOfDayGreeting()}
        firstName={firstName}
        spaceName={spaceName}
        home={home}
        periodPreset={periodPreset}
      />
    </Suspense>
  );
}
