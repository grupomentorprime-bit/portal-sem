import { Star } from "lucide-react";
import { iconSizes } from "@/design";
import type { TestimonialItem } from "@/types/content";
import { PortalCard } from "@/components/portal/cards/PortalCard";
import { TestimonialAvatar } from "@/components/portal/institution/TestimonialAvatar";

interface TestimonialCardProps {
  testimonial: TestimonialItem;
  /** Home editorial — cita protagonista, sin placeholder genérico */
  editorial?: boolean;
}

function isGenericPlaceholderImage(src?: string): boolean {
  if (!src?.trim()) return true;
  return /gallery-4\.svg|placeholder/i.test(src);
}

function RatingStars({ rating }: { rating: number }) {
  const value = Math.min(5, Math.max(0, Math.round(rating)));
  if (value <= 0) return null;

  return (
    <div className="flex gap-0.5" role="img" aria-label={`Calificación: ${value} de 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={iconSizes.sm}
          strokeWidth={2}
          className={index < value ? "fill-accent text-accent" : "text-border"}
          aria-hidden
        />
      ))}
    </div>
  );
}

export function TestimonialCard({ testimonial, editorial = false }: TestimonialCardProps) {
  const avatarSrc = isGenericPlaceholderImage(testimonial.image) ? undefined : testimonial.image;

  if (editorial) {
    return (
      <article className="trust-testimonial trust-testimonial--editorial group h-full">
        <PortalCard className="trust-testimonial__card trust-testimonial__card--editorial flex h-full flex-col p-0">
          <blockquote className="trust-testimonial__quote flex-1">
            <p className="trust-testimonial__quote-text text-body leading-relaxed text-foreground">
              &ldquo;{testimonial.quote}&rdquo;
            </p>
          </blockquote>
          <footer className="trust-testimonial__author flex items-center gap-3 border-t border-border px-6 py-5">
            <TestimonialAvatar
              src={avatarSrc}
              name={testimonial.author}
              className="trust-testimonial__avatar"
            />
            <div className="min-w-0 flex-1">
              <cite className="trust-testimonial__author-name not-italic text-heading text-foreground">
                {testimonial.author}
              </cite>
              {testimonial.role ? (
                <p className="trust-testimonial__author-role mt-0.5 text-caption font-semibold">
                  {testimonial.role}
                </p>
              ) : null}
              {testimonial.program ? (
                <p className="trust-testimonial__author-meta mt-0.5 text-caption text-muted">
                  {testimonial.program}
                </p>
              ) : null}
            </div>
          </footer>
        </PortalCard>
      </article>
    );
  }

  return (
    <article className="trust-testimonial group h-full">
      <PortalCard className="trust-testimonial__card flex h-full flex-col p-6">
        <div className="flex items-start gap-4">
          <TestimonialAvatar
            src={avatarSrc}
            name={testimonial.author}
          />
          <div className="min-w-0 flex-1">
            <h3 className="text-heading text-foreground">{testimonial.author}</h3>
            {testimonial.role ? (
              <p className="mt-1 text-caption text-muted">{testimonial.role}</p>
            ) : null}
            {testimonial.program ? (
              <p className="mt-0.5 text-caption text-secondary">{testimonial.program}</p>
            ) : null}
            {testimonial.rating ? (
              <div className="mt-2">
                <RatingStars rating={testimonial.rating} />
              </div>
            ) : null}
          </div>
        </div>
        <blockquote className="mt-6 flex-1">
          <p className="text-body leading-relaxed text-foreground">
            &ldquo;{testimonial.quote}&rdquo;
          </p>
        </blockquote>
      </PortalCard>
    </article>
  );
}
