import {
  FooterPremiumShell,
  normalizeFooterPremiumSettings,
} from "@/components/portal/experience/footer-premium";
import { blockSettings } from "@/lib/portal/blocks";
import type { ContactInfo, PortalCopy, SeoConfig, SocialLinks } from "@/types/cms";
import type { Institution } from "@/types/cms";
import type { FooterColumn, NavLink } from "@/core/navigation";
import type { ProgramItem } from "@/types/content";
import type { PortalFooterPremiumSettings } from "@/types/footer-premium";
import type { PageBlock } from "@/types/page";

interface FooterPremiumBlockSectionProps {
  block: PageBlock;
  institution: Institution;
  seo: SeoConfig;
  contact: ContactInfo;
  social: SocialLinks;
  portalCopy: PortalCopy;
  logos: { primary: string; secondary?: string };
  footerColumns: FooterColumn[];
  legalLinks: NavLink[];
  programs: ProgramItem[];
  siteFooterSettings?: PortalFooterPremiumSettings;
}

export function FooterPremiumBlockSection({
  block,
  institution,
  seo,
  contact,
  social,
  portalCopy,
  logos,
  footerColumns,
  legalLinks,
  programs,
  siteFooterSettings,
}: FooterPremiumBlockSectionProps) {
  const blockSettingsRaw = blockSettings<PortalFooterPremiumSettings>(block);
  const merged = normalizeFooterPremiumSettings({
    ...siteFooterSettings,
    ...blockSettingsRaw,
  });

  return (
    <FooterPremiumShell
      institution={institution}
      seo={seo}
      contact={contact}
      social={social}
      portalCopy={portalCopy}
      logos={logos}
      footerColumns={footerColumns}
      legalLinks={legalLinks}
      programs={programs}
      footerSettings={merged}
    />
  );
}
