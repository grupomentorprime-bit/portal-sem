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
  const ctx = await getActivePortal();

  const entries: MetadataRoute.Sitemap = STATIC_PUBLIC_PATHS.map((path) =>
    sitemapEntry(path, baseUrl)
  );

  if (ctx) {
    const forms = await listPublicExperienceForms(ctx.tenant);
    const superseded = getSupersededFormIds();

    for (const form of forms) {
      if (superseded.has(form._id) || isExperienceFormPrivate(form)) continue;
      entries.push(sitemapEntry(publicFormUrl(form._id), baseUrl));
    }
  }

  return entries;
}
