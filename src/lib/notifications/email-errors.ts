/** Mensajes públicos de Resend / correo transaccional. Sin detalles internos. */
export function publicTransactionalEmailError(error: {
  name?: string;
  message?: string;
}): string {
  const detail = error.message ?? "";
  if (/testing emails|verify a domain/i.test(detail)) {
    return "El remitente del correo no está configurado.";
  }

  switch (error.name) {
    case "missing_api_key":
    case "invalid_api_key":
    case "restricted_api_key":
      return "El correo transaccional no está configurado.";
    case "invalid_from_address":
      return "El remitente del correo no está verificado.";
    case "monthly_quota_exceeded":
    case "daily_quota_exceeded":
      return "Se alcanzó el límite de correos. Intenta más tarde.";
    case "rate_limit_exceeded":
      return "Hay demasiados envíos seguidos. Espera un momento e intenta de nuevo.";
    case "validation_error":
    case "invalid_parameter":
    case "missing_required_field":
      return "El servicio de correo rechazó el destinatario o el mensaje.";
    case "application_error":
      return "El servicio de correo no respondió. Intenta de nuevo.";
    default:
      return "No se pudo enviar el correo.";
  }
}
