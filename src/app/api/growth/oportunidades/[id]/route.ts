import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import { getGrowthVentasOperateView } from "@/lib/growth/ventas-read";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const ctx = await requirePermission("growth.sales.read");
    if (ctx instanceof NextResponse) return ctx;

    const { id } = await params;
    const item = await getGrowthVentasOperateView(ctx.tenantId, id);
    if (!item) {
      return NextResponse.json(
        { ok: false, error: "Oportunidad no encontrada en este Espacio." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, item });
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
