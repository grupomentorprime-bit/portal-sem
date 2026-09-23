import { SEM_CONTACT_PENDING } from "@/lib/portal/sem-identity-v7";
import { Globe, Mail } from "lucide-react";
import { FooterSectionHeading } from "@/components/portal/layout/footer/FooterSectionHeading";
import { FooterExperienceLink } from "@/components/portal/experience/footer-premium/FooterExperienceLink";
import { iconSizes } from "@/design";
import type { FooterContactResolved } from "@/lib/portal/footer-content";
import { cn } from "@/lib/utils";

interface FooterContactColumnProps {
  contact: FooterContactResolved;
  className?: string;
}

export function FooterContactColumn({ contact, className }: FooterContactColumnProps) {
  const email = contact.email?.trim() ?? "";
  const website = contact.website?.trim() ?? "";

  if (!email && !website) {
    return (
      <div className={cn("footer-premium__column footer-premium__column--contact", className)}>
        <FooterSectionHeading title={contact.title || "Contacto"} />
        <p className="footer-premium__contact-pending">{SEM_CONTACT_PENDING}</p>
      </div>
    );
  }

  return (
    <div className={cn("footer-premium__column footer-premium__column--contact", className)}>
      <FooterSectionHeading title={contact.title} />
      <ul className="footer-premium__contact-list">
        <li className="footer-premium__contact-item">
          <Mail size={iconSizes.sm} strokeWidth={1.75} className="footer-premium__contact-icon" aria-hidden />
          <FooterExperienceLink
            action={{ type: "email", address: contact.email }}
            className="footer-premium__contact-link"
          >
            {contact.email}
          </FooterExperienceLink>
        </li>
        <li className="footer-premium__contact-item">
          <Globe size={iconSizes.sm} strokeWidth={1.75} className="footer-premium__contact-icon" aria-hidden />
          <FooterExperienceLink
            action={{ type: "url", href: contact.websiteHref, newTab: true }}
            className="footer-premium__contact-link"
          >
            {contact.website}
          </FooterExperienceLink>
        </li>
      </ul>
    </div>
  );
}
