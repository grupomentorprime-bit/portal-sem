import { asBoolean, asString } from "@/lib/cms/block-utils";
import type { FooterColumn, NavLink } from "@/core/navigation";
import type {
  ContactInfo,
  Institution,
  PortalCopy,
  PortalFooterPremiumConfig,
  SeoConfig,
  SocialLinks,
} from "@/types/cms";
import type { ProgramItem } from "@/types/content";
import type { ExperienceAction } from "@/types/experience-action";
import {
  buildFooterContactViewModel,
  type BuildContactHubInput,
} from "@/components/portal/experience/contact-hub/mappers";
import type {
  PortalFooterNavLink,
  PortalFooterNavSection,
  PortalFooterPremiumSettings,
  PortalFooterPremiumViewModel,
  PortalFooterSocialItem,
} from "@/types/footer-premium";
import { SOCIAL_NETWORKS } from "@/components/portal/layout/footer/social-config";
import { SEM_FOOTER_LEGAL } from "@/lib/portal/footer-content";

export const DEFAULT_FOOTER_PREMIUM_SETTINGS: Required<PortalFooterPremiumSettings> = {
  showDescription: true,
  showNavigation: true,
  showContact: true,
  showSocial: true,
  showLegal: true,
  showNewsletter: false,
  showCertifications: false,
};

export function normalizeFooterPremiumSettings(
  settings?: PortalFooterPremiumSettings | PortalFooterPremiumConfig | Record<string, unknown>
): Required<PortalFooterPremiumSettings> {
  const raw = (settings ?? {}) as PortalFooterPremiumSettings;
  return {
    showDescription: asBoolean(raw.showDescription, true),
    showNavigation: asBoolean(raw.showNavigation, true),
    showContact: asBoolean(raw.showContact, true),
    showSocial: asBoolean(raw.showSocial, true),
    showLegal: asBoolean(raw.showLegal, true),
    showNewsletter: asBoolean(raw.showNewsletter, false),
    showCertifications: asBoolean(raw.showCertifications, false),
  };
}

function navLinkToAction(link: NavLink): ExperienceAction {
  return {
    type: "url",
    href: link.href,
    newTab: link.target === "_blank",
  };
}

function navLinksFromColumn(links: NavLink[], prefix: string): PortalFooterNavLink[] {
  return links.map((link, index) => ({
    id: `${prefix}-${index}`,
    label: link.label,
    action: navLinkToAction(link),
    highlighted: link.highlighted,
  }));
}

function buildNavigation(footerColumns: FooterColumn[]): PortalFooterNavSection[] {
  const sections: PortalFooterNavSection[] = [];

  footerColumns.forEach((column, index) => {
    if (column.links.length === 0) return;
    sections.push({
      id: `footer-col-${index}`,
      title: column.title,
      links: navLinksFromColumn(column.links, `col-${index}`),
    });
  });

  return sections;
}

function buildSocialItems(social?: SocialLinks): PortalFooterSocialItem[] {
  if (!social) return [];

  return SOCIAL_NETWORKS.filter(({ key }) => Boolean(social[key]?.trim())).map(({ key, label }) => ({
    id: key,
    label,
    icon: key,
    action: { type: "url", href: social[key], newTab: true },
  }));
}

export interface BuildFooterPremiumInput extends BuildContactHubInput {
  settings?: PortalFooterPremiumSettings | PortalFooterPremiumConfig;
  institution: Institution;
  seo: SeoConfig;
  portalCopy: PortalCopy;
  logos: { primary: string; secondary?: string };
  footerColumns: FooterColumn[];
  legalLinks: NavLink[];
  programs: ProgramItem[];
}

export function buildFooterPremiumViewModel(input: BuildFooterPremiumInput): PortalFooterPremiumViewModel {
  const settings = normalizeFooterPremiumSettings(input.settings);
  const { institution, seo, portalCopy, logos, contact, social } = input;
  const year = new Date().getFullYear();

  const contactViewModel = settings.showContact
    ? buildFooterContactViewModel({ contact, social }, portalCopy.footerContactTitle)
    : null;

  return {
    settings,
    brand: {
      institutionName: institution.name,
      institutionShortName: institution.shortName,
      organization: institution.organization || undefined,
      description: settings.showDescription ? seo.description || undefined : undefined,
      tagline: institution.tagline || undefined,
      logoPrimary: logos.primary,
      logoSecondary: logos.secondary,
    },
    navigation: settings.showNavigation
      ? buildNavigation(input.footerColumns)
      : [],
    contact: contactViewModel,
    social: settings.showSocial ? buildSocialItems(social) : [],
    legal: settings.showLegal
      ? input.legalLinks.map((link, index) => ({
          id: `legal-${index}`,
          label: link.label,
          action: navLinkToAction(link),
        }))
      : [],
    copyright: `© ${year} ${institution.name}`,
    copyrightSuffix: portalCopy.footerCopyrightSuffix || undefined,
    adminLabel: portalCopy.footerAdminLabel || undefined,
    adminAction: portalCopy.footerAdminLabel
      ? { type: "url", href: "/admin/config" }
      : undefined,
    credits: portalCopy.footerCredits || SEM_FOOTER_LEGAL.credits,
    backToTopLabel: portalCopy.footerBackToTopLabel,
  };
}
