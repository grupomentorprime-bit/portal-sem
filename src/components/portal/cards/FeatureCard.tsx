import { BlockIcon } from "@/components/portal/BlockIcon";
import { iconSizes } from "@/design";
import { PortalCard } from "./PortalCard";

interface FeatureCardProps {
  title: string;
  description: string;
  icon?: string;
}

export function FeatureCard({ title, description, icon }: FeatureCardProps) {
  return (
    <PortalCard className="animate-scale-in p-6">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[var(--radius-xl)] bg-accent/15 text-secondary">
        <BlockIcon name={icon} size={iconSizes.lg} strokeWidth={2} aria-hidden />
      </div>
      <h3 className="text-heading text-foreground">{title}</h3>
      <p className="mt-2 text-body text-muted">{description}</p>
    </PortalCard>
  );
}
