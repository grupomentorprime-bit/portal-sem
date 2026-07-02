/**
 * @deprecated
 *
 * Reemplazado por:
 * PortalSectionHeader
 *
 * Eliminación prevista:
 * Core UI v2.0
 *
 * @see docs/frontend/CORE-UI-CANON.md
 */

import { cn } from "@/lib/utils";

interface SectionTitleProps {
  overline?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionTitle({
  overline,
  title,
  description,
  align = "left",
  className,
}: SectionTitleProps) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {overline ? (
        <p className="text-caption font-semibold uppercase tracking-widest text-secondary">
          {overline}
        </p>
      ) : null}
      <h2 className={cn("text-display-l text-foreground", overline && "mt-2")}>
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-body text-muted">{description}</p>
      ) : null}
    </div>
  );
}
