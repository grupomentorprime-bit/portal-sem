import "server-only";

import type { Branding, SeoConfig } from "@/types/cms";
import type { ContentDocument } from "@/types/content";
import type { PageBlock } from "@/types/page";
import { resolveMediaRef, resolveMediaRefWithFallback } from "./resolve";
import type { MediaReference } from "./types";

export async function resolveBrandingMediaUrls(
  tenant: string,
  branding: Branding
): Promise<{
  logo: string;
  secondaryLogo?: string;
  hero: string;
  favicon?: string;
}> {
  const { PLATFORM_ASSET_FALLBACKS } = await import("@/lib/cms/asset-paths");

  const [logo, secondaryLogo, hero, favicon] = await Promise.all([
    resolveMediaRefWithFallback(
      tenant,
      { mediaId: branding.logoMediaId, legacyUrl: branding.logo },
      PLATFORM_ASSET_FALLBACKS.logo
    ),
    branding.secondaryLogoMediaId || branding.secondaryLogo
      ? resolveMediaRef(tenant, {
          mediaId: branding.secondaryLogoMediaId,
          legacyUrl: branding.secondaryLogo,
        })
      : Promise.resolve(undefined),
    resolveMediaRefWithFallback(
      tenant,
      { mediaId: branding.heroMediaId, legacyUrl: branding.heroImage },
      PLATFORM_ASSET_FALLBACKS.hero
    ),
    branding.faviconMediaId || branding.favicon
      ? resolveMediaRef(tenant, {
          mediaId: branding.faviconMediaId,
          legacyUrl: branding.favicon,
        })
      : Promise.resolve(undefined),
  ]);

  return {
    logo,
    secondaryLogo: secondaryLogo ?? undefined,
    hero,
    favicon: favicon ?? undefined,
  };
}

export async function resolveSeoImageUrls(
  tenant: string,
  seo: SeoConfig,
  branding: Branding
): Promise<{ ogImage?: string; twitterImage?: string }> {
  const ogImage = await resolveMediaRef(tenant, {
    mediaId: seo.ogImageMediaId,
    legacyUrl: seo.ogImage,
  });
  const twitterImage = await resolveMediaRef(tenant, {
    mediaId: seo.twitterImageMediaId,
    legacyUrl: seo.twitterImage,
  });

  const fallbackOg =
    ogImage ??
    (await resolveMediaRef(tenant, {
      mediaId: branding.heroMediaId,
      legacyUrl: branding.heroImage,
    })) ??
    (await resolveMediaRef(tenant, {
      mediaId: branding.logoMediaId,
      legacyUrl: branding.logo,
    }));

  return {
    ogImage: fallbackOg ?? undefined,
    twitterImage: twitterImage ?? fallbackOg ?? undefined,
  };
}

export async function resolvePageBlocksMedia(
  tenant: string,
  blocks: PageBlock[]
): Promise<PageBlock[]> {
  return Promise.all(
    blocks.map(async (block) => {
      if (block.type !== "hero") return block;

      const s = block.settings;
      const heroRef: MediaReference = {
        mediaId: s.heroMediaId as string | undefined,
        legacyUrl: s.heroImage as string | undefined,
      };
      const logoRef: MediaReference = {
        mediaId: s.logoMediaId as string | undefined,
        legacyUrl: s.logoSrc as string | undefined,
      };

      const [heroImage, logoSrc] = await Promise.all([
        resolveMediaRef(tenant, heroRef),
        resolveMediaRef(tenant, logoRef),
      ]);

      return {
        ...block,
        settings: {
          ...s,
          ...(heroImage ? { heroImage } : {}),
          ...(logoSrc ? { logoSrc } : {}),
        },
      };
    })
  );
}

export async function enrichContentDocumentMedia(
  tenant: string,
  doc: ContentDocument
): Promise<ContentDocument> {
  const imageRef: MediaReference = {
    mediaId: doc.coverMediaId ?? doc.featuredMediaId ?? doc.photoMediaId ?? doc.imageMediaId,
    legacyUrl: doc.image || doc.src,
  };

  const image = await resolveMediaRef(tenant, imageRef);
  const galleryUrls = doc.galleryMediaIds?.length
    ? await Promise.all(
        doc.galleryMediaIds.map((id) => resolveMediaRef(tenant, { mediaId: id }))
      )
    : [];

  return {
    ...doc,
    ...(image ? { image } : {}),
    ...(doc.src !== undefined && image ? { src: image } : {}),
    ...(galleryUrls.filter(Boolean).length
      ? { galleryUrls: galleryUrls.filter((u): u is string => Boolean(u)) }
      : {}),
  };
}

export async function enrichContentDocumentsMedia(
  tenant: string,
  docs: ContentDocument[]
): Promise<ContentDocument[]> {
  return Promise.all(docs.map((doc) => enrichContentDocumentMedia(tenant, doc)));
}
