import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import {
  getFormSubmissionStats,
  listFormSubmissions,
} from "@/lib/experience/forms/repository";

export async function GET(request: Request) {
  try {
    const ctx = await requirePermission("experience.forms.read");
    if (ctx instanceof NextResponse) return ctx;

    const { searchParams } = new URL(request.url);
    const formId = searchParams.get("formId") ?? undefined;
    const statsOnly = searchParams.get("stats") === "true";
    const limit = Number(searchParams.get("limit") ?? "100");
    const skip = Number(searchParams.get("skip") ?? "0");

    if (statsOnly) {
      if (!formId) {
        return NextResponse.json(
          { ok: false, error: "formId es obligatorio para estadísticas." },
          { status: 400 }
        );
      }

      const stats = await getFormSubmissionStats(ctx.tenantId, formId);
      return NextResponse.json({ ok: true, stats });
    }

    const { submissions, total } = await listFormSubmissions(ctx.tenantId, {
      formId,
      limit: Number.isFinite(limit) ? limit : 100,
      skip: Number.isFinite(skip) ? skip : 0,
    });

    return NextResponse.json({ ok: true, submissions, total });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
