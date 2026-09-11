/**
 * Origen visible (solo presentación).
 * No cambia `origin.channel` ni ningún valor persistido.
 *
 * Labels humanos: nav «Portal web», kind «Admisión»,
 * destinos de Experience Forms (Contacto, Solicitud de información, …).
 */

const CHANNEL_HUMAN_LABELS: Record<string, string> = {
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
 * Identificadores técnicos no se muestran; el valor persistido no se toca.
 */
export function humanizeOriginDisplayLabel(originLabel: string): string {
  const trimmed = originLabel.trim() || "Sin origen claro";
  if (trimmed.includes(" / ")) return trimmed;

  if (trimmed === "portal-admision") return "Portal web / Admisión";

  const parts = trimmed.split(" · ").map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) return "Sin origen claro";
  if (parts.length === 1) {
    return CHANNEL_HUMAN_LABELS[parts[0]] ?? parts[0];
  }

  const kind = parts[0];
  const channel = parts.slice(1).join(" · ");
  if (channel === "portal-admision") {
    return `Portal web / ${kind}`;
  }

  const channelHuman = channelDisplayLabel(channel);
  return `${kind} / ${channelHuman}`;
}
