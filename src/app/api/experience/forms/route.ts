import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import { authorizeApiWrite } from "@/lib/identity/api-guard";
import {
  createExperienceForm,
  listExperienceForms,
  restoreDefaultExperienceForm,
  seedExperienceForms,
} from "@/lib/experience/forms/repository";
import type { ExperienceFormCreate } from "@/types/experience-forms";

type CreateFormBody = ExperienceFormCreate & {
  seed?: boolean;
  restoreDefaultId?: string;
};

export async function GET() {
  try {
    const ctx = await requirePermission("experience.forms.read");
    if (ctx instanceof NextResponse) return ctx;

    const forms = await listExperienceForms(ctx.tenantId);

    return NextResponse.json({ ok: true, forms });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const denied = await authorizeApiWrite("experience.forms.manage", {
      action: "experience_form.create",
      entity: "experience_forms",
    });
    if (denied) return denied;

    const ctx = await requirePermission("experience.forms.manage");
    if (ctx instanceof NextResponse) return ctx;

    const body = (await request.json()) as CreateFormBody;

    if (body.seed) {
      const forms = await seedExperienceForms(ctx.tenantId);
      return NextResponse.json({ ok: true, forms });
    }

    if (body.restoreDefaultId?.trim()) {
      const form = await restoreDefaultExperienceForm(ctx.tenantId, body.restoreDefaultId.trim());
      if (!form) {
        return NextResponse.json(
          { ok: false, error: "No se pudo restaurar el formulario base." },
          { status: 400 }
        );
      }
      return NextResponse.json({ ok: true, form }, { status: 201 });
    }

    if (!body._id?.trim() || !body.name?.trim()) {
      return NextResponse.json(
        { ok: false, error: "ID y nombre son obligatorios." },
        { status: 400 }
      );
    }

    const form = await createExperienceForm({
      ...body,
      tenant: ctx.tenantId,
    });

    return NextResponse.json({ ok: true, form }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

/** Público: lista mínima para selects en admin sin auth completa — no expone campos */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
