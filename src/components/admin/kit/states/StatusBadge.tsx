import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export type StatusBadgeTone =
  | "active"
  | "inactive"
  | "draft"
  | "pending"
  | "error"
  | "info"
  | "neutral";

const toneMap: Record<StatusBadgeTone, BadgeVariant> = {
  active: "success",
  inactive: "neutral",
  draft: "neutral",
  pending: "warning",
  error: "error",
  info: "info",
  neutral: "neutral",
};

const toneLabel: Record<StatusBadgeTone, string> = {
  active: "Activo",
  inactive: "Inactivo",
  draft: "Borrador",
  pending: "Pendiente",
  error: "Error",
  info: "Info",
  neutral: "Neutral",
};

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: StatusBadgeTone;
  label?: string;
}

/** Badge semántico unificado para estados administrativos. */
export function StatusBadge({ tone = "neutral", label, className, children, ...props }: StatusBadgeProps) {
  return (
    <Badge variant={toneMap[tone]} className={cn(className)} {...props}>
      {children ?? label ?? toneLabel[tone]}
    </Badge>
  );
}
