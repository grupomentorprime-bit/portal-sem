import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import { assertActiveTenant, tenantGuardResponse } from "@/core/security";
import { publish } from "@/core/events/publisher";
import type { PublishInput } from "@/types/events";

export async function POST(request: Request) {
  try {
    const ctx = await requirePermission("events.manage");
    if (ctx instanceof NextResponse) return ctx;

    const body = (await request.json()) as PublishInput;
    if (!body.type || !body.tenantId || !body.entityType || !body.entityId) {
      return NextResponse.json(
        { ok: false, error: "type, tenantId, entityType y entityId son obligatorios." },
        { status: 400 }
      );
    }

    const tenantCheck = await assertActiveTenant(body.tenantId);
    if (!tenantCheck.ok) return tenantGuardResponse(tenantCheck);
    if (tenantCheck.tenant !== ctx.tenantId) {
      return NextResponse.json(
        { ok: false, error: "Acceso denegado entre tenants." },
        { status: 403 }
      );
    }

    const event = await publish({
      ...body,
      tenantId: ctx.tenantId,
      userId: body.userId ?? ctx.user._id,
    });

    return NextResponse.json({ ok: true, event });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
