import { NextResponse } from "next/server";
import { getActiveTenantId } from "@/core/identity";
import {
  getPublicExperienceForm,
  seedExperienceForms,
} from "@/lib/experience/forms/repository";

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

    let form = await getPublicExperienceForm(tenant, id);

    if (!form) {
      await seedExperienceForms(tenant);
      form = await getPublicExperienceForm(tenant, id);
    }

    if (!form) {
      return NextResponse.json(
        { ok: false, error: "Formulario no disponible." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, form });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
