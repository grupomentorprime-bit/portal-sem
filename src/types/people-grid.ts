/** Experience Module — People Grid v1.0 (LOCKED) */

export const PERSON_ROLES = [
  "teacher",
  "authority",
  "speaker",
  "coach",
  "mentor",
  "staff",
] as const;

export type PersonRole = (typeof PERSON_ROLES)[number];

export const PERSON_STATUSES = ["active", "featured", "guest", "historical"] as const;
export type PersonStatus = (typeof PERSON_STATUSES)[number];

export interface PortalPersonCardData {
  id: string;
  name: string;
  position?: string;
  specialty?: string;
  bio?: string;
  image?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  href?: string;
  personRole?: PersonRole | string;
  featured?: boolean;
  personStatus?: PersonStatus | string;
  teamGroup?: string;
  order?: number;
  visible?: boolean;
}

export interface PortalPeopleGridSettings extends Record<string, unknown> {
  overline?: string;
  title?: string;
  description?: string;
  showButton?: boolean;
  buttonLabel?: string;
  buttonHref?: string;
  cardCtaLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  emptyActionHref?: string;
  errorTitle?: string;
  errorDescription?: string;
}

export interface PortalPeopleGridProps {
  settings: PortalPeopleGridSettings;
  people: PortalPersonCardData[];
  error?: boolean;
  id?: string;
  muted?: boolean;
  /** Home: retrato + nombre/cargo sin bio, redes ni CTA por tarjeta */
  compactCards?: boolean;
  /** Home: banda editorial, retratos emergentes, CTA bajo el grid */
  editorialHome?: boolean;
}

export type PersonItem = PortalPersonCardData;
