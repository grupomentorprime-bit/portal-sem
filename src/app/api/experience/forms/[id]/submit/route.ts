import { NextResponse } from "next/server";
import { getActiveTenantId } from "@/core/identity";
import { submitExperienceForm } from "@/core/experience/forms";
import {
  getPublicExperienceForm,
  saveFormSubmission,
  seedExperienceForms,
} from "@/lib/experience/forms/repository";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
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

    const body = (await request.json()) as { data?: Record<string, unknown> };
    const data = body.data ?? {};

    const result = await submitExperienceForm({
      form,
      data,
      store: { save: saveFormSubmission },
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          errors: result.errors,
          error: result.message ?? form.errorMessage,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      ok: true,
      submissionId: result.submissionId,
      message: result.message,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
