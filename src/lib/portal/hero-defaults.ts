import type { HeroFeature, HeroGenerationCard, SemPremiumHeroSettings } from "@/types/hero";

export const DEFAULT_HERO_FEATURES: HeroFeature[] = [
  {
    icon: "video",
    title: "Clases en vivo",
    description: "100% Online",
  },
  {
    icon: "book",
    title: "Formación Integral",
    description: "Liderazgo y ministerio",
  },
  {
    icon: "award",
    title: "Certificación",
    description: "Respaldo institucional",
  },
  {
    icon: "users",
    title: "Comunidad",
    description: "Pastores y líderes",
  },
];

export const DEFAULT_GENERATION_CARD: HeroGenerationCard = {
  enabled: true,
  label: "CONFIANZA INSTITUCIONAL",
  year: "+25 años",
  description: "Formación bíblica con respaldo IPN Chile y comunidad nacional de seminaristas.",
  ctaLabel: "Conocer admisión",
  ctaHref: "/admision",
};

export const DEFAULT_SEM_PREMIUM_HERO: SemPremiumHeroSettings = {
  variant: "sem_premium",
  eyebrow: "SEMINARIO ECLESIÁSTICO MAYOR · 100% ONLINE",
  title: "Formamos líderes\npara la obra del\nministerio",
  highlight: "ministerio",
  description:
    "Excelencia académica, formación integral y acompañamiento pastoral para quienes responden al llamado de servir a la Iglesia.",
  primaryCta: {
    label: "Postular ahora",
    href: "/admision",
  },
  secondaryCta: {
    label: "Explorar programas",
    href: "/programas",
  },
  heroMediaId: "",
  heroImage: "",
  imageAlt: "Estudiante del seminario estudiando con Biblia y computador",
  generationCard: DEFAULT_GENERATION_CARD,
  features: DEFAULT_HERO_FEATURES,
};
