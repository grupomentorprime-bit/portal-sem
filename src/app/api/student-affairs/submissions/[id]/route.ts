import { NextResponse } from "next/server";
import { requireAuth } from "@/core/identity";
import { authorizeApiWrite } from "@/lib/identity/api-guard";
import {
  deleteFormSubmission,
  getFormSubmissionById,
} from "@/lib/experience/forms/repository";
import {
  assertSubmissionInStudentAffairsScope,
  canAccessStudentAffairsPanel,
  canDeleteStudentAffairsSubmission,
} from "@/lib/student-affairs/scope";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const denied = await authorizeApiWrite("experience.forms.manage", {
      action: "student_affairs_submission.delete",
      entity: "experience_form_submissions",
      entityId: id,
    });
    if (denied) return denied;

    const ctx = await requireAuth();
    if (ctx instanceof NextResponse) return ctx;

    if (!canAccessStudentAffairsPanel(ctx)) {
      return NextResponse.json({ ok: false, error: "Acceso denegado." }, { status: 403 });
    }

    if (!canDeleteStudentAffairsSubmission(ctx)) {
      return NextResponse.json(
        { ok: false, error: "Solo un administrador puede eliminar registros." },
        { status: 403 }
      );
    }

    const existing = await getFormSubmissionById(ctx.tenantId, id);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Respuesta no encontrada." }, { status: 404 });
    }

    if (!assertSubmissionInStudentAffairsScope(ctx, existing)) {
      return NextResponse.json({ ok: false, error: "Respuesta fuera de su alcance." }, { status: 403 });
    }

    const deleted = await deleteFormSubmission(ctx.tenantId, id);
    if (!deleted) {
      return NextResponse.json({ ok: false, error: "No se pudo eliminar la respuesta." }, { status: 500 });
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
