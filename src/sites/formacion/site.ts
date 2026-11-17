import type { CodedSite, SiteContentSlotDef } from "@/sites/types";

export const FORMACION_TENANT_ID = "mentor-prime-capacitacion";

export const FORMACION_SEO = {
  title: "Mentor Prime Formación y Capacitación",
  description:
    "Programas, cursos y desarrollo de competencias para empresas e instituciones. Los cursos se imparten a través de la OTEC habilitada.",
} as const;

export const formacionHomeSlots: SiteContentSlotDef[] = [
  {
    id: "hero.kicker",
    label: "Antetítulo",
    type: "text",
    default: "Formación",
  },
  {
    id: "hero.title",
    label: "Título",
    type: "text",
    default: "Mentor Prime Formación y Capacitación.",
  },
  {
    id: "hero.lead",
    label: "Bajada",
    type: "text",
    multiline: true,
    default:
      "Capacitación laboral, formación continua, cursos especializados y desarrollo de competencias para empresas e instituciones.",
  },
  {
    id: "hero.image",
    label: "Imagen principal",
    type: "image",
    default: {
      src: "",
      alt: "Taller de formación con un grupo alrededor de una mesa",
    },
  },
  {
    id: "hero.animation",
    label: "Animaciones de la portada",
    type: "animation",
    default: true,
    description: "Entrada y movimiento de la portada. Si se apaga, la página queda quieta.",
  },
];

export const formacionSite: CodedSite = {
  tenantId: FORMACION_TENANT_ID,
  pages: [
    {
      path: "/",
      title: FORMACION_SEO.title,
      navLabel: "Inicio",
      description: FORMACION_SEO.description,
      slots: formacionHomeSlots,
    },
    {
      path: "/contacto",
      title: "Contacto | Mentor Prime Formación",
      navLabel: "Contacto",
      description: "Escriba al equipo de Formación y Capacitación.",
    },
  ],
  forms: [],
};
