import type { PortalFooterNavSection } from "@/types/footer-premium";
import { FooterSectionHeading } from "@/components/portal/layout/footer/FooterSectionHeading";
import { FooterExperienceLink } from "@/components/portal/experience/footer-premium/FooterExperienceLink";
import { cn } from "@/lib/utils";

interface FooterColumnsProps {
  sections: PortalFooterNavSection[];
  className?: string;
}

export function FooterColumns({ sections, className }: FooterColumnsProps) {
  return (
    <div className={cn("footer-premium__columns", className)}>
      {sections.map((section) => (
        <div key={section.id} className="footer-premium__column">
          <FooterSectionHeading title={section.title} />
          <ul className="footer-premium__links">
            {section.links.map((link) => (
              <li key={link.id}>
                <FooterExperienceLink
                  action={link.action}
                  highlighted={link.highlighted}
                  className={cn(
                    "footer-premium__link",
                    link.highlighted && "footer-premium__link--highlight"
                  )}
                >
                  {link.label}
                </FooterExperienceLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
