import { NextResponse } from "next/server";
import { requireSession } from "@/core/identity";
import {
  assertActiveMembership,
  updateSessionActiveTenant,
} from "@/lib/identity/active-space";
import { writeAudit } from "@/lib/identity/audit";

/**
 * POST — cambio explícito de Espacio.
 * El cliente no puede fijar un tenantId sin membresía activa.
 * Tras éxito el cliente debe volver a Inicio (/admin).
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireSession();
    if (ctx instanceof NextResponse) return ctx;

    const body = (await request.json()) as { tenantId?: string };
    const tenantId = body.tenantId?.trim() ?? "";
    if (!tenantId) {
      return NextResponse.json(
        { ok: false, error: "Debes indicar un Espacio." },
        { status: 400 }
      );
    }

    const membership = await assertActiveMembership(ctx.user._id, tenantId);
    if (!membership) {
      return NextResponse.json(
        { ok: false, error: "No tienes membresía activa en ese Espacio." },
        { status: 403 }
      );
    }

    if (ctx.tenantId === tenantId) {
      return NextResponse.json({
        ok: true,
        activeTenantId: tenantId,
        redirectedTo: "/admin",
        unchanged: true,
      });
    }

    await updateSessionActiveTenant(ctx.session._id, tenantId);

    await writeAudit({
      tenantId,
      userId: ctx.user._id,
      action: "space.switch",
      entity: "session",
      entityId: ctx.session._id,
      metadata: { fromTenantId: ctx.tenantId || null, toTenantId: tenantId },
    });

    return NextResponse.json({
      ok: true,
      activeTenantId: tenantId,
      redirectedTo: "/admin",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
