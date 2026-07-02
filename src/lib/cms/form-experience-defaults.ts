import {
  FORM_CONVOCATORIAS,
  FORM_LANDINGS,
  type FormLandingHighlight,
} from "@/lib/admin/forms-center";
import { formUnavailabilityCopy } from "@/lib/experience/forms/status";
import type {
  ExperienceFormExperience,
  FormExperienceBlock,
  FormExperienceInfoCard,
  FormExperienceInfoIcon,
  FormExperienceStateKey,
  FormExperienceTemplateId,
} from "@/types/experience-form-experience";
import { DEFAULT_CHILE_EVENT_TIME } from "@/lib/experience/forms/convocatoria-event-datetime";
import { createCmsId } from "@/types/cms-shared";

const DEFAULT_BLOCKS: FormExperienceBlock[] = [
  { id: "block-hero", type: "hero", enabled: true, order: 0 },
  { id: "block-info", type: "info_cards", enabled: true, order: 1 },
  { id: "block-editorial", type: "editorial", enabled: true, order: 2 },
  { id: "block-banners", type: "banners", enabled: true, order: 3 },
  { id: "block-counter", type: "counter", enabled: false, order: 4 },
  { id: "block-form", type: "form", enabled: true, order: 5 },
  { id: "block-faq", type: "faq", enabled: false, order: 6 },
  { id: "block-contact", type: "contact", enabled: false, order: 7 },
  { id: "block-footer", type: "footer", enabled: true, order: 8 },
];

function mapHighlightIcon(icon: FormLandingHighlight["icon"]): FormExperienceInfoIcon {
  return icon;
}

function highlightsToInfoCards(highlights: FormLandingHighlight[]): FormExperienceInfoCard[] {
  return highlights.map((item, index) => ({
    id: createCmsId("info"),
    icon: mapHighlightIcon(item.icon),
    label: item.label,
    value: item.value,
    href: item.href,
    order: index,
    visible: true,
  }));
}

function defaultStates(): ExperienceFormExperience["states"] {
  const reasons: Array<{
    key: FormExperienceStateKey;
    reason: Parameters<typeof formUnavailabilityCopy>[0];
  }> = [
    { key: "archived", reason: "archived" },
    { key: "inactive", reason: "inactive" },
    { key: "hidden", reason: "hidden" },
    { key: "notFound", reason: "not_found" },
  ];

  const states: ExperienceFormExperience["states"] = {
    open: {
      title: "Formulario abierto",
      description: "Completa el formulario y envía tu respuesta.",
      icon: "sparkles",
      tone: "success",
    },
    closed: {
      title: "Formulario cerrado",
      description: "Este formulario ya no acepta respuestas.",
      icon: "clock",
      tone: "neutral",
      ctaLabel: "Ver formularios disponibles",
      ctaHref: "/formularios",
    },
    comingSoon: {
      title: "Próximamente",
      description: "Este formulario estará disponible muy pronto.",
      icon: "calendar",
      tone: "info",
    },
    full: {
      title: "Cupos completos",
      description: "Ya no quedan cupos disponibles para esta actividad.",
      icon: "users",
      tone: "warning",
    },
    readonly: {
      title: "Solo lectura",
      description: "Puedes consultar la información, pero no enviar respuestas.",
      icon: "book",
      tone: "neutral",
    },
    expired: {
      title: "Fuera de plazo",
      description: "El plazo para responder este formulario ha finalizado.",
      icon: "clock",
      tone: "warning",
    },
  };

  for (const { key, reason } of reasons) {
    const copy = formUnavailabilityCopy(reason);
    states[key] = {
      title: copy.title,
      description: copy.description,
      icon: "message",
      tone: "neutral",
      ctaLabel: "Ver formularios disponibles",
      ctaHref: "/formularios",
    };
  }

  return states;
}

function buildFromLanding(
  tenant: string,
  formId: string,
  landing: {
    theme: ExperienceFormExperience["appearance"]["theme"];
    eyebrow: string;
    headline: string;
    subheadline: string;
    motivational?: string;
    highlights: FormLandingHighlight[];
    ctaLabel?: string;
  }
): ExperienceFormExperience {
  const now = new Date().toISOString();
  return {
    _id: formId,
    tenant,
    schemaVersion: 1,
    publishStatus: "published",
    hero: {
      enabled: true,
      eyebrow: landing.eyebrow,
      headline: landing.headline,
      subheadline: landing.subheadline,
      motivational: landing.motivational,
      overlayOpacity: landing.theme === "convocatoria" ? 8 : 55,
      height: "default",
      showBreadcrumb: true,
      secondaryCtas: [],
    },
    infoCards: highlightsToInfoCards(landing.highlights),
    editorial: {
      enabled: true,
      title: "Bienvenido",
      body: "Esta jornada incluye evaluación académica además del encuentro formativo. Tu respuesta nos ayudará a organizar adecuadamente la actividad y brindar una mejor experiencia para todos los participantes.",
    },
    formShell: {
      overline: "Tu respuesta",
      title: "Completa el formulario",
      description: "Los campos marcados son obligatorios.",
      submitLabel: landing.ctaLabel ?? "Enviar respuesta",
      searchPlaceholder: "Buscar por nombre o apellido…",
    },
    states: defaultStates(),
    banners: [],
    counter: { enabled: false, label: "Faltan", mode: "days_until" },
    footer: {
      enabled: true,
      contactEmail: "contacto@sem.cl",
      pastoralMessage: "Que el Señor guíe tu camino formativo.",
      copyright: "© Seminario Eclesiástico Mayor. Todos los derechos reservados.",
      socialLinks: [],
    },
    faq: { enabled: false, title: "Preguntas frecuentes", items: [] },
    contact: { enabled: false, title: "¿Necesitas ayuda?", body: "" },
    seo: {
      title: landing.headline,
      description: landing.subheadline,
      keywords: [],
    },
    share: {
      whatsappText: `Te comparto este formulario: ${landing.headline}`,
      emailSubject: landing.headline,
      copyLinkLabel: "Copiar enlace",
    },
    appearance: {
      theme: landing.theme,
      layout: "hero",
      overlayOpacity: 55,
      borderRadius: "default",
      shadow: "soft",
      contentWidth: "default",
      spacing: "default",
    },
    blocks: DEFAULT_BLOCKS.map((block) => ({ ...block })),
    updatedAt: now,
  };
}

export function buildDefaultFormExperience(
  tenant: string,
  formId: string,
  formName?: string
): ExperienceFormExperience {
  const staticLanding = FORM_LANDINGS.find((item) => item.formId === formId);
  const convocatoria = FORM_CONVOCATORIAS.find((item) => item.formId === formId);

  if (convocatoria?.landing) {
    const experience = buildFromLanding(tenant, formId, convocatoria.landing);
    experience.formShell = {
      ...experience.formShell,
      title: "Confirma tu asistencia",
      description:
        "Busca tu nombre en el listado, actualiza tu teléfono y responde si asistirás.",
      submitLabel: convocatoria.landing.ctaLabel ?? "Enviar mi respuesta",
      attendanceYesMessage:
        "¡Qué alegría! Nos encantará verte en la jornada. ¡Contentos por vernos!",
      attendanceNoMessage:
        "¡Qué lástima! Te extrañaremos en la jornada. Gracias por avisarnos.",
      attendanceYesSuccessMessage:
        "¡Gracias por confirmar tu asistencia! Nos vemos en Talca Aurora. ¡Qué gusto contar contigo!",
      celebrateAttendanceYes: true,
    };
    experience.appearance.layout = "event";
    experience.counter = {
      enabled: true,
      label: "Faltan para la jornada",
      mode: "days_until",
      targetDate: convocatoria.date,
      targetTime: DEFAULT_CHILE_EVENT_TIME,
    };
    return experience;
  }

  if (staticLanding) {
    return buildFromLanding(tenant, formId, staticLanding);
  }

  const now = new Date().toISOString();
  const title = formName ?? "Formulario";
  return {
    _id: formId,
    tenant,
    schemaVersion: 1,
    publishStatus: "draft",
    hero: {
      enabled: true,
      eyebrow: "Formulario",
      headline: title,
      subheadline: "Completa la información solicitada.",
      overlayOpacity: 55,
      height: "default",
      showBreadcrumb: true,
      secondaryCtas: [],
    },
    infoCards: [],
    editorial: { enabled: false, title: "", body: "" },
    formShell: {
      overline: "Tu respuesta",
      title: "Completa el formulario",
      description: "Los campos marcados son obligatorios.",
      submitLabel: "Enviar respuesta",
    },
    states: defaultStates(),
    banners: [],
    counter: { enabled: false, label: "Faltan", mode: "days_until" },
    footer: { enabled: false, socialLinks: [] },
    faq: { enabled: false, title: "Preguntas frecuentes", items: [] },
    contact: { enabled: false, title: "Contacto", body: "" },
    seo: { title, description: "", keywords: [] },
    share: {},
    appearance: {
      theme: "information",
      layout: "minimal",
      overlayOpacity: 55,
      borderRadius: "default",
      shadow: "soft",
      contentWidth: "default",
      spacing: "default",
    },
    blocks: DEFAULT_BLOCKS.map((block) => ({ ...block })),
    updatedAt: now,
  };
}

const TEMPLATE_OVERRIDES: Record<
  FormExperienceTemplateId,
  Partial<Pick<ExperienceFormExperience, "hero" | "editorial" | "formShell" | "appearance">>
> = {
  convocatoria: {
    appearance: {
      theme: "convocatoria",
      layout: "event",
      overlayOpacity: 8,
      borderRadius: "default",
      shadow: "soft",
      contentWidth: "default",
      spacing: "default",
    },
    editorial: {
      enabled: true,
      title: "Bienvenido",
      body: "Esta jornada incluye evaluación académica además del encuentro formativo. Tu respuesta nos ayudará a organizar adecuadamente la actividad.",
    },
    formShell: {
      overline: "Tu respuesta",
      title: "Confirma tu asistencia",
      submitLabel: "Enviar mi respuesta",
    },
  },
  encuesta: {
    appearance: {
      theme: "information",
      layout: "minimal",
      overlayOpacity: 40,
      borderRadius: "soft",
      shadow: "soft",
      contentWidth: "narrow",
      spacing: "compact",
    },
    hero: {
      enabled: true,
      eyebrow: "Encuesta",
      headline: "Tu opinión importa",
      subheadline: "Responde con sinceridad; tus respuestas son confidenciales.",
      overlayOpacity: 40,
      height: "compact",
      showBreadcrumb: true,
      secondaryCtas: [],
    },
    formShell: { submitLabel: "Enviar encuesta" },
  },
  inscripcion: {
    appearance: {
      theme: "application",
      layout: "landing",
      overlayOpacity: 55,
      borderRadius: "default",
      shadow: "elevated",
      contentWidth: "default",
      spacing: "default",
    },
    formShell: { submitLabel: "Inscribirme" },
  },
  registro: {
    appearance: {
      theme: "attendance",
      layout: "institutional",
      overlayOpacity: 50,
      borderRadius: "default",
      shadow: "soft",
      contentWidth: "default",
      spacing: "default",
    },
    formShell: { submitLabel: "Registrar" },
  },
  postulacion: {
    appearance: {
      theme: "application",
      layout: "landing",
      overlayOpacity: 60,
      borderRadius: "default",
      shadow: "elevated",
      contentWidth: "wide",
      spacing: "airy",
    },
    formShell: { submitLabel: "Enviar postulación" },
  },
};

export function applyFormExperienceTemplate(
  experience: ExperienceFormExperience,
  templateId: FormExperienceTemplateId
): ExperienceFormExperience {
  const patch = TEMPLATE_OVERRIDES[templateId];
  return {
    ...experience,
    templateId,
    hero: { ...experience.hero, ...patch.hero },
    editorial: { ...experience.editorial, ...patch.editorial },
    formShell: { ...experience.formShell, ...patch.formShell },
    appearance: { ...experience.appearance, ...patch.appearance },
  };
}
