import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import { salesTransitionOpportunity } from "@/lib/growth/sales-ops";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const ctx = await requirePermission("growth.sales.operate");
    if (ctx instanceof NextResponse) return ctx;

    const { id } = await params;
    const body = (await request.json()) as {
      toState?: string;
      transitionId?: string;
      comment?: string;
      handoff?: {
        interesadoId?: string;
        delivered: boolean;
        externalId?: string;
        adapter?: string;
      };
    };

    if (!body.toState && !body.transitionId) {
      return NextResponse.json(
        { ok: false, error: "toState o transitionId es obligatorio." },
        { status: 400 }
      );
    }

    const result = await salesTransitionOpportunity({
      tenantId: ctx.tenantId,
      oportunidadId: id,
      actor: { userId: ctx.user._id },
      toState: body.toState,
      transitionId: body.transitionId,
      comment: body.comment,
      handoff: body.handoff,
    });

    if (!result.ok) {
      const status = result.reason === "not_found" ? 404 : 400;
      return NextResponse.json(
        {
          ok: false,
          reason: result.reason,
          error:
            result.error ??
            (result.reason === "not_found"
              ? "Oportunidad no encontrada."
              : "Transición no permitida."),
        },
        { status }
      );
    }

    return NextResponse.json({
      ok: true,
      oportunidadId: result.oportunidad._id,
      fromState: result.fromState,
      toState: result.toState,
      status: result.oportunidad.status,
      activityId: result.activity._id,
      actorUserId: result.activity.actorUserId,
      eventId: result.activity.eventId,
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
