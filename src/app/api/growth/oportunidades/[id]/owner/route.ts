import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import { salesAssignOwner } from "@/lib/growth/sales-ops";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const ctx = await requirePermission("growth.sales.operate");
    if (ctx instanceof NextResponse) return ctx;
    const { id } = await params;
    const body = (await request.json()) as { ownerUserId?: string | null };
    const ownerUserId =
      body.ownerUserId == null || body.ownerUserId === "" ? null : String(body.ownerUserId);
    const result = await salesAssignOwner({
      tenantId: ctx.tenantId,
      oportunidadId: id,
      actor: { userId: ctx.user._id },
      ownerUserId,
    });
    if (!result.ok) {
      const status = result.reason === "not_found" ? 404 : 400;
      return NextResponse.json(
        {
          ok: false,
          reason: result.reason,
          error:
            result.reason === "not_member"
              ? "El responsable debe ser un miembro de este Espacio."
              : "Oportunidad no encontrada.",
        },
        { status }
      );
    }
    return NextResponse.json({
      ok: true,
      ownerUserId: result.oportunidad.ownerUserId ?? null,
      activityId: result.activity?._id ?? null,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
