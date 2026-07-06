import type { AbsenceContactChannel } from "@/types/experience-forms";

/** Canales que el operador registra manualmente. El correo se registra al enviar desde el panel. */
export const OPERATOR_MANUAL_CONTACT_CHANNELS = [
  "phone",
  "whatsapp",
  "in-person",
  "other",
] as const satisfies readonly AbsenceContactChannel[];

export type OperatorManualContactChannel = (typeof OPERATOR_MANUAL_CONTACT_CHANNELS)[number];

export const OPERATOR_CONTACT_CHANNEL_OPTIONS: Array<{
  value: OperatorManualContactChannel;
  label: string;
}> = [
  { value: "phone", label: "Teléfono / llamada" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "in-person", label: "Presencial" },
  { value: "other", label: "Otro" },
];

export function isOperatorManualContactChannel(
  value: unknown
): value is OperatorManualContactChannel {
  return (
    typeof value === "string" &&
    OPERATOR_MANUAL_CONTACT_CHANNELS.includes(value as OperatorManualContactChannel)
  );
}
