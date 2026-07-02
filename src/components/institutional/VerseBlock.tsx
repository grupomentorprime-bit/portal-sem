/**
 * @deprecated
 *
 * Reemplazado por:
 * VerseSectionContent
 *
 * Eliminación prevista:
 * Core UI v2.0
 *
 * @see docs/frontend/CORE-UI-CANON.md
 */

import { cn } from "@/lib/utils";
import { Quote } from "lucide-react";
import { iconSizes } from "@/design";
import { InstitutionalCard } from "./InstitutionalCard";

interface VerseBlockProps {
  text: string;
  reference: string;
  className?: string;
}

export function VerseBlock({ text, reference, className }: VerseBlockProps) {
  return (
    <InstitutionalCard
      interactive={false}
      className={cn("relative overflow-hidden bg-background-soft p-8 md:p-12", className)}
    >
      <Quote
        className="absolute top-6 left-6 text-accent opacity-30"
        size={iconSizes.xl}
        strokeWidth={2}
        aria-hidden
      />
      <blockquote className="relative">
        <p className="text-heading font-medium text-foreground italic md:text-display-l md:font-normal md:not-italic">
          &ldquo;{text}&rdquo;
        </p>
        <footer className="mt-6 text-caption font-semibold text-secondary">
          — {reference}
        </footer>
      </blockquote>
    </InstitutionalCard>
  );
}
