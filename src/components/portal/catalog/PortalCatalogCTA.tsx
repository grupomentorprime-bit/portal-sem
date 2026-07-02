import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { iconSizes } from "@/design";
import { focusRing } from "@/components/ui/shared";
import { cn } from "@/lib/utils";

interface PortalCatalogCTAProps {
  href: string;
  label: string;
  comingSoon?: boolean;
  className?: string;
}

export function PortalCatalogCTA({
  href,
  label,
  comingSoon = false,
  className,
}: PortalCatalogCTAProps) {
  if (comingSoon) {
    return (
      <span
        className={cn("portal-catalog-card__cta portal-catalog-card__cta--muted", className)}
        aria-disabled="true"
      >
        <span>{label}</span>
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "portal-catalog-card__cta group/cta",
        focusRing,
        className
      )}
    >
      <span>{label}</span>
      <ArrowRight
        size={iconSizes.sm}
        strokeWidth={2}
        className="portal-catalog-card__cta-icon"
        aria-hidden
      />
    </Link>
  );
}
