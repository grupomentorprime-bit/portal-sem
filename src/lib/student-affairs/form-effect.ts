import { SEM_TENANT_ID } from "@/core/tenant/constants";
import { semConvocatoriaByFormId } from "@/lib/portal/sem-forms";
import {
  registerFormEffect,
  type FormEffectAfterInput,
  type FormEffectAfterResult,
  type FormEffectBeforeResult,
  type FormEffectInput,
} from "@/nelzuri";
import type { ConvocatoriaRegistrationAttendance } from "@/lib/experience/forms/roster";

function halt(status: number, body: unknown): FormEffectBeforeResult {
  return { halt: { status, body } };
}

function alreadyRegistered(field: string, attendance: ConvocatoriaRegistrationAttendance): FormEffectBeforeResult {
  return halt(422, {
    ok: false,
    alreadyRegistered: true,
    attendance,
    errors: { [field]: "Ya registraste una respuesta para esta convocatoria." },
    error: "Ya registraste una respuesta para esta convocatoria.",
  });
}

function matchesConvocatoria(form: { _id: string }, tenant: string): boolean {
  return tenant === SEM_TENANT_ID && Boolean(semConvocatoriaByFormId(form._id));
}

async function prepareConvocatoria(input: FormEffectInput): Promise<FormEffectBeforeResult | void> {
  const convocatoria = semConvocatoriaByFormId(input.formId);
  if (!convocatoria || input.tenant !== SEM_TENANT_ID) return;

  const [{ 
    buildSelfRegisteredRosterStudent,
    CONVOCATORIA_EXCLUSION_PUBLIC_MESSAGE,
    findConvocatoriaRegistrationByEmail,
    findConvocatoriaRegistrationByStudentId,
    findConvocatoriaRosterStudent,
    findConvocatoriaRosterStudentByIdentity,
    findExcludedConvocatoriaStudent,
  }, { normalizeGenerationValue }, { normalizeChilePhone, formatChilePhoneDisplay }] = await Promise.all([
    import("@/lib/experience/forms/roster"),
    import("@/lib/experience/forms/generations"),
    import("@/lib/experience/forms/phone-chile"),
  ]);

  const { tenant, formId } = input;
  let data = input.data;
  const studentId = String(data.studentId ?? "").trim();
  const registrationMode = String(data.registrationMode ?? "").trim();

  if (!studentId || registrationMode === "manual") {
    const fullName = String(data.fullName ?? "").trim();
    const email = String(data.email ?? "").trim();
    const rut = String(data.rut ?? "").trim() || undefined;
    const phone = normalizeChilePhone(String(data.phone ?? "").trim()) ?? undefined;

    if (!fullName) {
      return halt(422, {
        ok: false,
        errors: { fullName: "Debe indicar su nombre completo." },
        error: "Complete su nombre para registrarse.",
      });
    }

    const excluded = await findExcludedConvocatoriaStudent(tenant, convocatoria.slug, {
      fullName,
      rut,
      studentId,
    });
    if (excluded) {
      return halt(422, {
        ok: false,
        errors: { fullName: CONVOCATORIA_EXCLUSION_PUBLIC_MESSAGE },
        error: CONVOCATORIA_EXCLUSION_PUBLIC_MESSAGE,
      });
    }

    const rosterMatch = await findConvocatoriaRosterStudentByIdentity(tenant, convocatoria.slug, {
      fullName,
      rut,
    });
    const rosterGeneration = rosterMatch ? normalizeGenerationValue(rosterMatch.generation) : "";
    const useRosterMatch = rosterMatch && rosterGeneration !== "other";

    if (useRosterMatch) {
      const byStudent = await findConvocatoriaRegistrationByStudentId(tenant, formId, rosterMatch.id);
      if (byStudent.registered) return alreadyRegistered("fullName", byStudent.attendance);

      if (email) {
        const byEmail = await findConvocatoriaRegistrationByEmail(tenant, formId, email);
        if (byEmail.registered) return alreadyRegistered("email", byEmail.attendance);
      }

      const submittedPhone =
        phone || normalizeChilePhone(String(data.phone ?? "").trim()) || String(data.phone ?? "").trim();

      data = {
        ...data,
        registrationMode: "roster",
        studentId: rosterMatch.id,
        rut: rosterMatch.rut ?? rut ?? "",
        fullName: rosterMatch.fullName,
        program: rosterGeneration,
        generation: rosterGeneration,
        email: email || rosterMatch.email?.trim() || "",
        phone: submittedPhone || formatChilePhoneDisplay(rosterMatch.phone ?? "") || rosterMatch.phone || "",
      };
    } else {
      const generation = "other";
      const rosterStudent = buildSelfRegisteredRosterStudent({ fullName, rut, phone });
      if (!rosterStudent) {
        return halt(422, {
          ok: false,
          errors: { fullName: "Debe indicar su nombre completo." },
          error: "Complete su nombre para registrarse.",
        });
      }

      if (email) {
        const byEmail = await findConvocatoriaRegistrationByEmail(tenant, formId, email);
        if (byEmail.registered) return alreadyRegistered("email", byEmail.attendance);
      }

      const byStudent = await findConvocatoriaRegistrationByStudentId(tenant, formId, rosterStudent.id);
      if (byStudent.registered) return alreadyRegistered("fullName", byStudent.attendance);

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
    const excludedById = await findExcludedConvocatoriaStudent(tenant, convocatoria.slug, { studentId });
    if (excludedById) {
      return halt(422, {
        ok: false,
        errors: { studentId: CONVOCATORIA_EXCLUSION_PUBLIC_MESSAGE },
        error: CONVOCATORIA_EXCLUSION_PUBLIC_MESSAGE,
      });
    }

    const student = await findConvocatoriaRosterStudent(tenant, convocatoria.slug, studentId);
    if (!student) {
      return halt(422, {
        ok: false,
        errors: { studentId: "El alumno seleccionado no está en el listado de la convocatoria." },
        error: "Participante no válido para esta convocatoria.",
      });
    }

    const byStudent = await findConvocatoriaRegistrationByStudentId(tenant, formId, studentId);
    if (byStudent.registered) return alreadyRegistered("studentId", byStudent.attendance);

    const submittedPhone =
      normalizeChilePhone(String(data.phone ?? "").trim()) ?? String(data.phone ?? "").trim();
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
      phone: submittedPhone || formatChilePhoneDisplay(student.phone ?? "") || student.phone || "",
    };
  }

  return { data };
}

async function confirmConvocatoria(input: FormEffectAfterInput): Promise<FormEffectAfterResult | void> {
  const convocatoria = semConvocatoriaByFormId(input.formId);
  if (!convocatoria || input.tenant !== SEM_TENANT_ID) return;

  const { data, tenant, formId, form, submissionId } = input;
  if (data.registrationMode === "manual") {
    const { buildSelfRegisteredRosterStudent, upsertConvocatoriaRosterStudent } = await import(
      "@/lib/experience/forms/roster"
    );
    const rosterStudent = buildSelfRegisteredRosterStudent({
      fullName: String(data.fullName ?? ""),
      rut: String(data.rut ?? "").trim() || undefined,
      phone: String(data.phone ?? "").trim() || undefined,
    });
    if (rosterStudent) {
      const upserted = await upsertConvocatoriaRosterStudent(tenant, convocatoria.slug, formId, rosterStudent);
      void upserted;
    }
  }

  const participantEmail = String(data.email ?? "").trim();
  const attendance = data.attendance === "yes" ? "yes" : data.attendance === "no" ? "no" : null;
  let confirmationEmail: { sent: true; id?: string } | { sent: false; reason: string } | undefined;

  if (!participantEmail) {
    confirmationEmail = { sent: false, reason: "Correo del participante no indicado." };
    console.warn("[convocatoria] confirmation email skipped: missing participant email");
  } else if (!attendance) {
    confirmationEmail = { sent: false, reason: "Respuesta de asistencia no indicada." };
    console.warn("[convocatoria] confirmation email skipped: missing attendance");
  } else {
    const [{ getFormExperienceUncached }, { sendConvocatoriaConfirmationEmail }, { resolveConfirmationEmailCta }] =
      await Promise.all([
        import("@/lib/cms/form-experience"),
        import("@/lib/notifications/convocatoria-confirmation-email"),
        import("@/lib/notifications/resolve-confirmation-email-cta"),
      ]);

    let professorMessage: string | undefined;
    let confirmationEmailCtaUrl: string | undefined;
    let confirmationEmailCtaLabel: string | undefined;
    let confirmationEmailAttachment: { filename: string; content: Buffer } | undefined;
    let eventWhen: string | undefined;

    try {
      const experience = await getFormExperienceUncached(tenant, formId, form.name);
      professorMessage =
        attendance === "yes" ? experience.formShell.attendanceYesMessage : experience.formShell.attendanceNoMessage;
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
      console.error("[convocatoria] failed to load form experience for email, using defaults", experienceError);
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
        console.info("[convocatoria] confirmation email sent", { to: participantEmail, id: emailResult.id });
      } else {
        confirmationEmail = { sent: false, reason: emailResult.error };
        console.warn("[convocatoria] confirmation email not sent:", emailResult.error);
      }
    } catch (emailError) {
      const reason = emailError instanceof Error ? emailError.message : "Error desconocido al enviar correo.";
      confirmationEmail = { sent: false, reason };
      console.error("[convocatoria] confirmation email failed", emailError);
    }
  }

  return {
    body: {
      ok: true,
      submissionId,
      message: input.message,
      confirmationEmail,
    },
  };
}

export function registerSemFormEffect(): void {
  registerFormEffect({
    id: "sem-convocatoria",
    spaceId: SEM_TENANT_ID,
    matches: matchesConvocatoria,
    beforePhase: "prepare",
    beforeSave: prepareConvocatoria,
    afterSave: confirmConvocatoria,
  });
}
