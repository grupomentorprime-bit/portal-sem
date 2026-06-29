"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import { focusRing } from "./shared";

interface AccordionItemProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function AccordionItem({
  title,
  children,
  defaultOpen = false,
  className,
}: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = `accordion-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className={cn("border-b border-border", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center justify-between py-4 text-left text-sm font-medium text-foreground transition-colors duration-[var(--transition-fast)] hover:text-secondary",
          focusRing
        )}
      >
        {title}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted transition-transform duration-[var(--transition-fast)]",
            open && "rotate-180"
          )}
          strokeWidth={2}
          aria-hidden
        />
      </button>
      <div
        id={panelId}
        role="region"
        hidden={!open}
        className={cn(
          "overflow-hidden pb-4 text-sm text-muted",
          open && "animate-slide-up"
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function Accordion({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-[var(--radius-lg)] border border-border", className)}>
      <div className="px-4">{children}</div>
    </div>
  );
}
