import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import { salesRecordFollowUp } from "@/lib/growth/sales-ops";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const ctx = await requirePermission("growth.sales.operate");
    if (ctx instanceof NextResponse) return ctx;

    const { id } = await params;
    const body = (await request.json()) as {
      kind?: "note" | "contact";
      summary?: string;
    };

    if (body.kind !== "note" && body.kind !== "contact") {
      return NextResponse.json(
        { ok: false, error: "kind debe ser note o contact." },
        { status: 400 }
      );
    }

    const result = await salesRecordFollowUp({
      tenantId: ctx.tenantId,
      oportunidadId: id,
      actor: { userId: ctx.user._id },
      kind: body.kind,
      summary: body.summary ?? "",
    });

    if (!result.ok) {
      const status = result.reason === "not_found" ? 404 : 400;
      return NextResponse.json(
        {
          ok: false,
          reason: result.reason,
          error:
            result.reason === "missing_summary"
              ? "summary es obligatorio."
              : "Oportunidad no encontrada.",
        },
        { status }
      );
    }

    return NextResponse.json({
      ok: true,
      activityId: result.activity._id,
      kind: result.activity.kind,
      actorUserId: result.activity.actorUserId,
      eventId: result.activity.eventId,
      published: result.published,
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
