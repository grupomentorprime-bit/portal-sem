import "server-only";

import { getAppBaseUrl } from "@/lib/app-url";

export interface KeycloakConfig {
  url: string;
  realm: string;
  clientId: string;
  /** Vacío = cliente público (sin secret), como admin-cli */
  clientSecret: string;
  redirectUri: string;
  publicClient: boolean;
}

export function isKeycloakEnabled(): boolean {
  const cfg = getKeycloakConfig();
  return Boolean(cfg);
}

export function getKeycloakConfig(): KeycloakConfig | null {
  const url = process.env.KEYCLOAK_URL?.replace(/\/$/, "");
  const realm = process.env.KEYCLOAK_REALM?.trim();
  const clientId = process.env.KEYCLOAK_CLIENT_ID?.trim();
  const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET?.trim() ?? "";

  if (!url || !realm || !clientId) {
    return null;
  }

  const redirectUri =
    process.env.KEYCLOAK_REDIRECT_URI?.trim() ||
    `${getAppBaseUrl()}/api/identity/auth/keycloak/callback`;

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

export function buildKeycloakAuthorizeUrl(state: string): string {
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
  });

  return `${issuer}/protocol/openid-connect/auth?${params.toString()}`;
}

export async function exchangeKeycloakCode(
  code: string
): Promise<{ accessToken: string; idToken?: string }> {
  const config = getKeycloakConfig();
  if (!config) {
    throw new Error("Keycloak no está configurado.");
  }

  const res = await requestKeycloakToken(config, {
    grant_type: "authorization_code",
    redirect_uri: config.redirectUri,
    code,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Keycloak token error: ${text}`);
  }

  const json = (await res.json()) as { access_token: string; id_token?: string };
  return { accessToken: json.access_token, idToken: json.id_token };
}

export interface KeycloakUserInfo {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
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
    const text = await res.text();
    throw new Error(`Keycloak userinfo error: ${text}`);
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
      "El cliente institucional no existe en el realm o la configuración no coincide. Si usas cliente público, no necesitas secret.",
      "misconfigured"
    );
  }

  if (errorCode === "unauthorized_client" || normalized.includes("direct access grants")) {
    throw new KeycloakAuthError(
      "El inicio de sesión directo no está habilitado. Activa Direct access grants en el cliente institucional.",
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
      description || "No se pudo validar las credenciales institucionales.",
      "invalid_credentials"
    );
  }

  console.error("[keycloak] token error", { status: res.status, errorCode, description });
  throw new KeycloakAuthError(description || "No se pudo iniciar sesión.", "keycloak_unavailable");
}

/** Login embebido: valida usuario/contraseña (Direct Access Grants). */
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
