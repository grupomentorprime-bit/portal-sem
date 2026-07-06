import { NextResponse } from "next/server";
import { requireAuth } from "@/core/identity";
import { getFormSubmissionById } from "@/lib/experience/forms/repository";
import {
  assertSubmissionInStudentAffairsScope,
  canAccessFormInStudentAffairs,
  canAccessStudentAffairsPanel,
} from "@/lib/student-affairs/scope";
import { sendAbsenceJustificationRequestBulk } from "@/lib/student-affairs/send-justification-request";

interface RouteContext {
  params: Promise<{ formId: string }>;
}

export async function POST(request: Request, context: RouteContext) {
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

    const { formId } = await context.params;
    if (!canAccessFormInStudentAffairs(ctx, formId)) {
      return NextResponse.json({ ok: false, error: "Formulario no asignado." }, { status: 403 });
    }

    const body = (await request.json()) as {
      requests?: Array<{ submissionId?: string; email?: string }>;
    };

    const rawRequests = body.requests ?? [];
    if (!rawRequests.length) {
      return NextResponse.json(
        { ok: false, error: "No hay participantes seleccionados." },
        { status: 400 }
      );
    }

    const scopedRequests: Array<{ submissionId: string; email: string }> = [];

    for (const item of rawRequests) {
      const submissionId = String(item.submissionId ?? "").trim();
      const email = String(item.email ?? "").trim();
      if (!submissionId || !email) continue;

      const existing = await getFormSubmissionById(ctx.tenantId, submissionId);
      if (!existing || existing.formId !== formId) continue;
      if (!assertSubmissionInStudentAffairsScope(ctx, existing)) continue;

      scopedRequests.push({ submissionId, email });
    }

    if (!scopedRequests.length) {
      return NextResponse.json(
        { ok: false, error: "Ningún participante válido para enviar solicitud." },
        { status: 400 }
      );
    }

    const result = await sendAbsenceJustificationRequestBulk({
      tenant: ctx.tenantId,
      requests: scopedRequests,
      operatorName: ctx.user.displayName,
    });

    return NextResponse.json({
      ok: true,
      sent: result.sent,
      failed: result.failed,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
