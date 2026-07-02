/**
 * Verifica la conexión con el servidor de identidad institucional.
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

async function probe(
  tokenUrl: string,
  clientId: string,
  clientSecret: string
): Promise<{ error?: string; error_description?: string }> {
  const body = new URLSearchParams({
    grant_type: "password",
    client_id: clientId,
    username: "test@diagnostico.local",
    password: "test",
    scope: "openid profile email",
  });
  if (clientSecret) body.set("client_secret", clientSecret);

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  return (await res.json()) as { error?: string; error_description?: string };
}

async function main(): Promise<void> {
  const env = loadEnv();
  const url = env.KEYCLOAK_URL?.replace(/\/$/, "");
  const realm = env.KEYCLOAK_REALM;
  const clientId = env.KEYCLOAK_CLIENT_ID;
  const clientSecret = env.KEYCLOAK_CLIENT_SECRET?.trim() ?? "";

  console.log("\n── Diagnóstico de autenticación institucional ──\n");

  if (!url || !realm || !clientId) {
    console.log("✗ Faltan variables en .env:");
    if (!url) console.log("  - KEYCLOAK_URL");
    if (!realm) console.log("  - KEYCLOAK_REALM");
    if (!clientId) console.log("  - KEYCLOAK_CLIENT_ID");
    process.exit(1);
  }

  console.log(`URL:      ${url}`);
  console.log(`Realm:    ${realm}`);
  console.log(`Client:   ${clientId}`);
  console.log(
    `Secret:   ${clientSecret ? `${clientSecret.slice(0, 4)}…${clientSecret.slice(-4)} (${clientSecret.length} chars)` : "(vacío — cliente público)"}\n`
  );

  const tokenUrl = `${url}/realms/${realm}/protocol/openid-connect/token`;
  const json = await probe(tokenUrl, clientId, clientSecret);

  if (json.error === "invalid_client") {
    const builtin = await probe(tokenUrl, "admin-cli", "");
    if (builtin.error === "invalid_grant") {
      console.log("✗ EL CLIENT ID NO EXISTE EN ESTE REALM");
      console.log(`  "${clientId}" no está registrado en realm "${realm}".`);
      console.log("  Keycloak sí responde (admin-cli funciona).\n");
      console.log("  Solución:");
      console.log("  1. En Keycloak, arriba a la izquierda confirma que el realm es:", realm);
      console.log("  2. Clients → verifica el Client ID exacto (copia desde Settings)");
      console.log("  3. O usa cliente público sin secret, por ejemplo:");
      console.log("     KEYCLOAK_CLIENT_ID=admin-cli");
      console.log("     KEYCLOAK_CLIENT_SECRET=   (vacío)\n");
    } else {
      console.log("✗ CLIENT ID O SECRET INCORRECTO");
      console.log("  Si el cliente es público, deja KEYCLOAK_CLIENT_SECRET vacío.");
      console.log("  Si es confidential, copia el secret desde Credentials.\n");
    }
    process.exit(1);
  }

  if (json.error === "unauthorized_client") {
    console.log("✗ DIRECT ACCESS GRANTS DESACTIVADO");
    console.log("  En el cliente, activa: Direct access grants = ON\n");
    process.exit(1);
  }

  if (json.error === "invalid_grant") {
    console.log("✓ Configuración del cliente CORRECTA");
    console.log("  (Usuario de prueba no existe, pero el cliente está bien configurado)");
    console.log("\n  Si no puedes entrar, verifica el usuario en Keycloak:");
    console.log("  - Enabled = ON, Email verified = ON");
    console.log("  - Contraseña con Temporary = OFF");
    console.log("  - Mismo email/username que usas en el login\n");
    process.exit(0);
  }

  console.log("? Respuesta inesperada:", json);
  process.exit(1);
}

main().catch((err) => {
  console.error("Error de conexión:", err);
  process.exit(1);
});
