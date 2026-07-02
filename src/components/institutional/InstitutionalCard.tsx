/**
 * @deprecated
 *
 * Reemplazado por:
 * portal/cards/PortalCard
 *
 * Eliminación prevista:
 * Core UI v2.0
 *
 * @see docs/frontend/CORE-UI-CANON.md
 */

import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

interface InstitutionalCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  interactive?: boolean;
}

export function InstitutionalCard({
  children,
  interactive = true,
  className,
  ...props
}: InstitutionalCardProps) {
  return (
    <div
      className={cn(
        "institutional-card p-6",
        interactive && "cursor-default",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
