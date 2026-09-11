/**
 * OT-GROWTH-TEST-002 — helpers compartidos para smoke HTTP.
 * Sin mutaciones: solo GET y POST de validación (payloads inválidos → 422).
 */

export const SMOKE_FORM_ID = "convocatoria-talca-aurora-jul-2026";

/** Rutas de producto SEM estables (handlers dedicados, no catch-all CMS). */
export const PUBLIC_PRODUCT_PATHS = [
  "/",
  "/programas",
  "/admision",
  "/formularios",
  `/formularios/${SMOKE_FORM_ID}`,
  "/contacto",
  "/equipo",
  "/institucion",
  "/postulacion/enviada",
] as const;

/** Slugs CMS catch-all: pueden 404 si no hay página publicada — no fallan el smoke. */
export const CMS_CONTENT_PATHS = ["/noticias", "/eventos", "/biblioteca"] as const;

const CANDIDATE_BASES = [
  process.env.SMOKE_BASE_URL,
  process.env.DEMO_URL,
  process.env.CAPTURE_URL,
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.APP_URL,
  "http://localhost:3000",
  "http://localhost:3001",
].filter((v): v is string => Boolean(v && v.trim()));

let resolvedBase: string | null | undefined;
let resolvePromise: Promise<string | null> | undefined;

export type HttpResult = {
  status: number;
  headers: Headers;
  text: string;
  json: unknown | null;
  finalUrl: string;
};

export async function resolveSmokeBaseUrl(): Promise<string | null> {
  if (resolvedBase !== undefined) return resolvedBase;
  if (!resolvePromise) {
    resolvePromise = (async () => {
      const seen = new Set<string>();
      for (const raw of CANDIDATE_BASES) {
        const base = raw.replace(/\/$/, "");
        if (seen.has(base)) continue;
        seen.add(base);
        try {
          const res = await fetch(base, {
            method: "GET",
            redirect: "manual",
            signal: AbortSignal.timeout(8_000),
          });
          // Cualquier respuesta HTTP indica servidor vivo (incl. 307/404).
          if (res.status > 0) {
            resolvedBase = base;
            return base;
          }
        } catch {
          // siguiente candidato
        }
      }
      resolvedBase = null;
      return null;
    })();
  }
  return resolvePromise;
}

export async function requireSmokeBaseUrl(): Promise<string> {
  const base = await resolveSmokeBaseUrl();
  if (!base) {
    throw new Error(
      "Smoke E2E: no hay app viva. Arranca `npm run dev` (u otro puerto) o define SMOKE_BASE_URL."
    );
  }
  return base;
}

export async function smokeFetch(
  path: string,
  init: RequestInit = {}
): Promise<HttpResult> {
  const base = await requireSmokeBaseUrl();
  const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...init,
    redirect: init.redirect ?? "manual",
    signal: init.signal ?? AbortSignal.timeout(25_000),
  });
  const text = await res.text();
  let json: unknown | null = null;
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }
  return {
    status: res.status,
    headers: res.headers,
    text,
    json,
    finalUrl: res.url || url,
  };
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
