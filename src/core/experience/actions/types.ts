import type { ExperienceAction } from "@/types/experience-action";

export interface ExperienceActionContext {
  openForm: (formId: string) => void;
  openModal: (modalId: string) => void;
  navigate: (href: string) => void;
}

export type ExperienceActionHandler<T extends ExperienceAction = ExperienceAction> = (
  action: T,
  ctx: ExperienceActionContext
) => void | Promise<void>;

/** @deprecated Use ExperienceActionContext */
export type CtaActionContext = ExperienceActionContext;

/** @deprecated Use ExperienceActionHandler */
export type CtaActionHandler<T extends ExperienceAction = ExperienceAction> =
  ExperienceActionHandler<T>;
