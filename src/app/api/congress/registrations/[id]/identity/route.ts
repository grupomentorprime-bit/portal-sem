import { NextResponse } from "next/server";
import { requireCongressOperate } from "@/app/api/congress/guard";
import { attachRutToRegistration } from "@/core/congress/identity-attach";
import {
  appendCongressAudit,
  getCongressRegistration,
  listCongressRegistrations,
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
    const body = (await request.json().catch(() => null)) as { rut?: string } | null;
    const current = await getCongressRegistration(ctx.tenantId, id);
    if (!current) {
      return NextResponse.json({ ok: false, error: "Inscripción no encontrada." }, { status: 404 });
    }
    const existing = await listCongressRegistrations(ctx.tenantId);
    const now = new Date().toISOString();
    const result = attachRutToRegistration({
      registration: current,
      rut: String(body?.rut ?? ""),
      existing,
      now,
    });
    if (!result.ok) {
      const status = result.error === "duplicate_rut" ? 409 : 400;
      return NextResponse.json(
        { ok: false, error: result.error, duplicateId: result.duplicateId },
        { status }
      );
    }

    const updated = await updateCongressRegistration(
      ctx.tenantId,
      id,
      {
        identity: result.registration.identity,
        needsReview: result.registration.needsReview,
      },
      current.version
    );
    if (!updated) {
      return NextResponse.json({ ok: false, error: "Conflicto de versión." }, { status: 409 });
    }

    await appendCongressAudit({
      tenantId: ctx.tenantId,
      actorUserId: ctx.user._id,
      action: "registration.attach_rut",
      entity: "congress_registration",
      entityId: id,
      metadata: { rut: result.registration.identity.rut },
    });

    return NextResponse.json({ ok: true, registration: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Error interno." }, { status: 500 });
  }
}
