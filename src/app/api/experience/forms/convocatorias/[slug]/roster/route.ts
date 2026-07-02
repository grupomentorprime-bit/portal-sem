import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import { authorizeApiWrite } from "@/lib/identity/api-guard";
import { getConvocatoriaBySlug } from "@/lib/admin/forms-center";
import {
  getConvocatoriaRoster,
  parseConvocatoriaRosterText,
  saveConvocatoriaRoster,
} from "@/lib/experience/forms/roster";
import { normalizeGenerationValue } from "@/lib/experience/forms/generations";
import type { ConvocatoriaRosterStudent } from "@/types/convocatoria-roster";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const ctx = await requirePermission("experience.forms.read");
    if (ctx instanceof NextResponse) return ctx;

    const convocatoria = getConvocatoriaBySlug(slug);
    if (!convocatoria) {
      return NextResponse.json({ ok: false, error: "Convocatoria no encontrada." }, { status: 404 });
    }

    const roster = await getConvocatoriaRoster(ctx.tenantId, slug);
    return NextResponse.json({
      ok: true,
      roster: roster ?? {
        tenant: ctx.tenantId,
        convocatoriaSlug: slug,
        formId: convocatoria.formId,
        students: [],
        updatedAt: null,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const denied = await authorizeApiWrite("experience.forms.manage", {
      action: "convocatoria_roster.update",
      entity: "convocatoria_rosters",
      entityId: slug,
    });
    if (denied) return denied;

    const ctx = await requirePermission("experience.forms.manage");
    if (ctx instanceof NextResponse) return ctx;

    const convocatoria = getConvocatoriaBySlug(slug);
    if (!convocatoria) {
      return NextResponse.json({ ok: false, error: "Convocatoria no encontrada." }, { status: 404 });
    }

    const body = (await request.json()) as {
      students?: ConvocatoriaRosterStudent[];
      rawText?: string;
    };

    let students: ConvocatoriaRosterStudent[] = [];
    if (Array.isArray(body.students)) {
      students = body.students
        .map((student, index) => ({
          id: student.id?.trim() || `student-${index + 1}`,
          rut: student.rut?.trim() || undefined,
          fullName: student.fullName?.trim() ?? "",
          generation: normalizeGenerationValue(student.generation),
          phone: student.phone?.trim() || undefined,
        }))
        .filter((student) => student.fullName && student.generation);
    } else if (typeof body.rawText === "string") {
      students = parseConvocatoriaRosterText(body.rawText)
        .map((student) => ({
          ...student,
          generation: normalizeGenerationValue(student.generation),
        }))
        .filter((student) => student.fullName && student.generation);
    } else {
      return NextResponse.json(
        { ok: false, error: "Debe enviar students o rawText." },
        { status: 400 }
      );
    }

    const roster = await saveConvocatoriaRoster(
      ctx.tenantId,
      slug,
      convocatoria.formId,
      students
    );

    return NextResponse.json({ ok: true, roster });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
