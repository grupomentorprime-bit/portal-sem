/**
 * OT-GROWTH-WHATSAPP-META-001 — helpers de cliente para Embedded Signup v4.
 * Solo App ID / config_id públicos. El code se envía al servidor; nunca secretos.
 */

export interface WhatsAppEmbeddedSignupAssets {
  phoneNumberId: string;
  /** WhatsApp Business Account ID (Meta). Nombre neutro en UI. */
  accountId: string;
  businessId?: string;
}

export type WhatsAppEmbeddedSignupLaunchResult =
  | { ok: true; code: string; assets: WhatsAppEmbeddedSignupAssets }
  | { ok: false; reason: "cancelled" | "sdk_error" | "missing_assets" | "missing_code"; message: string };

declare global {
  interface Window {
    FB?: {
      init: (opts: {
        appId: string;
        autoLogAppEvents?: boolean;
        xfbml?: boolean;
        version: string;
      }) => void;
      login: (
        callback: (response: {
          authResponse?: { code?: string } | null;
          status?: string;
        }) => void,
        options: Record<string, unknown>
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

const FB_SDK_SRC = "https://connect.facebook.net/en_US/sdk.js";
const GRAPH_SDK_VERSION = "v21.0";

let sdkPromise: Promise<void> | null = null;

export function loadFacebookSdk(appId: string): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("SDK solo en navegador."));
  }
  if (window.FB) return Promise.resolve();
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    window.fbAsyncInit = () => {
      try {
        window.FB?.init({
          appId,
          autoLogAppEvents: true,
          xfbml: false,
          version: GRAPH_SDK_VERSION,
        });
        resolve();
      } catch (error) {
        reject(error);
      }
    };

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${FB_SDK_SRC}"]`
    );
    if (existing) return;

    const script = document.createElement("script");
    script.src = FB_SDK_SRC;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      sdkPromise = null;
      reject(new Error("No se pudo cargar el SDK de Meta."));
    };
    document.body.appendChild(script);
  });

  return sdkPromise;
}

function parseEmbeddedSignupMessage(
  raw: unknown
): WhatsAppEmbeddedSignupAssets | null {
  if (raw == null) return null;
  let data: unknown = raw;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!data || typeof data !== "object") return null;
  const envelope = data as {
    type?: string;
    event?: string;
    data?: Record<string, unknown>;
  };
  if (envelope.type !== "WA_EMBEDDED_SIGNUP") return null;

  const payload = envelope.data ?? {};
  const phoneNumberId =
    typeof payload.phone_number_id === "string"
      ? payload.phone_number_id.trim()
      : "";
  const accountId =
    typeof payload.waba_id === "string" ? payload.waba_id.trim() : "";
  if (!phoneNumberId || !accountId) return null;

  const businessId =
    typeof payload.business_id === "string"
      ? payload.business_id.trim()
      : typeof payload.owner_business_id === "string"
        ? payload.owner_business_id.trim()
        : undefined;

  return {
    phoneNumberId,
    accountId,
    ...(businessId ? { businessId } : {}),
  };
}

/**
 * Lanza FB.login Embedded Signup v4 (config_id + response_type=code).
 * Captura session info (phone_number_id / waba_id) vía postMessage.
 */
export async function launchWhatsAppEmbeddedSignup(input: {
  appId: string;
  esConfigId: string;
}): Promise<WhatsAppEmbeddedSignupLaunchResult> {
  try {
    await loadFacebookSdk(input.appId);
  } catch {
    return {
      ok: false,
      reason: "sdk_error",
      message: "No se pudo iniciar el autorizador de Meta.",
    };
  }

  if (!window.FB) {
    return {
      ok: false,
      reason: "sdk_error",
      message: "El SDK de Meta no está disponible.",
    };
  }

  let assets: WhatsAppEmbeddedSignupAssets | null = null;

  const onMessage = (event: MessageEvent) => {
    if (
      typeof event.origin !== "string" ||
      !event.origin.includes("facebook.com")
    ) {
      return;
    }
    const parsed = parseEmbeddedSignupMessage(event.data);
    if (parsed) assets = parsed;
  };

  window.addEventListener("message", onMessage);

  try {
    const loginResult = await new Promise<{
      code?: string;
      cancelled: boolean;
    }>((resolve) => {
      window.FB!.login(
        (response) => {
          const code = response.authResponse?.code?.trim();
          if (code) {
            resolve({ code, cancelled: false });
            return;
          }
          resolve({ cancelled: true });
        },
        {
          config_id: input.esConfigId,
          response_type: "code",
          override_default_response_type: true,
          extras: {
            setup: {},
            sessionInfoVersion: "3",
          },
        }
      );
    });

    // Dar tiempo a postMessage de session info tras el cierre del diálogo.
    await new Promise((r) => setTimeout(r, 250));

    if (loginResult.cancelled || !loginResult.code) {
      return {
        ok: false,
        reason: "cancelled",
        message: "Conexión cancelada.",
      };
    }

    if (!assets) {
      return {
        ok: false,
        reason: "missing_assets",
        message:
          "Meta no devolvió el número de WhatsApp. Volvé a intentarlo.",
      };
    }

    return { ok: true, code: loginResult.code, assets };
  } finally {
    window.removeEventListener("message", onMessage);
  }
}

/** Envía el code + assets al servidor (secretos nunca viajan de vuelta). */
export async function submitWhatsAppEmbeddedSignupComplete(input: {
  state: string;
  code: string;
  assets: WhatsAppEmbeddedSignupAssets;
}): Promise<
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; error: string; status: number }
> {
  const res = await fetch("/api/admin/integrations/whatsapp/meta/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      state: input.state,
      code: input.code,
      phoneNumberId: input.assets.phoneNumberId,
      wabaId: input.assets.accountId,
      businessId: input.assets.businessId,
    }),
  });
  const data = (await res.json()) as {
    ok?: boolean;
    error?: string;
    [key: string]: unknown;
  };
  if (!data.ok) {
    return {
      ok: false,
      error: data.error ?? "No se pudo completar la conexión.",
      status: res.status,
    };
  }
  return { ok: true, data };
}
