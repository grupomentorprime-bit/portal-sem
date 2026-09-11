import { NextResponse } from "next/server";
import { requireSession } from "@/core/identity";
import { listAvailableSpacesForUser } from "@/lib/identity/active-space";

/** GET — Espacios disponibles de la cuenta (membresías activas). */
export async function GET() {
  try {
    const ctx = await requireSession();
    if (ctx instanceof NextResponse) return ctx;

    const spaces = await listAvailableSpacesForUser(ctx.user._id);
    const activeTenantId = ctx.tenantId || null;

    return NextResponse.json({
      ok: true,
      activeTenantId,
      spaces,
      hasSpace: Boolean(activeTenantId && ctx.membership),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
