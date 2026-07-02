import "server-only";

import { getKeycloakConfig } from "@/core/identity/auth/keycloak";

interface KeycloakAdminConfig {
  baseUrl: string;
  realm: string;
  adminUser: string;
  adminPassword: string;
}

export interface ProvisionKeycloakUserInput {
  email: string;
  displayName: string;
}

export interface ProvisionKeycloakUserResult {
  ok: true;
  created: boolean;
  userId: string;
}

export interface ProvisionKeycloakUserError {
  ok: false;
  error: string;
  code: "not_configured" | "keycloak_error";
}

export interface SetKeycloakPasswordResult {
  ok: true;
  userId: string;
}

export interface SetKeycloakPasswordError {
  ok: false;
  error: string;
  code: "not_configured" | "keycloak_error";
}

function getKeycloakAdminConfig(): KeycloakAdminConfig | null {
  const keycloak = getKeycloakConfig();
  const adminUser = process.env.KEYCLOAK_ADMIN?.trim();
  const adminPassword = process.env.KEYCLOAK_ADMIN_PASSWORD?.trim();

  if (!keycloak || !adminUser || !adminPassword) return null;

  return {
    baseUrl: keycloak.url.replace(/\/$/, ""),
    realm: keycloak.realm,
    adminUser,
    adminPassword,
  };
}

export function isKeycloakProvisioningEnabled(): boolean {
  return getKeycloakAdminConfig() !== null;
}

function splitDisplayName(displayName: string): { firstName: string; lastName: string } {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "Usuario", lastName: "CMS" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "CMS" };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

async function getAdminToken(config: KeycloakAdminConfig): Promise<string> {
  const body = new URLSearchParams({
    grant_type: "password",
    client_id: "admin-cli",
    username: config.adminUser,
    password: config.adminPassword,
  });

  const res = await fetch(`${config.baseUrl}/realms/master/protocol/openid-connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`No se pudo autenticar en Keycloak: ${text}`);
  }

  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

export async function findKeycloakUserIdByEmail(email: string): Promise<string | null> {
  const config = getKeycloakAdminConfig();
  if (!config) return null;

  const token = await getAdminToken(config);
  return findKeycloakUserId(config, token, email);
}

async function findKeycloakUserId(
  config: KeycloakAdminConfig,
  token: string,
  email: string
): Promise<string | null> {
  const url = new URL(
    `${config.baseUrl}/admin/realms/${encodeURIComponent(config.realm)}/users`
  );
  url.searchParams.set("email", email);
  url.searchParams.set("exact", "true");

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error buscando usuario en Keycloak: ${text}`);
  }

  const users = (await res.json()) as Array<{ id: string }>;
  return users[0]?.id ?? null;
}

async function createKeycloakUserShell(
  config: KeycloakAdminConfig,
  token: string,
  input: ProvisionKeycloakUserInput
): Promise<string> {
  const { firstName, lastName } = splitDisplayName(input.displayName);
  const res = await fetch(
    `${config.baseUrl}/admin/realms/${encodeURIComponent(config.realm)}/users`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: input.email,
        email: input.email,
        firstName,
        lastName,
        enabled: true,
        emailVerified: true,
      }),
    }
  );

  if (res.status === 409) {
    const existingId = await findKeycloakUserId(config, token, input.email);
    if (existingId) return existingId;
    throw new Error("El usuario ya existe en Keycloak pero no se pudo localizar.");
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`No se pudo crear el usuario en Keycloak: ${text}`);
  }

  const location = res.headers.get("Location");
  if (location) {
    const parts = location.split("/");
    const id = parts[parts.length - 1];
    if (id) return id;
  }

  const createdId = await findKeycloakUserId(config, token, input.email);
  if (!createdId) {
    throw new Error("Usuario creado en Keycloak pero no se pudo obtener su identificador.");
  }
  return createdId;
}

async function setKeycloakUserPassword(
  config: KeycloakAdminConfig,
  token: string,
  userId: string,
  password: string
): Promise<void> {
  const res = await fetch(
    `${config.baseUrl}/admin/realms/${encodeURIComponent(config.realm)}/users/${encodeURIComponent(userId)}/reset-password`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "password",
        value: password,
        temporary: false,
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`No se pudo establecer la contraseña: ${text}`);
  }
}

export async function keycloakUserNeedsPassword(email: string): Promise<boolean> {
  const config = getKeycloakAdminConfig();
  if (!config) return true;

  try {
    const token = await getAdminToken(config);
    const userId = await findKeycloakUserId(config, token, email.toLowerCase().trim());
    if (!userId) return true;

    const res = await fetch(
      `${config.baseUrl}/admin/realms/${encodeURIComponent(config.realm)}/users/${encodeURIComponent(userId)}/credentials`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!res.ok) return true;

    const credentials = (await res.json()) as Array<{ type?: string }>;
    return !credentials.some((credential) => credential.type === "password");
  } catch {
    return true;
  }
}

export async function provisionKeycloakUserForInvite(
  input: ProvisionKeycloakUserInput
): Promise<ProvisionKeycloakUserResult | ProvisionKeycloakUserError> {
  const config = getKeycloakAdminConfig();
  if (!config) {
    return {
      ok: false,
      error: "KEYCLOAK_ADMIN y KEYCLOAK_ADMIN_PASSWORD no están configurados.",
      code: "not_configured",
    };
  }

  try {
    const token = await getAdminToken(config);
    const email = input.email.toLowerCase().trim();
    const existingId = await findKeycloakUserId(config, token, email);

    if (existingId) {
      return { ok: true, created: false, userId: existingId };
    }

    const userId = await createKeycloakUserShell(config, token, { ...input, email });
    return { ok: true, created: true, userId };
  } catch (error) {
    console.error("[keycloak-admin] provision failed", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Error desconocido en Keycloak.",
      code: "keycloak_error",
    };
  }
}

export async function setKeycloakPasswordForInvite(input: {
  email: string;
  displayName: string;
  password: string;
}): Promise<SetKeycloakPasswordResult | SetKeycloakPasswordError> {
  const config = getKeycloakAdminConfig();
  if (!config) {
    return {
      ok: false,
      error: "KEYCLOAK_ADMIN y KEYCLOAK_ADMIN_PASSWORD no están configurados.",
      code: "not_configured",
    };
  }

  try {
    const token = await getAdminToken(config);
    const email = input.email.toLowerCase().trim();
    let userId = await findKeycloakUserId(config, token, email);

    if (!userId) {
      userId = await createKeycloakUserShell(config, token, {
        email,
        displayName: input.displayName,
      });
    }

    await setKeycloakUserPassword(config, token, userId, input.password);
    return { ok: true, userId };
  } catch (error) {
    console.error("[keycloak-admin] set password failed", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Error desconocido en Keycloak.",
      code: "keycloak_error",
    };
  }
}
