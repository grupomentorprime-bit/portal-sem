/** Experience Framework — Action contract v1.0 (LOCKED) */

export const EXPERIENCE_ACTION_TYPES = [
  "url",
  "form",
  "modal",
  "whatsapp",
  "email",
  "phone",
  "download",
  "calendar",
  "video",
  "application",
  "enrollment",
  "program",
  "workflow",
  "api",
  "custom",
] as const;

export type ExperienceActionType = (typeof EXPERIENCE_ACTION_TYPES)[number];

/** Acciones con handler runtime implementado en v1.0 */
export const EXPERIENCE_ACTION_IMPLEMENTED: readonly ExperienceActionType[] = [
  "url",
  "form",
  "whatsapp",
  "email",
  "phone",
  "download",
];

export type ExperienceUrlAction = {
  type: "url";
  href: string;
  newTab?: boolean;
};

export type ExperienceFormAction = {
  type: "form";
  formId: string;
};

export type ExperienceModalAction = {
  type: "modal";
  modalId: string;
};

export type ExperienceWhatsappAction = {
  type: "whatsapp";
  phone: string;
  message?: string;
};

export type ExperienceEmailAction = {
  type: "email";
  address: string;
  subject?: string;
  body?: string;
};

export type ExperiencePhoneAction = {
  type: "phone";
  number: string;
};

export type ExperienceDownloadAction = {
  type: "download";
  href: string;
  filename?: string;
  newTab?: boolean;
};

export type ExperienceCalendarAction = {
  type: "calendar";
  eventId?: string;
  title?: string;
  start?: string;
  end?: string;
};

export type ExperienceVideoAction = {
  type: "video";
  videoId: string;
  provider?: string;
};

export type ExperienceApplicationAction = {
  type: "application";
  programId?: string;
};

export type ExperienceEnrollmentAction = {
  type: "enrollment";
  programId?: string;
};

export type ExperienceProgramAction = {
  type: "program";
  programId: string;
};

export type ExperienceWorkflowAction = {
  type: "workflow";
  workflowId: string;
  stepId?: string;
};

export type ExperienceApiAction = {
  type: "api";
  endpoint: string;
  method?: string;
  payload?: Record<string, unknown>;
};

export type ExperienceCustomAction = {
  type: "custom";
  handlerId: string;
  payload?: Record<string, unknown>;
};

export type ExperienceAction =
  | ExperienceUrlAction
  | ExperienceFormAction
  | ExperienceModalAction
  | ExperienceWhatsappAction
  | ExperienceEmailAction
  | ExperiencePhoneAction
  | ExperienceDownloadAction
  | ExperienceCalendarAction
  | ExperienceVideoAction
  | ExperienceApplicationAction
  | ExperienceEnrollmentAction
  | ExperienceProgramAction
  | ExperienceWorkflowAction
  | ExperienceApiAction
  | ExperienceCustomAction;

export interface ExperienceActionLink {
  href: string;
  newTab: boolean;
  download?: string;
}

/** @deprecated Use ExperienceAction */
export type PortalCtaAction = ExperienceAction;

/** @deprecated Use ExperienceActionType */
export type CtaActionType = ExperienceActionType;

/** @deprecated Use ExperienceActionLink */
export type PortalCtaActionLink = ExperienceActionLink;
