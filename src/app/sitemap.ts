import type { MetadataRoute } from "next";
import { getSupersededFormIds, publicFormUrl } from "@/lib/admin/forms-center";
import { getAppBaseUrl } from "@/lib/app-url";
import { listPublicExperienceForms } from "@/lib/experience/forms/repository";
import { isExperienceFormPrivate } from "@/lib/experience/forms/status";
import { getActivePortal } from "@/lib/portal/site";

const STATIC_PUBLIC_PATHS = [
  "/",
  "/programas",
  "/equipo",
  "/contacto",
  "/admision",
  "/noticias",
  "/eventos",
  "/biblioteca",
  "/agenda-academica",
  "/avisos",
  "/institucion",
  "/formularios",
] as const;

/** Evita prerender en build Docker (sin MONGODB_URI); se genera en runtime. */
export const dynamic = "force-dynamic";

function sitemapEntry(path: string, baseUrl: string): MetadataRoute.Sitemap[number] {
  return {
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getAppBaseUrl().replace(/\/$/, "");

  const entries: MetadataRoute.Sitemap = STATIC_PUBLIC_PATHS.map((path) =>
    sitemapEntry(path, baseUrl)
  );

  if (!process.env.MONGODB_URI?.trim() || !process.env.MONGODB_DB?.trim()) {
    return entries;
  }

  try {
    const ctx = await getActivePortal();
    if (!ctx) return entries;

    const forms = await listPublicExperienceForms(ctx.tenant);
    const superseded = getSupersededFormIds();

    for (const form of forms) {
      if (superseded.has(form._id) || isExperienceFormPrivate(form)) continue;
      entries.push(sitemapEntry(publicFormUrl(form._id), baseUrl));
    }
  } catch {
    // Build sin MongoDB o BD no disponible: publicar solo rutas estáticas.
  }

  return entries;
}
