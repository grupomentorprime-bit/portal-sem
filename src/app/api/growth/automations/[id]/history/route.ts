import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import { getAutomationHistoryView } from "@/lib/growth/automations-history";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * OT-GROWTH-AUTOMATION-007 — ejecuciones recientes (proyección humana).
 * Requiere growth.automations.view. Aislado por Espacio.
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const ctx = await requirePermission("growth.automations.view");
    if (ctx instanceof NextResponse) return ctx;

    const { id } = await params;
    const url = new URL(request.url);
    const limitRaw = url.searchParams.get("limit");
    const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 20;

    const result = await getAutomationHistoryView(ctx.tenantId, id, limit);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error, code: result.code },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, runs: result.runs });
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
