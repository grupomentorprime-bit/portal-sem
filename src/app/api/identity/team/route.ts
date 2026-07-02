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

    const memberships = await listMembershipsByTenant(ctx.tenantId);
    const userIds = memberships.map((m) => m.userId);
    const users = await listUsersByIds(userIds);
    const userMap = new Map(users.map((u) => [u._id, u]));

    const members = await Promise.all(
      memberships.map(async (m) => {
        const user = userMap.get(m.userId);
        const roles = await findRolesByIds(ctx.tenantId, m.roleIds);
        return {
          membershipId: m._id,
          userId: m.userId,
          email: user?.email ?? "",
          displayName: user?.displayName ?? "",
          status: m.status,
          roleIds: m.roleIds,
          roles: roles.map((r) => ({
            id: r._id,
            name: r.name,
            label: getInstitutionalRoleLabel(r.name),
          })),
          joinedAt: m.joinedAt,
          lastLoginAt: user?.lastLoginAt,
        };
      })
    );

    const invitations = await listInvitationsByTenant(ctx.tenantId);
    const audit = await listAuditByTenant(ctx.tenantId, 50);

    const auditUserIds = audit.map((a) => a.userId);
    const allUserIds = [...new Set([...userIds, ...auditUserIds])];
    const allUsers = allUserIds.length > userIds.length ? await listUsersByIds(allUserIds) : users;
    const fullUserMap = new Map(allUsers.map((u) => [u._id, u]));

    const invitationsWithRoles = await Promise.all(
      invitations.map(async (i) => {
        const roles = await findRolesByIds(ctx.tenantId, i.roleIds);
        return {
          id: i._id,
          email: i.email,
          status: i.status,
          expiresAt: i.expiresAt,
          createdAt: i.createdAt,
          roles: roles.map((r) => ({
            id: r._id,
            name: r.name,
            label: getInstitutionalRoleLabel(r.name),
          })),
        };
      })
    );

    return NextResponse.json({
      ok: true,
      members,
      invitations: invitationsWithRoles,
      audit: audit.map((a) => ({
        id: a._id,
        action: a.action,
        entity: a.entity,
        entityId: a.entityId,
        userId: a.userId,
        actorName: fullUserMap.get(a.userId)?.displayName || fullUserMap.get(a.userId)?.email || "Usuario",
        createdAt: a.createdAt,
        metadata: a.metadata,
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
