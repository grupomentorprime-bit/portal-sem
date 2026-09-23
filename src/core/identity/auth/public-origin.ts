import { isLoopbackHost, normalizeHost } from "@/core/tenant/hosts";

/**
 * Origen público de Growth OS cuando el proceso solo ve el bind interno
 * (`https://localhost:3000`: hostname de Next + x-forwarded-proto).
 * No asigna Espacio; solo evita que OAuth y redirects salgan a loopback.
 */
export const PRODUCTION_CANONICAL_ORIGIN = "https://growthos.mentorprime.cl";

const OAUTH_CALLBACK_PATH = "/api/identity/auth/keycloak/callback";

function headerFirst(headers: Headers, name: string): string | null {
  const raw = headers.get(name);
  if (!raw) return null;
  const first = raw.split(",")[0]?.trim() ?? "";
  return first || null;
}

function originFromPublicHost(host: string | null, proto: string): string | null {
  const normalized = normalizeHost(host);
  if (!normalized || isLoopbackHost(normalized)) return null;
  const scheme = proto === "http" ? "http" : "https";
  return `${scheme}://${normalized}`;
}

function nonLoopbackEnvOrigin(): string | null {
  for (const raw of [process.env.APP_URL, process.env.NEXT_PUBLIC_APP_URL]) {
    const trimmed = raw?.trim().replace(/\/$/, "");
    if (!trimmed) continue;
    try {
      const url = new URL(trimmed);
      if (!isLoopbackHost(url.host)) return url.origin;
    } catch {
      /* URL inválida */
    }
  }
  return null;
}

/**
 * Origen que debe ver el navegador.
 * Next, detrás del proxy, construye `request.url` como `https://localhost:3000`
 * (puerto de bind + proto reenviado). Ese origen no se usa para redirects.
 */
export function resolvePublicAppOrigin(request: Request): string {
  let requestOrigin = "";
  let requestHost = "";
  try {
    const requestUrl = new URL(request.url);
    requestOrigin = requestUrl.origin;
    requestHost = requestUrl.host;
  } catch {
    requestOrigin = "";
    requestHost = "";
  }

  if (requestHost && !isLoopbackHost(requestHost)) {
    return requestOrigin;
  }

  const proto =
    headerFirst(request.headers, "x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase() ||
    (requestOrigin.startsWith("http://") ? "http" : "https");

  const fromHeaders =
    originFromPublicHost(headerFirst(request.headers, "x-forwarded-host"), proto) ??
    originFromPublicHost(headerFirst(request.headers, "host"), proto);
  if (fromHeaders) return fromHeaders;

  const fromEnv = nonLoopbackEnvOrigin();
  if (fromEnv) return fromEnv;

  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_CANONICAL_ORIGIN;
  }

  return requestOrigin || "http://localhost:3000";
}

/** URL absoluta de un path de la app, nunca sobre el bind interno en producción. */
export function publicRedirectUrl(request: Request, path: string): URL {
  const origin = resolvePublicAppOrigin(request);
  const base = origin.endsWith("/") ? origin : `${origin}/`;
  return new URL(path, base);
}

/**
 * redirect_uri de Keycloak. En producción un valor loopback
 * (`https://localhost:3000/...` o `APP_URL` interno) se sustituye por el origen canónico.
 */
export function resolveKeycloakRedirectUri(fallbackBase: string): string {
  const configured = process.env.KEYCLOAK_REDIRECT_URI?.trim();
  const candidate = configured || `${fallbackBase.replace(/\/$/, "")}${OAUTH_CALLBACK_PATH}`;

  if (process.env.NODE_ENV !== "production") return candidate;

  try {
    const url = new URL(candidate);
    if (!isLoopbackHost(url.host)) return candidate;
  } catch {
    /* se reemplaza abajo */
  }

  const base = nonLoopbackEnvOrigin() ?? PRODUCTION_CANONICAL_ORIGIN;
  return `${base}${OAUTH_CALLBACK_PATH}`;
}
