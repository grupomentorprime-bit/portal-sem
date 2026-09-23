import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { getAppBaseUrl } from "@/lib/app-url";
import { resolveKeycloakRedirectUri } from "@/core/identity/auth/public-origin";

/** Cliente OAuth dedicado de Growth OS (confidential + Standard flow). */
export const GROWTH_OS_KEYCLOAK_CLIENT_ID = "growth-os-web";

/** Clientes históricos — no usar como fallback silencioso en producción. */
const FORBIDDEN_PRODUCTION_CLIENT_IDS = new Set(["admin-cli", "seminario-ipn-web"]);

export interface KeycloakConfig {
  url: string;
  realm: string;
  clientId: string;
  /** Obligatorio en producción para growth-os-web (cliente confidential). */
  clientSecret: string;
  redirectUri: string;
  publicClient: boolean;
}

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

export function isKeycloakEnabled(): boolean {
  return Boolean(getKeycloakConfig());
}

/**
 * Lee configuración Keycloak desde entorno.
 * En producción: exige URL/realm/clientId/secret y rechaza clientes legacy (sin fallback).
 */
export function getKeycloakConfig(): KeycloakConfig | null {
  const url = process.env.KEYCLOAK_URL?.replace(/\/$/, "");
  const realm = process.env.KEYCLOAK_REALM?.trim();
  const clientId = process.env.KEYCLOAK_CLIENT_ID?.trim();
  const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET?.trim() ?? "";

  if (!url || !realm || !clientId) {
    if (isProductionRuntime()) {
      console.error(
        "[keycloak] configuración incompleta en producción (KEYCLOAK_URL / KEYCLOAK_REALM / KEYCLOAK_CLIENT_ID)."
      );
    }
    return null;
  }

  if (isProductionRuntime()) {
    if (FORBIDDEN_PRODUCTION_CLIENT_IDS.has(clientId)) {
      console.error(
        `[keycloak] cliente "${clientId}" no permitido en producción. Usa ${GROWTH_OS_KEYCLOAK_CLIENT_ID}.`
      );
      return null;
    }
    if (!clientSecret) {
      console.error(
        "[keycloak] KEYCLOAK_CLIENT_SECRET es obligatorio en producción (cliente confidential)."
      );
      return null;
    }
  }

  const redirectUri = resolveKeycloakRedirectUri(getAppBaseUrl());

  return {
    url,
    realm,
    clientId,
    clientSecret,
    redirectUri,
    publicClient: clientSecret.length === 0,
  };
}

export function getKeycloakIssuer(config: KeycloakConfig): string {
  return `${config.url}/realms/${config.realm}`;
}

/**
 * PKCE S256 — verifier aleatorio (43–128 chars URL-safe).
 * Solo se almacena en cookie httpOnly temporal; nunca se expone al frontend como dato reutilizable.
 */
export function createPkcePair(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = randomBytes(32).toString("base64url");
  const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");
  return { codeVerifier, codeChallenge };
}

function buildClientAuthHeaders(config: KeycloakConfig): HeadersInit {
  if (config.publicClient || !config.clientSecret) {
    return { "Content-Type": "application/x-www-form-urlencoded" };
  }

  const basic = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
  return {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization: `Basic ${basic}`,
  };
}

async function requestKeycloakToken(
  config: KeycloakConfig,
  params: Record<string, string>
): Promise<Response> {
  const issuer = getKeycloakIssuer(config);
  const body = new URLSearchParams(params);

  if (!config.publicClient && config.clientSecret) {
    body.set("client_id", config.clientId);
    body.set("client_secret", config.clientSecret);
  } else {
    body.set("client_id", config.clientId);
  }

  const tokenUrl = `${issuer}/protocol/openid-connect/token`;

  let res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (
    !res.ok &&
    !config.publicClient &&
    config.clientSecret &&
    res.status === 401
  ) {
    const retryBody = new URLSearchParams(params);
    retryBody.set("client_id", config.clientId);
    res = await fetch(tokenUrl, {
      method: "POST",
      headers: buildClientAuthHeaders(config),
      body: retryBody,
    });
  }

  return res;
}

export function buildKeycloakAuthorizeUrl(
  state: string,
  codeChallenge: string
): string {
  const config = getKeycloakConfig();
  if (!config) {
    throw new Error("Keycloak no está configurado.");
  }

  const issuer = getKeycloakIssuer(config);
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: "openid profile email",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return `${issuer}/protocol/openid-connect/auth?${params.toString()}`;
}

export async function exchangeKeycloakCode(
  code: string,
  codeVerifier: string
): Promise<{ accessToken: string; idToken?: string }> {
  const config = getKeycloakConfig();
  if (!config) {
    throw new Error("Keycloak no está configurado.");
  }

  if (!codeVerifier) {
    throw new Error("Falta code_verifier PKCE.");
  }

  const res = await requestKeycloakToken(config, {
    grant_type: "authorization_code",
    redirect_uri: config.redirectUri,
    code,
    code_verifier: codeVerifier,
  });

  if (!res.ok) {
    await res.text();
    console.error("[keycloak] token exchange failed", res.status);
    throw new Error("No se pudo completar el inicio de sesión institucional.");
  }

  const json = (await res.json()) as { access_token: string; id_token?: string };
  return { accessToken: json.access_token, idToken: json.id_token };
}

export interface KeycloakUserInfo {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
}

export async function fetchKeycloakUserInfo(accessToken: string): Promise<KeycloakUserInfo> {
  const config = getKeycloakConfig();
  if (!config) {
    throw new Error("Keycloak no está configurado.");
  }

  const issuer = getKeycloakIssuer(config);
  const res = await fetch(`${issuer}/protocol/openid-connect/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    await res.text();
    console.error("[keycloak] userinfo failed", res.status);
    throw new Error("No se pudo validar el perfil institucional.");
  }

  return (await res.json()) as KeycloakUserInfo;
}

export class KeycloakAuthError extends Error {
  constructor(
    message: string,
    readonly code: "invalid_credentials" | "keycloak_unavailable" | "misconfigured"
  ) {
    super(message);
    this.name = "KeycloakAuthError";
  }
}

function parseTokenError(res: Response, body: { error?: string; error_description?: string }) {
  const errorCode = body.error ?? "";
  const description = body.error_description ?? "";
  const normalized = `${errorCode} ${description}`.toLowerCase();

  if (normalized.includes("https required")) {
    throw new KeycloakAuthError(
      "El servidor de identidad requiere HTTPS. El administrador debe ajustar la configuración SSL del realm para desarrollo.",
      "keycloak_unavailable"
    );
  }

  if (errorCode === "invalid_client" || normalized.includes("invalid client")) {
    throw new KeycloakAuthError(
      "El cliente institucional no existe en el realm o la configuración no coincide.",
      "misconfigured"
    );
  }

  if (errorCode === "unauthorized_client" || normalized.includes("direct access grants")) {
    throw new KeycloakAuthError(
      "El grant solicitado no está habilitado en el cliente institucional.",
      "misconfigured"
    );
  }

  if (
    errorCode === "invalid_grant" &&
    (normalized.includes("invalid user credentials") ||
      normalized.includes("invalid username or password") ||
      normalized.includes("account is not fully set up"))
  ) {
    throw new KeycloakAuthError("Usuario o contraseña incorrectos.", "invalid_credentials");
  }

  if (errorCode === "invalid_grant") {
    throw new KeycloakAuthError(
      "No se pudo validar las credenciales institucionales.",
      "invalid_credentials"
    );
  }

  console.error("[keycloak] token error", { status: res.status, errorCode });
  throw new KeycloakAuthError("No se pudo iniciar sesión.", "keycloak_unavailable");
}

/**
 * ROPC (Direct Access Grants) — login embebido de Growth OS.
 * El navegador envía correo/contraseña a /api/identity/auth/keycloak/session;
 * este grant habla con Keycloak en el servidor. Requiere DAG ON en el cliente.
 */
export async function loginWithKeycloakPassword(input: {
  username: string;
  password: string;
}): Promise<{ accessToken: string }> {
  const config = getKeycloakConfig();
  if (!config) {
    throw new KeycloakAuthError("El servicio de autenticación no está configurado.", "misconfigured");
  }

  let res: Response;
  try {
    res = await requestKeycloakToken(config, {
      grant_type: "password",
      username: input.username.trim(),
      password: input.password,
      scope: "openid profile email",
    });
  } catch {
    throw new KeycloakAuthError("No se pudo conectar con el servicio de autenticación.", "keycloak_unavailable");
  }

  if (!res.ok) {
    let body: { error?: string; error_description?: string } = {};
    try {
      body = (await res.json()) as { error?: string; error_description?: string };
    } catch {
      body = { error_description: await res.text() };
    }
    parseTokenError(res, body);
  }

  const json = (await res.json()) as { access_token: string };
  return { accessToken: json.access_token };
}
