import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        /** Proxy de medios privados (Backblaze B2) — ?key=… */
        pathname: "/api/cms/media/stream",
      },
      {
        /** Logos e imágenes estáticas (public/images) */
        pathname: "/images/**",
      },
      {
        /** Kit editorial (public/editorial) */
        pathname: "/editorial/**",
      },
      {
        /** Archivos locales en public/media */
        pathname: "/media/**",
      },
    ],
  },
};

export default nextConfig;
