import { NextResponse } from "next/server";
import { requireAuth } from "@/core/identity";
import { getConvocatoriaByFormId } from "@/lib/admin/forms-center";
import {
  getFormSubmissionStats,
  listFormSubmissions,
} from "@/lib/experience/forms/repository";
import { getConvocatoriaRoster } from "@/lib/experience/forms/roster";
import {
  buildCohortRosterStats,
  sumCohortRosterStats,
} from "@/lib/student-affairs/cohort-stats";
import { countAbsenceCategories } from "@/lib/student-affairs/absence-categories";
import {
  filterRosterStudentsForStudentAffairs,
  findRosterStudentsWithoutSubmission,
} from "@/lib/student-affairs/roster-pending";
import {
  canAccessFormInStudentAffairs,
  canAccessStudentAffairsPanel,
  canDeleteStudentAffairsSubmission,
  filterSubmissionsForStudentAffairs,
  resolveStudentAffairsScope,
} from "@/lib/student-affairs/scope";

interface RouteContext {
  params: Promise<{ formId: string }>;
}

function statsWithAbsenceBreakdown(
  submissions: Awaited<ReturnType<typeof listFormSubmissions>>["submissions"],
  base: Record<string, number>
) {
  const absence = countAbsenceCategories(submissions);
  return {
    ...base,
    notAttending: absence.total,
    absencePendingEmail: absence.pendingEmail,
    absenceUnjustified: absence.unjustified,
    absenceAwaitingJustification: absence.awaitingJustification,
    absencePendingReview: absence.pendingReview,
    absenceApproved: absence.approved,
  };
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const ctx = await requireAuth();
    if (ctx instanceof NextResponse) return ctx;

    if (!canAccessStudentAffairsPanel(ctx)) {
      return NextResponse.json({ ok: false, error: "Acceso denegado." }, { status: 403 });
    }

    const { formId } = await context.params;
    if (!canAccessFormInStudentAffairs(ctx, formId)) {
      return NextResponse.json({ ok: false, error: "Formulario no asignado." }, { status: 403 });
    }

    const url = new URL(request.url);
    const statsOnly = url.searchParams.get("stats") === "true";
    const scope = resolveStudentAffairsScope(ctx);

    if (statsOnly) {
      const stats = await getFormSubmissionStats(ctx.tenantId, formId);
      const convocatoria = getConvocatoriaByFormId(formId);
      const roster = convocatoria
        ? await getConvocatoriaRoster(ctx.tenantId, convocatoria.slug)
        : null;
      const rosterStudents = roster?.students ?? [];

      if (scope) {
        const { submissions } = await listFormSubmissions(ctx.tenantId, { formId, limit: 1000 });
        const filtered = filterSubmissionsForStudentAffairs(submissions, scope);
        const scopedRoster = filterRosterStudentsForStudentAffairs(rosterStudents, scope);
        const rosterPending = findRosterStudentsWithoutSubmission(scopedRoster, filtered);
        const attending = filtered.filter((s) => s.data.attendance === "yes").length;
        const notAttending = filtered.filter((s) => s.data.attendance === "no").length;
        const cohortStats = buildCohortRosterStats(filtered, scopedRoster);
        const cohortTotals = sumCohortRosterStats(cohortStats);
        return NextResponse.json({
          ok: true,
          stats: statsWithAbsenceBreakdown(filtered, {
            total: filtered.length,
            attending,
            notAttending,
            other: filtered.length - attending - notAttending,
            checkedIn: filtered.filter((s) => s.dayCheckIn?.present).length,
            rosterPending: rosterPending.length,
          }),
          cohortStats,
          cohortTotals,
          hasRoster: scopedRoster.length > 0,
          rosterPending,
        });
      }

      const { submissions } = await listFormSubmissions(ctx.tenantId, { formId, limit: 1000 });
      const rosterPending = findRosterStudentsWithoutSubmission(rosterStudents, submissions);
      const cohortStats = buildCohortRosterStats(submissions, rosterStudents);
      const cohortTotals = sumCohortRosterStats(cohortStats);
      return NextResponse.json({
        ok: true,
        stats: statsWithAbsenceBreakdown(submissions, {
          total: stats.total,
          attending: stats.attending,
          notAttending: stats.notAttending,
          other: stats.other,
          checkedIn: submissions.filter((s) => s.dayCheckIn?.present).length,
          rosterPending: rosterPending.length,
        }),
        cohortStats,
        cohortTotals,
        hasRoster: rosterStudents.length > 0,
        rosterPending,
      });
    }

    const limit = Math.min(Number(url.searchParams.get("limit") ?? 500), 1000);
    const { submissions } = await listFormSubmissions(ctx.tenantId, { formId, limit });
    const filtered = filterSubmissionsForStudentAffairs(submissions, scope);
    const convocatoria = getConvocatoriaByFormId(formId);
    const roster = convocatoria
      ? await getConvocatoriaRoster(ctx.tenantId, convocatoria.slug)
      : null;
    const rosterStudents = roster?.students ?? [];
    const scopedRoster = filterRosterStudentsForStudentAffairs(rosterStudents, scope);
    const rosterPending = findRosterStudentsWithoutSubmission(scopedRoster, filtered);

    return NextResponse.json({
      ok: true,
      submissions: filtered,
      total: filtered.length,
      canDeleteSubmissions: canDeleteStudentAffairsSubmission(ctx),
      hasRoster: scopedRoster.length > 0,
      rosterPending,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
