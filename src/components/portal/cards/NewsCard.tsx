/**
 * @deprecated
 *
 * Reemplazado por:
 * PortalNewsCard
 *
 * @see docs/core/CORE-NEWS-GRID-v1.md
 */

import type { NewsItem } from "@/types/content";
import { PortalNewsCard, newsItemToPortalNewsCard } from "@/components/portal/experience/news-grid";

interface NewsCardProps {
  news: NewsItem;
  variant?: "featured" | "compact";
  ctaLabel?: string;
}

/** @deprecated Usar PortalNewsCard */
export function NewsCard({ news, ctaLabel }: NewsCardProps) {
  return (
    <PortalNewsCard
      item={newsItemToPortalNewsCard(news)}
      ctaLabel={ctaLabel}
      className="w-full max-w-none"
    />
  );
}
