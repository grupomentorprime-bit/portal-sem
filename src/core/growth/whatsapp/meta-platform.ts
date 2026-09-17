/**
 * OT-GROWTH-WHATSAPP-META-001 — configuración Meta a nivel Growth OS.
 * Secretos solo en servidor. App ID / config_id son públicos (SDK) pero no se
 * inventan: deben existir en el entorno de despliegue.
 *
 * OT-GROWTH-WHATSAPP-EMBEDDED-SIGNUP-OAUTH-FIX-001 — normalizar IDs públicos
 * (comillas Dokploy) para que FB.login reciba un config_id válido; sin él Meta
 * cae a OIDC scope=openid y responde “needs at least one supported permission”.
 */

export const META_PLATFORM_ENV = {
  appId: "META_APP_ID",
  appSecret: "META_APP_SECRET",
  esConfigId: "META_ES_CONFIG_ID",
  webhookVerifyToken: "META_WEBHOOK_VERIFY_TOKEN",
} as const;

export interface MetaPlatformConfig {
  appId: string;
  appSecret: string;
  esConfigId: string;
  webhookVerifyToken: string;
}

/** Vista segura para el admin que lanza Embedded Signup (sin secretos). */
export interface MetaPlatformPublicConfig {
  ready: boolean;
  appId: string | null;
  esConfigId: string | null;
  missing: string[];
}

function stripWrappingQuotes(value: string): string {
  // Dokploy / .env a veces envuelven el valor en comillas literales.
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1).trim();
  }
  return value;
}

function trimEnv(name: string, env: NodeJS.ProcessEnv): string {
  return stripWrappingQuotes(env[name]?.trim() ?? "");
}

/** App ID / Embedded Signup config_id son numéricos en Meta. */
export function isMetaPublicId(value: string): boolean {
  return /^\d{5,}$/.test(value.trim());
}

export function readMetaPlatformConfig(
  env: NodeJS.ProcessEnv = process.env
): MetaPlatformConfig | null {
  const appId = trimEnv(META_PLATFORM_ENV.appId, env);
  const appSecret = trimEnv(META_PLATFORM_ENV.appSecret, env);
  const esConfigId = trimEnv(META_PLATFORM_ENV.esConfigId, env);
  const webhookVerifyToken = trimEnv(META_PLATFORM_ENV.webhookVerifyToken, env);
  if (
    !appId ||
    !appSecret ||
    !esConfigId ||
    !webhookVerifyToken ||
    !isMetaPublicId(appId) ||
    !isMetaPublicId(esConfigId)
  ) {
    return null;
  }
  return { appId, appSecret, esConfigId, webhookVerifyToken };
}

export function getMetaPlatformPublicConfig(
  env: NodeJS.ProcessEnv = process.env
): MetaPlatformPublicConfig {
  const missing: string[] = [];
  const appId = trimEnv(META_PLATFORM_ENV.appId, env);
  const appSecret = trimEnv(META_PLATFORM_ENV.appSecret, env);
  const esConfigId = trimEnv(META_PLATFORM_ENV.esConfigId, env);
  const webhookVerifyToken = trimEnv(META_PLATFORM_ENV.webhookVerifyToken, env);

  if (!appId || !isMetaPublicId(appId)) missing.push(META_PLATFORM_ENV.appId);
  if (!appSecret) missing.push(META_PLATFORM_ENV.appSecret);
  if (!esConfigId || !isMetaPublicId(esConfigId)) {
    missing.push(META_PLATFORM_ENV.esConfigId);
  }
  if (!webhookVerifyToken) missing.push(META_PLATFORM_ENV.webhookVerifyToken);

  return {
    ready: missing.length === 0,
    appId: appId && isMetaPublicId(appId) ? appId : null,
    esConfigId: esConfigId && isMetaPublicId(esConfigId) ? esConfigId : null,
    missing,
  };
}

export function getMetaAppSecret(
  env: NodeJS.ProcessEnv = process.env
): string | null {
  const secret = trimEnv(META_PLATFORM_ENV.appSecret, env);
  return secret || null;
}

export function getMetaWebhookVerifyToken(
  env: NodeJS.ProcessEnv = process.env
): string | null {
  const token = trimEnv(META_PLATFORM_ENV.webhookVerifyToken, env);
  return token || null;
}
