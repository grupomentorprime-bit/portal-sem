import { aek } from "@/components/admin/kit/utils/tokens";
import { cn } from "@/lib/utils";

export interface ActivityItem {
  id: string;
  time: string;
  label: string;
}

export interface ActivityCardProps {
  title?: string;
  items: ActivityItem[];
  className?: string;
}

/** Lista compacta de actividad reciente. */
export function ActivityCard({ title = "Actividad reciente", items, className }: ActivityCardProps) {
  return (
    <div className={cn(aek.surface, "p-4", className)}>
      <p className={aek.label}>{title}</p>
      <ul className="mt-3 space-y-0">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex gap-3 border-b border-border py-2.5 text-sm last:border-0"
          >
            <span className="w-14 shrink-0 text-xs text-muted">{item.time}</span>
            <span className="text-foreground">{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
