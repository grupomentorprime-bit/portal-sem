/**
 * @deprecated Usar PortalFooterPremium — ver docs/core/CORE-FOOTER-PREMIUM-v1.md
 */

import { PortalBrandMark } from "@/components/portal/PortalBrandMark";
import { FooterSocial } from "./FooterSocial";
import type { SocialLinks } from "@/types/cms";

interface FooterInstitutionProps {
  institutionName: string;
  institutionShortName: string;
  organization?: string;
  description?: string;
  tagline?: string;
  logoPrimary: string;
  logoSecondary?: string;
  social?: SocialLinks;
}

export function FooterInstitution({
  institutionName,
  institutionShortName,
  organization,
  description,
  tagline,
  logoPrimary,
  logoSecondary,
  social,
}: FooterInstitutionProps) {
  return (
    <div className="portal-footer-premium__column portal-footer-premium__column--institution">
      <PortalBrandMark
        logoPrimary={logoPrimary}
        institutionName={institutionName}
        institutionShortName={institutionShortName}
        variant="dark"
        layout="default"
      />
      {institutionName ? (
        <p className="portal-footer-premium__institution-name">{institutionName}</p>
      ) : null}
      {description ? (
        <p className="portal-footer-premium__description">{description}</p>
      ) : null}
      {tagline ? (
        <p className="portal-footer-premium__tagline">{tagline}</p>
      ) : null}
      <FooterSocial social={social} />
    </div>
  );
}
