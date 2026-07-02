import {
  EXPERIENCE_ACTION_TYPES,
  type ExperienceAction,
  type ExperienceActionType,
} from "@/types/experience-action";
import { asBoolean, asString } from "@/lib/cms/block-utils";

function isActionType(value: string): value is ExperienceActionType {
  return (EXPERIENCE_ACTION_TYPES as readonly string[]).includes(value);
}

function parsePayload(raw: unknown): Record<string, unknown> | undefined {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return undefined;
  return raw as Record<string, unknown>;
}

export function parseExperienceAction(
  raw: unknown,
  legacy?: { href?: string; newTab?: boolean }
): ExperienceAction | null {
  if (typeof raw === "object" && raw !== null) {
    const obj = raw as Record<string, unknown>;
    const type = asString(obj.type);

    if (!isActionType(type)) return null;

    switch (type) {
      case "url": {
        const href = asString(obj.href);
        if (!href) return null;
        return { type: "url", href, newTab: asBoolean(obj.newTab, false) };
      }
      case "form": {
        const formId = asString(obj.formId);
        if (!formId) return null;
        return { type: "form", formId };
      }
      case "modal": {
        const modalId = asString(obj.modalId);
        if (!modalId) return null;
        return { type: "modal", modalId };
      }
      case "whatsapp": {
        const phone = asString(obj.phone);
        if (!phone) return null;
        return {
          type: "whatsapp",
          phone,
          message: asString(obj.message) || undefined,
        };
      }
      case "email": {
        const address = asString(obj.address);
        if (!address) return null;
        return {
          type: "email",
          address,
          subject: asString(obj.subject) || undefined,
          body: asString(obj.body) || undefined,
        };
      }
      case "phone": {
        const number = asString(obj.number);
        if (!number) return null;
        return { type: "phone", number };
      }
      case "download": {
        const href = asString(obj.href);
        if (!href) return null;
        return {
          type: "download",
          href,
          filename: asString(obj.filename) || undefined,
          newTab: asBoolean(obj.newTab, true),
        };
      }
      case "calendar":
        return {
          type: "calendar",
          eventId: asString(obj.eventId) || undefined,
          title: asString(obj.title) || undefined,
          start: asString(obj.start) || undefined,
          end: asString(obj.end) || undefined,
        };
      case "video": {
        const videoId = asString(obj.videoId);
        if (!videoId) return null;
        return {
          type: "video",
          videoId,
          provider: asString(obj.provider) || undefined,
        };
      }
      case "application":
        return {
          type: "application",
          programId: asString(obj.programId) || undefined,
        };
      case "enrollment":
        return {
          type: "enrollment",
          programId: asString(obj.programId) || undefined,
        };
      case "program": {
        const programId = asString(obj.programId);
        if (!programId) return null;
        return { type: "program", programId };
      }
      case "workflow": {
        const workflowId = asString(obj.workflowId);
        if (!workflowId) return null;
        return {
          type: "workflow",
          workflowId,
          stepId: asString(obj.stepId) || undefined,
        };
      }
      case "api": {
        const endpoint = asString(obj.endpoint);
        if (!endpoint) return null;
        return {
          type: "api",
          endpoint,
          method: asString(obj.method) || undefined,
          payload: parsePayload(obj.payload),
        };
      }
      case "custom": {
        const handlerId = asString(obj.handlerId);
        if (!handlerId) return null;
        return {
          type: "custom",
          handlerId,
          payload: parsePayload(obj.payload),
        };
      }
    }
  }

  const legacyHref = legacy?.href ?? asString(raw);
  if (legacyHref) {
    return {
      type: "url",
      href: legacyHref,
      newTab: legacy?.newTab ?? false,
    };
  }

  return null;
}

/** @deprecated Use parseExperienceAction */
export const parseCtaAction = parseExperienceAction;

export function isValidExperienceAction(
  action: ExperienceAction | null
): action is ExperienceAction {
  return action !== null;
}

/** @deprecated Use isValidExperienceAction */
export const isValidCtaAction = isValidExperienceAction;
