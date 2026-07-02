/** Experience Framework — Forms v1.0 (LOCKED) */

import type { ExperienceAction } from "@/types/experience-action";

export const EXPERIENCE_FORM_FIELD_TYPES = [
  "text",
  "email",
  "phone",
  "number",
  "textarea",
  "select",
  "radio",
  "checkbox",
  "date",
  "time",
  "file",
  "hidden",
] as const;

export type ExperienceFormFieldType = (typeof EXPERIENCE_FORM_FIELD_TYPES)[number];

export const EXPERIENCE_FORM_DESTINATIONS = [
  "contact",
  "information_request",
  "attendance_confirmation",
  "absence_justification",
  "event_registration",
  "subscription",
] as const;

export type ExperienceFormDestination = (typeof EXPERIENCE_FORM_DESTINATIONS)[number];

export const EXPERIENCE_FORM_POST_ACTIONS = [
  "message",
  "redirect",
  "modal",
  "download",
  "page",
  "whatsapp",
] as const;

export type ExperienceFormPostAction = (typeof EXPERIENCE_FORM_POST_ACTIONS)[number];

export interface ExperienceFormFieldOption {
  label: string;
  value: string;
}

export interface ExperienceFormFieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
}

export interface ExperienceFormField {
  id: string;
  type: ExperienceFormFieldType;
  name: string;
  label: string;
  placeholder?: string;
  helper?: string;
  defaultValue?: string;
  options?: ExperienceFormFieldOption[];
  validation?: ExperienceFormFieldValidation;
  visible?: boolean;
}

export interface ExperienceFormPostSubmit {
  type: ExperienceFormPostAction;
  message?: string;
  action?: ExperienceAction;
}

export interface ExperienceFormDefinition {
  _id: string;
  tenant: string;
  name: string;
  description?: string;
  successMessage: string;
  errorMessage: string;
  destination: ExperienceFormDestination;
  postSubmit: ExperienceFormPostSubmit;
  fields: ExperienceFormField[];
  active: boolean;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ExperienceFormCreate = Omit<
  ExperienceFormDefinition,
  "createdAt" | "updatedAt"
>;

export type ExperienceFormUpdate = Partial<
  Omit<ExperienceFormDefinition, "_id" | "tenant" | "createdAt">
>;

export interface ExperienceFormSubmission {
  _id?: string;
  tenant: string;
  formId: string;
  destination: ExperienceFormDestination;
  data: Record<string, unknown>;
  createdAt: string;
}

export interface ExperienceFormBlockSettings extends Record<string, unknown> {
  formId?: string;
  overline?: string;
  title?: string;
  description?: string;
  display?: "inline" | "modal";
}

/** Alias CMS → formulario canónico */
export const EXPERIENCE_FORM_ID_ALIASES: Record<string, string> = {
  contact: "information-request",
};
