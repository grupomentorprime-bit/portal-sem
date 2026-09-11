import { notFound, redirect } from "next/navigation";
import { getInstitutionalRoleLabel } from "@/lib/admin/institutional";
import { buildAdminTenantBranding } from "@/lib/admin/tenant-branding";
import { getOperationalSiteConfig } from "@/lib/cms/config";
import { listAvailableSpacesForUser } from "@/lib/identity/active-space";
import { findRolesByIds, getRoleCode } from "@/lib/identity/roles";
import { loadSessionContext } from "@/lib/identity/sessions";
import {
  firstNameFromDisplayName,
  timeOfDayGreeting,
} from "@/lib/platform/space-labels";
import {
  GrowthOsAdminHomeMaster,
  GrowthOsAdminMasterShell,
} from "@/components/admin/preview/growth-os-master";
import { loadGrowthOsHomeSnapshot } from "@/components/admin/preview/growth-os-master/load-home-snapshot";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ empty?: string }>;
}

/**
 * Maqueta maestra del Espacio Growth OS (congelada).
 * OT-GROWTH-UX-ADMIN-MASTER-001 / 001A · CERRADAS · APTO VISUAL.
 * Solo desarrollo. No sustituye `/admin`.
 */
export default async function AdminMasterPreviewPage({ searchParams }: PageProps) {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  const session = await loadSessionContext();
  const tenantId = session?.session.tenantId?.trim();
  if (!session || !tenantId) {
    redirect("/admin/login?next=/dev-preview/admin-master");
  }

  const empty = (await searchParams).empty === "1";
  const [config, spaces, home] = await Promise.all([
    getOperationalSiteConfig(),
    listAvailableSpacesForUser(session.user._id),
    loadGrowthOsHomeSnapshot(tenantId, empty),
  ]);

  const branding = buildAdminTenantBranding(config);
  const activeSpace = spaces.find((s) => s.tenantId === tenantId);
  const spaceName =
    activeSpace?.name?.trim() || branding.institutionName;
  const displayName =
    session.user.displayName?.trim() || session.user.email || "Administrador";
  const firstName = firstNameFromDisplayName(displayName) || displayName;

  let roleLabel = "Colaborador";
  if (session.membership) {
    const roles = await findRolesByIds(tenantId, session.membership.roleIds);
    if (roles[0]) {
      const code = getRoleCode(roles[0]);
      roleLabel = getInstitutionalRoleLabel(roles[0].name, code ?? undefined);
    }
  }
  if (session.user.jobTitle?.trim()) {
    roleLabel = session.user.jobTitle.trim();
  }

  return (
    <GrowthOsAdminMasterShell
      userName={displayName}
      roleLabel={roleLabel}
      spaceName={spaceName}
      spaceLogoUrl={branding.logoUrl}
      spaceShortName={branding.institutionShortName}
    >
      <GrowthOsAdminHomeMaster
        greeting={timeOfDayGreeting()}
        firstName={firstName}
        spaceName={spaceName}
        home={home}
      />
    </GrowthOsAdminMasterShell>
  );
}
