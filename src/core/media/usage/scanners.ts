import "server-only";

import { getDatabase } from "@/lib/mongodb";
import { findMediaByUrl } from "@/core/media/lookup";
import type { SiteConfig } from "@/types/cms";
import type { ContentDocument } from "@/types/content";
import type { CmsPage } from "@/types/page";
import type { MediaUsageRef } from "@/types/media";
import type { UsageScanResult } from "./types";

function pushRef(
  results: UsageScanResult[],
  tenant: string,
  mediaId: string | undefined,
  legacyUrl: string | undefined,
  ref: Omit<MediaUsageRef, "field"> & { field: string }
): void {
  if (mediaId) {
    results.push({ mediaId, ref: { ...ref, field: ref.field } });
    return;
  }
  if (legacyUrl?.trim()) {
    void tenant;
    results.push({
      mediaId: `__legacy__:${legacyUrl}`,
      ref: { ...ref, field: ref.field },
    });
  }
}

export async function scanBranding(
  tenant: string,
  config: SiteConfig
): Promise<UsageScanResult[]> {
  const results: UsageScanResult[] = [];
  const { branding } = config;

  const fields: Array<{
    field: string;
    mediaId?: string;
    legacyUrl?: string;
    label: string;
  }> = [
    { field: "logoMediaId", mediaId: branding.logoMediaId, legacyUrl: branding.logo, label: "Configuración — Logo" },
    { field: "secondaryLogoMediaId", mediaId: branding.secondaryLogoMediaId, legacyUrl: branding.secondaryLogo, label: "Configuración — Logo secundario" },
    { field: "faviconMediaId", mediaId: branding.faviconMediaId, legacyUrl: branding.favicon, label: "Configuración — Favicon" },
    { field: "heroMediaId", mediaId: branding.heroMediaId, legacyUrl: branding.heroImage, label: "Configuración — Hero" },
  ];

  for (const item of fields) {
    pushRef(results, tenant, item.mediaId, item.legacyUrl, {
      module: "cms_config",
      entityId: "site",
      field: item.field,
      label: item.label,
    });
  }

  const seoFields: Array<{
    field: string;
    mediaId?: string;
    legacyUrl?: string;
    label: string;
  }> = [
    { field: "ogImageMediaId", mediaId: config.seo.ogImageMediaId, legacyUrl: config.seo.ogImage, label: "Configuración — OG Image" },
    { field: "twitterImageMediaId", mediaId: config.seo.twitterImageMediaId, legacyUrl: config.seo.twitterImage, label: "Configuración — Twitter Image" },
  ];

  for (const item of seoFields) {
    pushRef(results, tenant, item.mediaId, item.legacyUrl, {
      module: "cms_config",
      entityId: "site",
      field: item.field,
      label: item.label,
    });
  }

  for (const [index, slide] of config.heroPortal?.slides?.entries() ?? []) {
    pushRef(results, tenant, slide.multimedia.desktopMediaId, undefined, {
      module: "cms_config",
      entityId: "site",
      field: `heroPortal.slides[${index}].multimedia.desktopMediaId`,
      label: `Hero del Portal — Slide ${index + 1} (escritorio)`,
    });
    pushRef(results, tenant, slide.multimedia.mobileMediaId, undefined, {
      module: "cms_config",
      entityId: "site",
      field: `heroPortal.slides[${index}].multimedia.mobileMediaId`,
      label: `Hero del Portal — Slide ${index + 1} (móvil)`,
    });
    pushRef(results, tenant, slide.institutionalVideo.mediaId, undefined, {
      module: "cms_config",
      entityId: "site",
      field: `heroPortal.slides[${index}].institutionalVideo.mediaId`,
      label: `Hero del Portal — Slide ${index + 1} (video)`,
    });
    pushRef(results, tenant, slide.seo.imageMediaId, undefined, {
      module: "cms_config",
      entityId: "site",
      field: `heroPortal.slides[${index}].seo.imageMediaId`,
      label: `Hero del Portal — Slide ${index + 1} (SEO)`,
    });
  }

  return resolveLegacyRefs(tenant, results);
}

export async function scanPages(tenant: string): Promise<UsageScanResult[]> {
  const db = await getDatabase();
  const pages = await db.collection<CmsPage>("cms_pages").find({ tenant }).toArray();
  const results: UsageScanResult[] = [];

  for (const page of pages) {
    if (page.seo?.ogImageMediaId || page.seo?.ogImage) {
      pushRef(results, tenant, page.seo.ogImageMediaId, page.seo.ogImage, {
        module: "cms_pages",
        entityId: page._id,
        field: "seo.ogImageMediaId",
        label: `Página — ${page.title} (OG)`,
      });
    }

    for (const block of page.blocks ?? []) {
      const s = block.settings;
      if (block.type === "hero") {
        pushRef(results, tenant, s.heroMediaId as string | undefined, s.heroImage as string | undefined, {
          module: "cms_pages",
          entityId: page._id,
          field: `blocks.${block.id}.heroMediaId`,
          label: `Página — ${page.title} (Hero)`,
        });
        pushRef(results, tenant, s.logoMediaId as string | undefined, s.logoSrc as string | undefined, {
          module: "cms_pages",
          entityId: page._id,
          field: `blocks.${block.id}.logoMediaId`,
          label: `Página — ${page.title} (Logo)`,
        });
      }
    }
  }

  return resolveLegacyRefs(tenant, results);
}

async function scanContentCollection(
  tenant: string,
  collection: string,
  module: string,
  mapFields: (doc: ContentDocument) => Array<{
    mediaId?: string;
    legacyUrl?: string;
    field: string;
    label: string;
  }>
): Promise<UsageScanResult[]> {
  const db = await getDatabase();
  const docs = await db.collection<ContentDocument>(collection).find({ tenant }).toArray();
  const results: UsageScanResult[] = [];

  for (const doc of docs) {
    for (const item of mapFields(doc)) {
      pushRef(results, tenant, item.mediaId, item.legacyUrl, {
        module,
        entityId: doc._id,
        field: item.field,
        label: item.label,
      });
    }
  }

  return resolveLegacyRefs(tenant, results);
}

export function scanPrograms(tenant: string): Promise<UsageScanResult[]> {
  return scanContentCollection(tenant, "academy_programs", "academy_programs", (doc) => [
    {
      mediaId: doc.coverMediaId ?? doc.imageMediaId,
      legacyUrl: doc.image,
      field: "coverMediaId",
      label: `Programa — ${doc.title}`,
    },
    ...(doc.galleryMediaIds ?? []).map((id, i) => ({
      mediaId: id,
      field: `galleryMediaIds.${i}`,
      label: `Programa — ${doc.title} (galería)`,
    })),
  ]);
}

export function scanNews(tenant: string): Promise<UsageScanResult[]> {
  return scanContentCollection(tenant, "content_news", "content_news", (doc) => [
    {
      mediaId: doc.featuredMediaId ?? doc.imageMediaId,
      legacyUrl: doc.image,
      field: "featuredMediaId",
      label: `Noticia — ${doc.title}`,
    },
    ...(doc.galleryMediaIds ?? []).map((id, i) => ({
      mediaId: id,
      field: `galleryMediaIds.${i}`,
      label: `Noticia — ${doc.title} (galería)`,
    })),
  ]);
}

export function scanEvents(tenant: string): Promise<UsageScanResult[]> {
  return scanContentCollection(tenant, "content_events", "content_events", (doc) => [
    {
      mediaId: doc.featuredMediaId ?? doc.imageMediaId,
      legacyUrl: doc.image,
      field: "featuredMediaId",
      label: `Evento — ${doc.title}`,
    },
  ]);
}

export function scanAcademicAgenda(tenant: string): Promise<UsageScanResult[]> {
  return scanContentCollection(tenant, "content_academic_agenda", "content_academic_agenda", (doc) => [
    {
      mediaId: doc.featuredMediaId ?? doc.imageMediaId,
      legacyUrl: doc.image,
      field: "imageMediaId",
      label: `Agenda — ${doc.title}`,
    },
  ]);
}

export function scanInstitutionalNotices(tenant: string): Promise<UsageScanResult[]> {
  return scanContentCollection(
    tenant,
    "content_institutional_notices",
    "content_institutional_notices",
    (doc) => [
      {
        mediaId: doc.featuredMediaId ?? doc.imageMediaId,
        legacyUrl: doc.image,
        field: "imageMediaId",
        label: `Aviso — ${doc.title}`,
      },
      {
        mediaId: doc.attachmentMediaId,
        field: "attachmentMediaId",
        label: `Aviso adjunto — ${doc.title}`,
      },
    ]
  );
}

export function scanTeam(tenant: string): Promise<UsageScanResult[]> {
  const mapper = (doc: ContentDocument) => [
    {
      mediaId: doc.photoMediaId ?? doc.imageMediaId,
      legacyUrl: doc.image,
      field: "photoMediaId",
      label: `Equipo — ${doc.name ?? doc.title}`,
    },
  ];

  const teachers = scanContentCollection(tenant, "academy_teachers", "academy_teachers", mapper);
  const team = scanContentCollection(tenant, "academy_team", "academy_team", mapper);
  return Promise.all([teachers, team]).then(([a, b]) => [...a, ...b]);
}

async function resolveLegacyRefs(
  tenant: string,
  results: UsageScanResult[]
): Promise<UsageScanResult[]> {
  const resolved: UsageScanResult[] = [];

  for (const entry of results) {
    if (entry.mediaId.startsWith("__legacy__:")) {
      const url = entry.mediaId.slice("__legacy__:".length);
      const asset = await findMediaByUrl(tenant, url);
      if (asset) {
        resolved.push({ mediaId: asset._id, ref: entry.ref });
      }
    } else {
      resolved.push(entry);
    }
  }

  return resolved;
}
