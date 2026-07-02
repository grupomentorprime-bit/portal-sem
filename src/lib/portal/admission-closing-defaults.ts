/**
 * OT-PORTAL-005 — Contenido por defecto del Cierre Institucional.
 * Fuente CMS; no duplicar en componentes React.
 */
import type { AdmissionClosingBlock, AdmissionClosingConfig } from "@/types/admission-closing";

function blockId(type: string, index = 1): string {
  return `closing-${type}-${index}`;
}

export const DEFAULT_ADMISSION_CLOSING_BLOCKS: AdmissionClosingBlock[] = [
  {
    id: blockId("backdrop"),
    type: "backdrop",
    enabled: true,
    order: 0,
    data: {
      mode: "image",
      overlay: 82,
      gradientFrom: "var(--color-primary)",
      gradientTo: "var(--color-secondary)",
      opacity: 100,
      parallax: false,
      blur: false,
    },
  },
  {
    id: blockId("message"),
    type: "message",
    enabled: true,
    order: 1,
    data: {
      eyebrow: "FORMACIÓN MINISTERIAL",
      title: "Tu llamado merece una formación seria.",
      subtitle: "La formación ministerial comienza con una decisión.",
      description:
        "Da el siguiente paso en tu preparación bíblica y pastoral junto a una institución con respaldo de IPN Chile, modalidad 100% online y acompañamiento docente.",
      mediaId: undefined,
      overlay: 55,
      alignment: "left",
    },
  },
  {
    id: blockId("actions"),
    type: "actions",
    enabled: true,
    order: 2,
    data: {
      items: [
        {
          id: "act-1",
          label: "Iniciar postulación",
          icon: "Compass",
          href: "#postulacion",
          variant: "primary",
          order: 0,
          visible: true,
        },
        {
          id: "act-2",
          label: "Hablar con admisiones",
          icon: "Users",
          href: "/contacto",
          variant: "outline",
          order: 1,
          visible: true,
        },
        {
          id: "act-3",
          label: "Descargar folleto",
          icon: "BookOpen",
          href: "/biblioteca",
          variant: "ghost",
          order: 2,
          visible: true,
        },
        {
          id: "act-4",
          label: "Solicitar orientación",
          icon: "Heart",
          href: "/contacto",
          variant: "ghost",
          order: 3,
          visible: true,
        },
      ],
    },
  },
  {
    id: blockId("indicators"),
    type: "indicators",
    enabled: true,
    order: 3,
    data: {
      items: [
        {
          id: "ind-1",
          icon: "Award",
          title: "Trayectoria",
          value: "30 años",
          description: "Formando siervos para la Iglesia",
          visible: true,
          order: 0,
        },
        {
          id: "ind-2",
          icon: "GraduationCap",
          title: "Generaciones",
          value: "12 generaciones",
          description: "Cohortes ministeriales formadas",
          visible: true,
          order: 1,
        },
        {
          id: "ind-3",
          icon: "Monitor",
          title: "Modalidad",
          value: "100% Online",
          description: "Campus virtual y clases en vivo",
          visible: true,
          order: 2,
        },
        {
          id: "ind-4",
          icon: "Shield",
          title: "Respaldo",
          value: "IPN Chile",
          description: "Institución oficial de formación",
          visible: true,
          order: 3,
        },
      ],
    },
  },
  {
    id: blockId("quote"),
    type: "quote",
    enabled: true,
    order: 4,
    data: {
      items: [
        {
          id: "quote-1",
          text: "Equipando a los santos para la obra del ministerio.",
          reference: "Efesios 4:12",
          showQuotes: true,
          showSignature: true,
          visible: true,
          order: 0,
        },
      ],
    },
  },
  {
    id: blockId("contact"),
    type: "contact",
    enabled: true,
    order: 5,
    data: {
      title: "¿Necesitas orientación?",
      description:
        "Nuestro equipo de admisiones está disponible para acompañarte en tu proceso de discernimiento y postulación.",
      email: "contacto@seminarioipn.cl",
      phone: "+56 9 0000 0000",
      whatsapp: "+56 9 0000 0000",
      schedule: "Lunes a viernes, 9:00 — 18:00 hrs",
      address: "Chile — modalidad 100% online",
      mapEmbedUrl: "",
      social: [
        { id: "soc-1", platform: "Facebook", url: "https://facebook.com", visible: true },
        { id: "soc-2", platform: "Instagram", url: "https://instagram.com", visible: true },
        { id: "soc-3", platform: "YouTube", url: "https://youtube.com", visible: true },
      ],
    },
  },
  {
    id: blockId("footer"),
    type: "footer",
    enabled: true,
    order: 6,
    data: {
      columns: [
        {
          id: "col-adm",
          title: "Admisión",
          order: 0,
          visible: true,
          items: [
            { id: "l1", text: "Cómo postular", type: "page", url: "/admision", order: 0 },
            { id: "l2", text: "Requisitos", type: "url", url: "/admision#requisitos", order: 1 },
            { id: "l3", text: "Aranceles", type: "url", url: "/admision#aranceles", order: 2 },
            { id: "l4", text: "Preguntas frecuentes", type: "url", url: "/admision#preguntas-frecuentes", order: 3 },
          ],
        },
        {
          id: "col-res",
          title: "Recursos",
          order: 1,
          visible: true,
          items: [
            { id: "r1", text: "Biblioteca", type: "library", url: "/biblioteca", order: 0 },
            { id: "r2", text: "Noticias", type: "news", url: "/noticias", order: 1 },
            { id: "r3", text: "Programas", type: "program", url: "/programas", order: 2 },
          ],
        },
        {
          id: "col-inst",
          title: "Institución",
          order: 2,
          visible: true,
          items: [
            { id: "i1", text: "Equipo docente", type: "page", url: "/equipo", order: 0 },
            { id: "i2", text: "Nuestra historia", type: "page", url: "/institucion", order: 1 },
            { id: "i3", text: "Contacto", type: "page", url: "/contacto", order: 2 },
          ],
        },
        {
          id: "col-more",
          title: "Más información",
          order: 3,
          visible: true,
          items: [
            { id: "m1", text: "Campus virtual", type: "url", url: "/campus", order: 0 },
            { id: "m2", text: "Testimonios", type: "url", url: "/testimonios", order: 1 },
            { id: "m3", text: "Políticas", type: "url", url: "/legal", order: 2 },
          ],
        },
      ],
    },
  },
  {
    id: blockId("seal"),
    type: "seal",
    enabled: true,
    order: 7,
    data: {
      lines: ["Fundado 1994", "100% Online", "IPN Chile", "Seminario Oficial"],
      sealType: "default",
      tone: "inverse",
      position: "center",
      opacity: 12,
      size: "lg",
    },
  },
  {
    id: blockId("copyright"),
    type: "copyright",
    enabled: true,
    order: 8,
    data: {
      primaryText: "© Seminario Eclesiástico Mayor.",
      secondaryText: "Institución oficial de formación ministerial de IPN Chile.",
      developerText: "Desarrollado sobre Learning OS por Grupo Mentor Prime.",
      developerName: "Grupo Mentor Prime",
      developerUrl: "https://grupomentorprime.com",
    },
  },
  {
    id: blockId("benefits"),
    type: "benefits",
    enabled: true,
    order: 9,
    data: {
      items: [
        {
          id: "ben-1",
          icon: "Heart",
          label: "Acompañamiento pastoral",
          visible: true,
          order: 0,
        },
        {
          id: "ben-2",
          icon: "Users",
          label: "Docentes especializados",
          visible: true,
          order: 1,
        },
        {
          id: "ben-3",
          icon: "BookOpen",
          label: "Formación bíblica sólida",
          visible: true,
          order: 2,
        },
        {
          id: "ben-4",
          icon: "Monitor",
          label: "Campus virtual 24/7",
          visible: true,
          order: 3,
        },
        {
          id: "ben-5",
          icon: "Shield",
          label: "Respaldo IPN Chile",
          visible: true,
          order: 4,
        },
      ],
    },
  },
  {
    id: blockId("final_cta"),
    type: "final_cta",
    enabled: true,
    order: 10,
    data: {
      icon: "GraduationCap",
      title: "¿Listo para dar el siguiente paso en tu formación ministerial?",
      description: "Completa tu postulación y recibe orientación del equipo de admisiones.",
      buttonLabel: "Iniciar postulación",
      buttonHref: "#postulacion",
    },
  },
];

export const DEFAULT_ADMISSION_CLOSING: AdmissionClosingConfig = {
  enabled: true,
  blocks: DEFAULT_ADMISSION_CLOSING_BLOCKS,
};
