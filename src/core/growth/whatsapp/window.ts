/**
 * OT-GROWTH-MESSAGING-003 — ventana de servicio WhatsApp (24 h desde último inbound).
 * Fuera de ventana: respuesta libre no permitida → hace falta plantilla (sin gestión aún).
 */

import type { GrowthMessage } from "../messaging/types";

/** Contrato Cloud API: 24 horas desde el último mensaje del usuario. */
export const WHATSAPP_CUSTOMER_SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000;

export type WhatsAppServiceWindow =
  | {
      open: true;
      lastInboundAt: string;
      closesAt: string;
    }
  | {
      open: false;
      reason: "no_inbound" | "window_expired";
      lastInboundAt?: string;
      closesAt?: string;
    };

export function evaluateWhatsAppServiceWindow(input: {
  lastInbound: GrowthMessage | null;
  now?: string | Date;
}): WhatsAppServiceWindow {
  const nowMs = (
    input.now instanceof Date
      ? input.now
      : new Date(input.now ?? Date.now())
  ).getTime();

  if (!input.lastInbound?.occurredAt) {
    return { open: false, reason: "no_inbound" };
  }

  const lastMs = new Date(input.lastInbound.occurredAt).getTime();
  if (Number.isNaN(lastMs)) {
    return { open: false, reason: "no_inbound" };
  }

  const closesAtMs = lastMs + WHATSAPP_CUSTOMER_SERVICE_WINDOW_MS;
  const lastInboundAt = input.lastInbound.occurredAt;
  const closesAt = new Date(closesAtMs).toISOString();

  if (nowMs > closesAtMs) {
    return {
      open: false,
      reason: "window_expired",
      lastInboundAt,
      closesAt,
    };
  }

  return { open: true, lastInboundAt, closesAt };
}

/**
 * Destinatario Cloud API desde externalThreadId (`phoneNumberId:wa_id`).
 */
export function parseWhatsAppRecipientFromThreadId(
  externalThreadId: string | undefined
): string | null {
  const raw = externalThreadId?.trim();
  if (!raw) return null;
  const idx = raw.indexOf(":");
  if (idx <= 0 || idx >= raw.length - 1) return null;
  const waId = raw.slice(idx + 1).replace(/\D/g, "");
  return waId || null;
}
