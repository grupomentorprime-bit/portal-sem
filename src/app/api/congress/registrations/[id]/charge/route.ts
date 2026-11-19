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
      waiveClp?: number;
    } | null;

    if (body?.action !== "exempt" && body?.action !== "restore" && body?.action !== "reduce") {
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
      waiveClp: body.waiveClp,
      nowIso: new Date().toISOString(),
      actorUserId: ctx.user._id,
    });

    if (!result.ok) {
      const messages = {
        reason_required: "Elija el motivo.",
        has_allocations: "Anule los pagos imputados antes de no cobrar el total.",
        not_exempt: "Solo se puede restaurar un aporte que ya fue ajustado.",
        already_charged: "La inscripción ya tiene el aporte completo.",
        waive_invalid: "Indique la parte que no se cobra.",
        waive_too_high: "La parte que no se cobra supera el aporte.",
        below_paid: "El aporte que queda no puede ser menor a lo ya pagado.",
        no_charge: "Esta ficha no tiene aporte que ajustar.",
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
          : body.action === "reduce"
            ? "registration.charge.reduce"
            : "registration.charge.restore",
      entity: "congress_registration",
      entityId: id,
      metadata: {
        reason: String(body.reason ?? "").trim(),
        waiveClp: body.waiveClp ?? null,
      },
    });

    return NextResponse.json({ ok: true, registration: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Error interno." }, { status: 500 });
  }
}
