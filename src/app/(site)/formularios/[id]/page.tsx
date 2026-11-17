import { PortalBreadcrumb } from "@/components/portal/layout";
import { PortalExperienceForm } from "@/components/portal/experience/forms";
import { PortalConvocatoriaExperienceForm } from "@/components/portal/experience/forms/PortalConvocatoriaExperienceForm";
import { FormPublicExperience, FormUnavailableState } from "@/components/portal/forms";
import { CongressAttendanceSuccess } from "@/components/portal/forms/CongressAttendanceSuccess";
import {
  getConvocatoriaByFormId,
  getActiveConvocatoria,
  getSupersededFormIds,
  isExperienceFormPrivate,
  publicFormUrl,
} from "@/lib/admin/forms-center";
import { getFormExperience, toFormLandingConfig } from "@/lib/cms/form-experience";
import { isSemTenant } from "@/core/tenant/is-sem";
import { ipnDepartmentColors } from "@/design/tokens/colors";
import { SEM_CONTACT_PUBLISHED } from "@/lib/portal/sem-identity-v7";
import { getActivePortal } from "@/lib/portal/site";
import type { ExperienceFormExperience } from "@/types/experience-form-experience";
import {
  getDirectAccessibleExperienceForm,
  getExperienceFormById,
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
  const isPrivate = Boolean(form && isExperienceFormPrivate(form));
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
    keywords: isPrivate ? undefined : experience.seo.keywords.length > 0 ? experience.seo.keywords : undefined,
    robots: isPrivate ? { index: false, follow: false } : undefined,
    openGraph: isPrivate
      ? undefined
      : {
          title: experience.seo.title ?? title,
          description: experience.seo.description ?? landing.subheadline,
          images: experience.seo.openGraphImageUrl
            ? [{ url: experience.seo.openGraphImageUrl }]
            : undefined,
        },
  };
}

function withholdUnvalidatedFormContact(
  experience: ExperienceFormExperience,
  tenantId: string
): ExperienceFormExperience {
  if (!isSemTenant(tenantId) || SEM_CONTACT_PUBLISHED) return experience;
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

const VARONES_ATTENDANCE_FORM_ID = "ipn-asistencia-congreso-varones-2026";
const VARONES_CONGRESS_BANNER = "/branding/ipn-chile/congreso-varones-2026.jpg";

/** Portada del congreso: el banner lleva título, cita y fecha. */
function withDepartmentBrand(
  id: string,
  experience: ExperienceFormExperience
): ExperienceFormExperience {
  if (id !== VARONES_ATTENDANCE_FORM_ID) return experience;
  return {
    ...experience,
    hero: {
      ...experience.hero,
      eyebrow: "Confirmación de asistencia",
      headline: "3° Congreso de Varones",
      subheadline:
        "Celebramos juntos el 3.º Congreso de Varones. Confirma tu asistencia para preparar el encuentro.",
      motivational: "¡Nos encantará verte! Tu presencia fortalece este congreso.",
      mediaUrl: VARONES_CONGRESS_BANNER,
      mediaPresentation: "banner",
      overlayOpacity: 0,
      height: "compact",
      showBreadcrumb: false,
      secondaryCtas: [],
    },
    formShell: {
      ...experience.formShell,
      overline: "Tu respuesta",
      title: "Confirma tu asistencia",
      description: "Zona, iglesia y contacto. El correo es opcional.",
      submitLabel: "Confirmar asistencia",
      successMessage:
        "Gracias por confirmar tu asistencia. Te esperamos el 21 y 22 de noviembre.",
      confirmationEmailCtaLabel: "Descargar el programa",
    },
    counter: {
      ...experience.counter,
      enabled: true,
      mode: "days_until",
      targetDate: "2026-11-21",
      targetTime: "08:30",
      label: "Faltan",
    },
    appearance: {
      ...experience.appearance,
      primaryColor: ipnDepartmentColors.navy,
      borderRadius: "soft",
      shadow: "soft",
    },
    infoCards: [
      {
        id: "fecha",
        icon: "calendar",
        label: "Fecha",
        value: "Sábado 21 y domingo 22 de noviembre",
        description: "2026",
        order: 0,
        visible: true,
      },
      {
        id: "horario",
        icon: "clock",
        label: "Horario",
        value: "Desde las 8:30 a. m.",
        description: "Sábado 21 de noviembre",
        order: 1,
        visible: true,
      },
      {
        id: "traer",
        icon: "clipboard-check",
        label: "Traer",
        value: "Gorro, instrumentos, protector solar, agua, equipo de sonido y saco de dormir",
        order: 2,
        visible: true,
      },
      {
        id: "para-quien",
        icon: "users",
        label: "Para quién",
        value: "Varones de IPN Chile",
        order: 3,
        visible: true,
      },
    ],
    blocks: experience.blocks.map((block) =>
      block.type === "counter" ? { ...block, enabled: false } : block
    ),
  };
}

export default async function FormularioPublicPage({ params }: FormularioPageProps) {
  const { id } = await params;
  const ctx = await getActivePortal();
  if (!ctx) notFound();

  if (getSupersededFormIds(ctx.tenant).has(id)) {
    const convocatoria = getActiveConvocatoria(ctx.tenant);
    if (convocatoria) permanentRedirect(publicFormUrl(convocatoria.formId));
  }

  const storedForm = await getExperienceFormById(ctx.tenant, id);
  const experience = withDepartmentBrand(
    id,
    withholdUnvalidatedFormContact(
      await getFormExperience(ctx.tenant, id, storedForm?.name),
      ctx.tenant
    )
  );
  const landing = toFormLandingConfig(experience);
  const unavailability = getExperienceFormUnavailabilityReason(storedForm);
  const isPrivate = Boolean(storedForm && isExperienceFormPrivate(storedForm));

  const breadcrumb = (
    <PortalBreadcrumb
      items={
        isPrivate
          ? [
              { label: "Inicio", href: "/" },
              { label: landing.headline ?? storedForm?.name ?? "Formulario" },
            ]
          : [
              { label: "Inicio", href: "/" },
              { label: "Formularios", href: "/formularios" },
              { label: landing.headline ?? storedForm?.name ?? "Formulario" },
            ]
      }
    />
  );

  if (unavailability) {
    const stateKey = UNAVAILABILITY_STATE_KEY[unavailability];
    return (
      <FormUnavailableState
        reason={unavailability}
        formId={id}
        landing={landing}
        stateMessage={experience.states[stateKey]}
        formName={storedForm?.name}
        breadcrumb={breadcrumb}
      />
    );
  }

  const form = await getDirectAccessibleExperienceForm(ctx.tenant, id);
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

  const convocatoria = getConvocatoriaByFormId(id, ctx.tenant);
  const shell = experience.formShell;

  const isVaronesAttendance = id === VARONES_ATTENDANCE_FORM_ID;

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
          programDownloadUrl={shell.confirmationEmailCtaUrl}
          programDownloadLabel={shell.confirmationEmailCtaLabel}
        />
      ) : (
        <PortalExperienceForm
          form={form}
          overline={shell.overline}
          title={shell.title ?? form.name}
          description={shell.description ?? form.description}
          submitLabel={shell.submitLabel}
          successMessage={isVaronesAttendance ? shell.successMessage : undefined}
          successTitle={isVaronesAttendance ? "¡Gracias!" : undefined}
          successExtras={
            isVaronesAttendance ? (
              <CongressAttendanceSuccess
                programDownloadUrl={shell.confirmationEmailCtaUrl}
                programDownloadLabel={shell.confirmationEmailCtaLabel}
              />
            ) : undefined
          }
        />
      )}
    </FormPublicExperience>
  );
}
