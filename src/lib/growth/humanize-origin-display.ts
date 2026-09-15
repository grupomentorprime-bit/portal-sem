/**
 * Origen visible (solo presentación).
 * No cambia `origin.channel` ni ningún valor persistido.
 *
 * Labels humanos: nav «Portal web», kind «Admisión»,
 * destinos de Experience Forms (Contacto, Solicitud de información, …).
 * Canales humanos conocidos (WhatsApp, Portal web) tienen prioridad de
 * presentación cuando el kind es «Sin origen claro» (OT-GROWTH-PERSONAS-IMPLEMENT-003).
 */

/** Canales con label humano estable; no inventan GrowthOriginKind. */
export const GROWTH_KNOWN_HUMAN_ORIGIN_CHANNELS = [
  "whatsapp",
  "portal-admision",
] as const;

export type GrowthKnownHumanOriginChannel =
  (typeof GROWTH_KNOWN_HUMAN_ORIGIN_CHANNELS)[number];

const CHANNEL_HUMAN_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  "portal-admision": "Portal web",
  contact: "Contacto",
  contacto: "Contacto",
  information_request: "Solicitud de información",
  event_registration: "Inscripción a evento",
  attendance_confirmation: "Confirmación de asistencia",
  absence_justification: "Justificación de inasistencia",
  subscription: "Suscripción",
  testimonial_submission: "Testimonio de alumno",
};

export function isKnownHumanOriginChannel(channel: string | undefined): boolean {
  const c = channel?.trim();
  if (!c) return false;
  return (GROWTH_KNOWN_HUMAN_ORIGIN_CHANNELS as readonly string[]).includes(c);
}

function channelDisplayLabel(channel: string): string {
  const mapped = CHANNEL_HUMAN_LABELS[channel];
  if (mapped) return mapped;
  if (/^[a-z0-9]+(?:[-_][a-z0-9]+)+$/.test(channel)) {
    return channel
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
  return channel;
}

/**
 * `Admisión · portal-admision` → `Portal web / Admisión`.
 * `Sin origen claro · whatsapp` → `WhatsApp` (canal humano conocido).
 * Identificadores técnicos no se muestran; el valor persistido no se toca.
 */
export function humanizeOriginDisplayLabel(originLabel: string): string {
  const trimmed = originLabel.trim() || "Sin origen claro";
  if (trimmed.includes(" / ")) return trimmed;

  if (trimmed === "portal-admision") return "Portal web / Admisión";
  if (trimmed === "whatsapp") return "WhatsApp";

  const parts = trimmed.split(" · ").map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) return "Sin origen claro";
  if (parts.length === 1) {
    return CHANNEL_HUMAN_LABELS[parts[0]] ?? parts[0];
  }

  const kind = parts[0];
  const channel = parts.slice(1).join(" · ");

  // Canal humano conocido: no anteponer «Sin origen claro».
  if (kind === "Sin origen claro" && isKnownHumanOriginChannel(channel)) {
    return channelDisplayLabel(channel);
  }

  if (channel === "portal-admision") {
    return `Portal web / ${kind}`;
  }

  if (channel === "whatsapp" && kind !== "Sin origen claro") {
    return `WhatsApp / ${kind}`;
  }

  const channelHuman = channelDisplayLabel(channel);
  return `${kind} / ${channelHuman}`;
}
