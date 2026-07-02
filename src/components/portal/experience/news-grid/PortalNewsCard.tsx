import Link from "next/link";
import { focusRing } from "@/components/ui/shared";
import type { PortalNewsCardData } from "@/types/news-grid";
import { cn } from "@/lib/utils";
import { PortalCard } from "@/components/portal/cards/PortalCard";
import { PortalNewsCTA } from "./PortalNewsCTA";
import { PortalNewsImage } from "./PortalNewsImage";
import { PortalNewsMeta } from "./PortalNewsMeta";

interface PortalNewsCardProps {
  item: PortalNewsCardData;
  ctaLabel?: string;
  priorityImage?: boolean;
  staggerIndex?: number;
  className?: string;
}

export function PortalNewsCard({
  item,
  ctaLabel = "Leer más",
  priorityImage = false,
  staggerIndex = 0,
  className,
}: PortalNewsCardProps) {
  const titleId = `news-card-${item.id}-title`;

  return (
    <article
      className={cn(
        "portal-news-card group h-full",
        staggerIndex > 0 && `portal-news-card--stagger-${Math.min(staggerIndex, 6)}`,
        className
      )}
      aria-labelledby={titleId}
      data-cursor="card"
    >
      <Link href={item.href} className={cn("block h-full", focusRing)}>
        <PortalCard className="portal-news-card__card flex h-full flex-col overflow-hidden p-0">
          <PortalNewsImage
            src={item.image}
            alt={item.title}
            priority={priorityImage}
          />
          <div className="flex flex-1 flex-col p-5 sm:p-6">
            <PortalNewsMeta
              category={item.category}
              date={item.date}
              author={item.author}
              readTime={item.readTime}
              featured={item.featured}
              className="mb-3"
            />
            <h3
              id={titleId}
              className="portal-news-card__title text-heading text-foreground"
            >
              {item.title}
            </h3>
            {item.excerpt ? (
              <p className="portal-news-card__excerpt mt-2 flex-1 text-body text-muted line-clamp-3">
                {item.excerpt}
              </p>
            ) : (
              <div className="flex-1" />
            )}
            <div className="mt-4 border-t border-border pt-4">
              <PortalNewsCTA label={ctaLabel} />
            </div>
          </div>
        </PortalCard>
      </Link>
    </article>
  );
}
