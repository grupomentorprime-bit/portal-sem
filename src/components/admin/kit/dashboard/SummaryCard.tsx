import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type SummaryCardPriority = "primary" | "secondary" | "default";

export interface SummaryCardProps {
  title: string;
  description?: string;
  href?: string;
  onClick?: () => void;
  icon?: ReactNode;
  footer?: ReactNode;
  priority?: SummaryCardPriority;
}

const priorityStyles: Record<SummaryCardPriority, string> = {
  primary:
    "border-l-[3px] border-l-primary bg-background shadow-[var(--admin-shadow-card)] hover:bg-[var(--state-info-bg)]",
  secondary:
    "border border-border bg-background shadow-[var(--admin-shadow-card)] hover:bg-background-soft",
  default:
    "border border-[var(--admin-border-subtle)] bg-background hover:bg-background-soft",
};

const iconStyles: Record<SummaryCardPriority, string> = {
  primary: "rounded-md bg-[var(--state-info-bg)] p-2 text-primary",
  secondary: "rounded-md bg-background-muted p-2 text-muted",
  default: "rounded-md p-2 text-muted",
};

/** Resumen textual con enlace o acción opcional. */
export function SummaryCard({
  title,
  description,
  href,
  onClick,
  icon,
  footer,
  priority = "secondary",
}: SummaryCardProps) {
  const body = (
    <Card
      variant="interactive"
      className={cn("h-full p-3.5 transition-colors", priorityStyles[priority])}
    >
      <CardHeader className="mb-0 space-y-0">
        <div className="flex items-start gap-3">
          {icon ? <div className={cn("shrink-0", iconStyles[priority])}>{icon}</div> : null}
          <div className="min-w-0">
            <CardTitle
              className={cn(
                "text-sm leading-snug",
                priority === "primary" ? "font-bold text-foreground" : "font-semibold"
              )}
            >
              {title}
            </CardTitle>
            {description ? (
              <CardDescription className="mt-0.5 text-xs leading-snug">{description}</CardDescription>
            ) : null}
          </div>
        </div>
      </CardHeader>
      {footer ? (
        <CardDescription className="mt-2 border-t border-border pt-2 text-xs">{footer}</CardDescription>
      ) : null}
    </Card>
  );

  if (href) return <Link href={href}>{body}</Link>;
  if (onClick) {
    return (
      <button type="button" className="block w-full text-left" onClick={onClick}>
        {body}
      </button>
    );
  }
  return body;
}
