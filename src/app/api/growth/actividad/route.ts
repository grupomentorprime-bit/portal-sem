/**
 * OT-GROWTH-ACTIVITY-001 — API de lectura del historial comercial.
 * Permiso: growth.sales.read | growth.sales.operate (mismo mínimo que Mensajes/Ventas).
 * No reutiliza el permiso de auditoría Identity.
 */

import { NextResponse } from "next/server";
import { can, requireSpace } from "@/core/identity";
import {
  GROWTH_ACTIVIDAD_FEED_CATEGORIES,
  listGrowthActividadFeed,
  type GrowthActividadFeedCategoryFilter,
} from "@/lib/growth/actividad-read";

function parseCategory(
  raw: string | null
): GrowthActividadFeedCategoryFilter {
  if (
    raw &&
    (GROWTH_ACTIVIDAD_FEED_CATEGORIES as readonly string[]).includes(raw)
  ) {
    return raw as GrowthActividadFeedCategoryFilter;
  }
  return "all";
}

export async function GET(request: Request) {
  try {
    const ctx = await requireSpace();
    if (ctx instanceof NextResponse) return ctx;

    if (
      !can(ctx, "growth.sales.read") &&
      !can(ctx, "growth.sales.operate")
    ) {
      return NextResponse.json(
        { ok: false, error: "Permiso insuficiente." },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const category = parseCategory(url.searchParams.get("category"));
    const cursor = url.searchParams.get("cursor") ?? undefined;
    const limitRaw = url.searchParams.get("limit");
    const limit = limitRaw ? Number.parseInt(limitRaw, 10) : undefined;

    const result = await listGrowthActividadFeed(ctx.tenantId, {
      category,
      cursor,
      ...(Number.isFinite(limit) ? { limit } : {}),
    });

    return NextResponse.json({
      ok: true,
      items: result.items,
      nextCursor: result.nextCursor,
    });
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
