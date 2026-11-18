import { NextResponse } from "next/server";
import { requireCongressOperate } from "@/app/api/congress/guard";
import {
  assertLodgingNeedAllowed,
  isActiveLodgingAssignment,
} from "@/core/congress/lodging-status";
import type { CongressAttendanceDays, CongressLodgingNeed } from "@/core/congress/types";
import {
  appendCongressAudit,
  getCongressRegistration,
  listCongressAssignments,
  updateCongressRegistration,
} from "@/lib/congress/repository";

function parseExpectedDays(raw: unknown): CongressAttendanceDays | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const toFlag = (v: unknown): boolean | null => {
    if (v === true) return true;
    if (v === false) return false;
    return null;
  };
  return { saturday: toFlag(obj.saturday), sunday: toFlag(obj.sunday) };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireCongressOperate();
    if (ctx instanceof NextResponse) return ctx;

    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) {
      return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
    }

    const current = await getCongressRegistration(ctx.tenantId, id);
    if (!current) {
      return NextResponse.json({ ok: false, error: "Inscripción no encontrada." }, { status: 404 });
    }

    const patch: Partial<typeof current> = {};

    const expectedDays = parseExpectedDays(body.expectedDays);
    if (expectedDays) patch.expectedDays = expectedDays;

    if (
      body.lodgingNeed === "unknown" ||
      body.lodgingNeed === "none" ||
      body.lodgingNeed === "requested"
    ) {
      const lodgingNeed = body.lodgingNeed as CongressLodgingNeed;
      const assignments = (await listCongressAssignments(ctx.tenantId)).filter(
        (a) => a.registrationId === id
      );
      const hasActive = assignments.some((a) => isActiveLodgingAssignment(a));
      const allowed = assertLodgingNeedAllowed({ lodgingNeed, hasActiveAssignment: hasActive });
      if (!allowed.ok) {
        return NextResponse.json(
          {
            ok: false,
            error: "No se puede marcar «No requiere» con una asignación de alojamiento activa.",
          },
          { status: 400 }
        );
      }
      patch.lodgingNeed = lodgingNeed;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ ok: false, error: "Sin cambios." }, { status: 400 });
    }

    const updated = await updateCongressRegistration(
      ctx.tenantId,
      id,
      patch,
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
      action: "registration.patch",
      entity: "congress_registration",
      entityId: id,
      metadata: patch,
    });

    return NextResponse.json({ ok: true, registration: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Error interno." }, { status: 500 });
  }
}
