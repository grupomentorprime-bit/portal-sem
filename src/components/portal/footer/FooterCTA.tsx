"use client";

import { PortalContainer } from "@/components/portal/layout/PortalContainer";
import { ExperienceActionButton } from "@/components/portal/experience/ExperienceActionButton";
import type { FooterCtaContent } from "@/lib/portal/footer-content";
import { cn } from "@/lib/utils";

interface FooterCTAProps {
  content: FooterCtaContent;
  className?: string;
}

export function FooterCTA({ content, className }: FooterCTAProps) {
  return (
    <section
      className={cn("footer-premium__cta", className)}
      aria-labelledby="footer-cta-heading"
    >
      <PortalContainer className="footer-premium__cta-inner">
        <div className="footer-premium__cta-copy">
          <p className="footer-premium__cta-eyebrow">{content.eyebrow}</p>
          <h2 id="footer-cta-heading" className="footer-premium__cta-title">
            {content.title}
          </h2>
          <p className="footer-premium__cta-description">{content.description}</p>
        </div>
        <div className="footer-premium__cta-actions">
          <ExperienceActionButton
            label={content.primaryLabel}
            action={content.primaryAction}
            variant="primary"
            size="lg"
            inverse
            className="footer-premium__cta-btn footer-premium__cta-btn--primary"
          />
          <ExperienceActionButton
            label={content.secondaryLabel}
            action={content.secondaryAction}
            variant="outline"
            size="lg"
            inverse
            className="footer-premium__cta-btn footer-premium__cta-btn--secondary"
          />
        </div>
      </PortalContainer>
    </section>
  );
}
