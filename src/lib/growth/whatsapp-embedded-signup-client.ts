/**
 * OT-GROWTH-WHATSAPP-META-001 — helpers de cliente para Embedded Signup v4.
 * Solo App ID / config_id públicos. El code se envía al servidor; nunca secretos.
 *
 * OT-GROWTH-WHATSAPP-EMBEDDED-SIGNUP-OAUTH-FIX-001 — el inicio debe ser
 * Facebook Login for Business con config_id + response_type=code.
 * Nunca scope=openid (OIDC genérico): Meta responde
 * “Esta app necesita al menos un supported permission.”
 */

export interface WhatsAppEmbeddedSignupAssets {
  phoneNumberId: string;
  /** WhatsApp Business Account ID (Meta). Nombre neutro en UI. */
  accountId: string;
  businessId?: string;
}

export type WhatsAppEmbeddedSignupLaunchResult =
  | { ok: true; code: string; assets: WhatsAppEmbeddedSignupAssets }
  | {
      ok: false;
      reason:
        | "cancelled"
        | "sdk_error"
        | "missing_assets"
        | "missing_code"
        | "invalid_config";
      message: string;
    };

/** Opciones efectivas de FB.login (sin secretos). Expuesto para tests. */
export interface WhatsAppEmbeddedSignupLoginOptions {
  config_id: string;
  response_type: "code";
  override_default_response_type: true;
  extras: {
    setup: Record<string, never>;
    sessionInfoVersion: "3";
  };
}

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
        options: WhatsAppEmbeddedSignupLoginOptions
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

const FB_SDK_SRC = "https://connect.facebook.net/en_US/sdk.js";
/** Docs Meta Embedded Signup (2026-07): usar Graph API vigente. */
const GRAPH_SDK_VERSION = "v26.0";

let sdkPromise: Promise<void> | null = null;
let initializedAppId: string | null = null;

function isMetaPublicId(value: string): boolean {
  return /^\d{5,}$/.test(value.trim());
}

/**
 * Construye las opciones oficiales de Embedded Signup.
 * config_id reemplaza scope — no incluir scope ni openid.
 */
export function buildWhatsAppEmbeddedSignupLoginOptions(
  esConfigId: string
): WhatsAppEmbeddedSignupLoginOptions | null {
  const configId = esConfigId.trim();
  if (!isMetaPublicId(configId)) return null;
  return {
    config_id: configId,
    response_type: "code",
    override_default_response_type: true,
    extras: {
      setup: {},
      sessionInfoVersion: "3",
    },
  };
}

/** Parámetros públicos esperados en dialog/oauth (sin secretos). */
export function describeWhatsAppEmbeddedSignupOAuthParams(input: {
  appId: string;
  esConfigId: string;
}): {
  client_id: string;
  config_id: string;
  response_type: "code";
  /** Debe ausentarse; openid es el fallo observado. */
  scope: null;
} | null {
  const appId = input.appId.trim();
  const options = buildWhatsAppEmbeddedSignupLoginOptions(input.esConfigId);
  if (!isMetaPublicId(appId) || !options) return null;
  return {
    client_id: appId,
    config_id: options.config_id,
    response_type: options.response_type,
    scope: null,
  };
}

export function loadFacebookSdk(appId: string): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("SDK solo en navegador."));
  }
  const trimmedAppId = appId.trim();
  if (!isMetaPublicId(trimmedAppId)) {
    return Promise.reject(new Error("META_APP_ID inválido."));
  }

  if (window.FB && initializedAppId === trimmedAppId) {
    return Promise.resolve();
  }

  if (window.FB) {
    window.FB.init({
      appId: trimmedAppId,
      autoLogAppEvents: true,
      xfbml: true,
      version: GRAPH_SDK_VERSION,
    });
    initializedAppId = trimmedAppId;
    return Promise.resolve();
  }

  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    let settled = false;
    const finishOk = () => {
      if (settled) return;
      settled = true;
      try {
        window.FB?.init({
          appId: trimmedAppId,
          autoLogAppEvents: true,
          xfbml: true,
          version: GRAPH_SDK_VERSION,
        });
        initializedAppId = trimmedAppId;
        resolve();
      } catch (error) {
        sdkPromise = null;
        reject(error);
      }
    };
    const finishErr = (error: Error) => {
      if (settled) return;
      settled = true;
      sdkPromise = null;
      reject(error);
    };

    window.fbAsyncInit = () => finishOk();

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${FB_SDK_SRC}"]`
    );
    if (existing) {
      if (window.FB) {
        finishOk();
        return;
      }
      const waitForFb = window.setInterval(() => {
        if (!window.FB) return;
        window.clearInterval(waitForFb);
        finishOk();
      }, 50);
      window.setTimeout(() => {
        window.clearInterval(waitForFb);
        finishErr(new Error("Timeout cargando el SDK de Meta."));
      }, 10000);
      return;
    }

    const script = document.createElement("script");
    script.src = FB_SDK_SRC;
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    script.onerror = () => {
      finishErr(new Error("No se pudo cargar el SDK de Meta."));
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
 * No usa scope (openid u otros): los permisos viven en la Configuration de Meta.
 */
export async function launchWhatsAppEmbeddedSignup(input: {
  appId: string;
  esConfigId: string;
}): Promise<WhatsAppEmbeddedSignupLaunchResult> {
  const loginOptions = buildWhatsAppEmbeddedSignupLoginOptions(input.esConfigId);
  const oauth = describeWhatsAppEmbeddedSignupOAuthParams(input);
  if (!loginOptions || !oauth) {
    return {
      ok: false,
      reason: "invalid_config",
      message:
        "Falta la configuración de Embedded Signup (App ID / Config ID).",
    };
  }

  try {
    await loadFacebookSdk(oauth.client_id);
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
      !event.origin.endsWith("facebook.com")
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
      window.FB!.login((response) => {
        const code = response.authResponse?.code?.trim();
        if (code) {
          resolve({ code, cancelled: false });
          return;
        }
        resolve({ cancelled: true });
      }, loginOptions);
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
