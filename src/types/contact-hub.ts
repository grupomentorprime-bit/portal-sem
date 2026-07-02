/** Experience Module — Contact Hub v1.0 (LOCKED) */

import type { ExperienceAction } from "@/types/experience-action";
import type { CtaButtonVariant } from "@/types/cta-premium";

export const CONTACT_CHANNEL_TYPES = [
  "phone",
  "whatsapp",
  "email",
  "facebook",
  "instagram",
  "youtube",
  "linkedin",
  "telegram",
  "tiktok",
  "website",
  "hours",
  "address",
  "custom",
] as const;

export type ContactChannelType = (typeof CONTACT_CHANNEL_TYPES)[number];

export const CONTACT_MAP_PROVIDERS = ["google", "openstreetmap", "apple"] as const;

export type ContactMapProvider = (typeof CONTACT_MAP_PROVIDERS)[number];

export interface PortalContactChannel {
  id?: string;
  type: ContactChannelType | string;
  name: string;
  value: string;
  icon?: string;
  url?: string;
  visible?: boolean;
  order?: number;
}

export interface PortalContactLocation {
  id?: string;
  name: string;
  address: string;
  city?: string;
  region?: string;
  country?: string;
  email?: string;
  phone?: string;
  hours?: string;
  mapQuery?: string;
  primary?: boolean;
  visible?: boolean;
}

export interface PortalContactHubAction {
  id?: string;
  label: string;
  action: ExperienceAction;
  variant?: CtaButtonVariant;
  icon?: string;
  visible?: boolean;
}

export interface PortalContactHubSettings extends Record<string, unknown> {
  overline?: string;
  title?: string;
  description?: string;
  showMap?: boolean;
  showHours?: boolean;
  showSocial?: boolean;
  showLocations?: boolean;
  showForm?: boolean;
  mapProvider?: ContactMapProvider | string;
  formId?: string;
  channels?: PortalContactChannel[];
  locations?: PortalContactLocation[];
  actions?: PortalContactHubAction[];
  /** Heredar canales desde Institution Config cuando channels[] está vacío */
  useInstitutionDefaults?: boolean;
}

export interface PortalContactChannelView {
  id: string;
  type: string;
  name: string;
  value: string;
  icon?: string;
  action?: ExperienceAction;
  visible: boolean;
  order: number;
}

export interface PortalContactLocationView {
  id: string;
  name: string;
  address: string;
  city?: string;
  region?: string;
  country?: string;
  email?: string;
  phone?: string;
  hours?: string;
  mapQuery?: string;
  primary: boolean;
  visible: boolean;
}

export interface PortalContactMapView {
  provider: ContactMapProvider;
  query: string;
  embedUrl: string;
}

export interface PortalContactHubViewModel {
  overline?: string;
  title: string;
  description?: string;
  showMap: boolean;
  showHours: boolean;
  showSocial: boolean;
  showLocations: boolean;
  showForm: boolean;
  formId?: string;
  channels: PortalContactChannelView[];
  locations: PortalContactLocationView[];
  actions: PortalContactHubAction[];
  map?: PortalContactMapView;
}

export type PortalContactHubLayout = "full" | "footer";

export interface PortalContactHubProps {
  viewModel: PortalContactHubViewModel;
  layout?: PortalContactHubLayout;
  id?: string;
  className?: string;
}
