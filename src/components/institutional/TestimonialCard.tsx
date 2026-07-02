/**
 * @deprecated
 *
 * Reemplazado por:
 * portal/cards/TestimonialCard
 *
 * Eliminación prevista:
 * Core UI v2.0
 *
 * @see docs/frontend/CORE-UI-CANON.md
 */

import { Quote } from "lucide-react";
import { iconSizes } from "@/design";
import type { TestimonialItem } from "@/lib/institutional/home-content";
import { InstitutionalCard } from "./InstitutionalCard";

interface TestimonialCardProps {
  testimonial: TestimonialItem;
}

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <InstitutionalCard className="flex h-full flex-col animate-scale-in">
      <Quote
        className="mb-4 text-accent"
        size={iconSizes.lg}
        strokeWidth={2}
        aria-hidden
      />
      <blockquote className="flex-1">
        <p className="text-body text-foreground">&ldquo;{testimonial.quote}&rdquo;</p>
      </blockquote>
      <footer className="mt-6 border-t border-border pt-4">
        <cite className="not-italic">
          <p className="text-caption font-semibold text-foreground">
            {testimonial.author}
          </p>
          <p className="text-caption text-muted">{testimonial.role}</p>
        </cite>
      </footer>
    </InstitutionalCard>
  );
}
