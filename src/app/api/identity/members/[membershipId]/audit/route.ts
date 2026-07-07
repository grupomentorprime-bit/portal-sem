import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import { listAuditForMember } from "@/lib/identity/audit";
import { findMembershipById } from "@/lib/identity/memberships";
import { listUsersByIds } from "@/lib/identity/users";

interface RouteContext {
  params: Promise<{ membershipId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const ctx = await requirePermission("settings.team");
    if (ctx instanceof NextResponse) return ctx;

    const { membershipId } = await context.params;
    const membership = await findMembershipById(membershipId);

    if (!membership || membership.tenantId !== ctx.tenantId) {
      return NextResponse.json({ ok: false, error: "Membresía no encontrada." }, { status: 404 });
    }

    const entries = await listAuditForMember(ctx.tenantId, {
      userId: membership.userId,
      membershipId,
    });

    const actorIds = [...new Set(entries.map((entry) => entry.userId))];
    const actors = await listUsersByIds(actorIds);
    const actorMap = new Map(actors.map((user) => [user._id, user]));

    return NextResponse.json({
      ok: true,
      entries: entries.map((entry) => ({
        id: entry._id,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        userId: entry.userId,
        actorName:
          actorMap.get(entry.userId)?.displayName ||
          actorMap.get(entry.userId)?.email ||
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
