/**
 * OT-GROWTH-MESSAGING-003 — cliente WhatsApp Cloud API (envío de texto).
 * Token solo en servidor. Inyectable para tests.
 */

export const WHATSAPP_CLOUD_API_VERSION = "v21.0" as const;

export const WHATSAPP_GRAPH_BASE_URL =
  "https://graph.facebook.com" as const;

/** Errores Meta que indican ventana de servicio cerrada / hace falta plantilla. */
export const WHATSAPP_TEMPLATE_REQUIRED_CODES = new Set([
  131047, // Re-engagement message
  131051, // Unsupported message type / outside window (varía por versión)
]);

export interface WhatsAppSendTextInput {
  phoneNumberId: string;
  accessToken: string;
  /** wa_id / E.164 sin + */
  to: string;
  body: string;
}

export type WhatsAppSendTextResult =
  | { ok: true; externalMessageId: string }
  | {
      ok: false;
      code?: string;
      message: string;
      httpStatus?: number;
      templateRequired?: boolean;
    };

export interface WhatsAppProbeInput {
  phoneNumberId: string;
  accessToken: string;
}

export type WhatsAppProbeResult =
  | { ok: true; displayPhoneNumber?: string }
  | { ok: false; message: string };

export interface WhatsAppCloudApiPort {
  sendTextMessage(input: WhatsAppSendTextInput): Promise<WhatsAppSendTextResult>;
  /** Comprueba que phone_number_id + access token responden en Graph API. */
  probePhoneNumber(input: WhatsAppProbeInput): Promise<WhatsAppProbeResult>;
}

function readMetaError(json: unknown): {
  code?: number;
  message: string;
} {
  if (!json || typeof json !== "object") {
    return { message: "Respuesta inválida de Meta." };
  }
  const err = (json as { error?: { code?: number; message?: string } }).error;
  if (!err) return { message: "Respuesta inválida de Meta." };
  return {
    ...(typeof err.code === "number" ? { code: err.code } : {}),
    message:
      typeof err.message === "string" && err.message.trim()
        ? err.message.trim()
        : "Meta rechazó el envío.",
  };
}

export function createHttpWhatsAppCloudApi(options?: {
  baseUrl?: string;
  apiVersion?: string;
  fetchImpl?: typeof fetch;
}): WhatsAppCloudApiPort {
  const baseUrl = (options?.baseUrl ?? WHATSAPP_GRAPH_BASE_URL).replace(
    /\/$/,
    ""
  );
  const apiVersion = options?.apiVersion ?? WHATSAPP_CLOUD_API_VERSION;
  const fetchImpl = options?.fetchImpl ?? fetch;

  return {
    async sendTextMessage(input) {
      const phoneNumberId = input.phoneNumberId?.trim();
      const accessToken = input.accessToken?.trim();
      const to = input.to?.replace(/\D/g, "");
      const body = input.body?.trim();
      if (!phoneNumberId || !accessToken || !to || !body) {
        return {
          ok: false,
          code: "invalid_request",
          message: "Faltan datos para enviar por Cloud API.",
        };
      }

      const url = `${baseUrl}/${apiVersion}/${encodeURIComponent(phoneNumberId)}/messages`;
      let response: Response;
      try {
        response = await fetchImpl(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to,
            type: "text",
            text: { preview_url: false, body },
          }),
        });
      } catch {
        return {
          ok: false,
          code: "network_error",
          message: "No se pudo contactar la API de WhatsApp.",
        };
      }

      let json: unknown = null;
      try {
        json = await response.json();
      } catch {
        json = null;
      }

      if (!response.ok) {
        const meta = readMetaError(json);
        const codeStr =
          meta.code != null ? String(meta.code) : `http_${response.status}`;
        const templateRequired =
          meta.code != null && WHATSAPP_TEMPLATE_REQUIRED_CODES.has(meta.code);
        return {
          ok: false,
          code: codeStr,
          message: meta.message,
          httpStatus: response.status,
          ...(templateRequired ? { templateRequired: true } : {}),
        };
      }

      const messages = (
        json as { messages?: Array<{ id?: string }> } | null
      )?.messages;
      const externalMessageId = messages?.[0]?.id?.trim();
      if (!externalMessageId) {
        return {
          ok: false,
          code: "missing_wamid",
          message: "Meta no devolvió id de mensaje.",
          httpStatus: response.status,
        };
      }

      return { ok: true, externalMessageId };
    },

    async probePhoneNumber(input) {
      const phoneNumberId = input.phoneNumberId?.trim();
      const accessToken = input.accessToken?.trim();
      if (!phoneNumberId || !accessToken) {
        return {
          ok: false,
          message: "Faltan datos para comprobar la conexión.",
        };
      }

      const url = `${baseUrl}/${apiVersion}/${encodeURIComponent(phoneNumberId)}?fields=display_phone_number`;
      let response: Response;
      try {
        response = await fetchImpl(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
      } catch {
        return {
          ok: false,
          message: "No se pudo contactar la API de WhatsApp.",
        };
      }

      let json: unknown = null;
      try {
        json = await response.json();
      } catch {
        json = null;
      }

      if (!response.ok) {
        const meta = readMetaError(json);
        return { ok: false, message: meta.message };
      }

      const displayPhoneNumber = (
        json as { display_phone_number?: string } | null
      )?.display_phone_number?.trim();

      return {
        ok: true,
        ...(displayPhoneNumber ? { displayPhoneNumber } : {}),
      };
    },
  };
}
