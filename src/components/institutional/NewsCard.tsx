/**
 * @deprecated
 *
 * Reemplazado por:
 * portal/cards/NewsCard
 *
 * Eliminación prevista:
 * Core UI v2.0
 *
 * @see docs/frontend/CORE-UI-CANON.md
 */

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar } from "lucide-react";
import { iconSizes } from "@/design";
import { Badge } from "@/components/ui";
import type { NewsItem } from "@/lib/institutional/home-content";
import { InstitutionalCard } from "./InstitutionalCard";

interface NewsCardProps {
  news: NewsItem;
}

export function NewsCard({ news }: NewsCardProps) {
  return (
    <Link href={news.href} className="group block h-full">
      <InstitutionalCard className="flex h-full flex-col overflow-hidden p-0 animate-scale-in">
        <div className="relative aspect-[16/10] overflow-hidden bg-background-soft">
          {news.image ? (
            <Image
              src={news.image}
              alt=""
              fill
              className="object-cover transition-transform duration-[var(--transition-slow)] group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-primary/5">
              <Calendar size={iconSizes.xl} className="text-secondary/40" strokeWidth={2} />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-6">
          <div className="mb-3 flex items-center justify-between gap-2">
            <Badge variant="info">{news.category}</Badge>
            <time className="text-caption text-muted">{news.date}</time>
          </div>
          <h3 className="text-heading text-foreground">{news.title}</h3>
          <p className="mt-2 flex-1 text-body text-muted">{news.excerpt}</p>
          <span className="mt-4 flex items-center gap-1 text-caption font-medium text-secondary group-hover:text-accent">
            Leer más
            <ArrowRight size={iconSizes.sm} strokeWidth={2} aria-hidden />
          </span>
        </div>
      </InstitutionalCard>
    </Link>
  );
}
