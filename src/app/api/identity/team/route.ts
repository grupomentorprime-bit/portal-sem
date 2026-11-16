import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import { resolveAuthorizedApps } from "@/lib/desktop/app-access";
import { readSpaceContract } from "@/lib/desktop/store";
import { listMembershipsByTenant } from "@/lib/identity/memberships";
import { listUsersByIds } from "@/lib/identity/users";
import {
  findRolesByIds,
  getCallerRoleCode,
  getRoleCode,
  listRolesByTenant,
} from "@/lib/identity/roles";
import { listInvitationsByTenant } from "@/lib/identity/invitations";
import { getInstitutionalRoleLabel } from "@/lib/admin/institutional";
import { listAuditByTenant } from "@/lib/identity/audit";
import {
  buildAssignableRolesList,
  getTargetRoleCode,
  shouldHideMemberFromCaller,
} from "@/lib/identity/iam-guard";
import {
  assertCanAssignCustomProfile,
  classifyEnterpriseProfile,
} from "@/lib/identity/enterprise-profiles";
import { resolvePermissionDetailsForMembership } from "@/lib/identity/permission-resolver";
import type { RoleCode } from "@/core/identity/roles/codes";

export async function GET() {
  try {
    const ctx = await requirePermission("settings.team");
    if (ctx instanceof NextResponse) return ctx;

    // Lectura pura — sync de roles solo en login/bootstrap/migración (SAAS-004).
    const callerRoleCode = ctx.membership
      ? await getCallerRoleCode(ctx.tenantId, ctx.membership.roleIds)
      : null;

    const [memberships, invitations, audit, allRoles, contract] = await Promise.all([
      listMembershipsByTenant(ctx.tenantId),
      listInvitationsByTenant(ctx.tenantId),
      listAuditByTenant(ctx.tenantId, 50),
      listRolesByTenant(ctx.tenantId),
      readSpaceContract(ctx.tenantId),
    ]);

    const userIds = memberships.map((membership) => membership.userId);
    const auditUserIds = audit.map((entry) => entry.userId);
    const allUserIds = [...new Set([...userIds, ...auditUserIds])];
    const users = await listUsersByIds(allUserIds);
    const userMap = new Map(users.map((user) => [user._id, user]));

    const allRoleIds = [
      ...new Set([
        ...memberships.flatMap((membership) => membership.roleIds),
        ...invitations.flatMap((invitation) => invitation.roleIds),
      ]),
    ];
    const roles = await findRolesByIds(ctx.tenantId, allRoleIds);
    const roleMap = new Map(roles.map((role) => [role._id, role]));

    const members = memberships
      .map((membership) => {
        const user = userMap.get(membership.userId);
        const memberRoles = membership.roleIds
          .map((roleId) => roleMap.get(roleId))
          .filter((role): role is NonNullable<typeof role> => Boolean(role));

        const targetCode = getTargetRoleCode(memberRoles);

        return {
          membershipId: membership._id,
          userId: membership.userId,
          email: user?.email ?? "",
          displayName: user?.displayName ?? "",
          avatarPresetId: user?.avatarPresetId ?? null,
          avatarPhoto: user?.avatarPhoto === true,
          avatarPhotoUpdatedAt: user?.avatarPhotoUpdatedAt ?? null,
          status: membership.status,
          roleIds: membership.roleIds,
          authorizedApps: resolveAuthorizedApps({
            contracted: contract.contracted,
            authorizedApps: membership.authorizedApps ?? null,
          }),
          studentAffairsScope: membership.studentAffairsScope,
          roles: memberRoles.map((role) => {
            const code = getRoleCode(role);
            return {
              id: role._id,
              name: role.name,
              code: code ?? undefined,
              label: code ? getInstitutionalRoleLabel(code) : role.name,
            };
          }),
          joinedAt: membership.joinedAt,
          lastLoginAt: user?.lastLoginAt,
          _targetCode: targetCode,
          _user: user,
        };
      })
      .filter((member) => {
        return !shouldHideMemberFromCaller(
          callerRoleCode,
          member._targetCode as RoleCode | null,
          member._user ?? undefined
        );
      })
      .map(({ _targetCode: _, _user: __, ...member }) => member);

    const invitationsWithRoles = invitations
      .map((invitation) => {
        const invitationRoles = invitation.roleIds
          .map((roleId) => roleMap.get(roleId))
          .filter((role): role is NonNullable<typeof role> => Boolean(role));

        const targetCode = getTargetRoleCode(invitationRoles);

        return {
          id: invitation._id,
          email: invitation.email,
          displayName: invitation.displayName || invitation.email,
          status: invitation.status,
          expiresAt: invitation.expiresAt,
          createdAt: invitation.createdAt,
          roles: invitationRoles.map((role) => {
            const code = getRoleCode(role);
            return {
              id: role._id,
              name: role.name,
              code: code ?? undefined,
              label: code ? getInstitutionalRoleLabel(code) : role.name,
            };
          }),
          _targetCode: targetCode,
        };
      })
      .filter((invitation) => {
        return !shouldHideMemberFromCaller(callerRoleCode, invitation._targetCode as RoleCode | null);
      })
      .map(({ _targetCode: _, ...invitation }) => invitation);

    const callerEffective = ctx.membership
      ? (await resolvePermissionDetailsForMembership(ctx.tenantId, ctx.membership)).effective
      : {};
    const assignableRoles = [
      ...buildAssignableRolesList(callerRoleCode, allRoles),
      ...allRoles
        .filter((role) => classifyEnterpriseProfile(role) === "custom")
        .filter((role) =>
          assertCanAssignCustomProfile({
            callerCode: callerRoleCode,
            callerEffective,
            permissionMap: role.permissionMap ?? {},
          }).ok
        )
        .map((role) => ({
          id: role._id,
          name: role.name,
          code: "",
          label: role.name,
        })),
    ];

    return NextResponse.json({
      ok: true,
      callerRoleCode,
      callerMembershipId: ctx.membership?._id ?? null,
      assignableRoles,
      contractedApps: contract.contracted,
      members,
      invitations: invitationsWithRoles,
      audit: audit.map((entry) => ({
        id: entry._id,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        userId: entry.userId,
        actorName:
          userMap.get(entry.userId)?.displayName ||
          userMap.get(entry.userId)?.email ||
          "Usuario",
        createdAt: entry.createdAt,
        metadata: entry.metadata,
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
