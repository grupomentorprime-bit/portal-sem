/**
 * Crea o actualiza el cliente OAuth del portal en Keycloak (confidential + Direct Access Grants).
 * Requiere en .env: KEYCLOAK_ADMIN y KEYCLOAK_ADMIN_PASSWORD
 *
 * Uso: npx tsx scripts/setup-keycloak-client.ts
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const ENV_PATH = resolve(process.cwd(), ".env");
const CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID?.trim() || "seminario-ipn-web";

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
  const next = re.test(raw) ? raw.replace(re, line) : `${raw.trimEnd()}\n${line}\n`;
  writeFileSync(ENV_PATH, next, "utf8");
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

async function findClientUuid(
  baseUrl: string,
  realm: string,
  token: string,
  clientId: string
): Promise<string | null> {
  const res = await fetch(
    `${baseUrl}/admin/realms/${encodeURIComponent(realm)}/clients?clientId=${encodeURIComponent(clientId)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error listando clientes: ${text}`);
  }

  const clients = (await res.json()) as Array<{ id: string }>;
  return clients[0]?.id ?? null;
}

async function createOrUpdateClient(
  baseUrl: string,
  realm: string,
  token: string,
  redirectUri: string
): Promise<string> {
  const existingUuid = await findClientUuid(baseUrl, realm, token, CLIENT_ID);
  const webOrigin = new URL(redirectUri).origin;

  const payload = {
    clientId: CLIENT_ID,
    name: "Portal SEM CMS",
    enabled: true,
    publicClient: false,
    clientAuthenticatorType: "client-secret",
    directAccessGrantsEnabled: true,
    standardFlowEnabled: true,
    serviceAccountsEnabled: false,
    redirectUris: [redirectUri],
    webOrigins: [webOrigin, "+"],
    protocol: "openid-connect",
    attributes: {
      "post.logout.redirect.uris": "+",
    },
  };

  if (existingUuid) {
    const res = await fetch(
      `${baseUrl}/admin/realms/${encodeURIComponent(realm)}/clients/${existingUuid}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) {
      throw new Error(`Error actualizando cliente: ${await res.text()}`);
    }
    console.log(`✓ Cliente existente actualizado: ${CLIENT_ID}`);
    return existingUuid;
  }

  const res = await fetch(`${baseUrl}/admin/realms/${encodeURIComponent(realm)}/clients`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.status.toString().startsWith("2")) {
    throw new Error(`Error creando cliente: ${await res.text()}`);
  }

  const uuid = await findClientUuid(baseUrl, realm, token, CLIENT_ID);
  if (!uuid) throw new Error("Cliente creado pero no se pudo obtener su UUID.");
  console.log(`✓ Cliente creado: ${CLIENT_ID}`);
  return uuid;
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

async function main(): Promise<void> {
  const env = loadEnv();
  const baseUrl = env.KEYCLOAK_URL?.replace(/\/$/, "");
  const realm = env.KEYCLOAK_REALM;
  const adminUser = process.env.KEYCLOAK_ADMIN?.trim() || env.KEYCLOAK_ADMIN;
  const adminPassword = process.env.KEYCLOAK_ADMIN_PASSWORD?.trim() || env.KEYCLOAK_ADMIN_PASSWORD;
  const redirectUri =
    env.KEYCLOAK_REDIRECT_URI?.trim() ||
    `${env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000"}/api/identity/auth/keycloak/callback`;

  console.log("\n── Configuración cliente Keycloak (confidential) ──\n");

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

  console.log(`URL:     ${baseUrl}`);
  console.log(`Realm:   ${realm}`);
  console.log(`Client:  ${CLIENT_ID}`);
  console.log(`Redirect:${redirectUri}\n`);

  const token = await getAdminToken(baseUrl, adminUser, adminPassword);
  console.log("✓ Autenticado como admin de Keycloak");

  const clientUuid = await createOrUpdateClient(baseUrl, realm, token, redirectUri);
  const secret = await getClientSecret(baseUrl, realm, token, clientUuid);

  upsertEnvValue("KEYCLOAK_CLIENT_ID", CLIENT_ID);
  upsertEnvValue("KEYCLOAK_CLIENT_SECRET", secret);
  upsertEnvValue("KEYCLOAK_REDIRECT_URI", redirectUri);

  console.log(`✓ Secret guardado en .env (${secret.slice(0, 4)}…${secret.slice(-4)})`);
  console.log("\nReinicia npm run dev y ejecuta: npx tsx scripts/check-keycloak.ts\n");
}

main().catch((err) => {
  console.error("\n✗", err instanceof Error ? err.message : err);
  process.exit(1);
});
