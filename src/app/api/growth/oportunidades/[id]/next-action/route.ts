import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import {
  salesClearNextAction,
  salesSetNextAction,
} from "@/lib/growth/sales-ops";
import type { GrowthNextActionKind } from "@/core/growth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const ctx = await requirePermission("growth.sales.operate");
    if (ctx instanceof NextResponse) return ctx;

    const { id } = await params;
    const body = (await request.json()) as {
      summary?: string;
      dueAt?: string;
      kind?: GrowthNextActionKind;
      assigneeUserId?: string;
    };

    const result = await salesSetNextAction({
      tenantId: ctx.tenantId,
      oportunidadId: id,
      actor: { userId: ctx.user._id },
      summary: body.summary ?? "",
      dueAt: body.dueAt,
      kind: body.kind,
      assigneeUserId: body.assigneeUserId,
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
      nextAction: result.oportunidad.nextAction,
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

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const ctx = await requirePermission("growth.sales.operate");
    if (ctx instanceof NextResponse) return ctx;

    const { id } = await params;
    const result = await salesClearNextAction({
      tenantId: ctx.tenantId,
      oportunidadId: id,
      actor: { userId: ctx.user._id },
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, reason: "not_found", error: "Oportunidad no encontrada." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      nextAction: null,
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
