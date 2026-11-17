import type { ExperienceFormField } from "@/types/experience-forms";

export const CODED_FORM_DESTINATIONS = [
  "contact",
  "information_request",
  "event_registration",
] as const;

export type CodedFormDestination = (typeof CODED_FORM_DESTINATIONS)[number];

export interface CodedSiteFormDeclaration {
  _id: string;
  name: string;
  description?: string;
  successMessage: string;
  errorMessage: string;
  destination: CodedFormDestination;
  fields: ExperienceFormField[];
}

export type SiteContentSlotType = "text" | "image" | "animation";

export type SiteContentValue =
  | { type: "text"; value: string }
  | { type: "image"; src: string; alt: string; mediaId?: string }
  | { type: "animation"; enabled: boolean };

export type SiteContentSlotDef =
  | {
      id: string;
      label: string;
      type: "text";
      default: string;
      multiline?: boolean;
      description?: string;
    }
  | {
      id: string;
      label: string;
      type: "image";
      default: { src: string; alt: string };
      description?: string;
    }
  | {
      id: string;
      label: string;
      type: "animation";
      default: boolean;
      description?: string;
    };

export interface CodedSitePage {
  path: string;
  title: string;
  navLabel: string;
  description?: string;
  slots?: SiteContentSlotDef[];
}

export interface CodedSite {
  tenantId: string;
  pages: CodedSitePage[];
  forms: CodedSiteFormDeclaration[];
}
