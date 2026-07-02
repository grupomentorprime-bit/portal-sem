import { cn } from "@/lib/utils";
import { PortalCard } from "./PortalCard";

interface StatCardProps {
  value: string;
  label: string;
  variant?: "default" | "inverse";
}

export function StatCard({ value, label, variant = "default" }: StatCardProps) {
  const inverse = variant === "inverse";

  return (
    <PortalCard
      className={cn(
        "trust-stat-card animate-scale-in p-8 text-center",
        inverse && "trust-stat-card--inverse border-white/10 bg-white/5"
      )}
      interactive={false}
    >
      <p
        className={cn(
          "text-display-s font-semibold",
          inverse ? "text-text-inverse" : "text-secondary"
        )}
      >
        {value}
      </p>
      <p className={cn("mt-2 text-body", inverse ? "text-text-inverse/80" : "text-muted")}>
        {label}
      </p>
    </PortalCard>
  );
}
