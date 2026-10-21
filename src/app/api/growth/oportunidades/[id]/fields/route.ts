import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import { openGrowthFunnelDirectory } from "@/core/growth/funnel-mongo";
import { getDatabase } from "@/lib/mongodb";
import { salesSaveCustomFields } from "@/lib/growth/sales-ops";
import { createMongoGrowthOpportunityStore } from "@/core/growth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const ctx = await requirePermission("growth.sales.operate");
    if (ctx instanceof NextResponse) return ctx;
    const { id } = await params;
    const body = (await request.json()) as { values?: Record<string, unknown> };
    const db = await getDatabase();
    const store = createMongoGrowthOpportunityStore(db);
    const oportunidad = await store.findById(ctx.tenantId, id);
    if (!oportunidad) {
      return NextResponse.json({ ok: false, error: "Oportunidad no encontrada." }, { status: 404 });
    }
    const directory = await openGrowthFunnelDirectory(db);
    const funnel = await directory.findFunnel(ctx.tenantId, oportunidad.funnelKey || "default");
    const result = await salesSaveCustomFields({
      tenantId: ctx.tenantId,
      oportunidadId: id,
      fields: funnel?.fields ?? [],
      patch: body.values ?? {},
    });
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, reason: result.reason, error: "Revisa el valor del campo." },
        { status: 400 }
      );
    }
    return NextResponse.json({ ok: true, incomplete: result.incomplete });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
