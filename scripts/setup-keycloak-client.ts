/**
 * Provisiona el cliente OAuth de desarrollo de Growth OS (localhost).
 *
 * Crea solo `growth-os-dev`:
 *  - Client authentication ON · Standard flow ON · Direct access grants ON · PKCE S256
 *  - Redirect único: http://localhost:3000/api/identity/auth/keycloak/callback
 *
 * No modifica clientes protegidos:
 *  - growth-os-web (producción): no se actualiza ni se regenera el secret
 *  - seminario-ipn-web (Espacio SEM) y admin-cli
 *
 * Requiere: KEYCLOAK_ADMIN y KEYCLOAK_ADMIN_PASSWORD
 * Uso: npx tsx scripts/setup-keycloak-client.ts
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const ENV_PATH = resolve(process.cwd(), ".env");
const DEV_CLIENT_ID = "growth-os-dev";
const PROTECTED_PROD_CLIENT = "growth-os-web";
const PROTECTED_CLIENTS = new Set([PROTECTED_PROD_CLIENT, "seminario-ipn-web", "admin-cli"]);
const LOCAL_ORIGIN = "http://localhost:3000";
const LOCAL_REDIRECT = `${LOCAL_ORIGIN}/api/identity/auth/keycloak/callback`;

function loadEnv(): Record<string, string> {
  const raw = readFileSync(ENV_PATH, "utf8");
  const env: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function upsertEnvValue(key: string, value: string): void {
  const raw = readFileSync(ENV_PATH, "utf8");
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  const next = re.test(raw) ? raw.replace(re, () => line) : `${raw.trimEnd()}\n${line}\n`;
  writeFileSync(ENV_PATH, next, "utf8");
}

function assertDevClient(clientId: string): void {
  if (clientId !== DEV_CLIENT_ID || PROTECTED_CLIENTS.has(clientId)) {
    console.error(`✗ Este script solo provisiona ${DEV_CLIENT_ID}.`);
    console.error(
      `  ${PROTECTED_PROD_CLIENT} no se actualiza ni se regenera el secret. seminario-ipn-web y admin-cli no se tocan.`
    );
    process.exit(1);
  }
}

async function getAdminToken(
  baseUrl: string,
  adminUser: string,
  adminPassword: string
): Promise<string> {
  const body = new URLSearchParams({
    grant_type: "password",
    client_id: "admin-cli",
    username: adminUser,
    password: adminPassword,
  });

  const res = await fetch(`${baseUrl}/realms/master/protocol/openid-connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`No se pudo autenticar como admin de Keycloak: ${text}`);
  }

  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

async function findClient(
  baseUrl: string,
  realm: string,
  token: string,
  clientId: string
): Promise<{ id: string; clientId: string } | null> {
  const res = await fetch(
    `${baseUrl}/admin/realms/${encodeURIComponent(realm)}/clients?clientId=${encodeURIComponent(clientId)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    throw new Error(`Error buscando cliente: ${await res.text()}`);
  }

  const list = (await res.json()) as Array<{ id: string; clientId: string }>;
  return list[0] ?? null;
}

function devClientPayload() {
  return {
    clientId: DEV_CLIENT_ID,
    name: "Growth OS",
    description: "Cliente de desarrollo de Growth OS (localhost)",
    enabled: true,
    publicClient: false,
    clientAuthenticatorType: "client-secret",
    directAccessGrantsEnabled: true,
    standardFlowEnabled: true,
    implicitFlowEnabled: false,
    serviceAccountsEnabled: false,
    frontchannelLogout: true,
    rootUrl: LOCAL_ORIGIN,
    baseUrl: LOCAL_ORIGIN,
    redirectUris: [LOCAL_REDIRECT],
    webOrigins: [LOCAL_ORIGIN],
    protocol: "openid-connect",
    attributes: {
      "pkce.code.challenge.method": "S256",
      "post.logout.redirect.uris": `${LOCAL_ORIGIN}/*`,
    },
  };
}

async function createDevClient(baseUrl: string, realm: string, token: string): Promise<string> {
  const res = await fetch(`${baseUrl}/admin/realms/${encodeURIComponent(realm)}/clients`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(devClientPayload()),
  });

  if (!res.status.toString().startsWith("2")) {
    throw new Error(`Error creando cliente: ${await res.text()}`);
  }

  const created = await findClient(baseUrl, realm, token, DEV_CLIENT_ID);
  if (!created) throw new Error("Cliente creado pero no se pudo obtener su UUID.");
  console.log(`✓ Cliente creado: ${DEV_CLIENT_ID}`);
  return created.id;
}

async function getClientSecret(
  baseUrl: string,
  realm: string,
  token: string,
  clientUuid: string
): Promise<string> {
  const res = await fetch(
    `${baseUrl}/admin/realms/${encodeURIComponent(realm)}/clients/${clientUuid}/client-secret`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    throw new Error(`Error obteniendo secret: ${await res.text()}`);
  }

  const json = (await res.json()) as { value?: string };
  if (!json.value) throw new Error("Keycloak no devolvió client secret.");
  return json.value;
}

async function enableDirectAccessGrant(
  baseUrl: string,
  realm: string,
  token: string,
  clientUuid: string
): Promise<void> {
  const url = `${baseUrl}/admin/realms/${encodeURIComponent(realm)}/clients/${clientUuid}`;
  const current = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!current.ok) {
    throw new Error(`Error leyendo cliente: ${await current.text()}`);
  }
  const client = (await current.json()) as { directAccessGrantsEnabled?: boolean };
  if (client.directAccessGrantsEnabled) {
    console.log("✓ Direct access grants ya está activo.");
    return;
  }
  const updated = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...client, directAccessGrantsEnabled: true }),
  });
  if (!updated.ok) {
    throw new Error(`Error activando direct access grants: ${await updated.text()}`);
  }
  console.log("✓ Direct access grants activado para el login embebido.");
}

async function main(): Promise<void> {
  assertDevClient(DEV_CLIENT_ID);

  const env = loadEnv();
  const baseUrl = env.KEYCLOAK_URL?.replace(/\/$/, "");
  const realm = env.KEYCLOAK_REALM;
  const adminUser = process.env.KEYCLOAK_ADMIN?.trim() || env.KEYCLOAK_ADMIN;
  const adminPassword = process.env.KEYCLOAK_ADMIN_PASSWORD?.trim() || env.KEYCLOAK_ADMIN_PASSWORD;

  console.log("\n── Cliente Keycloak de desarrollo Growth OS ──\n");

  if (!baseUrl || !realm) {
    console.error("✗ Faltan KEYCLOAK_URL o KEYCLOAK_REALM en .env");
    process.exit(1);
  }
  if (!adminUser || !adminPassword) {
    console.error("✗ Agrega al .env las credenciales admin de Keycloak:");
    console.error("  KEYCLOAK_ADMIN=admin");
    console.error("  KEYCLOAK_ADMIN_PASSWORD=tu-password-admin");
    process.exit(1);
  }

  const configuredClient = env.KEYCLOAK_CLIENT_ID?.trim();
  if (configuredClient && PROTECTED_CLIENTS.has(configuredClient)) {
    console.log(
      `· .env apunta a "${configuredClient}" (protegido). Se cambia a ${DEV_CLIENT_ID} sin modificar ese cliente.`
    );
  }

  console.log(`URL:     ${baseUrl}`);
  console.log(`Realm:   ${realm}`);
  console.log(`Client:  ${DEV_CLIENT_ID}`);
  console.log(`Redirect:${LOCAL_REDIRECT}\n`);

  const token = await getAdminToken(baseUrl, adminUser, adminPassword);
  console.log("✓ Autenticado como admin de Keycloak");

  const existing = await findClient(baseUrl, realm, token, DEV_CLIENT_ID);
  const clientUuid = existing?.id ?? (await createDevClient(baseUrl, realm, token));

  if (existing) {
    console.log(`✓ ${DEV_CLIENT_ID} ya existe — no se regenera el secret.`);
  }

  await enableDirectAccessGrant(baseUrl, realm, token, clientUuid);

  const secret = await getClientSecret(baseUrl, realm, token, clientUuid);

  upsertEnvValue("KEYCLOAK_CLIENT_ID", DEV_CLIENT_ID);
  upsertEnvValue("KEYCLOAK_CLIENT_SECRET", secret);
  upsertEnvValue("KEYCLOAK_REDIRECT_URI", LOCAL_REDIRECT);

  console.log(`✓ Secret guardado en .env (${secret.slice(0, 4)}…${secret.slice(-4)})`);
  console.log("\nReinicia npm run dev y abre /login.\n");
}

main().catch((err) => {
  console.error("\n✗", err instanceof Error ? err.message : err);
  process.exit(1);
});
