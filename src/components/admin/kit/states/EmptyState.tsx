import { Button } from "@/components/ui/button";
import { aek } from "@/components/admin/kit/utils/tokens";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
  icon?: ReactNode;
  className?: string;
}

/** Estado vacío con CTA opcional. */
export function EmptyState({ title, description, action, icon, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        aek.surfaceMuted,
        "flex flex-col items-center justify-center px-6 py-12 text-center",
        className
      )}
    >
      {icon ? <div className="mb-4 text-muted">{icon}</div> : null}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description ? <p className={cn(aek.meta, "mt-2 max-w-md")}>{description}</p> : null}
      {action ? (
        <div className="mt-4">
          <Button
            size="sm"
            href={action.href}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
