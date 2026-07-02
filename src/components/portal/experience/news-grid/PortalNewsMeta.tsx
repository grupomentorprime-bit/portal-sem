import { Clock, User } from "lucide-react";
import { iconSizes } from "@/design";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

interface PortalNewsMetaProps {
  category?: string;
  date?: string;
  author?: string;
  readTime?: string;
  featured?: boolean;
  className?: string;
}

export function PortalNewsMeta({
  category,
  date,
  author,
  readTime,
  featured = false,
  className,
}: PortalNewsMetaProps) {
  const hasMeta = category || date || author || readTime || featured;
  if (!hasMeta) return null;

  return (
    <div className={cn("portal-news-card__meta flex flex-wrap items-center gap-2", className)}>
      {featured ? <Badge variant="success">Destacado</Badge> : null}
      {category ? <Badge variant="info">{category}</Badge> : null}
      {date ? (
        <time className="portal-news-card__date text-caption text-muted">{date}</time>
      ) : null}
      {readTime ? (
        <span className="portal-news-card__read-time inline-flex items-center gap-1 text-caption text-muted">
          <Clock size={iconSizes.sm} strokeWidth={2} aria-hidden />
          {readTime}
        </span>
      ) : null}
      {author ? (
        <span className="portal-news-card__author inline-flex items-center gap-1 text-caption text-muted">
          <User size={iconSizes.sm} strokeWidth={2} aria-hidden />
          {author}
        </span>
      ) : null}
    </div>
  );
}
