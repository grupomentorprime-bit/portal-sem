import { iconSizes } from "@/design";
import { BlockIcon } from "@/components/portal/BlockIcon";
import { cn } from "@/lib/utils";

interface PortalCatalogBadgeProps {
  label: string;
  icon?: string;
  tone?: "default" | "coming-soon" | "featured";
  className?: string;
}

export function PortalCatalogBadge({
  label,
  icon = "BookOpen",
  tone = "default",
  className,
}: PortalCatalogBadgeProps) {
  if (!label.trim()) return null;

  return (
    <span
      className={cn(
        "portal-catalog-card__badge",
        tone !== "default" && `portal-catalog-card__badge--${tone}`,
        className
      )}
    >
      <BlockIcon name={icon} size={iconSizes.sm} strokeWidth={2} aria-hidden />
      <span>{label}</span>
    </span>
  );
}
