import Link from "next/link";
import { ArrowRight, Megaphone } from "lucide-react";
import { iconSizes } from "@/design";
import { focusRing } from "@/components/ui/shared";
import type { InstitutionalNoticeItem } from "@/types/content";
import { cn } from "@/lib/utils";
import { PortalCard } from "./PortalCard";
import { CardMedia } from "./CardMedia";

interface InstitutionalNoticeCardProps {
  notice: InstitutionalNoticeItem;
  variant?: "card" | "featured" | "banner";
  ctaLabel?: string;
}

export function InstitutionalNoticeCard({
  notice,
  variant = "card",
  ctaLabel,
}: InstitutionalNoticeCardProps) {
  const featured = variant === "featured";
  const banner = variant === "banner";

  return (
    <article className={cn("group", banner ? "col-span-full" : "h-full")}>
      <Link href={notice.href} className={cn("block", !banner && "h-full", focusRing)}>
        <PortalCard
          className={cn(
            "overflow-hidden p-0 transition-shadow hover:shadow-md",
            banner
              ? "flex flex-col gap-0 bg-primary/5 sm:flex-row"
              : featured
                ? "eco-notice-featured flex h-full flex-col"
                : "flex h-full flex-col"
          )}
        >
          {notice.image ? (
            <CardMedia
              src={notice.image}
              alt={notice.title}
              className={cn(banner ? "sm:w-72 shrink-0" : undefined)}
              sizes={banner ? "288px" : "400px"}
            />
          ) : banner ? (
            <div className="flex items-center justify-center bg-primary/10 p-8 sm:w-48 shrink-0">
              <Megaphone className="text-primary" size={40} strokeWidth={1.5} aria-hidden />
            </div>
          ) : null}
          <div className={cn("flex flex-1 flex-col p-6", banner && "justify-center")}>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {notice.categoryLabel ? (
                <span className="rounded-full bg-background-soft px-2.5 py-0.5 text-caption font-medium text-muted">
                  {notice.categoryLabel}
                </span>
              ) : null}
              {notice.featured ? (
                <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-caption font-medium text-accent">
                  Destacado
                </span>
              ) : null}
              {notice.publishedAtLabel ? (
                <time className="text-caption text-muted" dateTime={notice.publishedAt}>
                  {notice.publishedAtLabel}
                </time>
              ) : null}
            </div>
            <h3
              className={cn(
                "text-foreground group-hover:text-secondary",
                banner ? "text-heading-lg" : "text-heading"
              )}
            >
              {notice.title}
            </h3>
            {notice.summary ? (
              <p className={cn("mt-2 text-body text-muted", banner ? "line-clamp-3" : "line-clamp-2 flex-1")}>
                {notice.summary}
              </p>
            ) : null}
            {ctaLabel ?? notice.ctaLabel ? (
              <span className="mt-4 inline-flex items-center gap-1 text-caption font-medium text-secondary group-hover:text-accent">
                {ctaLabel ?? notice.ctaLabel ?? "Leer aviso"}
                <ArrowRight size={iconSizes.sm} strokeWidth={2} aria-hidden />
              </span>
            ) : null}
          </div>
        </PortalCard>
      </Link>
    </article>
  );
}
