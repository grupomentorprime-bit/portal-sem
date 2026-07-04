import { aek } from "@/components/admin/kit/utils/tokens";
import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

export interface FormSectionProps extends HTMLAttributes<HTMLElement> {
  title: string;
  description?: string;
  children: ReactNode;
}

/** Bloque de formulario con título y descripción. */
export function FormSection({ title, description, children, className, ...props }: FormSectionProps) {
  return (
    <section className={cn(aek.sectionGap, className)} {...props}>
      <div>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        {description ? <p className={cn(aek.meta, "mt-1")}>{description}</p> : null}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
