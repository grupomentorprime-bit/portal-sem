import { NextResponse } from "next/server";
import { requireAuth } from "@/core/identity";
import { getConvocatoriaByFormId } from "@/lib/admin/forms-center";
import { getExperienceFormById } from "@/lib/experience/forms/repository";
import { findConvocatoriaRosterStudent } from "@/lib/experience/forms/roster";
import {
  registerRosterStudentOnSite,
} from "@/lib/student-affairs/roster-on-site";
import {
  recordRosterStudentOutreach,
  updateRosterStudentContactFields,
} from "@/lib/student-affairs/roster-outreach";
import type { AbsenceContactOutcome } from "@/types/experience-forms";
import { sendAbsenceJustificationRequest } from "@/lib/student-affairs/send-justification-request";
import { isOperatorManualContactChannel } from "@/lib/student-affairs/operator-contact-channels";
import {
  CONTACT_INFO_REQUIRED_MESSAGE,
  rosterStudentHasCompleteContactInfo,
} from "@/lib/student-affairs/contact-info";
import {
  assertRosterStudentInStudentAffairsScope,
  canAccessFormInStudentAffairs,
  canAccessStudentAffairsPanel,
} from "@/lib/student-affairs/scope";

interface RouteContext {
  params: Promise<{ formId: string; studentId: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const ctx = await requireAuth();
    if (ctx instanceof NextResponse) return ctx;

    if (!canAccessStudentAffairsPanel(ctx)) {
      return NextResponse.json({ ok: false, error: "Acceso denegado." }, { status: 403 });
    }

    const { formId, studentId } = await context.params;
    if (!canAccessFormInStudentAffairs(ctx, formId)) {
      return NextResponse.json({ ok: false, error: "Formulario no asignado." }, { status: 403 });
    }

    const convocatoria = getConvocatoriaByFormId(formId);
    if (!convocatoria) {
      return NextResponse.json({ ok: false, error: "Convocatoria no encontrada." }, { status: 404 });
    }

    const student = await findConvocatoriaRosterStudent(ctx.tenantId, convocatoria.slug, studentId);
    if (!student) {
      return NextResponse.json({ ok: false, error: "Participante no encontrado." }, { status: 404 });
    }

    if (!assertRosterStudentInStudentAffairsScope(ctx, formId, student)) {
      return NextResponse.json({ ok: false, error: "Participante fuera de su alcance." }, { status: 403 });
    }

    const body = (await request.json()) as { email?: string; phone?: string };
    const result = await updateRosterStudentContactFields({
      tenant: ctx.tenantId,
      formId,
      studentId,
      ...(body.email !== undefined ? { email: String(body.email) } : {}),
      ...(body.phone !== undefined ? { phone: String(body.phone) } : {}),
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: result.reason === "invalid-email" || result.reason === "invalid-input" ? 400 : 404 }
      );
    }

    return NextResponse.json({ ok: true, student: result.student });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const ctx = await requireAuth();
    if (ctx instanceof NextResponse) return ctx;

    if (!canAccessStudentAffairsPanel(ctx)) {
      return NextResponse.json({ ok: false, error: "Acceso denegado." }, { status: 403 });
    }

    const { formId, studentId } = await context.params;
    if (!canAccessFormInStudentAffairs(ctx, formId)) {
      return NextResponse.json({ ok: false, error: "Formulario no asignado." }, { status: 403 });
    }

    const convocatoria = getConvocatoriaByFormId(formId);
    if (!convocatoria) {
      return NextResponse.json({ ok: false, error: "Convocatoria no encontrada." }, { status: 404 });
    }

    const student = await findConvocatoriaRosterStudent(ctx.tenantId, convocatoria.slug, studentId);
    if (!student) {
      return NextResponse.json({ ok: false, error: "Participante no encontrado." }, { status: 404 });
    }

    if (!assertRosterStudentInStudentAffairsScope(ctx, formId, student)) {
      return NextResponse.json({ ok: false, error: "Participante fuera de su alcance." }, { status: 403 });
    }

    const body = (await request.json()) as {
      action?: "contact" | "send-justification";
      notes?: string;
      email?: string;
      startJustificationDeadline?: boolean;
      contactOutcome?: AbsenceContactOutcome;
      channel?: string;
    };

    if (body.action === "send-justification" || body.action === "contact" || !body.action) {
      if (!rosterStudentHasCompleteContactInfo(student)) {
        return NextResponse.json({ ok: false, error: CONTACT_INFO_REQUIRED_MESSAGE }, { status: 409 });
      }
    }

    if (body.action === "send-justification") {
      const email = String(body.email ?? student.email ?? "").trim();
      if (!email) {
        return NextResponse.json(
          { ok: false, error: "Debe indicar un correo para enviar la solicitud." },
          { status: 400 }
        );
      }

      if (body.email?.trim()) {
        const emailResult = await updateRosterStudentContactFields({
          tenant: ctx.tenantId,
          formId,
          studentId,
          email,
        });
        if (!emailResult.ok) {
          return NextResponse.json({ ok: false, error: emailResult.error }, { status: 400 });
        }
      }

      const form = await getExperienceFormById(ctx.tenantId, formId);
      if (!form) {
        return NextResponse.json({ ok: false, error: "Formulario no encontrado." }, { status: 404 });
      }

      const registered = await registerRosterStudentOnSite({
        tenant: ctx.tenantId,
        formId,
        convocatoriaSlug: convocatoria.slug,
        destination: form.destination,
        studentId,
        action: "mark-absent",
        operatorName: ctx.user.displayName,
      });

      if (!registered.ok) {
        const messages = {
          "not-found": "Participante no encontrado.",
          "already-submitted": "Ya existe un registro para este participante.",
          "invalid-action": "Acción inválida.",
        };
        return NextResponse.json(
          { ok: false, error: messages[registered.reason] },
          { status: registered.reason === "already-submitted" ? 409 : 422 }
        );
      }

      const submissionId = registered.submission._id ?? "";
      const sendResult = await sendAbsenceJustificationRequest({
        tenant: ctx.tenantId,
        submissionId,
        email,
        operatorName: ctx.user.displayName,
      });

      if (!sendResult.ok) {
        return NextResponse.json(
          { ok: false, error: sendResult.error, submission: registered.submission },
          { status: sendResult.reason === "email-failed" ? 502 : 422 }
        );
      }

      return NextResponse.json({
        ok: true,
        student: null,
        submission: sendResult.submission,
        email: sendResult.email,
      });
    }

    const result = await recordRosterStudentOutreach({
      tenant: ctx.tenantId,
      formId,
      studentId,
      channel: isOperatorManualContactChannel(body.channel) ? body.channel : "phone",
      operatorName: ctx.user.displayName,
      notes: String(body.notes ?? ""),
      phone: student.phone,
      startJustificationDeadline: body.startJustificationDeadline !== false,
      contactOutcome: body.contactOutcome,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 422 });
    }

    return NextResponse.json({ ok: true, student: result.student });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
