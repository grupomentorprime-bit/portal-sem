import type { NextConfig } from "next";
import {
  PRIVATE_CACHE_CONTROL,
  buildAppSecurityHeaders,
} from "./src/core/security/http-headers";

function buildRemotePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [];
  const publicUrl = process.env.S3_PUBLIC_URL?.trim();

  if (!publicUrl) return patterns;

  try {
    const parsed = new URL(publicUrl);
    patterns.push({
      protocol: parsed.protocol.replace(":", "") as "http" | "https",
      hostname: parsed.hostname,
      port: parsed.port,
      pathname: "/media/**",
    });
  } catch {
    /* URL inválida — se omite */
  }

  return patterns;
}

/**
 * no-store explícito en next.config para zonas pedidas por la OT.
 * Prefijos CMS/experience adicionales (con excepciones públicas) van vía `src/proxy.ts`.
 */
const PRIVATE_NO_STORE_SOURCES = [
  "/admin",
  "/admin/:path*",
  "/platform",
  "/platform/:path*",
  "/internal",
  "/internal/:path*",
  "/api/identity",
  "/api/identity/:path*",
  "/api/platform",
  "/api/platform/:path*",
  "/api/growth",
  "/api/growth/:path*",
  "/api/admin",
  "/api/admin/:path*",
] as const;

const nextConfig: NextConfig = {
  // Windows: Playwright/scripts suelen usar 127.0.0.1; sin esto Next bloquea /_next/* en dev.
  allowedDevOrigins: ["127.0.0.1"],
  poweredByHeader: false,
  images: {
    localPatterns: [
      {
        /** Proxy de medios privados (Backblaze B2) — admite ?key=… y ?v=… */
        pathname: "/api/cms/media/**",
      },
      {
        /** Medios CMS vía app route o public/media — admite ?v=… de caché */
        pathname: "/media/**",
      },
      {
        pathname: "/images/**",
        search: "",
      },
      {
        pathname: "/editorial/**",
        search: "",
      },
    ],
    remotePatterns: buildRemotePatterns(),
  },
  async headers() {
    const security = buildAppSecurityHeaders(process.env);

    return [
      {
        source: "/:path*",
        headers: security,
      },
      ...PRIVATE_NO_STORE_SOURCES.map((source) => ({
        source,
        headers: [{ key: "Cache-Control", value: PRIVATE_CACHE_CONTROL }],
      })),
    ];
  },
};

export default nextConfig;
