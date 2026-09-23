/**
 * Identidad pública SEM (v7) — solo T001.
 * No escribe en base de datos y no altera otros Espacios.
 */
import { isSemTenant } from "@/core/tenant/is-sem";
import { createDefaultBlock } from "@/lib/cms/page-defaults";
import type { ContactInfo } from "@/types/cms";
import type { BlockType, PageBlock } from "@/types/page";
import type { PortalPageModel } from "@/types/portal";

export const SEM_ISOTIPO_SRC = "/images/logo-sem-isotipo.svg";
export const SEM_ISOTIPO_ON_DARK_SRC = "/images/logo-sem-isotipo-light.svg";

export const SEM_PUBLIC_NAV = [
  { label: "Inicio", href: "/" },
  { label: "El SEM", href: "/institucion" },
  { label: "Cómo se estudia", href: "/como-se-estudia" },
  { label: "Malla/Formación", href: "/malla" },
  { label: "Admisión", href: "/admision" },
] as const;

/** Noticias y eventos siguen publicados como rutas, pero no se enlazan mientras sean semilla. */
const SEM_SEED_NEWS_PREFIXES = ["/noticias", "/eventos"] as const;

export const SEM_AFFILIATION =
  "Somos parte de IPN Chile — Iglesia Pentecostal Nazareth.";

export const SEM_CONTACT_PENDING =
  "Los datos oficiales de contacto se incorporarán una vez validados institucionalmente.";

/**
 * Mientras los datos sigan sin validar, el sitio público no muestra
 * correo, teléfono, WhatsApp ni dirección. No se infiere cuáles son reales.
 */
export const SEM_CONTACT_PUBLISHED = false;

/** Redes del pie: ocultas hasta que exista una URL oficial validada. */
export const SEM_SOCIAL_PUBLISHED = false;

/** Oculta contacto público de SEM hasta validación institucional. */
export function publicSemContact(contact: ContactInfo, tenantId: string): ContactInfo {
  if (!isSemTenant(tenantId) || SEM_CONTACT_PUBLISHED) return contact;

  return {
    ...contact,
    email: "",
    phone: "",
    whatsapp: "",
    address: "",
    city: "",
  };
}

export function isSeedNewsHref(href: string | undefined): boolean {
  const path = (href ?? "").split(/[?#]/)[0]?.replace(/\/$/, "") || "/";
  return SEM_SEED_NEWS_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

const SEM_UNPUBLISHED_PUBLIC_PATHS = ["/testimonios", "/biblioteca"] as const;

/** Enlaces que hoy responden 404 o apuntan a una URL de campus aún no confirmada. */
export function isWithheldSemPublicHref(href: string | undefined): boolean {
  const path = (href ?? "").split(/[?#]/)[0]?.replace(/\/$/, "") || "/";
  if (isSeedNewsHref(path)) return true;
  if (!SEM_CAMPUS_PUBLISHED && path === "/campus") return true;
  return SEM_UNPUBLISHED_PUBLIC_PATHS.some((item) => path === item);
}

/**
 * Campus permanece oculto hasta validar la URL oficial única.
 * `published` queda en false a propósito: el valor guardado en el CMS no se publica solo.
 */
export const SEM_CAMPUS_PUBLISHED = false;

export function officialCampusHref(
  href: string | undefined,
  published = SEM_CAMPUS_PUBLISHED
): string | undefined {
  if (!published) return undefined;
  const value = href?.trim() ?? "";
  if (!value || value === "#") return undefined;
  if (/aprendehoy|wisboo/i.test(value)) return undefined;
  if (value.startsWith("/") || value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  return undefined;
}

export const SEM_HERO_COPY = {
  eyebrow: "SEMINARIO ECLESIÁSTICO MAYOR",
  title: "Tu llamado merece\npreparación.",
  highlight: "preparación.",
  description: "Formación bíblica para un servicio real.",
  primaryText: "Postular",
  primaryUrl: "/admision",
  secondaryText: "Cómo se estudia",
  secondaryUrl: "/como-se-estudia",
} as const;

function block(type: BlockType, order: number, settings: Record<string, unknown>): PageBlock {
  const base = createDefaultBlock(type, order);
  return { ...base, settings: { ...base.settings, ...settings } };
}

const STUDY_ITEMS = [
  {
    id: "study-online",
    icon: "Monitor",
    title: "100% online",
    description: "La formación se cursa completamente en línea.",
  },
  {
    id: "study-monday",
    icon: "Video",
    title: "Clases en vivo cada lunes",
    description: "Nos encontramos el lunes.",
  },
  {
    id: "study-platform",
    icon: "BookOpen",
    title: "Plataforma académica online",
    description: "El material y las actividades quedan en la plataforma.",
  },
  {
    id: "study-week",
    icon: "Calendar",
    title: "Estudio durante la semana",
    description: "Seguimos creciendo con estudio y actividades entre un lunes y el siguiente.",
  },
];

const MALLA_AREAS = [
  {
    id: "area-biblia",
    icon: "BookOpen",
    title: "Estudios Bíblicos",
    description: "La Escritura como centro de la formación.",
    order: 0,
    visible: true,
  },
  {
    id: "area-ministerio",
    icon: "Heart",
    title: "Formación Ministerial",
    description: "Preparación para el servicio en la Iglesia.",
    order: 1,
    visible: true,
  },
  {
    id: "area-teologia",
    icon: "GraduationCap",
    title: "Área Teológica y General",
    description: "Fundamentos teológicos y formación complementaria.",
    order: 2,
    visible: true,
  },
  {
    id: "area-progresion",
    icon: "Calendar",
    title: "Progresión",
    description:
      "Cada semestre construye sobre el anterior, en una formación organizada a lo largo del programa.",
    order: 3,
    visible: false,
  },
];

const HOME_ADMISSION_STEPS = [
  {
    id: "adm-1",
    step: 1,
    title: "Conoce",
    description: "Revisa la formación y el calendario.",
    icon: "BookOpen",
  },
  {
    id: "adm-2",
    step: 2,
    title: "Postula",
    description: "Completa tu solicitud en línea.",
    icon: "FilePen",
  },
  {
    id: "adm-3",
    step: 3,
    title: "Evaluación",
    description: "Revisamos tu postulación.",
    icon: "Users",
  },
  {
    id: "adm-4",
    step: 4,
    title: "Matrícula",
    description: "Formalizas tu ingreso.",
    icon: "GraduationCap",
  },
  {
    id: "adm-5",
    step: 5,
    title: "Inicio de clases",
    description: "Comienzas la formación.",
    icon: "Calendar",
  },
];

function heroSettings(existing: Record<string, unknown> | undefined): Record<string, unknown> {
  return {
    ...(existing ?? {}),
    variant: "sem_premium",
    eyebrow: "SEMINARIO ECLESIÁSTICO MAYOR",
    title: "Tu llamado merece\npreparación.",
    highlight: "preparación.",
    description: "Formación bíblica para un servicio real.",
    primaryCta: { label: "Postular", href: "/admision" },
    secondaryCta: { label: "Cómo se estudia", href: "/como-se-estudia" },
    generationCard: { enabled: false },
    features: [
      { icon: "monitor", title: "100% online", description: "Formación completamente en línea" },
      { icon: "video", title: "Clases en vivo cada lunes", description: "Nos encontramos el lunes" },
      { icon: "book", title: "Plataforma académica", description: "Estudio y actividades en la semana" },
    ],
  };
}

export function applySemPublicHome(page: PortalPageModel): PortalPageModel {
  if (!isSemTenant(page.tenantId) || page.slug !== "/") return page;

  const current = new Map<BlockType, PageBlock>();
  for (const item of page.blocks) {
    if (!current.has(item.type)) current.set(item.type, item);
  }

  const hero = current.get("hero");
  const offer = current.get("academic_offer");
  const admission = current.get("admission_process");
  const cta = current.get("cta_premium");

  const blocks: PageBlock[] = [
    {
      id: hero?.id ?? "sem-hero",
      type: "hero",
      visible: true,
      order: 0,
      settings: heroSettings(hero?.settings as Record<string, unknown> | undefined),
    },
    block("text", 1, { variant: "sem_narrative" }),
    block("modality", 2, {
      overline: "Cómo se estudia",
      title: "Nos encontramos el lunes. Seguimos creciendo toda la semana.",
      subtitle: "",
      description: "",
      destinationBadge: "",
      buttonLabel: "Ver cómo se estudia",
      buttonHref: "/como-se-estudia",
      items: STUDY_ITEMS,
    }),
    block("feature_grid", 3, {
      overline: "Malla curricular",
      title: "4 años · 8 semestres · 3 áreas formativas",
      description: "",
      buttonLabel: "Ver malla",
      buttonHref: "/malla",
      features: MALLA_AREAS,
    }),
    {
      id: offer?.id ?? "sem-offer",
      type: "academic_offer",
      visible: true,
      order: 4,
      settings: {
        ...(offer?.settings ?? {}),
        overline: "Programas",
        title: "Estudia. Crece. Sirve.",
        description: "La oferta formativa del Seminario Eclesiástico Mayor.",
        pageSize: 12,
        showPagination: false,
        showHelpCta: false,
        cardMode: "published",
        query: {
          collection: "academy_programs",
          limit: 12,
          sort: { field: "order", direction: "asc" },
        },
      },
    },
    block("presentation", 5, {
      overline: "Nuestra identidad institucional",
      title: "Somos parte de IPN Chile",
      subtitle: "Iglesia Pentecostal Nazareth.",
      description:
        "El Seminario Eclesiástico Mayor forma parte de IPN Chile — Iglesia Pentecostal Nazareth. Formación bíblica para un servicio real.",
    }),
    {
      id: admission?.id ?? "sem-admission",
      type: "admission_process",
      visible: true,
      order: 6,
      settings: {
        ...(admission?.settings ?? {}),
        overline: "Admisión",
        title: "Prepárate hoy para servir mañana.",
        description: "",
        items: HOME_ADMISSION_STEPS,
        buttons: [
          {
            id: "adm-postular",
            label: "Postular",
            action: { type: "url", href: "/admision" },
            variant: "primary",
            visible: true,
          },
        ],
      },
    },
    {
      id: cta?.id ?? "sem-cta",
      type: "cta_premium",
      visible: true,
      order: 7,
      settings: {
        ...(cta?.settings ?? {}),
        overline: "",
        title: "Más que aprender, servir mejor.",
        description: "Una formación bíblica para una vida de servicio.",
        showStats: false,
        buttons: [
          {
            id: "cta-admision",
            label: "Conoce Admisión",
            action: { type: "url", href: "/admision" },
            variant: "primary",
            visible: true,
          },
        ],
      },
    },
  ];

  return {
    ...page,
    title: "Inicio",
    seo: {
      ...page.seo,
      title: "Tu llamado merece preparación",
      description:
        "Formación bíblica para un servicio real. Seminario Eclesiástico Mayor de IPN Chile — Iglesia Pentecostal Nazareth.",
    },
    blocks,
  };
}

function editorial(slug: string, title: string, blocks: PageBlock[]): PortalPageModel {
  return {
    slug,
    title,
    blocks,
    seo: {
      title,
      description: "Formación bíblica para un servicio real.",
    },
    tenantId: "seminario-ipn",
  };
}

export function semEditorialPage(slug: string, tenantId: string): PortalPageModel | null {
  if (!isSemTenant(tenantId)) return null;

  if (slug === "/como-se-estudia") {
    return editorial(slug, "Cómo se estudia", [
      block("modality", 0, {
        overline: "Modalidad",
        title: "Nos encontramos el lunes. Seguimos creciendo toda la semana.",
        description:
          "100% online. Clases en vivo cada lunes. Plataforma académica online. Estudio y actividades durante la semana.",
        items: STUDY_ITEMS,
      }),
      block("cta_premium", 1, {
        title: "Más que aprender, servir mejor.",
        description: "Una formación bíblica para una vida de servicio.",
        showStats: false,
        buttons: [
          {
            id: "study-apply",
            label: "Postular",
            action: { type: "url", href: "/admision" },
            variant: "primary",
            visible: true,
          },
        ],
      }),
    ]);
  }

  if (slug === "/malla") {
    return editorial(slug, "Malla y formación", [
      block("text", 0, {
        overline: "Malla curricular",
        title: "Una formación integral y progresiva.",
        body: "La propuesta se organiza en cuatro años y ocho semestres, en tres áreas formativas. Esta página no publica un listado de asignaturas: ese detalle queda pendiente de validación institucional.",
      }),
      block("feature_grid", 1, {
        overline: "Áreas",
        title: "4 años. 8 semestres. Un mismo propósito.",
        description: "Tres áreas formativas, sin inventar el detalle de cada asignatura.",
        features: MALLA_AREAS,
      }),
    ]);
  }

  // Fallback temporal: si el CMS publica bloques, loadPublishedPage los usa antes que esto.
  if (slug === "/institucion") {
    return editorial(slug, "El SEM", [
      block("presentation", 0, {
        overline: "El SEM",
        title: "Formación que transforma conocimiento en servicio.",
        subtitle: SEM_AFFILIATION,
        description:
          "El Seminario Eclesiástico Mayor forma parte de IPN Chile — Iglesia Pentecostal Nazareth. Formación bíblica para un servicio real. Más que aprender, servir mejor.",
      }),
      block("modality", 1, {
        overline: "Cómo se estudia",
        title: "Nos encontramos el lunes. Seguimos creciendo toda la semana.",
        description: "100% online, con clases en vivo cada lunes y estudio durante la semana.",
        items: STUDY_ITEMS,
        buttonLabel: "Cómo se estudia",
        buttonHref: "/como-se-estudia",
      }),
    ]);
  }

  return null;
}
