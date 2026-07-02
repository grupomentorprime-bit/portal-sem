import {
  FooterPremiumShell,
  normalizeFooterPremiumSettings,
} from "@/components/portal/experience/footer-premium";
import type { SiteConfig } from "@/types/cms";
import type { FooterColumn, NavLink } from "@/core/navigation";
import type { ProgramItem } from "@/types/content";
import type { PortalFooterPremiumSettings } from "@/types/footer-premium";

interface FooterPremiumGridProps {
  settings: Record<string, unknown>;
  config: SiteConfig;
  footerColumns: FooterColumn[];
  legalLinks: NavLink[];
  programs: ProgramItem[];
  logos: { primary: string; secondary?: string };
}

export function FooterPremiumGrid({
  settings,
  config,
  footerColumns,
  legalLinks,
  programs,
  logos,
}: FooterPremiumGridProps) {
  const merged = normalizeFooterPremiumSettings({
    ...config.portalExperience?.footerPremium,
    ...(settings as PortalFooterPremiumSettings),
  });

  return (
    <FooterPremiumShell
      institution={config.institution}
      seo={config.seo}
      contact={config.contact}
      social={config.social}
      portalCopy={config.portalCopy}
      logos={logos}
      footerColumns={footerColumns}
      legalLinks={legalLinks}
      programs={programs}
      footerSettings={merged}
    />
  );
}
