import type {
  ExperienceAction,
  ExperienceActionLink,
  ExperienceActionType,
} from "@/types/experience-action";
import type { ExperienceActionContext, ExperienceActionHandler } from "./types";

const handlers = new Map<ExperienceActionType, ExperienceActionHandler>();

export function registerExperienceActionHandler<T extends ExperienceAction>(
  type: T["type"],
  handler: ExperienceActionHandler<T>
): void {
  handlers.set(type, handler as ExperienceActionHandler);
}

/** @deprecated Use registerExperienceActionHandler */
export const registerCtaActionHandler = registerExperienceActionHandler;

export async function executeExperienceAction(
  action: ExperienceAction,
  ctx: ExperienceActionContext
): Promise<void> {
  const handler = handlers.get(action.type);
  if (!handler) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[Experience Action] Sin handler registrado para tipo "${action.type}"`
      );
    }
    return;
  }
  await handler(action, ctx);
}

/** @deprecated Use executeExperienceAction */
export const executeCtaAction = executeExperienceAction;

function buildWhatsAppUrl(phone: string, message?: string): string {
  const digits = phone.replace(/\D/g, "");
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${query}`;
}

function buildMailtoUrl(address: string, subject?: string, body?: string): string {
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  const query = params.toString();
  return `mailto:${address}${query ? `?${query}` : ""}`;
}

/** Resuelve href nativo cuando la acción puede renderizarse como enlace */
export function resolveExperienceActionLink(
  action: ExperienceAction
): ExperienceActionLink | null {
  switch (action.type) {
    case "url":
      return { href: action.href, newTab: action.newTab ?? false };
    case "whatsapp":
      return { href: buildWhatsAppUrl(action.phone, action.message), newTab: true };
    case "email":
      return {
        href: buildMailtoUrl(action.address, action.subject, action.body),
        newTab: false,
      };
    case "phone":
      return { href: `tel:${action.number.replace(/\s/g, "")}`, newTab: false };
    case "download":
      return {
        href: action.href,
        newTab: action.newTab ?? true,
        download: action.filename,
      };
    default:
      return null;
  }
}

/** @deprecated Use resolveExperienceActionLink */
export const resolveCtaActionLink = resolveExperienceActionLink;

/** Acciones que deben ejecutarse vía handler (no enlace nativo) */
export function requiresExperienceActionHandler(action: ExperienceAction): boolean {
  return resolveExperienceActionLink(action) === null;
}

/** @deprecated Use requiresExperienceActionHandler */
export const requiresCtaActionHandler = requiresExperienceActionHandler;
