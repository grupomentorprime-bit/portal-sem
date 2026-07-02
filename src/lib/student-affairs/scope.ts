import "server-only";

import { normalizeGenerationValue } from "@/lib/experience/forms/generations";
import type { AuthContext, StudentAffairsScope } from "@/types/identity";
import type { ExperienceFormSubmission } from "@/types/experience-forms";

export function submissionGenerationCode(data: Record<string, unknown>): string {
  return normalizeGenerationValue(data.generation ?? data.program);
}

export function submissionMatchesGenerationScope(
  data: Record<string, unknown>,
  generationCodes: string[]
): boolean {
  if (!generationCodes.length) return false;
  const code = submissionGenerationCode(data);
  if (!code) return false;
  return generationCodes.includes(code);
}

export function hasStudentAffairsFullAccess(ctx: AuthContext): boolean {
  if (ctx.compatMode) return true;
  return (
    ctx.permissions.includes("experience.forms.manage") ||
    ctx.permissions.includes("student-affairs.manage")
  );
}

export function canAccessStudentAffairsPanel(ctx: AuthContext): boolean {
  if (ctx.compatMode) return true;
  return (
    hasStudentAffairsFullAccess(ctx) ||
    ctx.permissions.includes("student-affairs.read") ||
    ctx.permissions.includes("student-affairs.checkin")
  );
}

export function canManageStudentAffairsScope(ctx: AuthContext): boolean {
  if (ctx.compatMode) return true;
  return (
    hasStudentAffairsFullAccess(ctx) ||
    ctx.permissions.includes("student-affairs.manage") ||
    ctx.permissions.includes("settings.team")
  );
}

/** Solo administradores del centro de formularios (p. ej. Director General). */
export function canDeleteStudentAffairsSubmission(ctx: AuthContext): boolean {
  if (ctx.compatMode) return true;
  return ctx.permissions.includes("experience.forms.manage");
}

export function resolveStudentAffairsScope(ctx: AuthContext): StudentAffairsScope | null {
  if (hasStudentAffairsFullAccess(ctx)) return null;
  return ctx.membership?.studentAffairsScope ?? { formIds: [], generationCodes: [] };
}

export function canAccessFormInStudentAffairs(
  ctx: AuthContext,
  formId: string
): boolean {
  if (!canAccessStudentAffairsPanel(ctx)) return false;
  const scope = resolveStudentAffairsScope(ctx);
  if (!scope) return true;
  return scope.formIds.includes(formId);
}

export function filterSubmissionsForStudentAffairs(
  submissions: ExperienceFormSubmission[],
  scope: StudentAffairsScope | null
): ExperienceFormSubmission[] {
  if (!scope) return submissions;
  if (!scope.formIds.length || !scope.generationCodes.length) return [];

  return submissions.filter(
    (submission) =>
      scope.formIds.includes(submission.formId) &&
      submissionMatchesGenerationScope(submission.data, scope.generationCodes)
  );
}

export function assertSubmissionInStudentAffairsScope(
  ctx: AuthContext,
  submission: ExperienceFormSubmission
): boolean {
  if (!canAccessStudentAffairsPanel(ctx)) return false;
  const scope = resolveStudentAffairsScope(ctx);
  if (!scope) return true;
  return (
    scope.formIds.includes(submission.formId) &&
    submissionMatchesGenerationScope(submission.data, scope.generationCodes)
  );
}

export function normalizeStudentAffairsScope(
  input: Partial<StudentAffairsScope> | null | undefined
): StudentAffairsScope {
  const formIds = [...new Set((input?.formIds ?? []).map((id) => id.trim()).filter(Boolean))];
  const generationCodes = [
    ...new Set((input?.generationCodes ?? []).map((code) => normalizeGenerationValue(code)).filter(Boolean)),
  ];
  return { formIds, generationCodes };
}
