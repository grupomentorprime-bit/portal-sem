import { NextResponse } from "next/server";
import { requireAuth } from "@/core/identity";
import { sendAbsenceJustificationRequest } from "@/lib/student-affairs/send-justification-request";
import {
  assertSubmissionInStudentAffairsScope,
  canAccessStudentAffairsPanel,
} from "@/lib/student-affairs/scope";
import { getFormSubmissionById } from "@/lib/experience/forms/repository";

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

    const body = (await request.json()) as { email?: string };
    const email = String(body.email ?? existing.data.email ?? "").trim();
    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Debe indicar un correo para enviar la solicitud." },
        { status: 400 }
      );
    }

    const result = await sendAbsenceJustificationRequest({
      tenant: ctx.tenantId,
      submissionId: id,
      email,
      operatorName: ctx.user.displayName,
    });

    if (!result.ok) {
      const status =
        result.reason === "invalid-email"
          ? 400
          : result.reason === "not-eligible"
            ? 422
            : result.reason === "email-failed"
              ? 502
              : 404;
      return NextResponse.json({ ok: false, error: result.error }, { status });
    }

    return NextResponse.json({
      ok: true,
      submission: result.submission,
      email: result.email,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
