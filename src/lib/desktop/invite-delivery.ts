export type InviteCreateFeedback = {
  status: "created_sent" | "created_unsent" | "not_created";
  message: string;
};

/**
 * Interpreta la respuesta de crear invitación para la UI de Equipo.
 * No inventa un envío exitoso: emailSent debe venir del servidor.
 */
export function inviteCreateFeedback(input: {
  ok: boolean;
  emailSent?: boolean;
  deliveryError?: string | null;
  error?: string | null;
}): InviteCreateFeedback {
  if (!input.ok) {
    const message =
      typeof input.error === "string" && input.error.trim()
        ? input.error.trim()
        : "No se pudo crear la invitación.";
    return { status: "not_created", message };
  }

  if (input.emailSent === true) {
    return {
      status: "created_sent",
      message:
        "Invitación creada y correo enviado. La persona recibirá un enlace para unirse.",
    };
  }

  const detail =
    typeof input.deliveryError === "string" && input.deliveryError.trim()
      ? ` ${input.deliveryError.trim()}`
      : "";
  return {
    status: "created_unsent",
    message: `Invitación creada. El correo no se envió.${detail} Puedes reintentar el envío desde la lista de invitaciones.`,
  };
}
