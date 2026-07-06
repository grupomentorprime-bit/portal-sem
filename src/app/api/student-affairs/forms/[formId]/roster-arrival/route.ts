import { NextResponse } from "next/server";
import { requireAuth } from "@/core/identity";
import { getConvocatoriaByFormId } from "@/lib/admin/forms-center";
import { getExperienceFormById } from "@/lib/experience/forms/repository";
import { findConvocatoriaRosterStudent } from "@/lib/experience/forms/roster";
import {
  sendParticipantCheckInEmail,
} from "@/lib/notifications/convocatoria-follow-up-email";
import {
  registerRosterStudentOnSite,
  type RosterOnSiteAction,
} from "@/lib/student-affairs/roster-on-site";
import {
  assertRosterStudentInStudentAffairsScope,
  canAccessFormInStudentAffairs,
  canAccessStudentAffairsPanel,
} from "@/lib/student-affairs/scope";
import { assertOnSiteOperationsOpen } from "@/lib/student-affairs/operations-state";

interface RouteContext {
  params: Promise<{ formId: string }>;
}

const ACTIONS: RosterOnSiteAction[] = ["check-in", "mark-absent"];

function isRosterOnSiteAction(value: unknown): value is RosterOnSiteAction {
  return typeof value === "string" && ACTIONS.includes(value as RosterOnSiteAction);
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

    const convocatoria = getConvocatoriaByFormId(formId);
    if (!convocatoria) {
      return NextResponse.json(
        { ok: false, error: "Esta convocatoria no tiene nómina oficial." },
        { status: 422 }
      );
    }

    const form = await getExperienceFormById(ctx.tenantId, formId);
    if (!form) {
      return NextResponse.json({ ok: false, error: "Formulario no encontrado." }, { status: 404 });
    }

    const body = (await request.json()) as {
      studentId?: string;
      action?: RosterOnSiteAction;
      notes?: string;
      notifyParticipant?: boolean;
    };

    const studentId = String(body.studentId ?? "").trim();
    if (!studentId) {
      return NextResponse.json({ ok: false, error: "Participante no indicado." }, { status: 400 });
    }

    if (!isRosterOnSiteAction(body.action)) {
      return NextResponse.json({ ok: false, error: "Acción inválida." }, { status: 400 });
    }

    if (body.action === "check-in") {
      const gate = await assertOnSiteOperationsOpen(ctx.tenantId, formId);
      if (!gate.ok) {
        return NextResponse.json({ ok: false, error: gate.error }, { status: 409 });
      }
    }

    const student = await findConvocatoriaRosterStudent(
      ctx.tenantId,
      convocatoria.slug,
      studentId
    );
    if (!student) {
      return NextResponse.json(
        { ok: false, error: "El participante no está en la nómina de esta convocatoria." },
        { status: 404 }
      );
    }

    if (!assertRosterStudentInStudentAffairsScope(ctx, formId, student)) {
      return NextResponse.json(
        { ok: false, error: "Participante fuera de su alcance." },
        { status: 403 }
      );
    }

    const result = await registerRosterStudentOnSite({
      tenant: ctx.tenantId,
      formId,
      convocatoriaSlug: convocatoria.slug,
      destination: form.destination,
      studentId,
      action: body.action,
      operatorName: ctx.user.displayName,
      notes: body.notes,
    });

    if (!result.ok) {
      const messages: Record<typeof result.reason, string> = {
        "not-found": "El participante no está en la nómina.",
        "already-submitted": "Ya existe una respuesta registrada para este participante.",
        "invalid-action": "Acción inválida.",
      };
      const status = result.reason === "already-submitted" ? 409 : 422;
      return NextResponse.json({ ok: false, error: messages[result.reason] }, { status });
    }

    const submission = result.submission;
    const notifyParticipant = body.notifyParticipant !== false;
    const participantEmail = String(submission.data.email ?? "").trim();
    const participantName = String(
      submission.data.name ?? submission.data.fullName ?? "Participante"
    );

    let emailResult:
      | { sent: true; id?: string }
      | { sent: false; reason: string }
      | undefined;

    if (notifyParticipant && participantEmail && body.action === "check-in") {
      try {
        const emailResponse = await sendParticipantCheckInEmail({
          to: participantEmail,
          participantName,
          convocatoria,
        });

        emailResult = emailResponse.ok
          ? { sent: true, id: emailResponse.id }
          : { sent: false, reason: emailResponse.error };
      } catch (emailError) {
        emailResult = {
          sent: false,
          reason: emailError instanceof Error ? emailError.message : "Error al enviar correo.",
        };
      }
    } else if (notifyParticipant && body.action === "check-in" && !participantEmail) {
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
