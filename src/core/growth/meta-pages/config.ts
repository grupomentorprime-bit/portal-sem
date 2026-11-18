/**
 * Autorización de páginas de Meta (Facebook + Instagram) para un Espacio.
 * Reutiliza META_APP_ID / META_APP_SECRET. El config de páginas es otro:
 * el de WhatsApp Embedded Signup no entrega la página ni la cuenta de Instagram.
 */

import { isMetaPublicId } from "@/core/growth/whatsapp/meta-platform";

export const META_PAGES_CONFIG_ENV = "META_PAGES_CONFIG_ID" as const;

export interface MetaPagesPublicConfig {
  ready: boolean;
  appId: string | null;
  configId: string | null;
  missing: string[];
}

function stripWrappingQuotes(value: string): string {
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

export function getMetaPagesPublicConfig(
  env: NodeJS.ProcessEnv = process.env
): MetaPagesPublicConfig {
  const missing: string[] = [];
  const appId = trimEnv("META_APP_ID", env);
  const appSecret = trimEnv("META_APP_SECRET", env);
  const configId = trimEnv(META_PAGES_CONFIG_ENV, env);

  if (!appId || !isMetaPublicId(appId)) missing.push("META_APP_ID");
  if (!appSecret) missing.push("META_APP_SECRET");
  if (!configId || !isMetaPublicId(configId)) missing.push(META_PAGES_CONFIG_ENV);

  return {
    ready: missing.length === 0,
    appId: appId && isMetaPublicId(appId) ? appId : null,
    configId: configId && isMetaPublicId(configId) ? configId : null,
    missing,
  };
}
