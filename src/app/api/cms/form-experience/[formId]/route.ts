import { NextResponse } from "next/server";
import {
  applyFormExperienceTemplateForForm,
  getFormExperienceUncached,
  seedFormExperience,
  updateFormExperience,
} from "@/lib/cms/form-experience";
import { getExperienceFormById } from "@/lib/experience/forms/repository";
import { authorizeApiWrite } from "@/lib/identity/api-guard";
import { getActiveTenantId } from "@/core/identity";
import type { ExperienceFormExperience, FormExperienceTemplateId } from "@/types/experience-form-experience";
import { FORM_EXPERIENCE_TEMPLATE_IDS } from "@/types/experience-form-experience";

interface RouteContext {
  params: Promise<{ formId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const tenant = await getActiveTenantId();
    if (!tenant) {
      return NextResponse.json({ ok: false, error: "Portal no configurado." }, { status: 503 });
    }

    const { formId } = await context.params;
    const form = await getExperienceFormById(tenant, formId);
    if (!form) {
      return NextResponse.json({ ok: false, error: "Formulario no encontrado." }, { status: 404 });
    }

    await seedFormExperience(tenant, formId, form.name);
    const experience = await getFormExperienceUncached(tenant, formId, form.name);
    return NextResponse.json({ ok: true, experience });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const denied = await authorizeApiWrite("experience.forms.manage", {
      action: "experience.forms.manage",
      entity: "experience_form_experience",
    });
    if (denied) return denied;

    const tenant = await getActiveTenantId();
    if (!tenant) {
      return NextResponse.json({ ok: false, error: "Portal no configurado." }, { status: 503 });
    }

    const { formId } = await context.params;
    const form = await getExperienceFormById(tenant, formId);
    if (!form) {
      return NextResponse.json({ ok: false, error: "Formulario no encontrado." }, { status: 404 });
    }

    const body = (await request.json()) as Partial<ExperienceFormExperience> & {
      publish?: boolean;
      saveDraft?: boolean;
      applyTemplate?: FormExperienceTemplateId;
    };

    if (body.applyTemplate) {
      if (!FORM_EXPERIENCE_TEMPLATE_IDS.includes(body.applyTemplate)) {
        return NextResponse.json({ ok: false, error: "Plantilla no válida." }, { status: 400 });
      }
      const experience = await applyFormExperienceTemplateForForm(
        tenant,
        formId,
        body.applyTemplate,
        form.name
      );
      return NextResponse.json({ ok: true, experience });
    }

    const experience = await updateFormExperience(tenant, formId, body, form.name);
    return NextResponse.json({ ok: true, experience });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
