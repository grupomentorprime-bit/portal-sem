import { isSemTenant } from "@/core/tenant/is-sem";
import { SEM_TENANT_ID } from "@/core/tenant/constants";
import { semConvocatoriaByFormId } from "@/lib/portal/sem-forms";
import { SEM_CONTACT_PUBLISHED } from "@/lib/portal/sem-identity-v7";
import { registerPublicForm } from "@/nelzuri";
import type { ExperienceFormExperience } from "@/types/experience-form-experience";

function withholdUnvalidatedFormContact(experience: ExperienceFormExperience): ExperienceFormExperience {
  if (SEM_CONTACT_PUBLISHED) return experience;
  return {
    ...experience,
    footer: {
      ...experience.footer,
      contactEmail: "",
      contactPhone: "",
      whatsapp: "",
    },
    contact: {
      ...experience.contact,
      email: "",
      phone: "",
    },
  };
}

function matchesSemForm(_formId: string, tenantId: string): boolean {
  return isSemTenant(tenantId);
}

function resolveSemForm(formId: string) {
  const convocatoria = semConvocatoriaByFormId(formId);
  return {
    kind: convocatoria ? ("convocatoria" as const) : ("generic" as const),
    tone: "default" as const,
    showBrandHeader: true,
    convocatoriaSlug: convocatoria?.slug,
    decorate: withholdUnvalidatedFormContact,
  };
}

export function registerSemPublicForm(): void {
  registerPublicForm({
    id: "sem-formularios",
    spaceId: SEM_TENANT_ID,
    matches: matchesSemForm,
    resolve: resolveSemForm,
  });
}
