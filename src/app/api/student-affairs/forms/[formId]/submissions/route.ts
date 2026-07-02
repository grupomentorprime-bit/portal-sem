import { NextResponse } from "next/server";
import { requireAuth } from "@/core/identity";
import {
  getFormSubmissionStats,
  listFormSubmissions,
} from "@/lib/experience/forms/repository";
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
      if (scope) {
        const { submissions } = await listFormSubmissions(ctx.tenantId, { formId, limit: 1000 });
        const filtered = filterSubmissionsForStudentAffairs(submissions, scope);
        const attending = filtered.filter((s) => s.data.attendance === "yes").length;
        const notAttending = filtered.filter((s) => s.data.attendance === "no").length;
        return NextResponse.json({
          ok: true,
          stats: {
            total: filtered.length,
            attending,
            notAttending,
            other: filtered.length - attending - notAttending,
            checkedIn: filtered.filter((s) => s.dayCheckIn?.present).length,
          },
        });
      }

      const { submissions } = await listFormSubmissions(ctx.tenantId, { formId, limit: 1000 });
      return NextResponse.json({
        ok: true,
        stats: {
          ...stats,
          checkedIn: submissions.filter((s) => s.dayCheckIn?.present).length,
        },
      });
    }

    const limit = Math.min(Number(url.searchParams.get("limit") ?? 500), 1000);
    const { submissions } = await listFormSubmissions(ctx.tenantId, { formId, limit });
    const filtered = filterSubmissionsForStudentAffairs(submissions, scope);

    return NextResponse.json({
      ok: true,
      submissions: filtered,
      total: filtered.length,
      canDeleteSubmissions: canDeleteStudentAffairsSubmission(ctx),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
