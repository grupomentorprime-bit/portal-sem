/**
 * OT-GROWTH-TEST-002 — helpers compartidos para smoke HTTP.
 * Sin mutaciones: solo GET y POST de validación (payloads inválidos → 422).
 */
import { request as httpRequest, type IncomingMessage } from "node:http";
import { request as httpsRequest } from "node:https";

export const SMOKE_FORM_ID = "convocatoria-talca-aurora-jul-2026";

/** Rutas de producto SEM estables (handlers dedicados, no catch-all CMS). */
export const PUBLIC_PRODUCT_PATHS = [
  "/",
  "/programas",
  "/el-sem",
  "/admision",
  "/formularios",
  `/formularios/${SMOKE_FORM_ID}`,
  "/contacto",
  "/equipo",
  "/postulacion/enviada",
] as const;

/** Slugs CMS catch-all: pueden 404 si no hay página publicada — no fallan el smoke. */
export const CMS_CONTENT_PATHS = ["/noticias", "/eventos", "/biblioteca"] as const;

const CANDIDATE_BASES = [process.env.SMOKE_BASE_URL].filter((v): v is string =>
  Boolean(v && v.trim())
);

let resolvedBase: string | null | undefined;
let resolvePromise: Promise<string | null> | undefined;

export type HttpResult = {
  status: number;
  headers: Headers;
  text: string;
  json: unknown | null;
  finalUrl: string;
};

async function probeBase(base: string): Promise<boolean> {
  try {
    const res = await requestUrl(base, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(8_000),
    });
    return res.status > 0;
  } catch {
    return false;
  }
}

/**
 * Node no resuelve `*.localhost` (c-ares). El navegador y curl sí.
 * Esas URLs se conectan a 127.0.0.1 conservando el Host del Espacio.
 */
function requestUrl(
  url: string,
  init: RequestInit
): Promise<{ status: number; headers: Headers; text: string; finalUrl: string }> {
  const target = new URL(url);
  if (!target.hostname.endsWith(".localhost")) {
    return fetch(url, {
      ...init,
      redirect: init.redirect ?? "manual",
      signal: init.signal ?? AbortSignal.timeout(25_000),
    }).then(async (res) => ({
      status: res.status,
      headers: res.headers,
      text: await res.text(),
      finalUrl: res.url || url,
    }));
  }

  const headers = new Headers(init.headers);
  headers.set("host", target.host);
  const body = typeof init.body === "string" ? init.body : undefined;
  if (body != null && !headers.has("content-length")) {
    headers.set("content-length", String(Buffer.byteLength(body)));
  }
  const headerRecord: Record<string, string> = {};
  headers.forEach((value, key) => {
    headerRecord[key] = value;
  });
  const lib = target.protocol === "https:" ? httpsRequest : httpRequest;

  return new Promise((resolve, reject) => {
    const req = lib(
      {
        hostname: "127.0.0.1",
        port: target.port || undefined,
        path: `${target.pathname}${target.search}`,
        method: init.method ?? "GET",
        headers: headerRecord,
      },
      (res: IncomingMessage) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer | string) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        res.on("end", () => {
          const responseHeaders = new Headers();
          for (const [key, value] of Object.entries(res.headers)) {
            if (value == null) continue;
            if (Array.isArray(value)) {
              for (const item of value) responseHeaders.append(key, item);
            } else {
              responseHeaders.set(key, value);
            }
          }
          resolve({
            status: res.statusCode ?? 0,
            headers: responseHeaders,
            text: Buffer.concat(chunks).toString("utf8"),
            finalUrl: url,
          });
        });
      }
    );
    req.setTimeout(25_000, () => {
      req.destroy(new Error("timeout"));
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

export async function resolveSmokeBaseUrl(): Promise<string | null> {
  if (resolvedBase !== undefined) return resolvedBase;
  if (!resolvePromise) {
    resolvePromise = (async () => {
      const explicit = process.env.SMOKE_BASE_URL?.trim().replace(/\/$/, "");
      if (explicit) {
        resolvedBase = (await probeBase(explicit)) ? explicit : null;
        return resolvedBase;
      }
      const seen = new Set<string>();
      for (const raw of CANDIDATE_BASES) {
        const base = raw.replace(/\/$/, "");
        if (seen.has(base)) continue;
        seen.add(base);
        if (await probeBase(base)) {
          resolvedBase = base;
          return base;
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
  const res = await requestUrl(url, {
    ...init,
    redirect: init.redirect ?? "manual",
    signal: init.signal ?? AbortSignal.timeout(25_000),
  });
  let json: unknown | null = null;
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    try {
      json = JSON.parse(res.text);
    } catch {
      json = null;
    }
  }
  return {
    status: res.status,
    headers: res.headers,
    text: res.text,
    json,
    finalUrl: res.finalUrl || url,
  };
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
