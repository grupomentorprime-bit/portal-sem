import Image from "next/image";
import type { PortalFooterBrandView, PortalFooterSocialItem } from "@/types/footer-premium";
import type { FooterInstitutionContent } from "@/lib/portal/footer-content";
import { cn } from "@/lib/utils";
import { FooterSocial } from "./FooterSocial";

interface FooterInstitutionProps {
  brand: PortalFooterBrandView;
  institution: FooterInstitutionContent;
  social: PortalFooterSocialItem[];
  className?: string;
}

export function FooterInstitution({
  brand,
  institution,
  social,
  className,
}: FooterInstitutionProps) {
  const institutionName = brand.institutionName?.trim() || "";
  const logoSrc = brand.logoPrimary?.trim() || "";

  return (
    <div className={cn("footer-premium__institution", className)}>
      <div className="footer-premium__brand">
        <div className="footer-premium__brand-mark">
          {logoSrc ? (
            logoSrc.toLowerCase().endsWith(".svg") ? (
              <img
                src={logoSrc}
                alt=""
                className="footer-premium__brand-icon"
              />
            ) : (
              <Image
                src={logoSrc}
                alt={institutionName || "Logo institucional"}
                width={48}
                height={54}
                className="footer-premium__brand-icon"
              />
            )
          ) : null}
          {institutionName ? (
            <p className="footer-premium__institution-name">{institutionName}</p>
          ) : null}
        </div>
        {institution.tagline ? (
          <p className="footer-premium__tagline">{institution.tagline}</p>
        ) : null}
        {institution.sealLine2 ? (
          <p className="footer-premium__affiliation">
            {institution.sealLine1} {institution.sealLine2}
            {institution.sealLine3 ? ` — ${institution.sealLine3}` : ""}.
          </p>
        ) : null}
        <FooterSocial items={social} className="footer-premium__social--institution" />
      </div>
    </div>
  );
}
