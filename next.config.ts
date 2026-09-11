import type { NextConfig } from "next";

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

const nextConfig: NextConfig = {
  // Windows: Playwright/scripts suelen usar 127.0.0.1; sin esto Next bloquea /_next/* en dev.
  allowedDevOrigins: ["127.0.0.1"],
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
};

export default nextConfig;
