import type { ReactNode } from "react";
import { Clock, GraduationCap, Layers } from "lucide-react";
import { iconSizes } from "@/design";
import { cn } from "@/lib/utils";

interface PortalCatalogMetaProps {
  modality?: string;
  duration?: string;
  level?: string;
  variant?: "default" | "featured" | "compact" | "horizontal" | "minimal";
  className?: string;
}

interface MetaItemProps {
  icon: ReactNode;
  label: string;
}

function MetaItem({ icon, label }: MetaItemProps) {
  return (
    <li className="portal-catalog-card__meta-item">
      <span className="portal-catalog-card__meta-icon" aria-hidden>
        {icon}
      </span>
      <span>{label}</span>
    </li>
  );
}

export function PortalCatalogMeta({
  modality,
  duration,
  level,
  variant = "default",
  className,
}: PortalCatalogMetaProps) {
  const items: MetaItemProps[] = [];

  if (modality) {
    items.push({
      icon: <GraduationCap size={iconSizes.sm} strokeWidth={2} />,
      label: modality,
    });
  }
  if (duration) {
    items.push({
      icon: <Clock size={iconSizes.sm} strokeWidth={2} />,
      label: duration,
    });
  }
  if (level) {
    items.push({
      icon: <Layers size={iconSizes.sm} strokeWidth={2} />,
      label: level,
    });
  }

  if (items.length === 0) return null;

  return (
    <ul
      className={cn(
        "portal-catalog-card__meta",
        variant !== "default" && `portal-catalog-card__meta--${variant}`,
        className
      )}
      aria-label="Detalles"
    >
      {items.map((item) => (
        <MetaItem key={item.label} icon={item.icon} label={item.label} />
      ))}
    </ul>
  );
}
