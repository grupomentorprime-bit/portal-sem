import { CUMPLE_FORM_ID, CUMPLE_TENANT_ID } from "@/sites/cumple/site";
import {
  registerFormEffect,
  type FormEffectAfterInput,
  type FormEffectAfterResult,
} from "@/nelzuri";

function matchesCumple(form: { _id: string }, tenant: string): boolean {
  return tenant === CUMPLE_TENANT_ID && form._id === CUMPLE_FORM_ID;
}

async function attachReport(input: FormEffectAfterInput): Promise<FormEffectAfterResult | void> {
  if (!matchesCumple(input.form, input.tenant) || !input.submissionId) return;
  try {
    const { reportPathForSubmission } = await import("@/lib/cumple/informe");
    const reportPath = await reportPathForSubmission(input.tenant, input.submissionId);
    return reportPath ? { extras: { reportPath } } : {};
  } catch (error) {
    console.error(
      "[Cumple] el diagnóstico quedó guardado, pero no se pudo entregar el informe",
      error instanceof Error ? error.message : error
    );
    return {};
  }
}

export function registerCumpleFormEffect(): void {
  registerFormEffect({
    id: "cumple-informe",
    spaceId: CUMPLE_TENANT_ID,
    matches: matchesCumple,
    afterSave: attachReport,
  });
}
