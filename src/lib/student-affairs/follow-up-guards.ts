import "server-only";

import type { ExperienceFormSubmission } from "@/types/experience-forms";
import type { AuthContext } from "@/types/identity";
import {
  isSubmissionLockedForStudentAffairsOperator,
  submissionAttendedOnSite,
} from "@/lib/student-affairs/follow-up-access";
import {
  CONTACT_INFO_REQUIRED_MESSAGE,
  submissionHasCompleteContactInfo,
} from "@/lib/student-affairs/contact-info";
import { getStudentAffairsFormOperations } from "@/lib/student-affairs/operations-state";
import {
  canValidateStudentAffairsHandoff,
  isStudentAffairsOperatorProfile,
} from "@/lib/student-affairs/scope";

export async function assertCanManageSubmissionInFollowUp(input: {
  ctx: AuthContext;
  roleCodes: string[];
  submission: ExperienceFormSubmission;
}): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const operations = await getStudentAffairsFormOperations(
    input.ctx.tenantId,
    input.submission.formId
  );

  if (operations?.phase !== "follow-up") {
    return { ok: true };
  }

  if (canValidateStudentAffairsHandoff(input.ctx, input.roleCodes)) {
    return { ok: true };
  }

  if (
    isStudentAffairsOperatorProfile(input.roleCodes) &&
    isSubmissionLockedForStudentAffairsOperator(input.submission, operations)
  ) {
    return {
      ok: false,
      error:
        "El informe fue validado. Los participantes que asistieron a la jornada quedaron bloqueados para su perfil.",
      status: 409,
    };
  }

  return { ok: true };
}

export function assertSubmissionHasCompleteContactInfo(
  submission: ExperienceFormSubmission
): { ok: true } | { ok: false; error: string; status: number } {
  if (!submissionHasCompleteContactInfo(submission.data)) {
    return {
      ok: false,
      error: CONTACT_INFO_REQUIRED_MESSAGE,
      status: 409,
    };
  }
  return { ok: true };
}

export async function assertCanModifyOnSiteAttendance(input: {
  tenant: string;
  formId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { assertOnSiteOperationsOpen } = await import("@/lib/student-affairs/operations-state");
  return assertOnSiteOperationsOpen(input.tenant, input.formId);
}
