export type HeroVariant = "default" | "sem_premium";

export interface HeroCta {
  label: string;
  href: string;
}

export interface HeroGenerationCard {
  enabled: boolean;
  icon?: string;
  label: string;
  subtitle?: string;
  year: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
}

export interface HeroFeature {
  icon: string;
  title: string;
  description: string;
}

export interface SemPremiumHeroSettings {
  variant?: HeroVariant;
  eyebrow?: string;
  title?: string;
  highlight?: string;
  description?: string;
  primaryCta?: HeroCta;
  secondaryCta?: HeroCta;
  heroMediaId?: string;
  heroImage?: string;
  imageAlt?: string;
  generationCard?: HeroGenerationCard;
  features?: HeroFeature[];
}
