import "server-only";

import { normalizeGenerationValue } from "@/lib/experience/forms/generations";
import type { ConvocatoriaRosterStudent } from "@/types/convocatoria-roster";
import type { AuthContext, StudentAffairsScope } from "@/types/identity";
import type { ExperienceFormSubmission } from "@/types/experience-forms";
import { isStudentAffairsOperator } from "@/lib/admin/nav-access";

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

export function canManageStudentAffairsScope(
  ctx: AuthContext,
  roleCodes: string[] = []
): boolean {
  if (roleCodes.length > 0 && isStudentAffairsOperator(roleCodes)) return false;
  if (ctx.compatMode) return true;
  return (
    hasStudentAffairsFullAccess(ctx) ||
    ctx.permissions.includes("student-affairs.manage") ||
    ctx.permissions.includes("settings.team")
  );
}

/** Solo administradores del centro de formularios (p. ej. Director General). */
export function canDeleteStudentAffairsSubmission(
  ctx: AuthContext,
  roleCodes: string[] = []
): boolean {
  if (roleCodes.length > 0 && isStudentAffairsOperator(roleCodes)) return false;
  if (ctx.compatMode) return true;
  return ctx.permissions.includes("experience.forms.manage");
}

export function canReclassifyStudentAffairsGeneration(
  ctx: AuthContext,
  roleCodes: string[] = []
): boolean {
  if (roleCodes.length > 0 && isStudentAffairsOperator(roleCodes)) return false;
  if (ctx.compatMode) return true;
  return (
    ctx.permissions.includes("experience.forms.manage") ||
    ctx.permissions.includes("student-affairs.manage")
  );
}

/** Encargado de gestión: valida el informe de cierre en el sistema. */
export function canValidateStudentAffairsHandoff(
  ctx: AuthContext,
  roleCodes: string[] = []
): boolean {
  if (roleCodes.length > 0 && isStudentAffairsOperator(roleCodes)) return false;
  if (ctx.compatMode) return true;
  return (
    ctx.permissions.includes("experience.forms.manage") ||
    ctx.permissions.includes("student-affairs.manage")
  );
}

/** Encargado de calidad: único perfil que puede reabrir la jornada cerrada. */
export function canReopenStudentAffairsJornada(
  ctx: AuthContext,
  roleCodes: string[] = []
): boolean {
  if (roleCodes.length > 0 && isStudentAffairsOperator(roleCodes)) return false;
  if (ctx.compatMode) return true;
  return ctx.permissions.includes("experience.forms.manage");
}

export function isStudentAffairsOperatorProfile(roleCodes: string[]): boolean {
  return isStudentAffairsOperator(roleCodes);
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

export function assertRosterStudentInStudentAffairsScope(
  ctx: AuthContext,
  formId: string,
  student: ConvocatoriaRosterStudent
): boolean {
  if (!canAccessFormInStudentAffairs(ctx, formId)) return false;
  const scope = resolveStudentAffairsScope(ctx);
  if (!scope) return true;
  const code = normalizeGenerationValue(student.generation);
  if (!code) return false;
  return scope.generationCodes.includes(code);
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
