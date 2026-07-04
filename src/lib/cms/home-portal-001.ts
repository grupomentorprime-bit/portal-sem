/**
 * OT-PORTAL-001 — Home institucional definitivo (contenido canónico y migración)
 */
import {
  blocksFromTemplate,
  createDefaultBlock,
  DEFAULT_TEMPLATES,
  SEED_HOME_BLOCK_DATA,
} from "@/lib/cms/page-defaults";
import { createBlockId } from "@/lib/cms/page-utils";
import type { BlockType, PageBlock } from "@/types/page";
import type { PortalPageModel } from "@/types/portal";

export const PORTAL_001_VERSION = "portal-001";

export const PORTAL_001_HOME_BLOCK_ORDER: BlockType[] = [
  "hero",
  "academic_offer",
  "audience_profiles",
  "modality",
  "people",
  "testimonials",
  "admission_process",
  "faq",
  "cta_premium",
];

export const PORTAL_001_SEMINARIOS_HOME = {
  eyebrow: "Formación continua",
  title: "Seminarios formativos",
  description:
    "Programas formativos cortos y especializados para profundizar en áreas clave del ministerio. Modalidad online con certificación SEM.",
  viewAllHref: "/programas",
  viewAllLabel: "Ver todos los programas formativos",
};

export const PORTAL_001_AUDIENCE_PROFILES = {
  overline: "Perfil del postulante",
  title: "¿Este seminario es para ti?",
  description:
    "Si te reconoces en alguno de estos caminos, la formación del SEM puede ser tu próximo paso ministerial.",
  image: "/images/demo/programs/hero-online.jpg",
  imageAlt: "Estudiantes del SEM en formación bíblica online",
  quote: "El SEM forma siervos para la Iglesia, no solo estudiantes.",
  ctaLabel: "Explorar admisión",
  ctaHref: "/admision",
  profiles: [
    {
      id: "pastores",
      title: "Pastores y pastoras",
      description:
        "Pastoreas una congregación y buscas profundizar en las Escrituras para guiar con mayor firmeza.",
      icon: "Users",
      href: "/programas?perfil=pastores",
      visible: true,
    },
    {
      id: "hermanos",
      title: "Hermanos(as) en la fe",
      description: "Sirves en tu iglesia y quieres una base bíblica y teológica más sólida.",
      icon: "BookOpen",
      href: "/programas?perfil=hermanos",
      visible: true,
    },
    {
      id: "lideres",
      title: "Líderes y diáconos",
      description:
        "Acompañas comunidades y necesitas herramientas con criterio pastoral y doctrinal.",
      icon: "GraduationCap",
      href: "/programas?perfil=lideres",
      visible: true,
    },
    {
      id: "vocacion",
      title: "Vocación al ministerio",
      description: "Sientes el llamado ordenado y buscas una ruta seria de preparación.",
      icon: "Heart",
      href: "/admision",
      visible: true,
      featured: true,
    },
  ],
};

export const PORTAL_001_METHODOLOGY = {
  overline: "Metodología",
  title: "Cómo se estudia en el SEM",
  subtitle: "Un modelo claro, flexible y acompañado.",
  description:
    "Clases en vivo, campus virtual y acompañamiento docente — una ruta formativa pensada para quienes sirven en la Iglesia.",
  items: [
    {
      id: "m1",
      icon: "Video",
      title: "Clases en vivo",
      description: "Sesiones sincrónicas con docentes y comunidad de seminaristas.",
    },
    {
      id: "m2",
      icon: "Monitor",
      title: "Campus virtual",
      description: "Material formativo, entregas y seguimiento en un solo espacio.",
    },
    {
      id: "m3",
      icon: "BookOpen",
      title: "Material formativo",
      description: "Biblioteca institucional y recursos para cada asignatura.",
    },
    {
      id: "m4",
      icon: "ClipboardCheck",
      title: "Evaluaciones",
      description: "Rúbricas que miden comprensión y aplicación ministerial.",
    },
    {
      id: "m5",
      icon: "Users",
      title: "Acompañamiento docente",
      description: "Formadores disponibles para orientar tu proceso.",
    },
    {
      id: "m6",
      icon: "Award",
      title: "Certificación",
      description: "Respaldo institucional IPN Chile al completar tu programa.",
    },
  ],
};

export const PORTAL_001_ADMISSION_STEPS = [
  {
    id: "adm-1",
    step: 1,
    title: "Explora",
    description: "Conoce programas, perfil del seminarista y requisitos.",
    icon: "Compass",
    url: "/programas",
  },
  {
    id: "adm-2",
    step: 2,
    title: "Postula",
    description: "Completa tu solicitud en línea con la documentación requerida.",
    icon: "FilePen",
    url: "/admision#postulacion",
  },
  {
    id: "adm-3",
    step: 3,
    title: "Evaluación",
    description: "Revisión académica y pastoral con retroalimentación personalizada.",
    icon: "Users",
    url: "/admision#proceso-postulacion",
  },
  {
    id: "adm-4",
    step: 4,
    title: "Matrícula",
    description: "Formaliza tu ingreso y plan de estudios con acompañamiento.",
    icon: "GraduationCap",
    url: "/admision#aranceles",
  },
  {
    id: "adm-5",
    step: 5,
    title: "Inicio de clases",
    description: "Integración a la comunidad seminarista y bienvenida institucional.",
    icon: "BookOpen",
    url: "/admision#calendario",
  },
];

export const PORTAL_001_ADMISSION_CTA = [
  {
    id: "adm-cta-1",
    label: "Iniciar postulación",
    action: { type: "url", href: "/admision#postulacion" },
    variant: "primary",
    visible: true,
  },
  {
    id: "adm-cta-2",
    label: "Hablar con admisiones",
    action: { type: "url", href: "/contacto" },
    variant: "outline",
    visible: true,
  },
];

export const PORTAL_001_FAQ_ITEMS = [
  {
    id: "f1",
    question: "¿Quién puede postular?",
    answer:
      "Personas con vocación al servicio ministerial que cumplan los requisitos académicos y pastorales publicados en la sección de admisión.",
  },
  {
    id: "f2",
    question: "¿Es completamente online?",
    answer:
      "Sí. La formación es 100% en línea, con clases en vivo, campus virtual y acompañamiento docente continuo.",
  },
  {
    id: "f3",
    question: "¿Cuál es el horario de clases?",
    answer:
      "Los horarios varían por programa y generación. Tras postular, admisiones te entrega el calendario vigente de tu cohorte.",
  },
  {
    id: "f4",
    question: "¿Cómo se paga la formación?",
    answer:
      "Existen aranceles de matrícula y cuotas semestrales. El equipo de admisiones orienta sobre medios de pago y opciones de apoyo.",
  },
  {
    id: "f5",
    question: "¿Qué certificación se obtiene?",
    answer:
      "Al completar el programa recibes certificación institucional del Seminario Eclesiástico Mayor, con respaldo de IPN Chile.",
  },
];

export const PORTAL_001_CTA_FINAL = {
  overline: "Da el siguiente paso",
  title: "Tu llamado merece una formación seria",
  description:
    "No postules a ciegas: nuestro equipo de admisiones te orienta en cada etapa, desde la elección del programa hasta tu matrícula.",
  variant: "highlight",
  background: "primary",
  buttons: [
    {
      id: "1",
      label: "Iniciar postulación",
      action: { type: "url", href: "/admision" },
      variant: "primary",
      visible: true,
    },
    {
      id: "2",
      label: "Hablar con admisiones",
      action: { type: "url", href: "/contacto" },
      variant: "outline",
      visible: true,
    },
  ],
};

function settingsForBlock(type: BlockType): Record<string, unknown> {
  const seed = SEED_HOME_BLOCK_DATA as unknown as Record<string, Record<string, unknown>>;
  const base = createDefaultBlock(type, 0).settings;

  switch (type) {
    case "academic_offer":
      return {
        ...base,
        ...seed.academic_offer,
        showAudienceSection: false,
      };
    case "seminarios_home":
      return { ...base, ...PORTAL_001_SEMINARIOS_HOME };
    case "audience_profiles":
      return { ...base, ...PORTAL_001_AUDIENCE_PROFILES };
    case "modality":
      return { ...base, ...seed.modality, ...PORTAL_001_METHODOLOGY };
    case "people":
      return {
        ...base,
        ...seed.people,
        overline: "Equipo directivo y académico",
        title: "Un equipo que inspira confianza",
        description:
          "Profesionales con trayectoria académica y pastoral, comprometidos con tu formación.",
      };
    case "testimonials":
      return {
        ...base,
        ...seed.testimonials,
        overline: "Testimonios",
        title: "Voces de nuestra comunidad",
        description: "Experiencias reales de quienes ya caminan la formación en el SEM.",
      };
    case "admission_process":
      return {
        ...base,
        overline: "Ruta de admisión",
        title: "Un proceso claro, con acompañamiento",
        description:
          "Desde tu primera visita hasta el inicio de clases, admisiones te guía en cada paso.",
        items: PORTAL_001_ADMISSION_STEPS,
        buttons: PORTAL_001_ADMISSION_CTA,
        layout: "auto",
        variant: "steps",
      };
    case "faq":
      return {
        ...base,
        ...seed.faq,
        overline: "Preguntas frecuentes",
        title: "Resolvemos tus dudas antes de postular",
        description: "Lo esencial sobre admisión, modalidad y certificación.",
        items: PORTAL_001_FAQ_ITEMS,
      };
    case "cta_premium":
      return {
        ...base,
        ...seed.cta_premium,
        ...PORTAL_001_CTA_FINAL,
        showStats: false,
      };
    case "hero":
      return { ...base, ...seed.hero };
    default:
      return base;
  }
}

function preserveBlockSettings(
  existing: PageBlock | undefined,
  type: BlockType
): Record<string, unknown> {
  const canonical = settingsForBlock(type);
  if (type === "hero" && existing?.settings) {
    return { ...canonical, ...existing.settings };
  }
  return canonical;
}

export function buildPortal001HomeBlocks(existingBlocks: PageBlock[] = []): PageBlock[] {
  const byType = new Map<BlockType, PageBlock>();
  for (const block of existingBlocks) {
    if (!byType.has(block.type)) {
      byType.set(block.type, block);
    }
  }

  return PORTAL_001_HOME_BLOCK_ORDER.map((type, order) => {
    const prev = byType.get(type);
    return {
      id: prev?.id ?? createBlockId(type),
      type,
      visible: prev?.visible ?? true,
      order,
      settings: preserveBlockSettings(prev, type),
    };
  });
}

export function applyPortal001HomeMigration(page: PortalPageModel): PortalPageModel {
  const slug = page.slug === "home" ? "/" : page.slug;
  if (slug !== "/") return page;

  const version = (page as PortalPageModel & { portalHomeVersion?: string }).portalHomeVersion;
  const blocks = buildPortal001HomeBlocks(page.blocks);

  return {
    ...page,
    slug,
    blocks,
    portalHomeVersion: PORTAL_001_VERSION,
  } as PortalPageModel;
}

export function getPortal001TemplateBlocks(): PageBlock[] {
  return buildPortal001HomeBlocks(blocksFromTemplate(
    DEFAULT_TEMPLATES.find((t) => t._id === "home") ?? DEFAULT_TEMPLATES[0]
  ));
}
