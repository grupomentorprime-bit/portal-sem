import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import { listMembershipsByTenant } from "@/lib/identity/memberships";
import { listUsersByIds } from "@/lib/identity/users";
import { findRolesByIds } from "@/lib/identity/roles";
import { listInvitationsByTenant } from "@/lib/identity/invitations";
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
          roles: roles.map((r) => r.name),
          joinedAt: m.joinedAt,
          lastLoginAt: user?.lastLoginAt,
        };
      })
    );

    const invitations = await listInvitationsByTenant(ctx.tenantId);
    const audit = await listAuditByTenant(ctx.tenantId, 20);

    return NextResponse.json({
      ok: true,
      members,
      invitations: invitations.map((i) => ({
        id: i._id,
        email: i.email,
        status: i.status,
        expiresAt: i.expiresAt,
        createdAt: i.createdAt,
      })),
      audit: audit.map((a) => ({
        id: a._id,
        action: a.action,
        entity: a.entity,
        entityId: a.entityId,
        userId: a.userId,
        createdAt: a.createdAt,
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
