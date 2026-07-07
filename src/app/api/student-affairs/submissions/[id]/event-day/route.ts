import { NextResponse } from "next/server";
import { requireAuth } from "@/core/identity";
import { getConvocatoriaByFormId } from "@/lib/admin/forms-center";
import {
  getFormSubmissionById,
  updateFormSubmissionEventDayStatus,
  type EventDayStatusAction,
} from "@/lib/experience/forms/repository";
import {
  sendParticipantArrivedEmail,
  sendParticipantCheckInEmail,
} from "@/lib/notifications/convocatoria-follow-up-email";
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

const ACTIONS: EventDayStatusAction[] = [
  "check-in",
  "undo-check-in",
  "mark-absent",
  "mark-arrived-from-absence",
];

function isEventDayAction(value: unknown): value is EventDayStatusAction {
  return typeof value === "string" && ACTIONS.includes(value as EventDayStatusAction);
}

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

    const body = (await request.json()) as {
      action?: EventDayStatusAction;
      notes?: string;
      notifyParticipant?: boolean;
    };

    if (!isEventDayAction(body.action)) {
      return NextResponse.json({ ok: false, error: "Acción inválida." }, { status: 400 });
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

    const onSiteOnlyActions = ["check-in", "undo-check-in", "mark-arrived-from-absence"] as const;
    if (onSiteOnlyActions.includes(body.action as (typeof onSiteOnlyActions)[number])) {
      const gate = await assertOnSiteOperationsOpen(ctx.tenantId, existing.formId);
      if (!gate.ok) {
        return NextResponse.json({ ok: false, error: gate.error }, { status: 409 });
      }
    }

    const submission = await updateFormSubmissionEventDayStatus(
      ctx.tenantId,
      id,
      body.action,
      ctx.user.displayName,
      body.notes
    );

    if (!submission) {
      return NextResponse.json(
        { ok: false, error: "No se pudo actualizar el estado para esta respuesta." },
        { status: 422 }
      );
    }

    const notifyParticipant = body.notifyParticipant !== false;
    const participantEmail = String(submission.data.email ?? "").trim();
    const participantName = String(
      submission.data.name ?? submission.data.fullName ?? "Participante"
    );
    const convocatoria = getConvocatoriaByFormId(submission.formId);

    let emailResult:
      | { sent: true; id?: string }
      | { sent: false; reason: string }
      | undefined;

    if (notifyParticipant && participantEmail && convocatoria) {
      try {
        let result:
          | { ok: true; id?: string }
          | { ok: false; error: string }
          | undefined;

        if (body.action === "mark-arrived-from-absence") {
          result = await sendParticipantArrivedEmail({
            to: participantEmail,
            participantName,
            convocatoria,
          });
        } else if (body.action === "check-in" && !existing.dayCheckIn?.checkedInAt) {
          result = await sendParticipantCheckInEmail({
            to: participantEmail,
            participantName,
            convocatoria,
          });
        }

        if (result) {
          emailResult = result.ok
            ? { sent: true, id: result.id }
            : { sent: false, reason: result.error };
        }
      } catch (emailError) {
        emailResult = {
          sent: false,
          reason: emailError instanceof Error ? emailError.message : "Error al enviar correo.",
        };
      }
    } else if (notifyParticipant && !participantEmail) {
      emailResult = { sent: false, reason: "Participante sin correo registrado." };
    }

    return NextResponse.json({ ok: true, submission, email: emailResult });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
