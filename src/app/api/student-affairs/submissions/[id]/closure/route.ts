import { NextResponse } from "next/server";
import { ObjectId, type Document, type UpdateFilter } from "mongodb";
import { requireAuth } from "@/core/identity";
import { getFormSubmissionById } from "@/lib/experience/forms/repository";
import { getDatabase } from "@/lib/mongodb";
import { resolveEffectiveRoleCodes } from "@/lib/identity/membership-role-codes";
import {
  assertSubmissionInStudentAffairsScope,
  canAccessStudentAffairsPanel,
} from "@/lib/student-affairs/scope";
import {
  assertCanManageSubmissionInFollowUp,
  assertSubmissionHasCompleteContactInfo,
} from "@/lib/student-affairs/follow-up-guards";
import { buildParticipantDropoutFields, validateDropoutNotes } from "@/lib/student-affairs/participant-closure";
import { PARTICIPANT_CLOSURE_REASONS } from "@/types/experience-forms";
import type { ExperienceFormSubmission, ParticipantClosureReason } from "@/types/experience-forms";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
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
      return NextResponse.json(
        { ok: false, error: "Sin permiso para gestionar asistencia." },
        { status: 403 }
      );
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

    const body = (await request.json()) as { reason?: ParticipantClosureReason; notes?: string };
    const reason = body.reason;
    if (!reason || !PARTICIPANT_CLOSURE_REASONS.includes(reason)) {
      return NextResponse.json({ ok: false, error: "Motivo de cierre inválido." }, { status: 400 });
    }

    const validatedNotes = validateDropoutNotes(body.notes ?? "");
    if (!validatedNotes.ok) {
      return NextResponse.json({ ok: false, error: validatedNotes.error }, { status: 400 });
    }

    if (existing.absenceReview?.closureReason === "dropout") {
      return NextResponse.json(
        { ok: false, error: "Este participante ya está marcado como desertor." },
        { status: 409 }
      );
    }

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return NextResponse.json({ ok: false, error: "Respuesta no encontrada." }, { status: 404 });
    }

    const db = await getDatabase();
    const result = await db.collection("experience_form_submissions").findOneAndUpdate(
      { _id: objectId, tenant: ctx.tenantId },
      {
        $set: buildParticipantDropoutFields({
          operatorName: ctx.user.displayName,
          notes: validatedNotes.normalized,
        }),
      } as unknown as UpdateFilter<Document>,
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ ok: false, error: "No se pudo cerrar el expediente." }, { status: 500 });
    }

    const doc = result as unknown as ExperienceFormSubmission & { _id: ObjectId };
    return NextResponse.json({
      ok: true,
      submission: { ...doc, _id: doc._id?.toString() },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
