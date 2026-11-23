import { IPN_CHILE_TENANT_ID } from "@/core/units/ipn-chile";
import {
  alreadyEnrolledMessage,
  CONGRESS_VARONES_FORM_ID,
  CONGRESS_VARONES_PROGRAM_PATH,
  enrolleeIdentity,
} from "@/lib/experience/forms/already-enrolled";
import {
  registerFormEffect,
  type FormEffectAfterInput,
  type FormEffectAfterResult,
  type FormEffectBeforeResult,
  type FormEffectInput,
} from "@/nelzuri";

function matchesCongress(form: { _id: string }, tenant: string): boolean {
  return tenant === IPN_CHILE_TENANT_ID && form._id === CONGRESS_VARONES_FORM_ID;
}

async function deliverCongressProgram(tenant: string, data: Record<string, unknown>): Promise<void> {
  const participantEmail = enrolleeIdentity(data).email;
  if (!participantEmail) return;

  const [{ sendCongressConfirmationEmail }, { resolveConfirmationEmailCta }] = await Promise.all([
    import("@/lib/notifications/congress-confirmation-email"),
    import("@/lib/notifications/resolve-confirmation-email-cta"),
  ]);

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

async function guardCongressDuplicate(input: FormEffectInput): Promise<FormEffectBeforeResult | void> {
  if (!matchesCongress(input.form, input.tenant)) return;
  const { data, tenant, form } = input;
  const [{ getCongressRegistration }, { isCongressRegistrationClaimable }, { findCongressEnrolleeMatch }] =
    await Promise.all([
      import("@/lib/congress/repository"),
      import("@/core/congress/claim"),
      import("@/lib/experience/forms/repository"),
    ]);

  const registrationId = String(data.registrationId ?? "").trim();
  if (registrationId) {
    const existingReg = await getCongressRegistration(tenant, registrationId);
    if (!existingReg || !isCongressRegistrationClaimable(existingReg)) {
      await deliverCongressProgram(tenant, data);
      return {
        halt: {
          status: 409,
          body: {
            ok: false,
            alreadyRegistered: true,
            error: alreadyEnrolledMessage("rut"),
          },
        },
      };
    }
  }

  const enrolled = await findCongressEnrolleeMatch(tenant, form._id, data);
  if (enrolled) {
    await deliverCongressProgram(tenant, data);
    return {
      halt: {
        status: 409,
        body: {
          ok: false,
          alreadyRegistered: true,
          match: enrolled,
          error: alreadyEnrolledMessage(enrolled),
        },
      },
    };
  }
}

async function finishCongress(input: FormEffectAfterInput): Promise<FormEffectAfterResult | void> {
  if (!matchesCongress(input.form, input.tenant)) return;
  const { data, tenant, submissionId } = input;
  let claimVerification:
    | { requestId: string; delivered: boolean; channel: "email" | "phone" | null }
    | undefined;

  const selectionRef = String(data.selectionRef ?? "").trim();
  if (selectionRef && submissionId) {
    try {
      const [{ openSelectionRef, selectionRefSecret }, { deliverAccreditedContactChallenge, fileCongressClaimRequestFromForm }] =
        await Promise.all([
          import("@/core/security/selection-ref"),
          import("@/lib/congress/claim-registration"),
        ]);
      const opened = openSelectionRef(selectionRef, selectionRefSecret(), Date.now());
      const filed = await fileCongressClaimRequestFromForm({
        tenantId: tenant,
        submissionId,
        opened: opened.ok
          ? {
              ok: true,
              kind: opened.subject.kind,
              tenantId: opened.subject.tenantId,
              subjectId: opened.subject.subjectId,
            }
          : { ok: false },
      });
      if (filed.ok) {
        const sent = await deliverAccreditedContactChallenge({
          tenantId: tenant,
          requestId: filed.requestId,
        });
        if (sent.ok) {
          claimVerification = {
            requestId: filed.requestId,
            delivered: sent.delivered,
            channel: sent.channel,
          };
        }
      }
    } catch {
      console.error("[congress] no se pudo archivar la solicitud de reclamo");
    }
  }

  await deliverCongressProgram(tenant, data);
  return claimVerification ? { extras: { claimVerification } } : {};
}

export function registerCongressFormEffect(): void {
  registerFormEffect({
    id: "congreso-varones",
    spaceId: IPN_CHILE_TENANT_ID,
    matches: matchesCongress,
    beforePhase: "guard",
    beforeSave: guardCongressDuplicate,
    afterSave: finishCongress,
  });
}
