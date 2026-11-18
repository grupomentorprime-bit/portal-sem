import { NextResponse } from "next/server";
import { getActiveTenantId } from "@/core/identity";
import { submitExperienceForm } from "@/core/experience/forms";
import { normalizeFormSubmissionData } from "@/core/experience/forms/validation";
import { getConvocatoriaByFormId } from "@/lib/admin/forms-center";
import { getFormExperienceUncached } from "@/lib/cms/form-experience";
import {
  buildSelfRegisteredRosterStudent,
  CONVOCATORIA_EXCLUSION_PUBLIC_MESSAGE,
  findConvocatoriaRegistrationByEmail,
  findConvocatoriaRegistrationByStudentId,
  findConvocatoriaRosterStudent,
  findConvocatoriaRosterStudentByIdentity,
  findExcludedConvocatoriaStudent,
  upsertConvocatoriaRosterStudent,
  type ConvocatoriaRegistrationAttendance,
} from "@/lib/experience/forms/roster";
import { normalizeGenerationValue } from "@/lib/experience/forms/generations";
import { publicInternalError } from "@/core/security/public-error";
import { normalizeChilePhone, formatChilePhoneDisplay } from "@/lib/experience/forms/phone-chile";
import {
  findCongressEnrolleeMatch,
  getDirectAccessibleExperienceForm,
  saveFormSubmission,
} from "@/lib/experience/forms/repository";
import { sendCongressConfirmationEmail } from "@/lib/notifications/congress-confirmation-email";
import { sendConvocatoriaConfirmationEmail } from "@/lib/notifications/convocatoria-confirmation-email";
import { updateRosterStudentContactFields } from "@/lib/student-affairs/roster-outreach";
import { resolveConfirmationEmailCta } from "@/lib/notifications/resolve-confirmation-email-cta";
import { reportPathForSubmission } from "@/lib/cumple/informe";
import { CUMPLE_FORM_ID } from "@/sites/cumple/site";
import {
  alreadyEnrolledMessage,
  CONGRESS_VARONES_FORM_ID,
  CONGRESS_VARONES_PROGRAM_PATH,
  enrolleeIdentity,
} from "@/lib/experience/forms/already-enrolled";
import { isCongressRegistrationClaimable } from "@/core/congress/claim";
import { claimCongressRegistrationFromForm } from "@/lib/congress/claim-registration";
import { getCongressRegistration } from "@/lib/congress/repository";
interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Envía el tríptico si hay correo. No interrumpe la inscripción si el envío falla. */
async function deliverCongressProgram(
  tenant: string,
  data: Record<string, unknown>
): Promise<void> {
  const participantEmail = enrolleeIdentity(data).email;
  if (!participantEmail) return;

  try {
    const resolvedCta = await resolveConfirmationEmailCta(tenant, {
      confirmationEmailCtaUrl: CONGRESS_VARONES_PROGRAM_PATH,
    });
    const emailResult = await sendCongressConfirmationEmail({
      tenantId: tenant,
      to: participantEmail,
      participantName: String(data.fullName ?? "").trim() || "Participante",
      programUrl: resolvedCta.url ?? CONGRESS_VARONES_PROGRAM_PATH,
      attachment: resolvedCta.attachment,
    });
    if (!emailResult.ok) {
      console.warn("[congreso] no se pudo enviar el programa:", emailResult.error);
    }
  } catch (emailError) {
    console.error("[congreso] falló el correo con el programa", emailError);
  }
}

function alreadyRegisteredResponse(field: string, attendance: ConvocatoriaRegistrationAttendance) {
  return NextResponse.json(
    {
      ok: false,
      alreadyRegistered: true,
      attendance,
      errors: { [field]: "Ya registraste una respuesta para esta convocatoria." },
      error: "Ya registraste una respuesta para esta convocatoria.",
    },
    { status: 422 }
  );
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const tenant = await getActiveTenantId();

    if (!tenant) {
      return NextResponse.json({ ok: false, error: "Portal no configurado." }, { status: 503 });
    }

    const form = await getDirectAccessibleExperienceForm(tenant, id);

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

        const excluded = await findExcludedConvocatoriaStudent(tenant, convocatoria.slug, {
          fullName,
          rut,
          studentId,
        });
        if (excluded) {
          return NextResponse.json(
            {
              ok: false,
              errors: { fullName: CONVOCATORIA_EXCLUSION_PUBLIC_MESSAGE },
              error: CONVOCATORIA_EXCLUSION_PUBLIC_MESSAGE,
            },
            { status: 422 }
          );
        }

        const rosterMatch = await findConvocatoriaRosterStudentByIdentity(
          tenant,
          convocatoria.slug,
          { fullName, rut }
        );
        const rosterGeneration = rosterMatch
          ? normalizeGenerationValue(rosterMatch.generation)
          : "";
        const useRosterMatch = rosterMatch && rosterGeneration !== "other";

        if (useRosterMatch) {
          const byStudent = await findConvocatoriaRegistrationByStudentId(tenant, id, rosterMatch.id);
          if (byStudent.registered) {
            return alreadyRegisteredResponse("fullName", byStudent.attendance);
          }

          if (email) {
            const byEmail = await findConvocatoriaRegistrationByEmail(tenant, id, email);
            if (byEmail.registered) {
              return alreadyRegisteredResponse("email", byEmail.attendance);
            }
          }

          const submittedPhone =
            phone ||
            normalizeChilePhone(String(data.phone ?? "").trim()) ||
            String(data.phone ?? "").trim();

          data = {
            ...data,
            registrationMode: "roster",
            studentId: rosterMatch.id,
            rut: rosterMatch.rut ?? rut ?? "",
            fullName: rosterMatch.fullName,
            program: rosterGeneration,
            generation: rosterGeneration,
            email: email || rosterMatch.email?.trim() || "",
            phone:
              submittedPhone ||
              formatChilePhoneDisplay(rosterMatch.phone ?? "") ||
              rosterMatch.phone ||
              "",
          };
        } else {
          const generation = "other";

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

          if (email) {
            const byEmail = await findConvocatoriaRegistrationByEmail(tenant, id, email);
            if (byEmail.registered) {
              return alreadyRegisteredResponse("email", byEmail.attendance);
            }
          }

          const byStudent = await findConvocatoriaRegistrationByStudentId(
            tenant,
            id,
            rosterStudent.id
          );
          if (byStudent.registered) {
            return alreadyRegisteredResponse("fullName", byStudent.attendance);
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
        }
      } else {
        const excludedById = await findExcludedConvocatoriaStudent(tenant, convocatoria.slug, {
          studentId,
        });
        if (excludedById) {
          return NextResponse.json(
            {
              ok: false,
              errors: { studentId: CONVOCATORIA_EXCLUSION_PUBLIC_MESSAGE },
              error: CONVOCATORIA_EXCLUSION_PUBLIC_MESSAGE,
            },
            { status: 422 }
          );
        }

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

        const byStudent = await findConvocatoriaRegistrationByStudentId(tenant, id, studentId);
        if (byStudent.registered) {
          return alreadyRegisteredResponse("studentId", byStudent.attendance);
        }

        const submittedPhone =
          normalizeChilePhone(String(data.phone ?? "").trim()) ??
          String(data.phone ?? "").trim();
        const submittedEmail = String(data.email ?? "").trim();

        const normalizedGeneration = normalizeGenerationValue(student.generation);

        data = {
          ...data,
          registrationMode: "roster",
          studentId: student.id,
          rut: student.rut ?? "",
          fullName: student.fullName,
          program: normalizedGeneration,
          generation: normalizedGeneration,
          email: submittedEmail || student.email?.trim() || "",
          phone:
            submittedPhone ||
            formatChilePhoneDisplay(student.phone ?? "") ||
            student.phone ||
            "",
        };
      }
    }

    data = normalizeFormSubmissionData(form, data);

    if (form._id === CONGRESS_VARONES_FORM_ID) {
      const registrationId = String(data.registrationId ?? "").trim();
      if (registrationId) {
        const existingReg = await getCongressRegistration(tenant, registrationId);
        if (!existingReg || !isCongressRegistrationClaimable(existingReg)) {
          await deliverCongressProgram(tenant, data);
          return NextResponse.json(
            {
              ok: false,
              alreadyRegistered: true,
              error: alreadyEnrolledMessage("rut"),
            },
            { status: 409 }
          );
        }
      }

      const enrolled = await findCongressEnrolleeMatch(tenant, form._id, data);
      if (enrolled) {
        await deliverCongressProgram(tenant, data);
        return NextResponse.json(
          {
            ok: false,
            alreadyRegistered: true,
            match: enrolled,
            error: alreadyEnrolledMessage(enrolled),
          },
          { status: 409 }
        );
      }
    }

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

    if (form._id === CONGRESS_VARONES_FORM_ID) {
      const registrationId = String(data.registrationId ?? "").trim();
      if (registrationId && result.submissionId) {
        const claimed = await claimCongressRegistrationFromForm({
          tenantId: tenant,
          registrationId,
          submissionId: result.submissionId,
          data,
        });
        if (!claimed.ok) {
          await deliverCongressProgram(tenant, data);
          return NextResponse.json(
            {
              ok: false,
              alreadyRegistered: true,
              error:
                claimed.error === "rut_conflict"
                  ? alreadyEnrolledMessage("rut")
                  : alreadyEnrolledMessage("rut"),
            },
            { status: 409 }
          );
        }
      }

      await deliverCongressProgram(tenant, data);
    }

    if (convocatoria && data.registrationMode === "manual") {
      const rosterStudent = buildSelfRegisteredRosterStudent({
        fullName: String(data.fullName ?? ""),
        rut: String(data.rut ?? "").trim() || undefined,
        phone: String(data.phone ?? "").trim() || undefined,
      });
      if (rosterStudent) {
        const upserted = await upsertConvocatoriaRosterStudent(
          tenant,
          convocatoria.slug,
          id,
          rosterStudent
        );
        // Excluidos ya se rechazan antes de guardar; aquí solo se evita reinsertarlos.
        void upserted;
      }
    }

    if (convocatoria && String(data.registrationMode ?? "") === "roster") {
      const rosterStudentId = String(data.studentId ?? "").trim();
      if (rosterStudentId) {
        try {
          const confirmedEmail = String(data.email ?? "").trim();
          const confirmedPhone = String(data.phone ?? "").trim();
          if (confirmedEmail || confirmedPhone) {
            await updateRosterStudentContactFields({
              tenant,
              formId: id,
              studentId: rosterStudentId,
              ...(confirmedEmail ? { email: confirmedEmail } : {}),
              ...(confirmedPhone ? { phone: confirmedPhone } : {}),
            });
          }
        } catch (contactError) {
          console.error(
            "[convocatoria] no se pudo guardar el correo o teléfono corregido",
            contactError
          );
        }
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
        let confirmationEmailAttachment:
          | { filename: string; content: Buffer }
          | undefined;
        let eventWhen: string | undefined;

        try {
          const experience = await getFormExperienceUncached(tenant, id, form.name);
          professorMessage =
            attendance === "yes"
              ? experience.formShell.attendanceYesMessage
              : experience.formShell.attendanceNoMessage;
          if (attendance === "yes") {
            const resolvedCta = await resolveConfirmationEmailCta(tenant, experience.formShell);
            confirmationEmailCtaUrl = resolvedCta.url;
            confirmationEmailAttachment = resolvedCta.attachment;
            confirmationEmailCtaLabel = experience.formShell.confirmationEmailCtaLabel;
          }
          const calendar = experience.infoCards.find(
            (card) => card.icon === "calendar" && card.visible !== false && card.value.trim()
          );
          const clock = experience.infoCards.find(
            (card) => card.icon === "clock" && card.visible !== false && card.value.trim()
          );
          const when = [calendar?.value.trim(), clock?.value.trim()].filter(Boolean).join(" · ");
          eventWhen = when || undefined;
        } catch (experienceError) {
          console.error(
            "[convocatoria] failed to load form experience for email, using defaults",
            experienceError
          );
        }

        try {
          const emailResult = await sendConvocatoriaConfirmationEmail({
            tenantId: tenant,
            to: participantEmail,
            participantName: String(data.fullName ?? "Participante"),
            attendance,
            convocatoria,
            phone: String(data.phone ?? ""),
            generation: String(data.generation ?? data.program ?? ""),
            professorMessage,
            confirmationEmailCtaUrl,
            confirmationEmailCtaLabel,
            confirmationEmailAttachment,
            eventWhen,
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

    let reportPath: string | null = null;
    if (form._id === CUMPLE_FORM_ID && result.submissionId) {
      try {
        reportPath = await reportPathForSubmission(tenant, result.submissionId);
      } catch (error) {
        console.error(
          "[Cumple] el diagnóstico quedó guardado, pero no se pudo entregar el informe",
          error instanceof Error ? error.message : error
        );
      }
    }

    return NextResponse.json({
      ok: true,
      submissionId: result.submissionId,
      message: result.message,
      ...(reportPath ? { reportPath } : {}),
    });
  } catch (error) {
    return publicInternalError("experience-form-submit", error);
  }
}
