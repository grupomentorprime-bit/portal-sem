import { PortalCard } from "./PortalCard";

interface StatCardProps {
  value: string;
  label: string;
}

export function StatCard({ value, label }: StatCardProps) {
  return (
    <PortalCard className="animate-scale-in p-6 text-center" interactive={false}>
      <p className="text-display-s font-semibold text-secondary">{value}</p>
      <p className="mt-2 text-body text-muted">{label}</p>
    </PortalCard>
  );
}
