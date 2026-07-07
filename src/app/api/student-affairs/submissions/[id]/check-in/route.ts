import { NextResponse } from "next/server";
import { requireAuth } from "@/core/identity";
import {
  getFormSubmissionById,
  updateFormSubmissionEventDayStatus,
} from "@/lib/experience/forms/repository";
import {
  assertSubmissionInStudentAffairsScope,
  canAccessStudentAffairsPanel,
} from "@/lib/student-affairs/scope";
import { assertOnSiteOperationsOpen } from "@/lib/student-affairs/operations-state";
import { assertCanManageSubmissionInFollowUp, assertSubmissionHasCompleteContactInfo } from "@/lib/student-affairs/follow-up-guards";
import { resolveEffectiveRoleCodes } from "@/lib/identity/membership-role-codes";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** @deprecated Usar PATCH /api/student-affairs/submissions/[id]/event-day */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const ctx = await requireAuth();
    if (ctx instanceof NextResponse) return ctx;

    if (!canAccessStudentAffairsPanel(ctx)) {
      return NextResponse.json({ ok: false, error: "Acceso denegado." }, { status: 403 });
    }

    if (
      !ctx.compatMode &&
      !ctx.permissions.includes("student-affairs.checkin") &&
      !ctx.permissions.includes("experience.forms.manage") &&
      !ctx.permissions.includes("student-affairs.manage")
    ) {
      return NextResponse.json({ ok: false, error: "Sin permiso para marcar asistencia." }, { status: 403 });
    }

    const { id } = await params;
    const existing = await getFormSubmissionById(ctx.tenantId, id);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Respuesta no encontrada." }, { status: 404 });
    }

    if (!assertSubmissionInStudentAffairsScope(ctx, existing)) {
      return NextResponse.json({ ok: false, error: "Respuesta fuera de su alcance." }, { status: 403 });
    }

    const roleCodes = await resolveEffectiveRoleCodes(ctx);
    const followUpGate = await assertCanManageSubmissionInFollowUp({
      ctx,
      roleCodes,
      submission: existing,
    });
    if (!followUpGate.ok) {
      return NextResponse.json({ ok: false, error: followUpGate.error }, { status: followUpGate.status });
    }

    const contactGate = assertSubmissionHasCompleteContactInfo(existing);
    if (!contactGate.ok) {
      return NextResponse.json({ ok: false, error: contactGate.error }, { status: contactGate.status });
    }

    const body = (await request.json()) as { present?: boolean; notes?: string };
    if (typeof body.present !== "boolean") {
      return NextResponse.json({ ok: false, error: "Indique si asistió (present)." }, { status: 400 });
    }

    const action = body.present ? "check-in" : "undo-check-in";
    const gate = await assertOnSiteOperationsOpen(ctx.tenantId, existing.formId);
    if (!gate.ok) {
      return NextResponse.json({ ok: false, error: gate.error }, { status: 409 });
    }
    const submission = await updateFormSubmissionEventDayStatus(
      ctx.tenantId,
      id,
      action,
      ctx.user.displayName,
      body.notes
    );

    if (!submission) {
      return NextResponse.json({ ok: false, error: "No se pudo actualizar el check-in." }, { status: 422 });
    }

    return NextResponse.json({ ok: true, submission });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
