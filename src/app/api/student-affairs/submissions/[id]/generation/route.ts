import { NextResponse } from "next/server";
import { requireAuth } from "@/core/identity";
import { getConvocatoriaByFormId } from "@/lib/admin/forms-center";
import {
  getFormSubmissionById,
  updateFormSubmissionGeneration,
} from "@/lib/experience/forms/repository";
import { isKnownGeneration, normalizeGenerationValue } from "@/lib/experience/forms/generations";
import {
  getConvocatoriaRoster,
  upsertConvocatoriaRosterStudent,
} from "@/lib/experience/forms/roster";
import {
  assertSubmissionInStudentAffairsScope,
  canAccessStudentAffairsPanel,
  canReclassifyStudentAffairsGeneration,
} from "@/lib/student-affairs/scope";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function normalizeRut(value: string): string {
  return value.replace(/\./g, "").replace(/-/g, "").replace(/\s+/g, "").toLowerCase().trim();
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const ctx = await requireAuth();
    if (ctx instanceof NextResponse) return ctx;

    if (!canAccessStudentAffairsPanel(ctx)) {
      return NextResponse.json({ ok: false, error: "Acceso denegado." }, { status: 403 });
    }

    if (!canReclassifyStudentAffairsGeneration(ctx)) {
      return NextResponse.json(
        { ok: false, error: "Sin permiso para cambiar la generación." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existing = await getFormSubmissionById(ctx.tenantId, id);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Respuesta no encontrada." }, { status: 404 });
    }

    if (!assertSubmissionInStudentAffairsScope(ctx, existing)) {
      return NextResponse.json({ ok: false, error: "Respuesta fuera de su alcance." }, { status: 403 });
    }

    const body = (await request.json()) as { generation?: string };
    const generation = normalizeGenerationValue(body.generation);
    if (!generation || !isKnownGeneration(generation)) {
      return NextResponse.json({ ok: false, error: "Generación no válida." }, { status: 400 });
    }

    const submission = await updateFormSubmissionGeneration(ctx.tenantId, id, generation);
    if (!submission) {
      return NextResponse.json(
        { ok: false, error: "No se pudo actualizar la generación." },
        { status: 500 }
      );
    }

    const convocatoria = getConvocatoriaByFormId(existing.formId);
    const rut = String(existing.data.rut ?? "").trim();
    if (convocatoria && rut) {
      const roster = await getConvocatoriaRoster(ctx.tenantId, convocatoria.slug);
      const rosterStudent = roster?.students.find(
        (student) => student.rut && normalizeRut(student.rut) === normalizeRut(rut)
      );
      if (rosterStudent) {
        await upsertConvocatoriaRosterStudent(
          ctx.tenantId,
          convocatoria.slug,
          existing.formId,
          { ...rosterStudent, generation }
        );
      }
    }

    return NextResponse.json({ ok: true, submission });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
