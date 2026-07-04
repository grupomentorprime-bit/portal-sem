import type { MetadataRoute } from "next";
import { getAppBaseUrl } from "@/lib/app-url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getAppBaseUrl().replace(/\/$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/formularios/testimonial-submission"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
