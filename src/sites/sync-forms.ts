import type {
  ExperienceFormCreate,
  ExperienceFormDefinition,
  ExperienceFormUpdate,
} from "@/types/experience-forms";
import type { CodedSiteFormDeclaration } from "@/sites/types";
import { CODED_FORM_DESTINATIONS } from "@/sites/types";

function codedFormBody(
  form: CodedSiteFormDeclaration
): Omit<ExperienceFormCreate, "_id" | "tenant"> {
  return {
    name: form.name,
    description: form.description,
    successMessage: form.successMessage,
    errorMessage: form.errorMessage,
    destination: form.destination,
    postSubmit: { type: "message", message: form.successMessage },
    fields: form.fields,
    active: true,
    visible: false,
    private: true,
    archived: false,
    managedBy: "coded-site",
  };
}

function codedFormAlreadyStored(
  existing: ExperienceFormDefinition,
  update: Omit<ExperienceFormCreate, "_id" | "tenant">
): boolean {
  return (
    existing.name === update.name &&
    existing.description === update.description &&
    existing.successMessage === update.successMessage &&
    existing.errorMessage === update.errorMessage &&
    existing.destination === update.destination &&
    existing.postSubmit.type === "message" &&
    existing.postSubmit.message === update.successMessage &&
    JSON.stringify(existing.fields) === JSON.stringify(update.fields) &&
    existing.active === true &&
    existing.visible === false &&
    existing.private === true &&
    existing.archived !== true &&
    existing.managedBy === "coded-site"
  );
}

export async function syncCodedSiteForms(
  tenantId: string,
  forms: CodedSiteFormDeclaration[],
  deps: {
    list: (tenant: string) => Promise<ExperienceFormDefinition[]>;
    create: (data: ExperienceFormCreate) => Promise<ExperienceFormDefinition>;
    update: (
      tenant: string,
      id: string,
      update: ExperienceFormUpdate
    ) => Promise<ExperienceFormDefinition | null>;
  }
): Promise<{ upserted: string[]; archived: string[] }> {
  for (const form of forms) {
    if (!(CODED_FORM_DESTINATIONS as readonly string[]).includes(form.destination)) {
      throw new Error(`Destino de formulario no permitido: ${form.destination}`);
    }
  }

  const existing = await deps.list(tenantId);
  const byId = new Map(existing.map((form) => [form._id, form]));
  const declaredIds = new Set(forms.map((form) => form._id));
  const upserted: string[] = [];
  const archived: string[] = [];

  for (const form of forms) {
    const payload = codedFormBody(form);
    const current = byId.get(form._id);
    if (current && codedFormAlreadyStored(current, payload)) continue;
    if (current) {
      await deps.update(tenantId, form._id, payload);
    } else {
      await deps.create({
        _id: form._id,
        tenant: tenantId,
        ...payload,
      });
    }
    upserted.push(form._id);
  }

  for (const form of existing) {
    if (form.managedBy !== "coded-site" || declaredIds.has(form._id)) continue;
    if (form.archived === true && form.active === false) continue;
    await deps.update(tenantId, form._id, { archived: true, active: false });
    archived.push(form._id);
  }

  return { upserted, archived };
}
