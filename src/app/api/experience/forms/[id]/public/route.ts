import { NextResponse } from "next/server";
import { getActiveTenantId } from "@/core/identity";
import { getPublicExperienceForm } from "@/lib/experience/forms/repository";
import { publicInternalError } from "@/core/security/public-error";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const tenant = await getActiveTenantId();

    if (!tenant) {
      return NextResponse.json({ ok: false, error: "Portal no configurado." }, { status: 503 });
    }

    const form = await getPublicExperienceForm(tenant, id);

    if (!form) {
      return NextResponse.json(
        { ok: false, error: "Formulario no disponible." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, form });
  } catch (error) {
    return publicInternalError("experience-form-public", error);
  }
}
