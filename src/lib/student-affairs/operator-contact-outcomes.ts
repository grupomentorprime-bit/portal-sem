import type { AbsenceContactChannel, AbsenceContactOutcome } from "@/types/experience-forms";
import type { OperatorManualContactChannel } from "@/lib/student-affairs/operator-contact-channels";

export function getContactOutcomeOptions(channel: OperatorManualContactChannel): Array<{
  value: AbsenceContactOutcome;
  label: string;
}> {
  switch (channel) {
    case "phone":
      return [
        { value: "reached", label: "Contacto exitoso" },
        { value: "no-answer", label: "No contesta" },
        { value: "invalid-number", label: "Número inválido" },
        { value: "other", label: "Otro" },
      ];
    case "whatsapp":
      return [
        { value: "reached", label: "Respondió por WhatsApp" },
        { value: "no-answer", label: "Sin respuesta en WhatsApp" },
        { value: "invalid-number", label: "Número sin WhatsApp / inválido" },
        { value: "other", label: "Otro" },
      ];
    case "in-person":
      return [
        { value: "reached", label: "Se conversó en persona" },
        { value: "no-answer", label: "No se encontró en el lugar" },
        { value: "other", label: "Otro" },
      ];
    case "other":
      return [
        { value: "reached", label: "Gestión exitosa" },
        { value: "no-answer", label: "No fue posible contactar" },
        { value: "other", label: "Otro" },
      ];
  }
}

export function isContactOutcomeValidForChannel(
  channel: OperatorManualContactChannel,
  outcome: AbsenceContactOutcome
): boolean {
  return getContactOutcomeOptions(channel).some((option) => option.value === outcome);
}

export function defaultContactOutcomeForChannel(
  channel: OperatorManualContactChannel
): AbsenceContactOutcome {
  return "reached";
}

/** Resultados que no permiten iniciar plazo de justificación. */
export function isFailedContactOutcomeForChannel(
  channel: OperatorManualContactChannel,
  outcome: AbsenceContactOutcome
): boolean {
  if (outcome === "reached") return false;
  if (outcome === "other") return false;
  if (outcome === "invalid-number") {
    return channel === "phone" || channel === "whatsapp";
  }
  if (outcome === "no-answer") return true;
  return false;
}

export function absenceContactOutcomeLabelForChannel(
  outcome: AbsenceContactOutcome,
  channel?: AbsenceContactChannel
): string {
  if (channel && channel !== "email") {
    const option = getContactOutcomeOptions(channel as OperatorManualContactChannel).find(
      (item) => item.value === outcome
    );
    if (option) return option.label;
  }

  switch (outcome) {
    case "reached":
      return "Contacto exitoso";
    case "no-answer":
      return "No contesta";
    case "invalid-number":
      return "Número inválido";
    case "other":
      return "Otro";
  }
}

export function contactNotesPlaceholder(channel: OperatorManualContactChannel): string {
  switch (channel) {
    case "phone":
      return "Ej.: Llamada — se informó plazo de 3 días y próximo paso por correo…";
    case "whatsapp":
      return "Ej.: WhatsApp — se envió enlace de justificación y plazo de 3 días…";
    case "in-person":
      return "Ej.: En campus — se conversó sobre la inasistencia y plazo para justificar…";
    case "other":
      return "Ej.: Describa la gestión realizada y acuerdos con el participante…";
  }
}
