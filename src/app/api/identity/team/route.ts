import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import { listMembershipsByTenant } from "@/lib/identity/memberships";
import { listUsersByIds } from "@/lib/identity/users";
import { findRolesByIds } from "@/lib/identity/roles";
import { listInvitationsByTenant } from "@/lib/identity/invitations";
import { getInstitutionalRoleLabel } from "@/lib/admin/institutional";
import { listAuditByTenant } from "@/lib/identity/audit";

export async function GET() {
  try {
    const ctx = await requirePermission("settings.team");
    if (ctx instanceof NextResponse) return ctx;

    const [memberships, invitations, audit] = await Promise.all([
      listMembershipsByTenant(ctx.tenantId),
      listInvitationsByTenant(ctx.tenantId),
      listAuditByTenant(ctx.tenantId, 50),
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

    const members = memberships.map((membership) => {
      const user = userMap.get(membership.userId);
      const memberRoles = membership.roleIds
        .map((roleId) => roleMap.get(roleId))
        .filter((role): role is NonNullable<typeof role> => Boolean(role));

      return {
        membershipId: membership._id,
        userId: membership.userId,
        email: user?.email ?? "",
        displayName: user?.displayName ?? "",
        status: membership.status,
        roleIds: membership.roleIds,
        studentAffairsScope: membership.studentAffairsScope,
        roles: memberRoles.map((role) => ({
          id: role._id,
          name: role.name,
          label: getInstitutionalRoleLabel(role.name),
        })),
        joinedAt: membership.joinedAt,
        lastLoginAt: user?.lastLoginAt,
      };
    });

    const invitationsWithRoles = invitations.map((invitation) => {
      const invitationRoles = invitation.roleIds
        .map((roleId) => roleMap.get(roleId))
        .filter((role): role is NonNullable<typeof role> => Boolean(role));

      return {
        id: invitation._id,
        email: invitation.email,
        displayName: invitation.displayName || invitation.email,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
        roles: invitationRoles.map((role) => ({
          id: role._id,
          name: role.name,
          label: getInstitutionalRoleLabel(role.name),
        })),
      };
    });

    return NextResponse.json({
      ok: true,
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
