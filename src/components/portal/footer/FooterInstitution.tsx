import Image from "next/image";
import type { PortalFooterBrandView, PortalFooterSocialItem } from "@/types/footer-premium";
import type { FooterInstitutionContent } from "@/lib/portal/footer-content";
import { PLATFORM_ASSET_FALLBACKS } from "@/lib/cms/asset-paths";
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
  const institutionName = brand.institutionName || "Seminario Eclesiástico Mayor";

  return (
    <div className={cn("footer-premium__institution", className)}>
      <div className="footer-premium__brand">
        <div className="footer-premium__brand-mark">
          <Image
            src={PLATFORM_ASSET_FALLBACKS.logoOnDark}
            alt={institutionName}
            width={48}
            height={54}
            className="footer-premium__brand-icon"
          />
          <p className="footer-premium__institution-name">{institutionName}</p>
        </div>
        <p className="footer-premium__tagline">{institution.tagline}</p>
        <FooterSocial items={social} className="footer-premium__social--institution" />
      </div>
    </div>
  );
}
