import { NextResponse } from "next/server";
import { getActiveTenantId } from "@/core/identity";
import { submitExperienceForm } from "@/core/experience/forms";
import { normalizeFormSubmissionData } from "@/core/experience/forms/validation";
import { getConvocatoriaByFormId } from "@/lib/admin/forms-center";
import { getFormExperienceUncached } from "@/lib/cms/form-experience";
import {
  buildSelfRegisteredRosterStudent,
  findConvocatoriaRosterStudent,
  hasConvocatoriaSubmission,
  hasConvocatoriaSubmissionByEmail,
  upsertConvocatoriaRosterStudent,
} from "@/lib/experience/forms/roster";
import { normalizeGenerationValue } from "@/lib/experience/forms/generations";
import { normalizeChilePhone, formatChilePhoneDisplay } from "@/lib/experience/forms/phone-chile";
import {
  getPublicExperienceForm,
  saveFormSubmission,
} from "@/lib/experience/forms/repository";
import { sendConvocatoriaConfirmationEmail } from "@/lib/notifications/convocatoria-confirmation-email";
import { resolveConfirmationEmailCtaUrl } from "@/lib/notifications/resolve-confirmation-email-cta";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const tenant = await getActiveTenantId();

    if (!tenant) {
      return NextResponse.json({ ok: false, error: "Portal no configurado." }, { status: 503 });
    }

    const form = await getPublicExperienceForm(tenant, id);

    if (!form) {
      return NextResponse.json(
        { ok: false, error: "Formulario no disponible." },
        { status: 404 }
      );
    }

    const body = (await request.json()) as { data?: Record<string, unknown> };
    let data = body.data ?? {};
    delete data.justificationAttachmentFile;

    const convocatoria = getConvocatoriaByFormId(id);
    if (convocatoria) {
      const studentId = String(data.studentId ?? "").trim();
      const registrationMode = String(data.registrationMode ?? "").trim();

      if (!studentId || registrationMode === "manual") {
        const fullName = String(data.fullName ?? "").trim();
        const email = String(data.email ?? "").trim();
        const rut = String(data.rut ?? "").trim() || undefined;
        const phone = normalizeChilePhone(String(data.phone ?? "").trim()) ?? undefined;
        const generation = "other";

        if (!fullName) {
          return NextResponse.json(
            {
              ok: false,
              errors: { fullName: "Debe indicar su nombre completo." },
              error: "Complete su nombre para registrarse.",
            },
            { status: 422 }
          );
        }

        const rosterStudent = buildSelfRegisteredRosterStudent({ fullName, rut, phone });
        if (!rosterStudent) {
          return NextResponse.json(
            {
              ok: false,
              errors: { fullName: "Debe indicar su nombre completo." },
              error: "Complete su nombre para registrarse.",
            },
            { status: 422 }
          );
        }

        if (email && (await hasConvocatoriaSubmissionByEmail(tenant, id, email))) {
          return NextResponse.json(
            {
              ok: false,
              errors: { email: "Ya existe una respuesta registrada con este correo." },
              error: "Ya registraste una respuesta para esta convocatoria.",
            },
            { status: 422 }
          );
        }

        const alreadySubmitted = await hasConvocatoriaSubmission(tenant, id, rosterStudent.id);
        if (alreadySubmitted) {
          return NextResponse.json(
            {
              ok: false,
              errors: { fullName: "Ya registraste una respuesta para esta convocatoria." },
              error: "Ya existe una respuesta registrada con tu nombre.",
            },
            { status: 422 }
          );
        }

        data = {
          ...data,
          registrationMode: "manual",
          studentId: rosterStudent.id,
          rut: rosterStudent.rut ?? "",
          fullName: rosterStudent.fullName,
          program: generation,
          generation,
          phone: phone || rosterStudent.phone || "",
        };
      } else {
        const student = await findConvocatoriaRosterStudent(tenant, convocatoria.slug, studentId);
        if (!student) {
          return NextResponse.json(
            {
              ok: false,
              errors: { studentId: "El alumno seleccionado no está en el listado de la convocatoria." },
              error: "Participante no válido para esta convocatoria.",
            },
            { status: 422 }
          );
        }

        const alreadySubmitted = await hasConvocatoriaSubmission(tenant, id, studentId);
        if (alreadySubmitted) {
          return NextResponse.json(
            {
              ok: false,
              errors: { studentId: "Ya registraste una respuesta para esta convocatoria." },
              error: "Ya existe una respuesta registrada con tu nombre.",
            },
            { status: 422 }
          );
        }

        const submittedPhone =
          normalizeChilePhone(String(data.phone ?? "").trim()) ??
          String(data.phone ?? "").trim();

        const normalizedGeneration = normalizeGenerationValue(student.generation);

        data = {
          ...data,
          registrationMode: "roster",
          studentId: student.id,
          rut: student.rut ?? "",
          fullName: student.fullName,
          program: normalizedGeneration,
          generation: normalizedGeneration,
          phone:
            submittedPhone ||
            formatChilePhoneDisplay(student.phone ?? "") ||
            student.phone ||
            "",
        };
      }
    }

    data = normalizeFormSubmissionData(form, data);

    const result = await submitExperienceForm({
      form,
      data,
      store: { save: saveFormSubmission },
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          errors: result.errors,
          error: result.message ?? form.errorMessage,
        },
        { status: 422 }
      );
    }

    if (convocatoria && data.registrationMode === "manual") {
      const rosterStudent = buildSelfRegisteredRosterStudent({
        fullName: String(data.fullName ?? ""),
        rut: String(data.rut ?? "").trim() || undefined,
        phone: String(data.phone ?? "").trim() || undefined,
      });
      if (rosterStudent) {
        await upsertConvocatoriaRosterStudent(
          tenant,
          convocatoria.slug,
          id,
          rosterStudent
        );
      }
    }

    if (convocatoria) {
      const participantEmail = String(data.email ?? "").trim();
      const attendance =
        data.attendance === "yes" ? "yes" : data.attendance === "no" ? "no" : null;

      let confirmationEmail:
        | { sent: true; id?: string }
        | { sent: false; reason: string }
        | undefined;

      if (!participantEmail) {
        confirmationEmail = { sent: false, reason: "Correo del participante no indicado." };
        console.warn("[convocatoria] confirmation email skipped: missing participant email");
      } else if (!attendance) {
        confirmationEmail = { sent: false, reason: "Respuesta de asistencia no indicada." };
        console.warn("[convocatoria] confirmation email skipped: missing attendance");
      } else {
        let professorMessage: string | undefined;
        let confirmationEmailCtaUrl: string | undefined;
        let confirmationEmailCtaLabel: string | undefined;

        try {
          const experience = await getFormExperienceUncached(tenant, id, form.name);
          professorMessage =
            attendance === "yes"
              ? experience.formShell.attendanceYesMessage
              : experience.formShell.attendanceNoMessage;
          confirmationEmailCtaUrl = await resolveConfirmationEmailCtaUrl(
            tenant,
            experience.formShell
          );
          confirmationEmailCtaLabel = experience.formShell.confirmationEmailCtaLabel;
        } catch (experienceError) {
          console.error(
            "[convocatoria] failed to load form experience for email, using defaults",
            experienceError
          );
        }

        try {
          const emailResult = await sendConvocatoriaConfirmationEmail({
            to: participantEmail,
            participantName: String(data.fullName ?? "Participante"),
            attendance,
            convocatoria,
            phone: String(data.phone ?? ""),
            generation: String(data.generation ?? data.program ?? ""),
            professorMessage,
            confirmationEmailCtaUrl,
            confirmationEmailCtaLabel,
          });

          if (emailResult.ok) {
            confirmationEmail = { sent: true, id: emailResult.id };
            console.info("[convocatoria] confirmation email sent", {
              to: participantEmail,
              id: emailResult.id,
            });
          } else {
            confirmationEmail = { sent: false, reason: emailResult.error };
            console.warn("[convocatoria] confirmation email not sent:", emailResult.error);
          }
        } catch (emailError) {
          const reason =
            emailError instanceof Error ? emailError.message : "Error desconocido al enviar correo.";
          confirmationEmail = { sent: false, reason };
          console.error("[convocatoria] confirmation email failed", emailError);
        }
      }

      return NextResponse.json({
        ok: true,
        submissionId: result.submissionId,
        message: result.message,
        confirmationEmail,
      });
    }

    return NextResponse.json({
      ok: true,
      submissionId: result.submissionId,
      message: result.message,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
