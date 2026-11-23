import { NextResponse } from "next/server";
import { getActiveTenantId } from "@/core/identity";
import { submitExperienceForm } from "@/core/experience/forms";
import { normalizeFormSubmissionData } from "@/core/experience/forms/validation";
import { publicInternalError } from "@/core/security/public-error";
import { ensureFormEffects } from "@/lib/desktop/register-form-effects";
import {
  ensureSpecializedCapabilities,
  publicFormSubmitAllowed,
} from "@/lib/desktop/register-specialized";
import { getDirectAccessibleExperienceForm, saveFormSubmission } from "@/lib/experience/forms/repository";
import { resolveFormEffect, type FormEffectBeforeResult } from "@/nelzuri";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    ensureSpecializedCapabilities();
    ensureFormEffects();
    const { id } = await params;
    const tenant = await getActiveTenantId();

    if (!tenant) {
      return NextResponse.json({ ok: false, error: "Portal no configurado." }, { status: 503 });
    }

    if (!publicFormSubmitAllowed(id, tenant)) {
      return NextResponse.json({ ok: false, error: "Formulario no disponible." }, { status: 404 });
    }

    const form = await getDirectAccessibleExperienceForm(tenant, id);

    if (!form) {
      return NextResponse.json({ ok: false, error: "Formulario no disponible." }, { status: 404 });
    }

    const body = (await request.json()) as { data?: Record<string, unknown> };
    let data = body.data ?? {};
    delete data.justificationAttachmentFile;

    const resolved = resolveFormEffect(form, tenant);
    if (resolved.status === "ambiguous" || (resolved.status === "one" && resolved.effect.spaceId !== tenant)) {
      return NextResponse.json({ ok: false, error: "No se pudo enviar el formulario." }, { status: 503 });
    }
    const effect = resolved.status === "one" ? resolved.effect : null;

    const applyBefore = (prepared: FormEffectBeforeResult | void) => {
      if (prepared?.halt) {
        return NextResponse.json(prepared.halt.body, { status: prepared.halt.status });
      }
      if (prepared?.data) data = prepared.data;
      return null;
    };

    if (effect?.beforeSave && effect.beforePhase === "prepare") {
      const halted = applyBefore(await effect.beforeSave({ tenant, form, formId: id, data }));
      if (halted) return halted;
    }

    data = normalizeFormSubmissionData(form, data);

    if (effect?.beforeSave && effect.beforePhase !== "prepare") {
      const halted = applyBefore(await effect.beforeSave({ tenant, form, formId: id, data }));
      if (halted) return halted;
    }

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

    if (effect?.afterSave) {
      const after = await effect.afterSave({
        tenant,
        form,
        formId: id,
        data,
        submissionId: result.submissionId,
        message: result.message,
      });
      if (after?.body !== undefined) return NextResponse.json(after.body);
      return NextResponse.json({
        ok: true,
        submissionId: result.submissionId,
        message: result.message,
        ...(after?.extras ?? {}),
      });
    }

    return NextResponse.json({
      ok: true,
      submissionId: result.submissionId,
      message: result.message,
    });
  } catch (error) {
    return publicInternalError("experience-form-submit", error);
  }
}
