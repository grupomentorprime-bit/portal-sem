import { ADL_TENANT_ID } from "@/core/tenant/constants";
import type { CodedSite, SiteContentSlotDef } from "@/sites/types";

export { ADL_TENANT_ID };

export const ADL_SEO = {
  title: "Academia ADL",
  description: "Formación y acompañamiento para equipos que necesitan crecer con método.",
} as const;

export const adlHomeSlots: SiteContentSlotDef[] = [
  {
    id: "hero.kicker",
    label: "Antetítulo",
    type: "text",
    default: "Academia",
  },
  {
    id: "hero.title",
    label: "Título",
    type: "text",
    default: "Academia ADL.",
  },
  {
    id: "hero.lead",
    label: "Bajada",
    type: "text",
    multiline: true,
    default:
      "Un espacio de trabajo para formar equipos, ordenar programas y acompañar el aprendizaje de la organización.",
  },
  {
    id: "hero.image",
    label: "Imagen principal",
    type: "image",
    default: {
      src: "",
      alt: "Estudiantes y docentes de Academia ADL",
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

export const adlSite: CodedSite = {
  tenantId: ADL_TENANT_ID,
  pages: [
    {
      path: "/",
      title: ADL_SEO.title,
      navLabel: "Inicio",
      description: ADL_SEO.description,
      slots: adlHomeSlots,
    },
    {
      path: "/contacto",
      title: "Contacto | Academia ADL",
      navLabel: "Contacto",
      description: "Canales de contacto de Academia ADL.",
    },
  ],
  forms: [],
};
