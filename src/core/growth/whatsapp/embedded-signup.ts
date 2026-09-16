/**
 * OT-GROWTH-WHATSAPP-META-001 — completar Embedded Signup sobre el conector existente.
 * Exchange code → business token (servidor). Suscribe WABA. Persiste en
 * growth_whatsapp_connections del Espacio. Sin segundo conector.
 *
 * Endpoints oficiales (docs Meta Embedded Signup / Graph API):
 * - GET /{version}/oauth/access_token
 * - POST /{waba-id}/subscribed_apps
 * - POST /{phone-number-id}/register
 */

import { ObjectId } from "mongodb";
import {
  WHATSAPP_CLOUD_API_VERSION,
  WHATSAPP_GRAPH_BASE_URL,
  createHttpWhatsAppCloudApi,
  type WhatsAppCloudApiPort,
} from "./cloud-api";
import type { GrowthWhatsAppConnectionStore } from "./connection-store";
import { verifyWhatsAppConnectState } from "./connect-state";
import { readMetaPlatformConfig } from "./meta-platform";
import type { GrowthWhatsAppConnection } from "./types";
import { GROWTH_WHATSAPP_CONNECTION_SOURCE_EMBEDDED } from "./types";

export interface CompleteWhatsAppEmbeddedSignupInput {
  tenantId: string;
  state: string;
  code: string;
  phoneNumberId: string;
  wabaId: string;
  businessId?: string;
  displayPhoneNumber?: string;
  /** PIN de registro Cloud API (6 dígitos). Si se omite, se genera en servidor. */
  registrationPin?: string;
  now?: string;
}

export type CompleteWhatsAppEmbeddedSignupResult =
  | { ok: true; connection: GrowthWhatsAppConnection; created: boolean }
  | { ok: false; reason: "meta_not_configured" }
  | { ok: false; reason: "invalid_state" }
  | { ok: false; reason: "state_tenant_mismatch" }
  | { ok: false; reason: "missing_code" }
  | { ok: false; reason: "missing_phone_number_id" }
  | { ok: false; reason: "missing_waba_id" }
  | { ok: false; reason: "phone_number_in_use" }
  | { ok: false; reason: "token_exchange_failed"; message: string }
  | { ok: false; reason: "subscribe_failed"; message: string }
  | { ok: false; reason: "persist_failed"; message: string };

export interface WhatsAppEmbeddedSignupGraphPort {
  exchangeCode(input: {
    appId: string;
    appSecret: string;
    code: string;
  }): Promise<{ ok: true; accessToken: string } | { ok: false; message: string }>;

  subscribeApps(input: {
    wabaId: string;
    accessToken: string;
  }): Promise<{ ok: true } | { ok: false; message: string }>;

  registerPhoneNumber(input: {
    phoneNumberId: string;
    accessToken: string;
    pin: string;
  }): Promise<{ ok: true; alreadyRegistered?: boolean } | { ok: false; message: string }>;
}

function readGraphError(json: unknown): string {
  if (!json || typeof json !== "object") return "Respuesta inválida de Meta.";
  const err = (json as { error?: { message?: string } }).error;
  if (typeof err?.message === "string" && err.message.trim()) {
    return err.message.trim();
  }
  return "Meta rechazó la operación.";
}

export function createHttpWhatsAppEmbeddedSignupGraph(options?: {
  baseUrl?: string;
  apiVersion?: string;
  fetchImpl?: typeof fetch;
}): WhatsAppEmbeddedSignupGraphPort {
  const baseUrl = (options?.baseUrl ?? WHATSAPP_GRAPH_BASE_URL).replace(/\/$/, "");
  const apiVersion = options?.apiVersion ?? WHATSAPP_CLOUD_API_VERSION;
  const fetchImpl = options?.fetchImpl ?? fetch;

  return {
    async exchangeCode({ appId, appSecret, code }) {
      const url = new URL(`${baseUrl}/${apiVersion}/oauth/access_token`);
      url.searchParams.set("client_id", appId);
      url.searchParams.set("client_secret", appSecret);
      url.searchParams.set("code", code);

      let response: Response;
      try {
        response = await fetchImpl(url.toString(), { method: "GET" });
      } catch {
        return { ok: false, message: "No se pudo contactar la API de Meta." };
      }

      let json: unknown = null;
      try {
        json = await response.json();
      } catch {
        json = null;
      }

      if (!response.ok) {
        return { ok: false, message: readGraphError(json) };
      }

      const token =
        json &&
        typeof json === "object" &&
        typeof (json as { access_token?: unknown }).access_token === "string"
          ? (json as { access_token: string }).access_token.trim()
          : "";
      if (!token) {
        return { ok: false, message: "Meta no devolvió un token de negocio." };
      }
      return { ok: true, accessToken: token };
    },

    async subscribeApps({ wabaId, accessToken }) {
      const url = `${baseUrl}/${apiVersion}/${encodeURIComponent(wabaId)}/subscribed_apps`;
      let response: Response;
      try {
        response = await fetchImpl(url, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      } catch {
        return { ok: false, message: "No se pudo suscribir el WABA." };
      }

      let json: unknown = null;
      try {
        json = await response.json();
      } catch {
        json = null;
      }

      if (!response.ok) {
        return { ok: false, message: readGraphError(json) };
      }
      return { ok: true };
    },

    async registerPhoneNumber({ phoneNumberId, accessToken, pin }) {
      const url = `${baseUrl}/${apiVersion}/${encodeURIComponent(phoneNumberId)}/register`;
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
            pin,
          }),
        });
      } catch {
        return { ok: false, message: "No se pudo registrar el número." };
      }

      let json: unknown = null;
      try {
        json = await response.json();
      } catch {
        json = null;
      }

      if (response.ok) return { ok: true };

      const message = readGraphError(json).toLowerCase();
      // Ya registrado en Cloud API — no bloquear onboarding.
      if (
        message.includes("already") ||
        message.includes("registered") ||
        message.includes("exist")
      ) {
        return { ok: true, alreadyRegistered: true };
      }
      return { ok: false, message: readGraphError(json) };
    },
  };
}

function generateRegistrationPin(): string {
  const n = Math.floor(Math.random() * 1_000_000);
  return String(n).padStart(6, "0");
}

export async function completeWhatsAppEmbeddedSignup(
  store: GrowthWhatsAppConnectionStore,
  input: CompleteWhatsAppEmbeddedSignupInput,
  deps?: {
    platform?: ReturnType<typeof readMetaPlatformConfig>;
    graph?: WhatsAppEmbeddedSignupGraphPort;
    cloudApi?: WhatsAppCloudApiPort;
  }
): Promise<CompleteWhatsAppEmbeddedSignupResult> {
  const platform = deps?.platform ?? readMetaPlatformConfig();
  if (!platform) return { ok: false, reason: "meta_not_configured" };

  const state = verifyWhatsAppConnectState(input.state, {
    expectedTenantId: input.tenantId,
  });
  if (!state.ok) {
    if (state.reason === "tenant_mismatch") {
      return { ok: false, reason: "state_tenant_mismatch" };
    }
    return { ok: false, reason: "invalid_state" };
  }

  const code = input.code?.trim();
  if (!code) return { ok: false, reason: "missing_code" };

  const phoneNumberId = input.phoneNumberId?.trim();
  if (!phoneNumberId) return { ok: false, reason: "missing_phone_number_id" };

  const wabaId = input.wabaId?.trim();
  if (!wabaId) return { ok: false, reason: "missing_waba_id" };

  const owner = await store.findByPhoneNumberId(phoneNumberId);
  if (owner && owner.tenantId !== input.tenantId) {
    return { ok: false, reason: "phone_number_in_use" };
  }

  const graph = deps?.graph ?? createHttpWhatsAppEmbeddedSignupGraph();
  const exchanged = await graph.exchangeCode({
    appId: platform.appId,
    appSecret: platform.appSecret,
    code,
  });
  if (!exchanged.ok) {
    return {
      ok: false,
      reason: "token_exchange_failed",
      message: exchanged.message,
    };
  }

  const subscribed = await graph.subscribeApps({
    wabaId,
    accessToken: exchanged.accessToken,
  });
  if (!subscribed.ok) {
    return {
      ok: false,
      reason: "subscribe_failed",
      message: subscribed.message,
    };
  }

  const pin =
    input.registrationPin?.trim().replace(/\D/g, "").slice(0, 6) ||
    generateRegistrationPin();
  // Fail-soft: número nuevo puede requerir PIN; si ya está registrado, ok.
  await graph.registerPhoneNumber({
    phoneNumberId,
    accessToken: exchanged.accessToken,
    pin,
  });

  let displayPhoneNumber = input.displayPhoneNumber?.trim() || undefined;
  if (!displayPhoneNumber) {
    const cloud = deps?.cloudApi ?? createHttpWhatsAppCloudApi();
    const probed = await cloud.probePhoneNumber({
      phoneNumberId,
      accessToken: exchanged.accessToken,
    });
    if (probed.ok && probed.displayPhoneNumber?.trim()) {
      displayPhoneNumber = probed.displayPhoneNumber.trim();
    }
  }

  const existing = await store.findByTenantId(input.tenantId);
  const now = input.now ?? new Date().toISOString();
  const businessId = input.businessId?.trim() || existing?.businessId;

  const connection: GrowthWhatsAppConnection = {
    _id: existing?._id ?? new ObjectId().toString(),
    tenantId: input.tenantId,
    phoneNumberId,
    wabaId,
    // Firma y verify viven en la Meta App de plataforma — no duplicar secretos por Espacio.
    verifyToken: "",
    appSecret: "",
    accessToken: exchanged.accessToken,
    enabled: true,
    connectionSource: GROWTH_WHATSAPP_CONNECTION_SOURCE_EMBEDDED,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  if (displayPhoneNumber) connection.displayPhoneNumber = displayPhoneNumber;
  if (businessId) connection.businessId = businessId;

  try {
    const saved = await store.upsert(connection);
    return { ok: true, connection: saved, created: !existing };
  } catch (error) {
    return {
      ok: false,
      reason: "persist_failed",
      message:
        error instanceof Error ? error.message : "No se pudo guardar la conexión.",
    };
  }
}

export type DisconnectWhatsAppConnectionResult =
  | { ok: true; removed: boolean }
  | { ok: false; reason: "not_found" };

export async function disconnectWhatsAppConnection(
  store: GrowthWhatsAppConnectionStore,
  tenantId: string
): Promise<DisconnectWhatsAppConnectionResult> {
  const tid = tenantId.trim();
  if (!tid) return { ok: false, reason: "not_found" };
  const existing = await store.findByTenantId(tid);
  if (!existing) return { ok: false, reason: "not_found" };
  if (typeof store.deleteByTenantId === "function") {
    await store.deleteByTenantId(tid);
    return { ok: true, removed: true };
  }
  // Fallback: pausar si el store no soporta borrado.
  await store.upsert({
    ...existing,
    enabled: false,
    updatedAt: new Date().toISOString(),
  });
  return { ok: true, removed: false };
}
