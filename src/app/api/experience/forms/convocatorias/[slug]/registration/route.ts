import { NextResponse } from "next/server";
import { getActiveTenantId } from "@/core/identity";
import { getConvocatoriaBySlug } from "@/lib/admin/forms-center";
import {
  findConvocatoriaRegistrationByStudentId,
  findConvocatoriaRosterStudent,
} from "@/lib/experience/forms/roster";
import { publicInternalError } from "@/core/security/public-error";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const tenant = await getActiveTenantId();
    if (!tenant) {
      return NextResponse.json({ ok: false, error: "Portal no configurado." }, { status: 503 });
    }

    const convocatoria = getConvocatoriaBySlug(slug);
    if (!convocatoria) {
      return NextResponse.json({ ok: false, error: "Convocatoria no encontrada." }, { status: 404 });
    }

    const studentId = new URL(request.url).searchParams.get("studentId")?.trim() ?? "";
    if (!studentId || studentId.length > 160) {
      return NextResponse.json({ ok: false, error: "Participante no indicado." }, { status: 422 });
    }

    const student = await findConvocatoriaRosterStudent(tenant, slug, studentId);
    if (!student) {
      return NextResponse.json({ ok: true, registered: false, attendance: null });
    }

    const registration = await findConvocatoriaRegistrationByStudentId(
      tenant,
      convocatoria.formId,
      studentId
    );
    return NextResponse.json({
      ok: true,
      registered: registration.registered,
      attendance: registration.attendance,
    });
  } catch (error) {
    return publicInternalError("convocatoria-registration-lookup", error);
  }
}
