/**
 * @deprecated
 *
 * Reemplazado por:
 * PortalFeatureCard
 *
 * @see docs/core/CORE-FEATURE-GRID-v1.md
 */

import { PortalFeatureCard } from "@/components/portal/experience/feature-grid/PortalFeatureCard";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  title: string;
  description: string;
  icon?: string;
  className?: string;
}

/** @deprecated Usar PortalFeatureCard */
export function FeatureCard({ title, description, icon, className }: FeatureCardProps) {
  return (
    <PortalFeatureCard
      feature={{
        id: title,
        title,
        description,
        icon,
        visible: true,
      }}
      className={className}
    />
  );
}
