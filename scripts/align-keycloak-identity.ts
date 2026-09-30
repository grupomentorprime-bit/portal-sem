/**
 * Alinea la identidad visible del realm de plataforma a Growth OS.
 *
 * No renombra el realm, no regenera secrets, no cambia redirect URIs
 * y no toca usuarios ni sesiones.
 *
 * El tema `sem` solo se asigna a seminario-ipn-web si ya está instalado
 * en el servidor. Un tema ausente rompe el login de ese cliente.
 *
 * Uso: npx tsx scripts/align-keycloak-identity.ts
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import {
  GROWTH_OS_KEYCLOAK_CLIENT_IDS,
  KEYCLOAK_GROWTH_OS_LOGIN_THEME,
  KEYCLOAK_REALM_DISPLAY_NAME,
  KEYCLOAK_REALM_TECHNICAL_ID,
  KEYCLOAK_SEM_SPACE_LOGIN_THEME,
  SEM_SPACE_KEYCLOAK_CLIENT_ID,
} from "../src/core/identity/auth/keycloak-identity";

const ENV_PATH = resolve(process.cwd(), ".env");
const SEM_CLIENT_NAME = "Seminario Eclesiástico Mayor";

type Json = Record<string, unknown>;

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
    throw new Error(`No se pudo autenticar como admin de Keycloak (${res.status}).`);
  }
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

async function api(
  baseUrl: string,
  token: string,
  path: string,
  init?: RequestInit
): Promise<Response> {
  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
  });
}

function stableList(value: unknown): string {
  return JSON.stringify(Array.isArray(value) ? value : []);
}

async function main(): Promise<void> {
  const env = loadEnv();
  const baseUrl = env.KEYCLOAK_URL?.replace(/\/$/, "");
  const realm = env.KEYCLOAK_REALM?.trim();
  const adminUser = process.env.KEYCLOAK_ADMIN?.trim() || env.KEYCLOAK_ADMIN;
  const adminPassword = process.env.KEYCLOAK_ADMIN_PASSWORD?.trim() || env.KEYCLOAK_ADMIN_PASSWORD;

  console.log("\n── Identidad Keycloak: Growth OS ──\n");

  if (!baseUrl || !realm) {
    console.error("✗ Faltan KEYCLOAK_URL o KEYCLOAK_REALM en .env");
    process.exit(1);
  }
  if (realm !== KEYCLOAK_REALM_TECHNICAL_ID) {
    console.error(
      `✗ El realm técnico debe seguir siendo ${KEYCLOAK_REALM_TECHNICAL_ID}. Este script no lo renombra.`
    );
    process.exit(1);
  }
  if (!adminUser || !adminPassword) {
    console.error("✗ Faltan KEYCLOAK_ADMIN y KEYCLOAK_ADMIN_PASSWORD.");
    process.exit(1);
  }

  const token = await getAdminToken(baseUrl, adminUser, adminPassword);
  const realmPath = `/admin/realms/${encodeURIComponent(realm)}`;
  const realmRes = await api(baseUrl, token, realmPath);
  if (!realmRes.ok) {
    throw new Error(`No se pudo leer el realm (${realmRes.status}).`);
  }
  const realmBody = (await realmRes.json()) as Json;
  if (realmBody.realm !== KEYCLOAK_REALM_TECHNICAL_ID) {
    throw new Error("El realm leído no coincide con el id técnico. No se escribe nada.");
  }

  const infoRes = await api(baseUrl, token, "/admin/serverinfo");
  if (!infoRes.ok) {
    throw new Error(`No se pudo leer serverinfo (${infoRes.status}).`);
  }
  const info = (await infoRes.json()) as {
    themes?: { login?: Array<{ name: string }> };
  };
  const loginThemes = new Set((info.themes?.login ?? []).map((theme) => theme.name));
  const growthThemeReady = loginThemes.has(KEYCLOAK_GROWTH_OS_LOGIN_THEME);
  const semThemeReady = loginThemes.has(KEYCLOAK_SEM_SPACE_LOGIN_THEME);

  const nextRealm: Json = {
    ...realmBody,
    realm: KEYCLOAK_REALM_TECHNICAL_ID,
    displayName: KEYCLOAK_REALM_DISPLAY_NAME,
    displayNameHtml: KEYCLOAK_REALM_DISPLAY_NAME,
  };
  if (growthThemeReady) {
    nextRealm.loginTheme = KEYCLOAK_GROWTH_OS_LOGIN_THEME;
  }

  const realmChanged =
    realmBody.displayName !== KEYCLOAK_REALM_DISPLAY_NAME ||
    realmBody.displayNameHtml !== KEYCLOAK_REALM_DISPLAY_NAME ||
    (growthThemeReady && realmBody.loginTheme !== KEYCLOAK_GROWTH_OS_LOGIN_THEME);

  if (realmChanged) {
    const put = await api(baseUrl, token, realmPath, {
      method: "PUT",
      body: JSON.stringify(nextRealm),
    });
    if (!put.ok) {
      throw new Error(`No se pudo actualizar el realm (${put.status}): ${(await put.text()).slice(0, 300)}`);
    }
    console.log(`✓ Display Name = ${KEYCLOAK_REALM_DISPLAY_NAME}`);
  } else {
    console.log(`✓ Display Name ya es ${KEYCLOAK_REALM_DISPLAY_NAME}`);
  }

  const confirmedRes = await api(baseUrl, token, realmPath);
  const confirmed = (await confirmedRes.json()) as Json;
  if (confirmed.realm !== KEYCLOAK_REALM_TECHNICAL_ID) {
    throw new Error("El id técnico del realm cambió. Revisa el servidor antes de seguir.");
  }
  if (confirmed.displayName !== KEYCLOAK_REALM_DISPLAY_NAME) {
    throw new Error("El Display Name no quedó en Growth OS.");
  }

  const clientTargets: Array<{ clientId: string; name: string; theme: string | null }> = [
    ...GROWTH_OS_KEYCLOAK_CLIENT_IDS.map((clientId) => ({
      clientId,
      name: KEYCLOAK_REALM_DISPLAY_NAME,
      theme: growthThemeReady ? KEYCLOAK_GROWTH_OS_LOGIN_THEME : null,
    })),
    {
      clientId: SEM_SPACE_KEYCLOAK_CLIENT_ID,
      name: SEM_CLIENT_NAME,
      theme: semThemeReady ? KEYCLOAK_SEM_SPACE_LOGIN_THEME : null,
    },
  ];

  for (const target of clientTargets) {
    const listRes = await api(
      baseUrl,
      token,
      `${realmPath}/clients?clientId=${encodeURIComponent(target.clientId)}`
    );
    if (!listRes.ok) {
      throw new Error(`No se pudo buscar ${target.clientId} (${listRes.status}).`);
    }
    const list = (await listRes.json()) as Json[];
    const found = list.find((item) => item.clientId === target.clientId);
    if (!found?.id || typeof found.id !== "string") {
      console.log(`· ${target.clientId} no existe en el realm. No se crea.`);
      continue;
    }

    const fullRes = await api(baseUrl, token, `${realmPath}/clients/${found.id}`);
    if (!fullRes.ok) {
      throw new Error(`No se pudo leer ${target.clientId} (${fullRes.status}).`);
    }
    const client = (await fullRes.json()) as Json;
    const secretRes = await api(
      baseUrl,
      token,
      `${realmPath}/clients/${found.id}/client-secret`
    );
    const secretBefore = secretRes.ok
      ? ((await secretRes.json()) as { value?: string }).value ?? null
      : null;
    const beforeRedirects = stableList(client.redirectUris);
    const beforeWebOrigins = stableList(client.webOrigins);
    const beforeRoot = client.rootUrl ?? "";
    const attributes = {
      ...((client.attributes as Record<string, string> | undefined) ?? {}),
    };
    if (target.theme) {
      attributes.login_theme = target.theme;
    }

    const nextClient: Json = {
      ...client,
      clientId: target.clientId,
      name: target.name,
      attributes,
      redirectUris: client.redirectUris,
      webOrigins: client.webOrigins,
      rootUrl: client.rootUrl,
      baseUrl: client.baseUrl,
    };

    const themeSame = !target.theme || attributes.login_theme === target.theme;
    const nameSame = client.name === target.name;
    const previousTheme = (client.attributes as Record<string, string> | undefined)?.login_theme;
    const themeAlready = !target.theme || previousTheme === target.theme;
    if (nameSame && themeAlready && themeSame) {
      console.log(`✓ ${target.clientId} ya tiene el nombre${target.theme ? " y el tema" : ""} esperado`);
      continue;
    }

    const put = await api(baseUrl, token, `${realmPath}/clients/${found.id}`, {
      method: "PUT",
      body: JSON.stringify(nextClient),
    });
    if (!put.ok) {
      throw new Error(
        `No se pudo actualizar ${target.clientId} (${put.status}): ${(await put.text()).slice(0, 300)}`
      );
    }

    const afterRes = await api(baseUrl, token, `${realmPath}/clients/${found.id}`);
    const after = (await afterRes.json()) as Json;
    if (after.clientId !== target.clientId) {
      throw new Error(`${target.clientId} cambió de clientId. Revisa el servidor.`);
    }
    if (stableList(after.redirectUris) !== beforeRedirects) {
      throw new Error(`${target.clientId} cambió sus redirect URIs. Revisa el servidor.`);
    }
    if (stableList(after.webOrigins) !== beforeWebOrigins || (after.rootUrl ?? "") !== beforeRoot) {
      throw new Error(`${target.clientId} cambió rootUrl o webOrigins. Revisa el servidor.`);
    }
    if (secretBefore) {
      const secretAfterRes = await api(
        baseUrl,
        token,
        `${realmPath}/clients/${found.id}/client-secret`
      );
      const secretAfter = secretAfterRes.ok
        ? ((await secretAfterRes.json()) as { value?: string }).value ?? null
        : null;
      if (secretAfter !== secretBefore) {
        throw new Error(`${target.clientId} regeneró el client secret. Revisa el servidor.`);
      }
    }
    console.log(
      `✓ ${target.clientId} → nombre «${target.name}»${
        target.theme ? `, tema ${target.theme}` : ""
      }`
    );
  }

  if (!growthThemeReady || !semThemeReady) {
    console.log("\n· Temas de login instalados:", [...loginThemes].join(", ") || "(ninguno)");
    console.log(
      "· growth-os y sem todavía no están en el servidor. No se asigna un tema inexistente: eso rompe el login."
    );
    console.log(
      "· Monta infra/keycloak/themes/growth-os e infra/keycloak/themes/sem en el directorio themes/ de Keycloak y vuelve a ejecutar este script."
    );
    console.log(
      "· Hasta entonces, el Display Name Growth OS es la identidad general, también en seminario-ipn-web."
    );
  } else {
    console.log(`✓ Tema de plataforma: ${KEYCLOAK_GROWTH_OS_LOGIN_THEME}`);
    console.log(`✓ Tema del Espacio SEM (${SEM_SPACE_KEYCLOAK_CLIENT_ID}): ${KEYCLOAK_SEM_SPACE_LOGIN_THEME}`);
  }

  console.log(`\nRealm técnico: ${confirmed.realm}`);
  console.log(`Display Name:  ${confirmed.displayName}`);
  console.log("Secrets, redirect URIs, usuarios y sesiones no se modifican.\n");
}

main().catch((err) => {
  console.error("\n✗", err instanceof Error ? err.message : err);
  process.exit(1);
});
