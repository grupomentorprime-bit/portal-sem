import { NextResponse } from "next/server";
import { requireAuth } from "@/core/identity";
import {
  getFormSubmissionById,
  updateFormSubmissionAbsenceReview,
} from "@/lib/experience/forms/repository";
import {
  assertSubmissionInStudentAffairsScope,
  canAccessStudentAffairsPanel,
} from "@/lib/student-affairs/scope";
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
      return NextResponse.json({ ok: false, error: "Sin permiso para gestionar inasistencias." }, { status: 403 });
    }

    const { id } = await params;
    const existing = await getFormSubmissionById(ctx.tenantId, id);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Respuesta no encontrada." }, { status: 404 });
    }

    if (!assertSubmissionInStudentAffairsScope(ctx, existing)) {
      return NextResponse.json({ ok: false, error: "Respuesta fuera de su alcance." }, { status: 403 });
    }

    const body = (await request.json()) as Partial<ExperienceFormAbsenceReview>;
    if (!isAbsenceReviewStatus(body.status)) {
      return NextResponse.json({ ok: false, error: "Estado de gestión inválido." }, { status: 400 });
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

    return NextResponse.json({ ok: true, submission });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
