/**
 * OT-GROWTH-SECURITY-HARDENING-002 — cabeceras HTTP reutilizables.
 * Sin `server-only`: también lo importa `next.config.ts` en build.
 */

export const PRIVATE_CACHE_CONTROL = "no-store";

export const SECURITY_HEADER_NAMES = {
  contentTypeOptions: "X-Content-Type-Options",
  referrerPolicy: "Referrer-Policy",
  permissionsPolicy: "Permissions-Policy",
  contentSecurityPolicy: "Content-Security-Policy",
  cacheControl: "Cache-Control",
} as const;

/** Prefijos privados: páginas shell + APIs de identidad / Espacio / plataforma / Growth. */
const PRIVATE_NO_STORE_PREFIXES = [
  "/admin",
  "/platform",
  "/internal",
  "/api/identity",
  "/api/platform",
  "/api/growth",
  "/api/admin",
  "/api/cms",
  "/api/student-affairs",
  "/api/workflows",
  "/api/events",
  "/api/experience",
] as const;

/** Recursos públicos/cacheables que no deben heredar no-store. */
const PRIVATE_NO_STORE_EXCEPTIONS = [
  "/api/cms/media/stream",
  "/api/webhooks",
  "/api/admission",
] as const;

function originFromEnvUrl(raw: string | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function uniqueOrigins(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    if (!value || seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}

/**
 * CSP mínima alineada a recursos reales de Growth OS:
 * app propia, Next.js, next/font self-hosted, medios S3, embeds de sitio, Keycloak (navegación/form).
 * Sin `unsafe-eval` en producción ni comodines de host abiertos.
 */
export function buildContentSecurityPolicy(env: NodeJS.ProcessEnv = process.env): string {
  const keycloakOrigin = originFromEnvUrl(env.KEYCLOAK_URL);
  const s3Origin = originFromEnvUrl(env.S3_PUBLIC_URL);
  const isDev = env.NODE_ENV === "development";

  const imgSrc = ["'self'", "data:", "blob:", ...uniqueOrigins([s3Origin])];
  const mediaSrc = ["'self'", "blob:", ...uniqueOrigins([s3Origin])];
  const connectSrc = [
    "'self'",
    ...uniqueOrigins([keycloakOrigin]),
    ...(isDev ? ["ws:", "wss:"] : []),
  ];
  const formAction = ["'self'", ...uniqueOrigins([keycloakOrigin])];
  const frameSrc = [
    "'self'",
    "https://www.youtube.com",
    "https://www.youtube-nocookie.com",
    "https://player.vimeo.com",
    "https://www.google.com",
    "https://maps.google.com",
    "https://www.openstreetmap.org",
  ];

  const scriptSrc = ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : [])];

  const directives: Array<[string, string[]]> = [
    ["default-src", ["'self'"]],
    ["base-uri", ["'self'"]],
    ["object-src", ["'none'"]],
    ["frame-ancestors", ["'none'"]],
    ["form-action", formAction],
    ["script-src", scriptSrc],
    ["style-src", ["'self'", "'unsafe-inline'"]],
    ["img-src", imgSrc],
    ["font-src", ["'self'", "data:"]],
    ["connect-src", connectSrc],
    ["media-src", mediaSrc],
    ["frame-src", frameSrc],
    ["worker-src", ["'self'", "blob:"]],
  ];

  return directives.map(([name, values]) => `${name} ${values.join(" ")}`).join("; ");
}

/** Cabeceras de seguridad de borde de aplicación (HSTS queda en edge/Cloudflare). */
export function buildAppSecurityHeaders(env: NodeJS.ProcessEnv = process.env): Array<{
  key: string;
  value: string;
}> {
  return [
    { key: SECURITY_HEADER_NAMES.contentTypeOptions, value: "nosniff" },
    {
      key: SECURITY_HEADER_NAMES.referrerPolicy,
      value: "strict-origin-when-cross-origin",
    },
    {
      key: SECURITY_HEADER_NAMES.permissionsPolicy,
      value:
        "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
    },
    {
      key: SECURITY_HEADER_NAMES.contentSecurityPolicy,
      value: buildContentSecurityPolicy(env),
    },
  ];
}

export function shouldApplyPrivateNoStore(pathname: string): boolean {
  const path = pathname.split("?")[0] || "/";

  for (const exception of PRIVATE_NO_STORE_EXCEPTIONS) {
    if (path === exception || path.startsWith(`${exception}/`)) {
      return false;
    }
  }

  // Formularios públicos del portal (lectura pública / envío).
  if (/^\/api\/experience\/forms\/[^/]+\/(public|submit)(?:\/|$)/.test(path)) {
    return false;
  }

  return PRIVATE_NO_STORE_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

export function applyPrivateNoStoreHeader(
  headers: Headers,
  pathname: string
): void {
  if (shouldApplyPrivateNoStore(pathname)) {
    headers.set(SECURITY_HEADER_NAMES.cacheControl, PRIVATE_CACHE_CONTROL);
  }
}
