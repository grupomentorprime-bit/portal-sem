"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface FloatingActionsProps {
  children: ReactNode;
  className?: string;
}

/** CTA flotante inferior derecha (móvil). */
export function FloatingActions({ children, className }: FloatingActionsProps) {
  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-40 flex flex-col gap-2 lg:hidden",
        className
      )}
    >
      {children}
    </div>
  );
}

export function FloatingActionButton({
  label,
  onClick,
  href,
}: {
  label: string;
  onClick?: () => void;
  href?: string;
}) {
  return (
    <Button
      size="lg"
      href={href}
      onClick={onClick}
      className="shadow-[var(--shadow-lg)]"
      aria-label={label}
    >
      {label}
    </Button>
  );
}
