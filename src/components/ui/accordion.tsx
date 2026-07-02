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
  /** Índice visual (ej. 01, 02) en variantes editoriales */
  index?: number;
  /** Estilo home editorial SEM */
  editorial?: boolean;
}

export function AccordionItem({
  title,
  children,
  defaultOpen = false,
  className,
  index,
  editorial = false,
}: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = `accordion-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div
      className={cn(
        "border-b border-border",
        editorial && "faq-accordion__item",
        editorial && open && "faq-accordion__item--open",
        className
      )}
      data-open={open ? "true" : "false"}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center justify-between gap-4 text-left font-medium transition-colors duration-[var(--transition-fast)]",
          editorial
            ? "faq-accordion__trigger py-5"
            : "py-4 text-sm text-foreground hover:text-secondary",
          focusRing
        )}
      >
        <span className="faq-accordion__trigger-text">
          {editorial && index !== undefined ? (
            <span className="faq-accordion__index" aria-hidden>
              {String(index + 1).padStart(2, "0")}
            </span>
          ) : null}
          <span className={editorial ? "faq-accordion__question" : undefined}>{title}</span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-[var(--transition-fast)]",
            editorial ? "faq-accordion__chevron" : "text-muted",
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
          "overflow-hidden",
          editorial ? "faq-accordion__panel" : "pb-4 text-sm text-muted",
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
