/**
 * OT-GROWTH-MESSAGING-002 — extraer mensajes de usuario del webhook Cloud API.
 * Ignora statuses, ecos y tipos sin contenido útil.
 */

import type { WhatsAppInboundExtracted } from "./types";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || undefined;
  }
  // Meta a veces serializa IDs numéricos como number en JSON.
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function mediaPlaceholder(type: string): string {
  switch (type) {
    case "image":
      return "[imagen]";
    case "video":
      return "[video]";
    case "audio":
      return "[audio]";
    case "document":
      return "[documento]";
    case "sticker":
      return "[sticker]";
    case "location":
      return "[ubicación]";
    case "contacts":
      return "[contacto]";
    default:
      return "";
  }
}

function extractBody(message: Record<string, unknown>): string | undefined {
  const type = asString(message.type) ?? "unknown";

  if (type === "text") {
    return asString(asRecord(message.text)?.body);
  }

  if (type === "button") {
    return asString(asRecord(message.button)?.text);
  }

  if (type === "interactive") {
    const interactive = asRecord(message.interactive);
    const buttonReply = asRecord(interactive?.button_reply);
    const listReply = asRecord(interactive?.list_reply);
    return (
      asString(buttonReply?.title) ??
      asString(listReply?.title) ??
      asString(listReply?.description)
    );
  }

  if (type === "image" || type === "video" || type === "document") {
    const media = asRecord(message[type]);
    return (
      asString(media?.caption) ??
      asString(media?.filename) ??
      mediaPlaceholder(type)
    );
  }

  if (type === "audio" || type === "sticker") {
    return mediaPlaceholder(type);
  }

  if (type === "location") {
    const location = asRecord(message.location);
    return (
      asString(location?.name) ??
      asString(location?.address) ??
      mediaPlaceholder("location")
    );
  }

  if (type === "contacts") {
    return mediaPlaceholder("contacts");
  }

  return undefined;
}

function profileNameFor(
  contacts: unknown[],
  from: string
): string | undefined {
  for (const item of contacts) {
    const contact = asRecord(item);
    if (!contact) continue;
    const waId = asString(contact.wa_id);
    if (waId && waId.replace(/^\+/, "") !== from.replace(/^\+/, "")) continue;
    const profile = asRecord(contact.profile);
    return asString(profile?.name);
  }
  return undefined;
}

/**
 * Recorre el payload oficial. No valida firma (eso es el paso anterior/siguiente).
 */
export function extractWhatsAppInboundMessages(
  payload: unknown
): WhatsAppInboundExtracted[] {
  const root = asRecord(payload);
  if (!root) return [];
  if (asString(root.object) !== "whatsapp_business_account") return [];

  const extracted: WhatsAppInboundExtracted[] = [];

  for (const entryItem of asArray(root.entry)) {
    const entry = asRecord(entryItem);
    if (!entry) continue;
    const wabaId = asString(entry.id);

    for (const changeItem of asArray(entry.changes)) {
      const change = asRecord(changeItem);
      if (!change) continue;
      const field = asString(change.field);
      if (field && field !== "messages") continue;

      const value = asRecord(change.value);
      if (!value) continue;
      if (asString(value.messaging_product) && value.messaging_product !== "whatsapp") {
        continue;
      }

      const metadata = asRecord(value.metadata);
      const phoneNumberId = asString(metadata?.phone_number_id);
      if (!phoneNumberId) continue;
      const displayPhoneNumber = asString(metadata?.display_phone_number);
      const contacts = asArray(value.contacts);

      for (const messageItem of asArray(value.messages)) {
        const message = asRecord(messageItem);
        if (!message) continue;
        if (message.errors) continue;

        const from = asString(message.from);
        const messageId = asString(message.id);
        if (!from || !messageId) continue;
        if (
          displayPhoneNumber &&
          from.replace(/\D/g, "") === displayPhoneNumber.replace(/\D/g, "")
        ) {
          continue;
        }

        const body = extractBody(message);
        if (!body) continue;
        const profileName = profileNameFor(contacts, from);

        extracted.push({
          ...(wabaId ? { wabaId } : {}),
          phoneNumberId,
          ...(displayPhoneNumber ? { displayPhoneNumber } : {}),
          from,
          ...(profileName ? { profileName } : {}),
          messageId,
          timestamp: asString(message.timestamp) ?? "",
          type: asString(message.type) ?? "unknown",
          body,
        });
      }
    }
  }

  return extracted;
}

export function collectWhatsAppPhoneNumberIds(payload: unknown): string[] {
  const root = asRecord(payload);
  if (!root) return [];
  const ids = new Set<string>();

  for (const entryItem of asArray(root.entry)) {
    const entry = asRecord(entryItem);
    if (!entry) continue;
    for (const changeItem of asArray(entry.changes)) {
      const change = asRecord(changeItem);
      const value = asRecord(change?.value);
      const metadata = asRecord(value?.metadata);
      const phoneNumberId = asString(metadata?.phone_number_id);
      if (phoneNumberId) ids.add(phoneNumberId);
    }
  }

  return [...ids];
}

export function occurredAtFromWhatsAppTimestamp(
  timestamp: string,
  fallbackIso: string
): string {
  if (!timestamp) return fallbackIso;
  const seconds = Number(timestamp);
  if (!Number.isFinite(seconds) || seconds <= 0) return fallbackIso;
  return new Date(seconds * 1000).toISOString();
}
