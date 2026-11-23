/**
 * OT-GROWTH-SECURITY-HARDENING-002 — cabeceras HTTP reutilizables.
 * Sin `server-only` y sin alias `@/`: también lo importa `next.config.ts` en build.
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
  "/login",
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

/**
 * Origen de Cumple que el escritorio puede usar como action del formulario.
 * Misma regla que Connect: `cumple.localhost` en local, `https://cumple.{base}` en público.
 * Vive aquí porque `next.config` no resuelve `@/`.
 */
function cumpleFormOrigin(env: NodeJS.ProcessEnv): string | null {
  const candidates = [env.APP_URL, env.NEXT_PUBLIC_APP_URL]
    .map((value) => originFromEnvUrl(value))
    .filter((origin): origin is string => Boolean(origin));
  const published = candidates.find((origin) => {
    const host = new URL(origin).hostname;
    return host !== "localhost" && host !== "127.0.0.1" && host !== "::1";
  });
  const desk =
    published ??
    (env.NODE_ENV === "production" ? "https://growthos.mentorprime.cl" : candidates[0] ?? "http://localhost:3000");
  let url: URL;
  try {
    url = new URL(desk);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  const configured = (env.SPACE_BASE_DOMAIN || env.PLATFORM_BASE_DOMAIN || "")
    .trim()
    .toLowerCase()
    .replace(/^\.+|\.+$/g, "");
  let base = configured;
  if (!base && host !== "localhost" && host !== "127.0.0.1" && host !== "::1") {
    const parts = host.split(".");
    if (parts.length >= 3) base = parts.slice(1).join(".");
  }
  if (!base) {
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (host !== "localhost" && host !== "127.0.0.1") return null;
    const port = url.port ? `:${url.port}` : "";
    return `${url.protocol}//cumple.localhost${port}`;
  }
  if (url.port) return null;
  return `https://cumple.${base}`;
}

/** Origen de RR.HH. que puede recibir el formulario. Sin variable, el canónico. */
function rrhhFormOrigin(env: NodeJS.ProcessEnv): string | null {
  return originFromEnvUrl(
    env.RRHH_APP_URL?.trim() ||
      (env.NODE_ENV === "production"
        ? "https://rrhh-dev-xltxcc-f041cc-212-47-70-32.sslip.io"
        : "http://localhost:3001")
  );
}

function aprendeHoyFormOrigin(env: NodeJS.ProcessEnv): string | null {
  return originFromEnvUrl(
    env.APRENDE_HOY_APP_URL?.trim() ||
      (env.NODE_ENV === "production" ? "" : "http://localhost:3002")
  );
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
export function buildContentSecurityPolicy(
  env: NodeJS.ProcessEnv = process.env,
  options?: { nonce?: string }
): string {
  const keycloakOrigin = originFromEnvUrl(env.KEYCLOAK_URL);
  const s3Origin = originFromEnvUrl(env.S3_PUBLIC_URL);
  const isDev = env.NODE_ENV === "development";

  const imgSrc = ["'self'", "data:", "blob:", ...uniqueOrigins([s3Origin])];
  const mediaSrc = ["'self'", "blob:", ...uniqueOrigins([s3Origin])];
  const connectSrc = [
    "'self'",
    ...uniqueOrigins([keycloakOrigin]),
    // Meta Embedded Signup / Facebook Login for Business (OT-GROWTH-WHATSAPP-META-001)
    "https://graph.facebook.com",
    "https://www.facebook.com",
    "https://connect.facebook.net",
    ...(isDev ? ["ws:", "wss:"] : []),
  ];
  const formAction = [
    "'self'",
    ...uniqueOrigins([
      keycloakOrigin,
      cumpleFormOrigin(env),
      rrhhFormOrigin(env),
      aprendeHoyFormOrigin(env),
      ...(isDev ? ["http://localhost:3001", "http://localhost:3002"] : []),
    ]),
  ];
  const frameSrc = [
    "'self'",
    "https://www.youtube.com",
    "https://www.youtube-nocookie.com",
    "https://player.vimeo.com",
    "https://www.google.com",
    "https://maps.google.com",
    "https://www.openstreetmap.org",
    "https://www.facebook.com",
    "https://web.facebook.com",
    "https://staticxx.facebook.com",
  ];

  const nonce = options?.nonce?.trim();
  const scriptSrc = [
    "'self'",
    ...(nonce ? [`'nonce-${nonce}'`] : []),
    "https://connect.facebook.net",
    ...(isDev ? ["'unsafe-inline'", "'unsafe-eval'"] : []),
  ];

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

/** Cabeceras estáticas. La CSP va en el proxy, con nonce por respuesta. */
export function buildStaticSecurityHeaders(env: NodeJS.ProcessEnv = process.env): Array<{
  key: string;
  value: string;
}> {
  return buildAppSecurityHeaders(env).filter(
    (header) => header.key !== SECURITY_HEADER_NAMES.contentSecurityPolicy
  );
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
