/** Experience Module — Footer Premium v1.0 (LOCKED) */

import type { ExperienceAction } from "@/types/experience-action";
import type { PortalContactHubViewModel } from "@/types/contact-hub";

export interface PortalFooterPremiumSettings extends Record<string, unknown> {
  showDescription?: boolean;
  showNavigation?: boolean;
  showContact?: boolean;
  showSocial?: boolean;
  showLegal?: boolean;
  /** @future */
  showNewsletter?: boolean;
  /** @future */
  showCertifications?: boolean;
}

export interface PortalFooterBrandView {
  institutionName: string;
  institutionShortName: string;
  organization?: string;
  description?: string;
  tagline?: string;
  logoPrimary: string;
  logoSecondary?: string;
}

export interface PortalFooterNavLink {
  id: string;
  label: string;
  action: ExperienceAction;
  highlighted?: boolean;
}

export interface PortalFooterNavSection {
  id: string;
  title: string;
  links: PortalFooterNavLink[];
}

export interface PortalFooterSocialItem {
  id: string;
  label: string;
  action: ExperienceAction;
  icon: string;
}

export interface PortalFooterLegalLink {
  id: string;
  label: string;
  action: ExperienceAction;
}

export interface PortalFooterPremiumViewModel {
  settings: Required<PortalFooterPremiumSettings>;
  brand: PortalFooterBrandView;
  navigation: PortalFooterNavSection[];
  contact: PortalContactHubViewModel | null;
  social: PortalFooterSocialItem[];
  legal: PortalFooterLegalLink[];
  copyright: string;
  copyrightSuffix?: string;
  adminLabel?: string;
  adminAction?: ExperienceAction;
  credits?: string;
  backToTopLabel: string;
}

export interface PortalFooterPremiumProps {
  viewModel: PortalFooterPremiumViewModel;
  className?: string;
}
