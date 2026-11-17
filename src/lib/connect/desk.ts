import { PRODUCTION_CANONICAL_ORIGIN } from "@/core/identity/auth/public-origin";
import { resolvePlatformBaseDomain } from "@/core/tenant/hosts";
import {
  isAprendeHoyProductOrigin,
  isDeskOrigin,
  isRrhhProductOrigin,
  normalizeOrigin,
  RRHH_CANONICAL_ORIGIN,
  spaceBaseFromDeskOrigin,
} from "@/lib/connect/policy";

function isPublicDesk(origin: string): boolean {
  const hostname = new URL(origin).hostname;
  return hostname !== "localhost" && hostname !== "127.0.0.1" && hostname !== "::1";
}

/** Origen del escritorio que emite y recibe el retorno. No usa el bind interno de producción. */
export function deskOriginFromEnv(
  env: Record<string, string | undefined> = process.env
): string {
  const origins = [env.APP_URL, env.NEXT_PUBLIC_APP_URL]
    .map((value) => normalizeOrigin(value))
    .filter((origin): origin is string => Boolean(origin && isDeskOrigin(origin)));
  const published = origins.find(isPublicDesk);
  if (published) return published;
  if (env.NODE_ENV === "production") return PRODUCTION_CANONICAL_ORIGIN;
  return origins[0] ?? "http://localhost:3000";
}

/** En local el código se emite para este escritorio, no para el dominio publicado. */
export function deskIssuerFromRequest(
  request: Request,
  env: Record<string, string | undefined> = process.env
): string {
  const header = normalizeOrigin(request.headers.get("origin"));
  if (header && isDeskOrigin(header) && !isPublicDesk(header)) return header;
  return deskOriginFromEnv(env);
}

/** Origen de RR.HH. `RRHH_APP_URL` lo reemplaza. En local, el 3001. */
export function rrhhOriginFromEnv(
  env: Record<string, string | undefined> = process.env
): string | null {
  const configured = env.RRHH_APP_URL?.trim();
  const fallback = env.NODE_ENV === "production" ? RRHH_CANONICAL_ORIGIN : "http://localhost:3001";
  const origin = normalizeOrigin(configured || fallback);
  if (!origin || !isRrhhProductOrigin(origin)) return null;
  return origin;
}

/** Origen de Aprende Hoy. `APRENDE_HOY_APP_URL` lo reemplaza. En local, el 3002. */
export function aprendeHoyOriginFromEnv(
  env: Record<string, string | undefined> = process.env
): string | null {
  const configured = env.APRENDE_HOY_APP_URL?.trim();
  const fallback = env.NODE_ENV === "production" ? null : "http://localhost:3002";
  const origin = normalizeOrigin(configured || fallback);
  if (!origin || !isAprendeHoyProductOrigin(origin)) return null;
  return origin;
}

/** Base de `cumple.{base}`: la del Espacio, o el padre del origen del escritorio. */
export function allowedCumpleBase(
  env: Record<string, string | undefined> = process.env
): string | null {
  return resolvePlatformBaseDomain(env) ?? spaceBaseFromDeskOrigin(deskOriginFromEnv(env));
}
