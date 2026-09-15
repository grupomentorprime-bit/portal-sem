/**
 * Normaliza un host de request/URL: lowercase, conserva puerto, sin path/query.
 * Ej.: "LocalHost:3000/" → "localhost:3000"; "https://seminarioipn.cl" → "seminarioipn.cl"
 */
export function normalizeHost(raw: string | null | undefined): string | null {
  if (raw == null) return null;

  let value = String(raw).trim().toLowerCase();
  if (!value) return null;

  // x-forwarded-host puede ser lista: toma el primero
  value = value.split(",")[0]?.trim() ?? "";
  if (!value) return null;

  try {
    const withProtocol = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(value)
      ? value
      : `https://${value}`;
    const parsed = new URL(withProtocol);
    const host = parsed.host.trim().toLowerCase().replace(/\.$/, "");
    return host || null;
  } catch {
    return null;
  }
}

/**
 * Host efectivo del request. Solo Host / X-Forwarded-Host.
 * Nunca lee ?tenant=, x-tenant-id ni headers de spoof de tenant.
 */
export function resolveRequestHost(headerBag: {
  get(name: string): string | null;
}): string | null {
  return (
    normalizeHost(headerBag.get("x-forwarded-host")) ??
    normalizeHost(headerBag.get("host"))
  );
}

/**
 * Extrae hosts normalizados (lowercase, con puerto si aplica) desde URLs de app.
 * Describen el origen canónico de la aplicación/plataforma — no asignan tenant.
 */
export function extractHostsFromAppUrls(urls: Array<string | undefined | null>): string[] {
  const hosts = new Set<string>();

  for (const raw of urls) {
    const host = normalizeHost(raw);
    if (host) hosts.add(host);
  }

  return [...hosts];
}

function hostnameOf(host: string): string {
  return host.split(":")[0] ?? host;
}

/** Hostname loopback (sin DNS público). */
export function isLoopbackHost(host: string): boolean {
  const normalized = normalizeHost(host) ?? host.trim().toLowerCase();
  const hostname = hostnameOf(normalized);
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

/**
 * Hosts del origen canónico de la app (`APP_URL` / `NEXT_PUBLIC_APP_URL`).
 * Usados para canonical, OAuth, cookies, etc. — nunca para inferir Espacio.
 */
export function resolveAppHostsFromEnv(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
): string[] {
  const hosts = extractHostsFromAppUrls([
    env.NEXT_PUBLIC_APP_URL,
    env.APP_URL,
  ]);

  if (hosts.length === 0) {
    return ["localhost:3000"];
  }

  return hosts;
}

/**
 * Host público presente en APP_URL / NEXT_PUBLIC_APP_URL.
 * No incluye loopback: ese origen sigue siendo portal SEM de desarrollo.
 */
export function isPlatformOriginHost(
  host: string | null | undefined,
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
): boolean {
  const normalized = normalizeHost(host);
  if (!normalized || isLoopbackHost(normalized)) return false;
  return resolveAppHostsFromEnv(env).includes(normalized);
}

/**
 * Sin Espacio resuelto, un host público entra a Growth OS (no al portal institucional).
 * Loopback sin contexto se deja al empty-state de desarrollo.
 */
export function shouldEnterPlatformHome(
  host: string | null | undefined,
  hasPortalContext: boolean
): boolean {
  if (hasPortalContext) return false;
  const normalized = normalizeHost(host);
  if (!normalized || isLoopbackHost(normalized)) return false;
  return true;
}

/**
 * Hosts de bootstrap SEM derivados del entorno.
 * Solo loopback: un APP_URL público (p. ej. host de plataforma) no se registra
 * como Domain legacy de T001.
 */
export function resolveSemBootstrapHostsFromEnv(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
): string[] {
  return resolveAppHostsFromEnv(env).filter((h) => isLoopbackHost(h));
}

/**
 * Base de subdominios de plataforma (hostname sin puerto).
 * Ej.: PLATFORM_BASE_DOMAIN=portales.example.com → "portales.example.com"
 * Vacío / ausente → null (aún no hay plataforma multi-subdominio).
 */
export function resolvePlatformBaseDomain(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
): string | null {
  const raw = env.PLATFORM_BASE_DOMAIN?.trim();
  if (!raw) return null;
  const host = normalizeHost(raw);
  if (!host) return null;
  // Base de plataforma: solo hostname (sin puerto).
  return host.split(":")[0] || null;
}

/**
 * Construye `{siteSlug}.{PLATFORM_BASE_DOMAIN}` normalizado.
 * No crea DNS ni registro en `domains` — solo el host canónico.
 */
export function buildPlatformSubdomainHost(
  siteSlug: string,
  options?: {
    baseDomain?: string | null;
    env?: NodeJS.ProcessEnv | Record<string, string | undefined>;
  }
): string | null {
  const slug = siteSlug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slug) return null;

  const base =
    (options?.baseDomain != null
      ? normalizeHost(options.baseDomain)?.split(":")[0] ?? null
      : null) ?? resolvePlatformBaseDomain(options?.env ?? process.env);

  if (!base) return null;
  return `${slug}.${base}`;
}
