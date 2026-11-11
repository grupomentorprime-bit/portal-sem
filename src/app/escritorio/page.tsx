import "@/components/desktop/mentor-desktop.css";
import { redirect } from "next/navigation";
import { MentorDesktop } from "@/components/desktop/MentorDesktop";
import { hasPlatformOperatorCapability } from "@/core/identity/platform/capability";
import { usesStudentAffairsFocusedShell } from "@/lib/admin/nav-access";
import { CUMPLE_SPACE_ID, parseWallpaper } from "@/lib/desktop/catalog";
import { escritorioRedirect } from "@/lib/desktop/contract";
import { mongoAppRequestStore, readSpaceContract } from "@/lib/desktop/store";
import { listAvailableSpacesForUser } from "@/lib/identity/active-space";
import { findRolesByIds, getRoleCode } from "@/lib/identity/roles";
import { loadSessionContext } from "@/lib/identity/sessions";
import { resolvePublicOriginForTenant } from "@/lib/portal/public-origin";

export const dynamic = "force-dynamic";

export default async function EscritorioPage() {
  const session = await loadSessionContext();
  if (!session) redirect("/login?next=/escritorio");

  const tenantId = session.session.tenantId?.trim() ?? "";
  const hasMembership = Boolean(session.membership);
  const hasSpace = Boolean(hasMembership && tenantId);
  let studentAffairs = false;

  if (session.membership && tenantId) {
    const roles = await findRolesByIds(tenantId, session.membership.roleIds);
    const roleCodes = roles.map((role) => getRoleCode(role)).filter(Boolean) as string[];
    const { resolvePermissionsForMembership } = await import("@/lib/identity/permission-resolver");
    const permissions = await resolvePermissionsForMembership(tenantId, session.membership);
    studentAffairs = usesStudentAffairsFocusedShell(permissions, false, roleCodes);
  }

  const destination = escritorioRedirect({
    hasSpace,
    studentAffairs,
    isPlatformOperator: hasPlatformOperatorCapability(session.user),
    hasMembership,
  });
  if (destination) redirect(destination);

  const [spaces, contract, openRequests] = await Promise.all([
    listAvailableSpacesForUser(session.user._id),
    readSpaceContract(tenantId),
    mongoAppRequestStore().listOpen(tenantId),
  ]);

  const active = spaces.find((space) => space.tenantId === tenantId);
  const cumpleOrigin =
    tenantId === CUMPLE_SPACE_ID
      ? await resolvePublicOriginForTenant(tenantId).catch(() => null)
      : null;

  return (
    <MentorDesktop
      spaceName={active?.name?.trim() || "Espacio"}
      spaces={spaces.map((space) => ({ tenantId: space.tenantId, name: space.name }))}
      activeTenantId={tenantId}
      user={{ displayName: session.user.displayName, email: session.user.email }}
      contracted={contract.contracted}
      aprendeHoyEntryUrl={contract.aprendeHoyEntryUrl}
      cumpleOrigin={cumpleOrigin}
      wallpaper={parseWallpaper(session.user.desktopWallpaper)}
      requested={openRequests.map((row) => row.appId)}
    />
  );
}
