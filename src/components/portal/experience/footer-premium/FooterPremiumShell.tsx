import {
  buildFooterPremiumViewModel,
  normalizeFooterPremiumSettings,
} from "@/components/portal/experience/footer-premium";
import { FooterPremium } from "@/components/portal/footer";
import type { FooterColumn, NavLink } from "@/core/navigation";
import type { ContactInfo, PortalCopy, PortalFooterPremiumConfig, SeoConfig, SocialLinks } from "@/types/cms";
import type { Institution } from "@/types/cms";
import type { ProgramItem } from "@/types/content";
import type { PortalFooterPremiumSettings } from "@/types/footer-premium";

export interface FooterPremiumShellProps {
  institution: Institution;
  seo: SeoConfig;
  contact: ContactInfo;
  social: SocialLinks;
  portalCopy: PortalCopy;
  logos: { primary: string; secondary?: string };
  footerColumns: FooterColumn[];
  legalLinks: NavLink[];
  programs: ProgramItem[];
  footerSettings?: PortalFooterPremiumSettings | PortalFooterPremiumConfig;
}

export function FooterPremiumShell({
  institution,
  seo,
  contact,
  social,
  portalCopy,
  logos,
  footerColumns,
  legalLinks,
  programs,
  footerSettings,
}: FooterPremiumShellProps) {
  const viewModel = buildFooterPremiumViewModel({
    settings: footerSettings,
    institution,
    seo,
    contact,
    social,
    portalCopy,
    logos,
    footerColumns,
    legalLinks,
    programs,
  });

  return <FooterPremium viewModel={viewModel} whatsapp={contact.whatsapp} />;
}

export { normalizeFooterPremiumSettings };
