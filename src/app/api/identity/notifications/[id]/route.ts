import { NextResponse } from "next/server";
import { requireSession } from "@/core/identity";
import { markNotificationRead } from "@/lib/identity/notifications";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(_request: Request, context: RouteContext) {
  try {
    const ctx = await requireSession();
    if (ctx instanceof NextResponse) return ctx;

    const { id } = await context.params;
    const ok = await markNotificationRead(ctx.tenantId, ctx.user._id, id);
    if (!ok) {
      return NextResponse.json({ ok: false, error: "Notificación no encontrada." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[identity/notifications/[id] PATCH]", error);
    return NextResponse.json({ ok: false, error: "Error interno." }, { status: 500 });
  }
}
