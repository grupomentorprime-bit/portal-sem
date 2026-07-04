import { aek } from "@/components/admin/kit/utils/tokens";
import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

/** Agrupa contenido con título opcional y acciones alineadas. */
export function Section({
  title,
  description,
  actions,
  children,
  className,
  ...props
}: SectionProps) {
  return (
    <section className={cn(aek.sectionGap, className)} {...props}>
      {title || actions ? (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            {title ? <h2 className="text-base font-bold text-foreground">{title}</h2> : null}
            {description ? <p className={cn("mt-0.5 text-xs text-muted")}>{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
