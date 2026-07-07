import { NextResponse } from "next/server";
import { requireAuth } from "@/core/identity";
import { resolveEffectiveRoleCodes } from "@/lib/identity/membership-role-codes";
import { listExperienceForms } from "@/lib/experience/forms/repository";
import { filterFormsForStudentAffairsPanel } from "@/lib/student-affairs/forms";
import {
  canAccessStudentAffairsPanel,
  canManageStudentAffairsScope,
  resolveStudentAffairsScope,
} from "@/lib/student-affairs/scope";

export async function GET() {
  try {
    const ctx = await requireAuth();
    if (ctx instanceof NextResponse) return ctx;

    if (!canAccessStudentAffairsPanel(ctx)) {
      return NextResponse.json({ ok: false, error: "Acceso denegado." }, { status: 403 });
    }

    const scope = resolveStudentAffairsScope(ctx);
    const allForms = filterFormsForStudentAffairsPanel(await listExperienceForms(ctx.tenantId));
    const forms = scope
      ? allForms.filter((form) => scope.formIds.includes(form._id))
      : allForms;
    const roleCodes = await resolveEffectiveRoleCodes(ctx);

    return NextResponse.json({
      ok: true,
      scope,
      canManageScope: canManageStudentAffairsScope(ctx, roleCodes),
      forms: forms.map((form) => ({
        id: form._id,
        name: form.name,
        description: form.description ?? "",
        active: form.active,
        visible: form.visible,
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
