export type RegisteredAttendance = "yes" | "no" | null;

/** idle: nadie elegido. pending: consulta en curso. open: puede responder. registered: ya respondió. */
export type ConvocatoriaRegistrationLookup = "idle" | "pending" | "open" | "registered";

export function shouldShowConvocatoriaSubmitButton(input: {
  registrationMode: string;
  studentId: string;
  lookup: ConvocatoriaRegistrationLookup;
}): boolean {
  if (input.lookup === "registered") return false;
  const rosterSelected =
    input.registrationMode === "roster" && input.studentId.trim().length > 0;
  if (rosterSelected && input.lookup !== "open") return false;
  return true;
}

export function alreadyRegisteredConfirmationMessage(attendance: RegisteredAttendance): string {
  if (attendance === "yes") {
    return "Confirmaste que asistirás. Tu respuesta ya quedó registrada y no necesitas enviar el formulario otra vez.";
  }
  if (attendance === "no") {
    return "Avisaste que no podrás asistir. Tu respuesta ya quedó registrada y no necesitas enviarla de nuevo.";
  }
  return "Tu respuesta ya quedó registrada. No necesitas enviar el formulario otra vez.";
}
