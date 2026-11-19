import { createHash, timingSafeEqual } from "node:crypto";
import {
  DEFAULT_ATTENTION_AREAS,
  openAttentionCase,
  type AttentionActor,
  type AttentionArea,
  type AttentionCase,
} from "@/lib/desktop/attention";
import { findHelpOrigin, type HelpAttachment } from "@/lib/desktop/help-origins";

export type { HelpAttachment, HelpFrom, HelpLocation, HelpOriginRecord } from "@/lib/desktop/help-origins";
export {
  HELP_LOCATION_TTL_MS,
  HELP_ORIGINS,
  findHelpOrigin,
  formatCorrelative,
  formatHelpOrigin,
  freezeHelpOrigin,
  helpLocationFromOrigin,
  helpPlace,
  presentHelpLocation,
  screenForPath,
} from "@/lib/desktop/help-origins";

const MAX_WHERE = 200;
const MAX_ATTACHMENT_BYTES = 4_000_000;

export function acceptScreenshot(
  raw: unknown
): { ok: true; attachment: HelpAttachment } | { ok: false; reason: "attachment" } {
  if (!raw || typeof raw !== "object") return { ok: false, reason: "attachment" };
  const row = raw as Record<string, unknown>;
  const name = typeof row.name === "string" ? row.name.trim() : "";
  const mediaType = typeof row.mediaType === "string" ? row.mediaType.trim() : "";
  const dataUrl = typeof row.dataUrl === "string" ? row.dataUrl : "";
  const allowed =
    mediaType === "image/png" ||
    mediaType === "image/jpeg" ||
    mediaType === "image/webp" ||
    mediaType === "application/pdf" ||
    mediaType === "application/msword" ||
    mediaType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (!name || name.length > 80 || /[\\/]/.test(name) || !allowed) {
    return { ok: false, reason: "attachment" };
  }
  const prefix = `data:${mediaType};base64,`;
  if (!dataUrl.startsWith(prefix)) return { ok: false, reason: "attachment" };
  const payload = dataUrl.slice(prefix.length);
  if (!payload || !/^[a-zA-Z0-9+/=]+$/.test(payload)) return { ok: false, reason: "attachment" };
  if (Math.floor((payload.length * 3) / 4) > MAX_ATTACHMENT_BYTES) return { ok: false, reason: "attachment" };
  return { ok: true, attachment: { name, mediaType, dataUrl } };
}

export function hashContactCode(code: string): string {
  return createHash("sha256").update(code.trim()).digest("hex");
}

function sameSecret(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function openHelpTicket(input: {
  areas: readonly AttentionArea[];
  actor: AttentionActor;
  tenantId: string;
  areaId: string;
  subject: string;
  body: string;
  originId: string;
  capturedAt: string;
  correlative: string;
  whereNote?: string;
  attachment?: unknown;
  forCompany?: boolean;
  visitor?: boolean;
  id: string;
  messageId: string;
  eventId: string;
  now: string;
  priority?: string;
}): ReturnType<typeof openAttentionCase> {
  const origin = findHelpOrigin(input.originId);
  if (!origin) return { ok: false, reason: "origin" };
  const frozenAt = input.capturedAt.trim();
  if (!Number.isFinite(Date.parse(frozenAt))) return { ok: false, reason: "origin" };
  let attachment = null;
  if (input.attachment) {
    const shot = acceptScreenshot(input.attachment);
    if (!shot.ok) return shot;
    attachment = shot.attachment;
  }
  const where = (input.whereNote ?? "").trim();
  if (where.length > MAX_WHERE) return { ok: false, reason: "note" };
  return openAttentionCase({
    areas: input.areas,
    actor: input.actor,
    tenantId: input.tenantId,
    areaId: input.areaId,
    subject: input.subject,
    body: input.body,
    priority: input.priority,
    forCompany: input.forCompany,
    visitor: input.visitor,
    correlative: input.correlative,
    helpFrom: {
      originId: origin.id,
      channel: origin.channel,
      siteOrApp: origin.siteOrApp,
      module: origin.module,
      screen: origin.screen,
      action: origin.action,
      at: new Date(frozenAt).toISOString(),
    },
    whereNote: origin.general ? where : "",
    attachment,
    intakeChannel: input.originId === "escritorio.chat-en-vivo" ? "envivo" : undefined,
    id: input.id,
    messageId: input.messageId,
    eventId: input.eventId,
    now: input.now,
  });
}

export function beginVisitorTicket(input: {
  name: string;
  email: string;
  body: string;
  originId: string;
  capturedAt: string;
  correlative: string;
  id: string;
  messageId: string;
  eventId: string;
  now: string;
  code: string;
  areas?: readonly AttentionArea[];
}): { ok: true; case: AttentionCase; code: string } | { ok: false; reason: string } {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim().replace(/\s+/g, " ");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || name.length < 2) {
    return { ok: false, reason: "contact" };
  }
  const opened = openHelpTicket({
    areas: input.areas ?? DEFAULT_ATTENTION_AREAS,
    actor: {
      userId: `visitor:${email}`,
      displayName: name,
      kind: "client",
      tenantId: "",
      allAreas: false,
      areaIds: [],
      orgWide: false,
      economic: false,
    },
    tenantId: "",
    areaId: "general",
    subject: input.body.trim().replace(/\s+/g, " ").slice(0, 80),
    body: input.body,
    originId: input.originId,
    capturedAt: input.capturedAt,
    correlative: input.correlative,
    visitor: true,
    id: input.id,
    messageId: input.messageId,
    eventId: input.eventId,
    now: input.now,
  });
  if (!opened.ok) return opened;
  return {
    ok: true,
    code: input.code,
    case: {
      ...opened.case,
      visitorEmail: email,
      contactCodeHash: hashContactCode(input.code),
      contactVerifiedAt: null,
    },
  };
}

export function verifyVisitorContact(
  item: AttentionCase,
  input: { email: string; code: string; now: string }
): { ok: true; case: AttentionCase } | { ok: false; reason: "contact" } {
  const email = input.email.trim().toLowerCase();
  if (!item.visitorEmail || item.visitorEmail !== email || !item.contactCodeHash) {
    return { ok: false, reason: "contact" };
  }
  if (!sameSecret(item.contactCodeHash, hashContactCode(input.code))) {
    return { ok: false, reason: "contact" };
  }
  return { ok: true, case: { ...item, contactVerifiedAt: input.now, updatedAt: input.now } };
}

export function followVisitorTicket(
  item: AttentionCase,
  input: { body: string; id: string; now: string }
): { ok: true; case: AttentionCase } | { ok: false; reason: "contact" | "closed" | "empty" | "long" } {
  if (!item.contactVerifiedAt) return { ok: false, reason: "contact" };
  if (item.status === "resuelto") return { ok: false, reason: "closed" };
  const body = input.body.trim();
  if (!body) return { ok: false, reason: "empty" };
  if (body.length > 2000) return { ok: false, reason: "long" };
  return {
    ok: true,
    case: {
      ...item,
      waitingOn: "nelzuri",
      updatedAt: input.now,
      messages: [
        ...item.messages,
        {
          id: input.id,
          at: input.now,
          authorUserId: item.requesterUserId,
          authorName: item.requesterName,
          role: "client",
          body,
        },
      ],
    },
  };
}

export function linkVisitorCompany(
  item: AttentionCase,
  input: {
    tenantId: string;
    relationshipVerified: boolean;
    actorUserId: string;
    eventId: string;
    now: string;
  }
): { ok: true; case: AttentionCase } | { ok: false; reason: "forbidden" | "contact" } {
  if (!item.contactVerifiedAt) return { ok: false, reason: "contact" };
  const tenantId = input.tenantId.trim();
  if (!input.relationshipVerified || !tenantId) return { ok: false, reason: "forbidden" };
  return {
    ok: true,
    case: {
      ...item,
      tenantId,
      sharedWithCompany: true,
      updatedAt: input.now,
      events: [
        ...item.events,
        {
          id: input.eventId,
          at: input.now,
          actorUserId: input.actorUserId,
          actorName: "NELZURI",
          kind: "estado",
          detail: "Quedó vinculado a la empresa.",
        },
      ],
    },
  };
}

export { filterDeskCases } from "@/lib/desktop/help-origins";
