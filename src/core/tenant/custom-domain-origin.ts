/** IP de origen del servidor donde corre Growth OS (Dokploy/Traefik). No se envía al navegador. */
export const DEFAULT_CUSTOM_DOMAIN_ORIGIN_IP = "212.47.70.32";

export function customDomainOriginIp(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
): string {
  const raw = env.CUSTOM_DOMAIN_ORIGIN_IP?.trim() ?? "";
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(raw)) return raw;
  return DEFAULT_CUSTOM_DOMAIN_ORIGIN_IP;
}
