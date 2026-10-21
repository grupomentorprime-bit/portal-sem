/**
 * Conversion Engine fase 3 — GET /api/growth/conversion-analytics
 * READ-ONLY. Permiso: growth.sales.view. Espacio activo vía sesión.
 */

import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import { getConversionAnalytics } from "@/lib/growth/conversion-analytics-read";

export async function GET(request: Request) {
  try {
    const ctx = await requirePermission("growth.sales.view");
    if (ctx instanceof NextResponse) return ctx;

    const url = new URL(request.url);
    const preset = url.searchParams.get("preset");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    const result = await getConversionAnalytics(ctx.tenantId, {
      preset,
      from,
      to,
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({ ok: true, ...result.data });
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
