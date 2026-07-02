import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { iconSizes } from "@/design";
import { Badge } from "@/components/ui";
import { BlockIcon } from "@/components/portal/BlockIcon";
import { focusRing } from "@/components/ui/shared";
import type { LibraryItem } from "@/types/content";
import { cn } from "@/lib/utils";
import { PortalCard } from "./PortalCard";
import { CardMedia } from "./CardMedia";

interface LibraryCardProps {
  item: LibraryItem;
  ctaLabel?: string;
}

export function LibraryCard({ item, ctaLabel }: LibraryCardProps) {
  return (
    <article className="eco-library-card group h-full">
      <Link href={item.href} className={cn("block h-full", focusRing)}>
        <PortalCard className="flex h-full flex-col overflow-hidden p-0">
          <CardMedia
            src={item.image}
            alt={item.title}
            aspect="portrait"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
          <div className="flex flex-1 flex-col p-6">
            {item.resourceType ? (
              <Badge variant="neutral" className="mb-3 w-fit">
                {item.resourceType}
              </Badge>
            ) : null}
            <h3 className="text-heading text-foreground group-hover:text-secondary">{item.title}</h3>
            {item.author ? (
              <p className="mt-1 text-caption font-medium text-secondary">{item.author}</p>
            ) : null}
            {item.description ? (
              <p className="mt-2 flex-1 text-body text-muted line-clamp-3">{item.description}</p>
            ) : (
              <div className="flex-1" />
            )}
            {ctaLabel || item.ctaLabel ? (
              <span className="mt-4 inline-flex items-center gap-1 text-caption font-medium text-secondary group-hover:text-accent">
                {ctaLabel ?? item.ctaLabel}
                <ArrowRight size={iconSizes.sm} strokeWidth={2} aria-hidden />
              </span>
            ) : null}
          </div>
        </PortalCard>
      </Link>
    </article>
  );
}

interface ResourceCardProps {
  title: string;
  description: string;
  href: string;
  resourceType?: string;
  icon?: string;
  image?: string;
  ctaLabel?: string;
}

export function ResourceCard({
  title,
  description,
  href,
  resourceType,
  icon = "BookOpen",
  image,
  ctaLabel = "Consultar recurso",
}: ResourceCardProps) {
  return (
    <article className="eco-resource-card group h-full">
      <Link href={href} className={cn("block h-full", focusRing)}>
        <PortalCard className="flex h-full flex-col overflow-hidden p-0">
          {image ? (
            <CardMedia src={image} alt={title} aspect="video" sizes="(max-width: 768px) 100vw, 50vw" />
          ) : (
            <div className="flex aspect-[16/10] items-center justify-center bg-accent/10">
              <BlockIcon name={icon} size={iconSizes.xl} className="text-secondary/50" strokeWidth={1.5} />
            </div>
          )}
          <div className="flex flex-1 flex-col p-6">
            {resourceType ? (
              <Badge variant="info" className="mb-3 w-fit">
                {resourceType}
              </Badge>
            ) : null}
            <h3 className="text-heading text-foreground group-hover:text-secondary">{title}</h3>
            {description ? (
              <p className="mt-2 flex-1 text-body text-muted line-clamp-3">{description}</p>
            ) : (
              <div className="flex-1" />
            )}
            <span className="mt-4 inline-flex items-center gap-1 text-caption font-medium text-secondary group-hover:text-accent">
              {ctaLabel}
              <ArrowRight size={iconSizes.sm} strokeWidth={2} aria-hidden />
            </span>
          </div>
        </PortalCard>
      </Link>
    </article>
  );
}
