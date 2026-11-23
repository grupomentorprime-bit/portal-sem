import { IPN_CHILE_TENANT_ID } from "@/core/units/ipn-chile";
import { ipnDepartmentColors } from "@/design/tokens/colors";
import {
  CONGRESS_VARONES_FORM_ID,
  CONGRESS_VARONES_PROGRAM_LABEL,
  CONGRESS_VARONES_PROGRAM_PATH,
} from "@/lib/experience/forms/already-enrolled";
import { registerPublicForm } from "@/nelzuri";
import type { ExperienceFormExperience } from "@/types/experience-form-experience";

const VARONES_CONGRESS_BANNER = "/branding/ipn-chile/congreso-varones-2026.jpg";

function withDepartmentBrand(experience: ExperienceFormExperience): ExperienceFormExperience {
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
      successMessage: "Gracias por confirmar tu asistencia. Te esperamos el 21 y 22 de noviembre.",
      confirmationEmailCtaUrl: CONGRESS_VARONES_PROGRAM_PATH,
      confirmationEmailCtaLabel: CONGRESS_VARONES_PROGRAM_LABEL,
    },
    counter: {
      ...experience.counter,
      enabled: true,
      mode: "days_until",
      targetDate: "2026-11-21",
      targetTime: "08:00",
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
        value: "Desde las 8:00 a. m.",
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

function matchesCongressForm(formId: string, tenantId: string): boolean {
  return tenantId === IPN_CHILE_TENANT_ID && formId === CONGRESS_VARONES_FORM_ID;
}

function resolveCongressForm() {
  return {
    kind: "congress" as const,
    tone: "corporate" as const,
    showBrandHeader: false,
    decorate: withDepartmentBrand,
  };
}

export function registerCongressPublicForm(): void {
  registerPublicForm({
    id: "congreso-varones",
    spaceId: IPN_CHILE_TENANT_ID,
    matches: matchesCongressForm,
    resolve: resolveCongressForm,
  });
}
