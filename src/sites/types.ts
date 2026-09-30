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

export interface CodedSitePage {
  path: string;
  title: string;
  navLabel: string;
}

export interface CodedSite {
  tenantId: string;
  pages: CodedSitePage[];
  forms: CodedSiteFormDeclaration[];
}
