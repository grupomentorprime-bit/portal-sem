import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import { listGrowthVentasQueue } from "@/lib/growth/ventas-read";

export async function GET(request: Request) {
  try {
    const ctx = await requirePermission("growth.sales.read");
    if (ctx instanceof NextResponse) return ctx;

    const url = new URL(request.url);
    const items = await listGrowthVentasQueue(ctx.tenantId, {
      q: url.searchParams.get("q") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      type: url.searchParams.get("type") ?? undefined,
      nextAction: url.searchParams.get("nextAction") ?? undefined,
    });

    return NextResponse.json({ ok: true, items });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
