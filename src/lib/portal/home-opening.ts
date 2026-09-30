import { isSemTenant } from "@/core/tenant/is-sem";
import { SEM_AFFILIATION, SEM_HERO_COPY } from "@/lib/portal/sem-identity-v7";

/**
 * Apertura fotográfica del home.
 * El componente no conoce al SEM: cada Espacio entrega su propio modelo.
 * `mediaId` apunta a la biblioteca del CMS. Mientras no haya fotografía
 * del Espacio, se usa `provisionalSrc`.
 */
export interface HomeOpeningImage {
  mediaId?: string;
  provisionalSrc: string;
  alt: string;
}

export interface HomeOpeningLink {
  label: string;
  href: string;
}

export interface HomeOpeningContent {
  hero: {
    eyebrow: string;
    title: string;
    highlight: string;
    lead: string;
    affiliation: string;
    primary: HomeOpeningLink;
    secondary: HomeOpeningLink;
    image: HomeOpeningImage;
  };
  pillars: Array<{
    id: string;
    title: string;
    text: string;
    icon: "book" | "path" | "service";
  }>;
  presentation: {
    kicker: string;
    title: string;
    highlight: string;
    lead: string;
    link: HomeOpeningLink;
    images: [HomeOpeningImage, HomeOpeningImage, HomeOpeningImage];
  };
  lines: {
    kicker: string;
    title: string;
    items: Array<{
      id: string;
      index: string;
      title: string;
      text: string;
      link: HomeOpeningLink;
      image: HomeOpeningImage;
      tone: "primary" | "secondary";
    }>;
  };
}

export interface ResolvedHomeOpeningImage {
  src: string;
  alt: string;
  provisional: boolean;
  mediaId?: string;
}

export interface ResolvedHomeOpening
  extends Omit<HomeOpeningContent, "hero" | "presentation" | "lines"> {
  hero: Omit<HomeOpeningContent["hero"], "image"> & {
    image: ResolvedHomeOpeningImage;
    photos: ResolvedHomeOpeningImage[];
  };
  presentation: Omit<HomeOpeningContent["presentation"], "images"> & {
    images: [ResolvedHomeOpeningImage, ResolvedHomeOpeningImage, ResolvedHomeOpeningImage];
  };
  lines: Omit<HomeOpeningContent["lines"], "items"> & {
    items: Array<
      Omit<HomeOpeningContent["lines"]["items"][number], "image"> & {
        image: ResolvedHomeOpeningImage;
      }
    >;
  };
}

const PROVISIONAL = "/images/provisional";

/**
 * Respaldo del Espacio SEM con frases ya cerradas.
 * No es la fuente si el modelo del tenant trae otro texto o un mediaId.
 */
const SEM_HOME_OPENING: HomeOpeningContent = {
  hero: {
    eyebrow: "Seminario Eclesiástico Mayor",
    title: SEM_HERO_COPY.title,
    highlight: SEM_HERO_COPY.highlight,
    lead: SEM_HERO_COPY.description,
    affiliation: SEM_AFFILIATION,
    primary: { label: "Admisión 2027", href: "/admision" },
    secondary: { label: "Cómo estudiamos", href: "/como-estudiamos" },
    image: {
      provisionalSrc: `${PROVISIONAL}/home-hero.jpg`,
      alt: "",
    },
  },
  pillars: [
    {
      id: "palabra",
      title: "Palabra",
      text: "Formación bíblica para un servicio real.",
      icon: "book",
    },
    {
      id: "formacion",
      title: "Formación",
      text: "Línea principal. Un programa.",
      icon: "path",
    },
    {
      id: "servicio",
      title: "Servicio",
      text: "Más que aprender, servir mejor.",
      icon: "service",
    },
  ],
  presentation: {
    kicker: "El SEM",
    title: "Formación bíblica para un servicio real.",
    highlight: "servicio real.",
    lead: "Más que aprender, servir mejor.",
    link: { label: "Quiénes somos", href: "/el-sem/quienes-somos" },
    images: [
      {
        provisionalSrc: `${PROVISIONAL}/home-about-main.jpg`,
        alt: "",
      },
      {
        provisionalSrc: `${PROVISIONAL}/home-about-top.jpg`,
        alt: "",
      },
      {
        provisionalSrc: `${PROVISIONAL}/home-about-bottom.jpg`,
        alt: "",
      },
    ],
  },
  lines: {
    kicker: "Formación",
    title: "Líneas de formación",
    items: [
      {
        id: "educacion-teologica",
        index: "01",
        title: "Educación Teológica",
        text: "Línea principal. Un programa.",
        link: {
          label: "Educación Teológica",
          href: "/formacion/educacion-teologica",
        },
        image: {
          provisionalSrc: `${PROVISIONAL}/home-line-primary.jpg`,
          alt: "",
        },
        tone: "primary",
      },
      {
        id: "cursos",
        index: "02",
        title: "Cursos de Formación",
        text: "Línea independiente. La oferta aparece cuando haya un curso publicado.",
        link: { label: "Cursos de Formación", href: "/formacion/cursos" },
        image: {
          provisionalSrc: `${PROVISIONAL}/home-line-secondary.jpg`,
          alt: "",
        },
        tone: "secondary",
      },
    ],
  },
};

export function homeOpeningForTenant(tenantId: string): HomeOpeningContent | null {
  if (!isSemTenant(tenantId)) return null;
  return SEM_HOME_OPENING;
}
