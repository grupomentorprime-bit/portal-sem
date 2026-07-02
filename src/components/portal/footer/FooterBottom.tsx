import { FooterExperienceLink } from "@/components/portal/experience/footer-premium/FooterExperienceLink";
import type { FooterLegalContent } from "@/lib/portal/footer-content";
import { cn } from "@/lib/utils";

interface FooterBottomProps {
  copyright: string;
  legal: FooterLegalContent;
  className?: string;
}

export function FooterBottom({ copyright, legal, className }: FooterBottomProps) {
  return (
    <div className={cn("footer-premium__bottom", className)}>
      <div className="footer-premium__bottom-inner">
        <p className="footer-premium__copyright">
          {copyright}
          {legal.copyrightSuffix ? `. ${legal.copyrightSuffix}` : null}
        </p>
        {legal.credits ? (
          <p className="footer-premium__credits">{legal.credits}</p>
        ) : null}
        {legal.adminLabel ? (
          <FooterExperienceLink
            action={{ type: "url", href: legal.adminHref }}
            className="footer-premium__admin-link"
          >
            {legal.adminLabel}
          </FooterExperienceLink>
        ) : null}
      </div>
    </div>
  );
}
