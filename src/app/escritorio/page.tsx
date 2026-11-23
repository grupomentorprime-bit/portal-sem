import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MentorDesktop } from "@/components/desktop/MentorDesktop";
import {
  hasPlatformOperatorCapability,
  hasPlatformOwnerCapability,
} from "@/core/identity/platform/capability";
import { usesStudentAffairsFocusedShell } from "@/lib/admin/nav-access";
import { aprendeHoyOriginFromEnv, rrhhOriginFromEnv } from "@/lib/connect/desk";
import { CUMPLE_SPACE_ID, DESK_ENTERED_COOKIE, enteredClientId, parseWallpaper } from "@/lib/desktop/catalog";
import { customWallpaperUrl } from "@/lib/desktop/wallpaper-upload";
import { parseDesktopLayout } from "@/lib/desktop/layout";
import { desktopClients } from "@/lib/desktop/clients";
import type { DesktopDayLine } from "@/lib/desktop/day";
import { readDesktopDay } from "@/lib/desktop/day-read";
import { escritorioRedirect } from "@/lib/desktop/contract";
import { attentionBadge } from "@/lib/desktop/attention";
import { attentionCasesInScope, attentionDeskScope, attentionMemberActor } from "@/lib/desktop/attention-context";
import {
  listAttentionCases,
  listAttentionCasesForTenant,
  readAttentionConfig,
} from "@/lib/desktop/attention-store";
import { hasAnySpaceSetting } from "@/lib/desktop/space-settings";
import { mongoAppRequestStore, readSpaceContract } from "@/lib/desktop/store";
import { listAvailableSpacesForUser, updateSessionActiveTenant } from "@/lib/identity/active-space";
import { findMembership } from "@/lib/identity/memberships";
import { activeDepartmentName } from "@/lib/identity/place-context";
import { findRolesByIds, getRoleCode } from "@/lib/identity/roles";
import { loadSessionContext } from "@/lib/identity/sessions";
import { resolvePublicOriginForTenant } from "@/lib/portal/public-origin";
import { getDatabase } from "@/lib/mongodb";
import { listTenants } from "@/core/tenant";
import type { MentorAppId } from "@/lib/desktop/catalog";

export const dynamic = "force-dynamic";

export default async function EscritorioPage() {
  const session = await loadSessionContext();
  if (!session) redirect("/login?next=/escritorio");

  const tenantId = session.session.tenantId?.trim() ?? "";
  const hasMembership = Boolean(session.membership);
  const hasSpace = Boolean(hasMembership && tenantId);
  let studentAffairs = false;
  let permissions: string[] = [];
  let roleCodes: string[] = [];

  if (session.membership && tenantId) {
    const roles = await findRolesByIds(tenantId, session.membership.roleIds);
    roleCodes = roles.map((role) => getRoleCode(role)).filter(Boolean) as string[];
    const { resolvePermissionsForMembership } = await import("@/lib/identity/permission-resolver");
    permissions = await resolvePermissionsForMembership(tenantId, session.membership);
    studentAffairs = usesStudentAffairsFocusedShell(permissions, false, roleCodes);
  }

  const destination = escritorioRedirect({
    hasSpace,
    studentAffairs,
    isPlatformOperator: hasPlatformOperatorCapability(session.user),
    hasMembership,
  });
  if (destination) redirect(destination);

  const operator = hasPlatformOperatorCapability(session.user);
  const platformOwner = hasPlatformOwnerCapability(session.user);
  const [memberships, catalog] = await Promise.all([
    listAvailableSpacesForUser(session.user._id),
    operator ? listTenants(await getDatabase()) : Promise.resolve([]),
  ]);
  const spaces = desktopClients({
    operator,
    memberships,
    catalog: catalog.map((tenant) => ({
      tenantId: tenant.tenantId,
      name: tenant.name,
      status: tenant.status,
    })),
  });
  const jar = await cookies();
  const entered = enteredClientId({
    owner: platformOwner,
    requestedId: jar.get(DESK_ENTERED_COOKIE)?.value,
    spaceIds: spaces.map((space) => space.tenantId),
  });
  const onPlatformDesk = platformOwner && !entered;
  let deskTenantId = onPlatformDesk ? "" : entered || tenantId;
  if (entered && entered !== tenantId) {
    await updateSessionActiveTenant(session.session._id, entered);
    deskTenantId = entered;
  }
  const [contract, openRequests] = onPlatformDesk
    ? [{ contracted: [], aprendeHoyEntryUrl: null, spaceType: null }, []]
    : await Promise.all([
        readSpaceContract(deskTenantId),
        mongoAppRequestStore().listOpen(deskTenantId),
      ]);
  const active = deskTenantId ? spaces.find((space) => space.tenantId === deskTenantId) : undefined;
  const cumpleOrigin =
    deskTenantId === CUMPLE_SPACE_ID
      ? await resolvePublicOriginForTenant(deskTenantId).catch(() => null)
      : null;
  let authorizedApps: MentorAppId[] | null = null;
  let deskMembership = session.membership;
  let deskPermissions = permissions;
  if (!onPlatformDesk && deskTenantId) {
    if (platformOwner || deskMembership?.tenantId !== deskTenantId) {
      deskMembership = await findMembership(session.user._id, deskTenantId);
      if (deskMembership) {
        const { resolvePermissionsForMembership } = await import(
          "@/lib/identity/permission-resolver"
        );
        deskPermissions = await resolvePermissionsForMembership(deskTenantId, deskMembership);
      } else {
        deskPermissions = [];
      }
    }
    authorizedApps = deskMembership?.authorizedApps ?? null;
  }
  let deskRoleCodes = roleCodes;
  if (deskMembership && deskTenantId && deskMembership.tenantId !== tenantId) {
    const roles = await findRolesByIds(deskTenantId, deskMembership.roleIds);
    deskRoleCodes = roles.map((role) => getRoleCode(role)).filter(Boolean) as string[];
  }

  let attentionCount = 0;
  let attentionUnread = false;
  let attentionUnreadCount = 0;
  const attentionStaff = operator;
  const attentionScope = attentionDeskScope({
    owner: platformOwner,
    sessionTenantId: tenantId,
    enteredTenantId: entered,
  });
  try {
    const actor = attentionMemberActor(
      attentionStaff
      ? {
          userId: session.user._id,
          displayName: session.user.displayName,
          kind: "staff",
          tenantId: attentionScope.desk === "company" ? attentionScope.tenantId : null,
          allAreas: platformOwner,
          areaIds: platformOwner ? [] : (await readAttentionConfig()).grants.find((grant) => grant.userId === session.user._id)?.areaIds ?? [],
          orgWide: false,
          economic: false,
        }
      : {
          userId: session.user._id,
          displayName: session.user.displayName,
          kind: "client",
          tenantId: deskTenantId,
          allAreas: false,
          areaIds: [],
          orgWide: hasAnySpaceSetting(deskPermissions, contract.contracted),
          economic: false,
        },
      attentionScope
    );
    const pool =
      attentionScope.desk === "company"
        ? await listAttentionCasesForTenant(attentionScope.tenantId)
        : attentionStaff
          ? await listAttentionCases()
          : [];
    const rows = attentionCasesInScope(pool, attentionScope);
    const badge = attentionBadge(rows, actor);
    attentionCount = badge.count;
    attentionUnread = badge.unread;
    attentionUnreadCount = badge.unreadCount;
  } catch {
    attentionCount = 0;
    attentionUnread = false;
    attentionUnreadCount = 0;
  }

  let departmentName = "";
  if (!onPlatformDesk && deskTenantId) {
    departmentName = await activeDepartmentName({
      tenantId: deskTenantId,
      roleCodes: deskRoleCodes,
      unitAccess: deskMembership?.unitAccess,
    });
  }

  let unitIds: string[] | null = null;
  let enabledUnitAppIds: string[] | null = null;
  if (!onPlatformDesk && deskTenantId && deskMembership?.unitAccess?.mode === "units") {
    const { listOrgUnits } = await import("@/core/units/repository");
    const { membershipUnitScope } = await import("@/core/units/access");
    const scope = membershipUnitScope({
      unitAccess: deskMembership.unitAccess,
      units: await listOrgUnits(await getDatabase(), deskTenantId),
    });
    unitIds = scope.unitIds;
    enabledUnitAppIds = scope.enabledUnitAppIds;
  }

  const dayLines = onPlatformDesk
    ? []
    : await Promise.race([
        readDesktopDay({
          tenantId: deskTenantId,
          userId: session.user._id,
          contracted: contract.contracted,
          authorizedApps,
          aprendeHoyEntryUrl: contract.aprendeHoyEntryUrl,
          cumpleOrigin,
        }),
        new Promise<DesktopDayLine[]>((resolve) => setTimeout(() => resolve([]), 400)),
      ]);

  return (
    <MentorDesktop
      spaceName={
        departmentName || active?.name?.trim() || (operator ? "Elige un cliente" : "Espacio")
      }
      spaces={spaces}
      activeTenantId={deskTenantId}
      user={{
        id: session.user._id,
        displayName: session.user.displayName,
        email: session.user.email,
        avatarPresetId: session.user.avatarPresetId,
        avatarPhoto: session.user.avatarPhoto === true,
        avatarPhotoUpdatedAt: session.user.avatarPhotoUpdatedAt,
      }}
      contracted={contract.contracted}
      authorizedApps={authorizedApps}
      spaceType={contract.spaceType}
      aprendeHoyEntryUrl={contract.aprendeHoyEntryUrl}
      aprendeHoyOrigin={aprendeHoyOriginFromEnv()}
      cumpleOrigin={cumpleOrigin}
      rrhhOrigin={rrhhOriginFromEnv()}
      wallpaper={
        session.user.desktopWallpaper === "custom" && session.user.desktopWallpaperCustom
          ? "custom"
          : parseWallpaper(session.user.desktopWallpaper)
      }
      customWallpaper={
        session.user.desktopWallpaperCustom
          ? customWallpaperUrl(session.user.desktopWallpaperUpdatedAt)
          : null
      }
      layout={parseDesktopLayout(session.user.desktopLayout)}
      requested={openRequests.map((row) => row.appId)}
      dayLines={dayLines}
      owner={onPlatformDesk}
      attentionStaff={attentionStaff}
      attentionDesk={attentionScope.desk}
      attentionCompanyName={attentionScope.desk === "company" ? active?.name?.trim() || "" : ""}
      attentionCount={attentionCount}
      attentionUnread={attentionUnread}
      attentionUnreadCount={attentionUnreadCount}
      canReturnToPlatform={platformOwner && Boolean(entered)}
      permissions={onPlatformDesk ? [] : deskPermissions}
      roleCodes={onPlatformDesk ? [] : deskRoleCodes}
      unitIds={onPlatformDesk ? null : unitIds}
      enabledUnitAppIds={onPlatformDesk ? null : enabledUnitAppIds}
    />
  );
}
