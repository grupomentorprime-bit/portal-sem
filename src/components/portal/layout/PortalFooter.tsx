/**
 * @deprecated Usar PortalFooterPremium — ver docs/core/CORE-FOOTER-PREMIUM-v1.md
 */

import { FooterPremiumShell } from "@/components/portal/experience/footer-premium/FooterPremiumShell";
import type { FooterColumn, NavLink } from "@/core/navigation";
import type { ContactInfo, PortalCopy, SocialLinks } from "@/types/cms";
import type { ProgramItem } from "@/types/content";

interface PortalFooterProps {
  institutionName: string;
  institutionShortName: string;
  description?: string;
  tagline?: string;
  organization?: string;
  contact?: ContactInfo;
  social?: SocialLinks;
  logoPrimary: string;
  logoSecondary?: string;
  programs: ProgramItem[];
  footerColumns?: FooterColumn[];
  legalLinks?: NavLink[];
  portalCopy: PortalCopy;
}

export function PortalFooter({
  institutionName,
  institutionShortName,
  description,
  tagline,
  organization,
  contact,
  social,
  logoPrimary,
  logoSecondary,
  programs,
  footerColumns = [],
  legalLinks = [],
  portalCopy,
}: PortalFooterProps) {
  return (
    <FooterPremiumShell
      institution={{
        name: institutionName,
        shortName: institutionShortName,
        organization: organization ?? "",
        tagline: tagline ?? "",
        tenant: "",
        website: "",
        status: "active",
      }}
      seo={{ title: "", description: description ?? "", keywords: [] }}
      contact={
        contact ?? {
          email: "",
          phone: "",
          whatsapp: "",
          address: "",
          city: "",
          country: "",
          hours: "",
        }
      }
      social={
        social ?? {
          facebook: "",
          instagram: "",
          youtube: "",
          linkedin: "",
          tiktok: "",
          spotify: "",
        }
      }
      portalCopy={portalCopy}
      logos={{ primary: logoPrimary, secondary: logoSecondary }}
      footerColumns={footerColumns}
      legalLinks={legalLinks}
      programs={programs}
    />
  );
}

export { PortalFooterPremium } from "@/components/portal/experience/footer-premium";
