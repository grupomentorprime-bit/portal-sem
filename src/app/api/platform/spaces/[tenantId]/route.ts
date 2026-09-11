import { NextResponse } from "next/server";
import { requirePlatformOperator } from "@/core/identity";
import { getPlatformSpaceDetail } from "@/lib/platform/spaces";

interface RouteContext {
  params: Promise<{ tenantId: string }>;
}

/**
 * Ficha operativa de un Espacio. Aislada por tenantId.
 * Deny-by-default vía requirePlatformOperator.
 */
export async function GET(_request: Request, context: RouteContext) {
  const ctx = await requirePlatformOperator();
  if (ctx instanceof NextResponse) return ctx;

  try {
    const { tenantId } = await context.params;
    const space = await getPlatformSpaceDetail(decodeURIComponent(tenantId));
    if (!space) {
      return NextResponse.json(
        { ok: false, error: "Espacio no encontrado." },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, space });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
