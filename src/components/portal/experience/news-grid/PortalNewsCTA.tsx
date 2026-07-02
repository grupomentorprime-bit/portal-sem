import { ArrowRight } from "lucide-react";
import { iconSizes } from "@/design";
import { cn } from "@/lib/utils";

interface PortalNewsCTAProps {
  label: string;
  className?: string;
}

export function PortalNewsCTA({ label, className }: PortalNewsCTAProps) {
  return (
    <span className={cn("portal-news-card__cta group/cta inline-flex items-center gap-1.5", className)}>
      <span>{label}</span>
      <ArrowRight
        size={iconSizes.sm}
        strokeWidth={2}
        className="portal-news-card__cta-icon"
        aria-hidden
      />
    </span>
  );
}
