/**
 * Verifica la configuración Keycloak para Growth OS (Auth Code + PKCE).
 * No exige Direct Access Grants (ROPC) — growth-os-web lo tiene OFF.
 * Uso: npx tsx scripts/check-keycloak.ts
 */
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnv(): Record<string, string> {
  const path = resolve(process.cwd(), ".env");
  const raw = readFileSync(path, "utf8");
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

async function main(): Promise<void> {
  const env = loadEnv();
  const url = env.KEYCLOAK_URL?.replace(/\/$/, "");
  const realm = env.KEYCLOAK_REALM;
  const clientId = env.KEYCLOAK_CLIENT_ID;
  const clientSecret = env.KEYCLOAK_CLIENT_SECRET?.trim() ?? "";
  const redirectUri =
    env.KEYCLOAK_REDIRECT_URI?.trim() ||
    "http://localhost:3000/api/identity/auth/keycloak/callback";

  console.log("\n── Diagnóstico Keycloak (Auth Code + PKCE) ──\n");

  if (!url || !realm || !clientId) {
    console.log("✗ Faltan variables en .env:");
    if (!url) console.log("  - KEYCLOAK_URL");
    if (!realm) console.log("  - KEYCLOAK_REALM");
    if (!clientId) console.log("  - KEYCLOAK_CLIENT_ID");
    process.exit(1);
  }

  if (clientId === "admin-cli" || clientId === "seminario-ipn-web") {
    console.log(`✗ Cliente "${clientId}" no es el de Growth OS.`);
    console.log("  Usa KEYCLOAK_CLIENT_ID=growth-os-web\n");
    process.exit(1);
  }

  console.log(`URL:      ${url}`);
  console.log(`Realm:    ${realm}`);
  console.log(`Client:   ${clientId}`);
  console.log(
    `Secret:   ${clientSecret ? `(presente, ${clientSecret.length} chars)` : "(vacío)"}`
  );
  console.log(`Redirect: ${redirectUri}\n`);

  if (!clientSecret) {
    console.log("✗ KEYCLOAK_CLIENT_SECRET vacío — growth-os-web es confidential.\n");
    process.exit(1);
  }

  const wellKnown = `${url}/realms/${encodeURIComponent(realm)}/.well-known/openid-configuration`;
  const oidcRes = await fetch(wellKnown);
  if (!oidcRes.ok) {
    console.log(`✗ No se pudo leer OIDC discovery (${oidcRes.status}): ${wellKnown}\n`);
    process.exit(1);
  }

  const oidc = (await oidcRes.json()) as {
    authorization_endpoint?: string;
    token_endpoint?: string;
  };

  if (!oidc.authorization_endpoint || !oidc.token_endpoint) {
    console.log("✗ Discovery OIDC incompleto.\n");
    process.exit(1);
  }

  console.log("✓ Realm OIDC reachable");
  console.log(`  authorize: ${oidc.authorization_endpoint}`);
  console.log(`  token:     ${oidc.token_endpoint}`);

  // Probe client credentials sin ROPC: authorization_code inválido → invalid_grant
  // (cliente existe) vs invalid_client (mal secret / client id).
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: "diagnostic-invalid-code",
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
    code_verifier: "diagnostic-verifier-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  });

  const tokenRes = await fetch(oidc.token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = (await tokenRes.json()) as {
    error?: string;
    error_description?: string;
  };

  if (json.error === "invalid_client") {
    console.log("\n✗ CLIENT ID O SECRET INCORRECTO");
    console.log("  Verifica Credentials del cliente en Keycloak (sin regenerar en prod).\n");
    process.exit(1);
  }

  if (json.error === "invalid_grant" || json.error === "unauthorized_client") {
    console.log("\n✓ Cliente confidential responde (Auth Code path)");
    console.log("  Login UI: /admin/login → /api/identity/auth/keycloak/login (+ PKCE)\n");
    process.exit(0);
  }

  console.log("\n? Respuesta inesperada:", { status: tokenRes.status, error: json.error });
  process.exit(1);
}

main().catch((err) => {
  console.error("Error de conexión:", err);
  process.exit(1);
});
