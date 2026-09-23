import { NextResponse } from "next/server";
import { requirePlatformOperator } from "@/core/identity";
import {
  DeletePlatformSpaceError,
  deletePlatformSpace,
} from "@/lib/platform/delete-space";
import {
  SetPlatformSpaceStatusError,
  setPlatformSpaceStatus,
} from "@/lib/platform/space-status";
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

/**
 * Activar, desactivar, suspender o archivar un Espacio.
 * Deny-by-default vía requirePlatformOperator.
 */
export async function PATCH(request: Request, context: RouteContext) {
  const ctx = await requirePlatformOperator();
  if (ctx instanceof NextResponse) return ctx;

  try {
    const { tenantId } = await context.params;
    const decoded = decodeURIComponent(tenantId);
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const status = typeof body.status === "string" ? body.status : "";

    const result = await setPlatformSpaceStatus(
      decoded,
      status,
      ctx.user._id
    );

    return NextResponse.json({
      ok: true,
      message: "Estado actualizado",
      space: result,
    });
  } catch (error) {
    if (error instanceof SetPlatformSpaceStatusError) {
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code },
        { status: error.status }
      );
    }
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

/**
 * Eliminar Espacio (irreversible). No aplica a SEM ni ADL.
 * Deny-by-default vía requirePlatformOperator.
 */
export async function DELETE(request: Request, context: RouteContext) {
  const ctx = await requirePlatformOperator();
  if (ctx instanceof NextResponse) return ctx;

  try {
    const { tenantId } = await context.params;
    const decoded = decodeURIComponent(tenantId);
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const confirmSlug =
      typeof body.confirmSlug === "string" ? body.confirmSlug : "";

    const result = await deletePlatformSpace(
      decoded,
      confirmSlug,
      ctx.user._id
    );

    return NextResponse.json({
      ok: true,
      message: "Espacio eliminado",
      space: result,
    });
  } catch (error) {
    if (error instanceof DeletePlatformSpaceError) {
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code },
        { status: error.status }
      );
    }
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
