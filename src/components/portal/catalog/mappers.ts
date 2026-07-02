import type { ProgramItem } from "@/types/content";
import type { PortalCatalogCardProps, PortalCatalogCardVariant } from "@/types/catalog-card";

export function programItemToCatalogCard(
  program: ProgramItem,
  options?: {
    ctaLabel?: string;
    variant?: PortalCatalogCardVariant;
    staggerIndex?: number;
    priorityImage?: boolean;
  }
): PortalCatalogCardProps {
  return {
    id: program.id,
    image: program.image,
    imageIcon: program.icon,
    title: program.title,
    description: program.description,
    badge: program.badge,
    category: program.category,
    modality: program.modality,
    duration: program.duration,
    level: program.certification,
    color: program.color,
    url: program.href,
    featured: program.featured,
    comingSoon: program.status === "coming_soon",
    disabled: false,
    ctaLabel: options?.ctaLabel,
    variant: options?.variant,
    staggerIndex: options?.staggerIndex,
    priorityImage: options?.priorityImage,
  };
}
