import { NextResponse } from "next/server";
import { requireCongressOperate } from "@/app/api/congress/guard";
import { applyChargeChange } from "@/core/congress/charge";
import {
  appendCongressAudit,
  getCongressRegistration,
  updateCongressRegistration,
} from "@/lib/congress/repository";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireCongressOperate();
    if (ctx instanceof NextResponse) return ctx;

    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as {
      action?: string;
      reason?: string;
    } | null;

    if (body?.action !== "exempt" && body?.action !== "restore") {
      return NextResponse.json({ ok: false, error: "Acción inválida." }, { status: 400 });
    }

    const current = await getCongressRegistration(ctx.tenantId, id);
    if (!current) {
      return NextResponse.json({ ok: false, error: "Inscripción no encontrada." }, { status: 404 });
    }

    const result = applyChargeChange({
      chargeAmountClp: current.chargeAmountClp,
      allocatedPaidClp: current.allocatedPaidClp,
      chargeHistory: current.chargeHistory ?? [],
      action: body.action,
      reason: body.reason,
      nowIso: new Date().toISOString(),
      actorUserId: ctx.user._id,
    });

    if (!result.ok) {
      const messages = {
        reason_required: "Se requiere motivo.",
        has_allocations: "Anule los pagos imputados antes de marcar exento.",
        not_exempt: "Solo se puede restaurar un aporte previamente exento.",
        already_charged: "La inscripción ya tiene cargo.",
      } as const;
      return NextResponse.json(
        { ok: false, error: messages[result.error] },
        { status: 400 }
      );
    }

    if (result.idempotent) {
      return NextResponse.json({
        ok: true,
        registration: current,
        idempotent: true,
      });
    }

    const updated = await updateCongressRegistration(
      ctx.tenantId,
      id,
      {
        chargeAmountClp: result.chargeAmountClp,
        chargeHistory: result.chargeHistory,
      },
      current.version
    );
    if (!updated) {
      return NextResponse.json(
        { ok: false, error: "Conflicto de versión; reintente." },
        { status: 409 }
      );
    }

    await appendCongressAudit({
      tenantId: ctx.tenantId,
      actorUserId: ctx.user._id,
      action:
        body.action === "exempt"
          ? "registration.charge.exempt"
          : "registration.charge.restore",
      entity: "congress_registration",
      entityId: id,
      metadata: { reason: String(body.reason ?? "").trim() },
    });

    return NextResponse.json({ ok: true, registration: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Error interno." }, { status: 500 });
  }
}
