import { SEM_SITE_ID } from "@/core/tenant/constants";

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
 * Host de desarrollo del Espacio SEM: `{siteId}.localhost`, con o sin puerto.
 * El loopback pelado (`localhost`) es la plataforma, no este Espacio.
 */
export function isSemDevHost(host: string | null | undefined): boolean {
  const normalized = normalizeHost(host);
  if (!normalized) return false;
  return hostnameOf(normalized) === `${SEM_SITE_ID}.localhost`;
}

/**
 * Origen de la plataforma: host público de APP_URL, o loopback pelado en local.
 * `seminario-ipn.localhost` y `adl.localhost` no entran: son Espacios.
 */
export function isPlatformOriginHost(
  host: string | null | undefined,
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
): boolean {
  const normalized = normalizeHost(host);
  if (!normalized || isSemDevHost(normalized)) return false;
  if (isLoopbackHost(normalized)) return true;
  return resolveAppHostsFromEnv(env).includes(normalized);
}

/**
 * Sin Espacio resuelto, el request entra a la portada de Growth OS.
 * Incluye el loopback pelado y cualquier host público que no sea un Espacio.
 */
export function shouldEnterPlatformHome(
  host: string | null | undefined,
  hasPortalContext: boolean
): boolean {
  if (hasPortalContext) return false;
  return normalizeHost(host) != null;
}

/**
 * Origen público de un host de Espacio.
 * Loopback y `*.localhost` van por http; el resto, https.
 */
export function publicOriginFromHost(host: string | null | undefined): string | null {
  const normalized = normalizeHost(host);
  if (!normalized) return null;
  const hostname = hostnameOf(normalized);
  const insecure = isLoopbackHost(normalized) || hostname.endsWith(".localhost");
  return `${insecure ? "http" : "https"}://${normalized}`;
}

/** Une el origen del Espacio con la ruta pública de una página. */
export function publicUrlForPath(origin: string, path: string): string {
  const base = origin.replace(/\/$/, "");
  const raw = path.trim();
  const hashIndex = raw.indexOf("#");
  const pathname = hashIndex >= 0 ? raw.slice(0, hashIndex) : raw;
  const hash = hashIndex >= 0 ? raw.slice(hashIndex) : "";
  if (!pathname || pathname === "/" || pathname === "home") {
    return `${base}/${hash}`;
  }
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${base}${normalized}${hash}`;
}

/**
 * Hosts de bootstrap SEM derivados del entorno.
 * Un APP_URL de loopback se traduce al subdominio del Espacio
 * (`seminario-ipn.localhost:{puerto}`). El origen pelado no se registra como Domain.
 * Un APP_URL público no se registra como Domain legacy de T001.
 */
export function resolveSemBootstrapHostsFromEnv(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
): string[] {
  const hosts = new Set<string>();

  for (const host of resolveAppHostsFromEnv(env)) {
    if (!isLoopbackHost(host)) continue;
    const port = host.split(":").pop() ?? "";
    hosts.add(
      /^\d+$/.test(port)
        ? `${SEM_SITE_ID}.localhost:${port}`
        : `${SEM_SITE_ID}.localhost`
    );
  }

  return [...hosts];
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

/** Slug de host: minúsculas, a-z0-9 y guiones. */
export function normalizePlatformHostSlug(raw: string): string | null {
  const slug = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || null;
}

export type SpaceHostOptions = {
  baseDomain?: string | null;
  env?: NodeJS.ProcessEnv | Record<string, string | undefined>;
};

/**
 * Construye `{siteSlug}.{PLATFORM_BASE_DOMAIN}` normalizado.
 * No crea DNS ni registro en `domains` — solo el host canónico.
 */
export function buildPlatformSubdomainHost(
  siteSlug: string,
  options?: SpaceHostOptions
): string | null {
  const slug = normalizePlatformHostSlug(siteSlug);
  if (!slug) return null;

  const base =
    (options?.baseDomain != null
      ? normalizeHost(options.baseDomain)?.split(":")[0] ?? null
      : null) ?? resolvePlatformBaseDomain(options?.env ?? process.env);

  if (!base) return null;
  return `${slug}.${base}`;
}

/**
 * Sufijo local de subdominio (`localhost` + puerto de APP_URL).
 * El origen pelado (`localhost:3000`) es la plataforma, no un Espacio.
 */
export function resolveDevLoopbackSuffix(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
): string {
  for (const host of resolveAppHostsFromEnv(env)) {
    if (!isLoopbackHost(host)) continue;
    const port = host.split(":").pop() ?? "";
    return /^\d+$/.test(port) ? `localhost:${port}` : "localhost";
  }
  return "localhost:3000";
}

/**
 * Dirección por defecto de un Espacio, homologada para todos:
 * `{slug}.{PLATFORM_BASE_DOMAIN}` o, en local, `{slug}.localhost:{puerto}`.
 */
export function buildDefaultSpaceHost(
  siteSlug: string,
  options?: SpaceHostOptions
): string | null {
  const fromBase = buildPlatformSubdomainHost(siteSlug, options);
  if (fromBase) return fromBase;

  const slug = normalizePlatformHostSlug(siteSlug);
  if (!slug) return null;
  return `${slug}.${resolveDevLoopbackSuffix(options?.env ?? process.env)}`;
}

/**
 * ¿El host es el subdominio de plataforma de este slug?
 * Incluye `{slug}.{base}` y `{slug}.localhost` (cualquier puerto).
 */
export function isPlatformSubdomainHost(
  siteSlug: string,
  host: string | null | undefined,
  options?: SpaceHostOptions
): boolean {
  const normalized = normalizeHost(host);
  if (!normalized) return false;

  const expected = buildDefaultSpaceHost(siteSlug, options);
  if (expected && normalized === expected) return true;

  const slug = normalizePlatformHostSlug(siteSlug);
  if (!slug) return false;

  const hostname = hostnameOf(normalized);
  if (hostname === `${slug}.localhost`) return true;

  const base =
    (options?.baseDomain != null
      ? normalizeHost(options.baseDomain)?.split(":")[0] ?? null
      : null) ?? resolvePlatformBaseDomain(options?.env ?? process.env);
  return Boolean(base && hostname === `${slug}.${base}`);
}

/**
 * El loopback pelado (`localhost`, `127.0.0.1`) es origen de plataforma,
 * nunca dominio de un Espacio. `{slug}.localhost` sí es de un Espacio.
 */
export function isBarePlatformOriginHost(
  host: string | null | undefined
): boolean {
  const normalized = normalizeHost(host);
  if (!normalized) return false;
  return isLoopbackHost(normalized);
}

/** Clasificación de alta: subdominio de plataforma o dominio propio. */
export function classifySpaceDomainKind(
  siteSlug: string,
  host: string,
  options?: SpaceHostOptions
): "platform_subdomain" | "custom" {
  return isPlatformSubdomainHost(siteSlug, host, options)
    ? "platform_subdomain"
    : "custom";
}
