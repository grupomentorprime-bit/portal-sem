import { PortalBreadcrumb } from "@/components/portal/layout";
import { PortalExperienceForm } from "@/components/portal/experience/forms";
import { PortalConvocatoriaExperienceForm } from "@/components/portal/experience/forms/PortalConvocatoriaExperienceForm";
import { FormPublicExperience, FormUnavailableState } from "@/components/portal/forms";
import { getConvocatoriaByFormId, getActiveConvocatoria, getSupersededFormIds, publicFormUrl } from "@/lib/admin/forms-center";
import { getFormExperience, toFormLandingConfig } from "@/lib/cms/form-experience";
import { getActivePortal } from "@/lib/portal/site";
import {
  getExperienceFormById,
  getPublicExperienceForm,
} from "@/lib/experience/forms/repository";
import { getExperienceFormUnavailabilityReason } from "@/lib/experience/forms/status";
import type { FormExperienceStateKey } from "@/types/experience-form-experience";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

interface FormularioPageProps {
  params: Promise<{ id: string }>;
}

const UNAVAILABILITY_STATE_KEY: Record<
  NonNullable<ReturnType<typeof getExperienceFormUnavailabilityReason>>,
  FormExperienceStateKey
> = {
  archived: "archived",
  inactive: "inactive",
  hidden: "hidden",
  not_found: "notFound",
};

export async function generateMetadata({ params }: FormularioPageProps): Promise<Metadata> {
  const { id } = await params;
  const ctx = await getActivePortal();
  if (!ctx) return { title: "Formulario" };

  const form = await getExperienceFormById(ctx.tenant, id);
  const experience = await getFormExperience(ctx.tenant, id, form?.name);
  const landing = toFormLandingConfig(experience);
  const unavailability = getExperienceFormUnavailabilityReason(form);
  const title = experience.seo.title ?? landing.headline ?? form?.name ?? "Formulario";

  if (unavailability) {
    const stateCopy = experience.states[UNAVAILABILITY_STATE_KEY[unavailability]];
    return {
      title,
      description: stateCopy?.description ?? formUnavailabilityDescription(unavailability),
      robots: { index: false, follow: false },
      openGraph: experience.seo.openGraphImageUrl
        ? { images: [{ url: experience.seo.openGraphImageUrl }] }
        : undefined,
    };
  }

  return {
    title,
    description: experience.seo.description ?? landing.subheadline ?? form?.description ?? undefined,
    keywords: experience.seo.keywords.length > 0 ? experience.seo.keywords : undefined,
    openGraph: {
      title: experience.seo.title ?? title,
      description: experience.seo.description ?? landing.subheadline,
      images: experience.seo.openGraphImageUrl
        ? [{ url: experience.seo.openGraphImageUrl }]
        : undefined,
    },
  };
}

function formUnavailabilityDescription(
  reason: NonNullable<ReturnType<typeof getExperienceFormUnavailabilityReason>>
): string {
  switch (reason) {
    case "archived":
      return "Este formulario ya no acepta respuestas.";
    case "inactive":
      return "Este formulario aún no está abierto para recibir respuestas.";
    case "hidden":
      return "Este formulario no está publicado en el portal.";
    default:
      return "No encontramos el formulario solicitado.";
  }
}

export default async function FormularioPublicPage({ params }: FormularioPageProps) {
  const { id } = await params;

  if (getSupersededFormIds().has(id)) {
    const convocatoria = getActiveConvocatoria();
    if (convocatoria) permanentRedirect(publicFormUrl(convocatoria.formId));
  }

  const ctx = await getActivePortal();
  if (!ctx) notFound();

  const storedForm = await getExperienceFormById(ctx.tenant, id);
  const experience = await getFormExperience(ctx.tenant, id, storedForm?.name);
  const landing = toFormLandingConfig(experience);
  const unavailability = getExperienceFormUnavailabilityReason(storedForm);

  const breadcrumb = (
    <PortalBreadcrumb
      items={[
        { label: "Inicio", href: "/" },
        { label: "Formularios", href: "/formularios" },
        { label: landing.headline ?? storedForm?.name ?? "Formulario" },
      ]}
    />
  );

  if (unavailability) {
    const stateKey = UNAVAILABILITY_STATE_KEY[unavailability];
    return (
      <FormUnavailableState
        reason={unavailability}
        landing={landing}
        stateMessage={experience.states[stateKey]}
        formName={storedForm?.name}
        breadcrumb={breadcrumb}
      />
    );
  }

  const form = await getPublicExperienceForm(ctx.tenant, id);
  if (!form) {
    return (
      <FormUnavailableState
        reason="not_found"
        landing={landing}
        stateMessage={experience.states.notFound}
        breadcrumb={breadcrumb}
      />
    );
  }

  const convocatoria = getConvocatoriaByFormId(id);
  const shell = experience.formShell;

  return (
    <FormPublicExperience experience={experience} breadcrumb={breadcrumb}>
      {convocatoria ? (
        <PortalConvocatoriaExperienceForm
          form={form}
          convocatoriaSlug={convocatoria.slug}
          overline={shell.overline}
          title={shell.title}
          description={shell.description}
          submitLabel={shell.submitLabel}
          attendanceYesMessage={shell.attendanceYesMessage}
          attendanceNoMessage={shell.attendanceNoMessage}
          attendanceYesSuccessMessage={shell.attendanceYesSuccessMessage}
          celebrateAttendanceYes={shell.celebrateAttendanceYes}
        />
      ) : (
        <PortalExperienceForm
          form={form}
          overline={shell.overline}
          title={shell.title ?? form.name}
          description={shell.description ?? form.description}
          submitLabel={shell.submitLabel}
        />
      )}
    </FormPublicExperience>
  );
}
