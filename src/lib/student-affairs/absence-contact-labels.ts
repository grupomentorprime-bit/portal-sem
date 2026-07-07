import type { AbsenceContactChannel, AbsenceContactOutcome } from "@/types/experience-forms";
import {
  absenceContactOutcomeLabelForChannel,
} from "@/lib/student-affairs/operator-contact-outcomes";

export function absenceContactChannelLabel(channel: AbsenceContactChannel): string {
  switch (channel) {
    case "email":
      return "Correo";
    case "phone":
      return "Teléfono";
    case "whatsapp":
      return "WhatsApp";
    case "in-person":
      return "Presencial";
    case "other":
      return "Otro";
  }
}

export function formatAbsenceContactDate(iso: string): string {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Santiago",
  }).format(new Date(iso));
}

export function absenceContactOutcomeLabel(
  outcome: AbsenceContactOutcome,
  channel?: AbsenceContactChannel
): string {
  if (channel && channel !== "email") {
    return absenceContactOutcomeLabelForChannel(outcome, channel);
  }
  switch (outcome) {
    case "reached":
      return "Contacto exitoso";
    case "no-answer":
      return "No contesta";
    case "invalid-number":
      return "Número inválido";
    case "dropout":
      return "Alumno desertor / baja institucional";
    case "other":
      return "Otro";
  }
}
