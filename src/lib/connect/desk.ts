import { PRODUCTION_CANONICAL_ORIGIN } from "@/core/identity/auth/public-origin";
import { resolvePlatformBaseDomain } from "@/core/tenant/hosts";
import { isDeskOrigin, normalizeOrigin, spaceBaseFromDeskOrigin } from "@/lib/connect/policy";

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

/** Base de `cumple.{base}`: la del Espacio, o el padre del origen del escritorio. */
export function allowedCumpleBase(
  env: Record<string, string | undefined> = process.env
): string | null {
  return resolvePlatformBaseDomain(env) ?? spaceBaseFromDeskOrigin(deskOriginFromEnv(env));
}
