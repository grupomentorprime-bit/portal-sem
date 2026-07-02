import { FooterSectionHeading } from "@/components/portal/layout/footer/FooterSectionHeading";
import type { PortalFooterNavSection } from "@/types/footer-premium";
import { cn } from "@/lib/utils";
import { FooterExperienceLink } from "./FooterExperienceLink";

interface PortalFooterNavigationProps {
  sections: PortalFooterNavSection[];
}

export function PortalFooterNavigation({ sections }: PortalFooterNavigationProps) {
  if (sections.length === 0) return null;

  return (
    <>
      {sections.map((section) => (
        <div key={section.id} className="portal-footer-premium__column">
          <FooterSectionHeading title={section.title} />
          <ul className="portal-footer-premium__links">
            {section.links.map((link) => (
              <li key={link.id}>
                <FooterExperienceLink
                  action={link.action}
                  highlighted={link.highlighted}
                  className={cn(
                    "portal-footer-premium__link",
                    link.highlighted && "portal-footer-premium__link--highlight"
                  )}
                >
                  {link.label}
                </FooterExperienceLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}
