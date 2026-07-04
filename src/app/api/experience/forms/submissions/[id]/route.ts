import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import { authorizeApiWrite } from "@/lib/identity/api-guard";
import {
  getFormSubmissionById,
  updateFormSubmissionAbsenceReview,
  deleteFormSubmission,
} from "@/lib/experience/forms/repository";
import { sendParticipantAbsenceReviewEmail } from "@/lib/notifications/convocatoria-follow-up-email";
import {
  ABSENCE_REVIEW_STATUSES,
  type AbsenceReviewStatus,
  type ExperienceFormAbsenceReview,
} from "@/types/experience-forms";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function isAbsenceReviewStatus(value: unknown): value is AbsenceReviewStatus {
  return typeof value === "string" && ABSENCE_REVIEW_STATUSES.includes(value as AbsenceReviewStatus);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const denied = await authorizeApiWrite("experience.forms.manage", {
      action: "experience_form_submission.update",
      entity: "experience_form_submissions",
      entityId: id,
    });
    if (denied) return denied;

    const ctx = await requirePermission("experience.forms.manage");
    if (ctx instanceof NextResponse) return ctx;

    const existing = await getFormSubmissionById(ctx.tenantId, id);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Respuesta no encontrada." }, { status: 404 });
    }

    const body = (await request.json()) as Partial<ExperienceFormAbsenceReview>;
    if (!isAbsenceReviewStatus(body.status)) {
      return NextResponse.json(
        { ok: false, error: "Estado de gestión inválido." },
        { status: 400 }
      );
    }

    if (body.status === "approved" && !body.evidenceReceived) {
      return NextResponse.json(
        {
          ok: false,
          error: "Para aceptar fuerza mayor debe confirmar que se recibió respaldo documental.",
        },
        { status: 400 }
      );
    }

    const submission = await updateFormSubmissionAbsenceReview(
      ctx.tenantId,
      id,
      {
        status: body.status,
        managementNotes: body.managementNotes?.trim() || undefined,
        evidenceReceived: Boolean(body.evidenceReceived),
        evidenceNotes: body.evidenceNotes?.trim() || undefined,
      },
      ctx.user.displayName
    );

    if (!submission) {
      return NextResponse.json({ ok: false, error: "Respuesta no encontrada." }, { status: 404 });
    }

    const participantEmail = String(submission.data.email ?? "").trim();
    let emailResult:
      | { sent: true; id?: string }
      | { sent: false; reason: string }
      | undefined;

    if (participantEmail) {
      try {
        const result = await sendParticipantAbsenceReviewEmail({
          to: participantEmail,
          participantName: String(
            submission.data.name ?? submission.data.fullName ?? "Participante"
          ),
          formId: submission.formId,
          status: body.status,
          managementNotes: body.managementNotes,
          evidenceReceived: Boolean(body.evidenceReceived),
          evidenceNotes: body.evidenceNotes,
        });
        emailResult = result.ok
          ? { sent: true, id: result.id }
          : { sent: false, reason: result.error };
      } catch (emailError) {
        emailResult = {
          sent: false,
          reason: emailError instanceof Error ? emailError.message : "Error al enviar correo.",
        };
      }
    } else {
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

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const denied = await authorizeApiWrite("experience.forms.manage", {
      action: "experience_form_submission.delete",
      entity: "experience_form_submissions",
      entityId: id,
    });
    if (denied) return denied;

    const ctx = await requirePermission("experience.forms.manage");
    if (ctx instanceof NextResponse) return ctx;

    const deleted = await deleteFormSubmission(ctx.tenantId, id);

    if (!deleted) {
      return NextResponse.json({ ok: false, error: "Respuesta no encontrada." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
