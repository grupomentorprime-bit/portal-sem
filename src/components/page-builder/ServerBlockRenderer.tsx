import { BlockRenderer } from "@/components/page-builder/BlockRenderer";
import { resolvePageBlocks } from "@/lib/content/block-queries";
import { resolveBrandingMediaUrls, resolvePageBlocksMedia } from "@/core/media";
import type { PageBlock } from "@/types/page";
import type { SiteConfig } from "@/types/cms";

interface ServerBlockRendererProps {
  blocks: PageBlock[];
  config: SiteConfig;
  tenant: string;
  preview?: boolean;
}

export async function ServerBlockRenderer({
  blocks,
  config,
  tenant,
  preview,
}: ServerBlockRendererProps) {
  const [withMedia, brandingUrls] = await Promise.all([
    resolvePageBlocksMedia(tenant, blocks),
    resolveBrandingMediaUrls(tenant, config.branding),
  ]);
  const resolved = await resolvePageBlocks(withMedia, tenant, { includeDraft: preview });

  const enrichedConfig: SiteConfig = {
    ...config,
    branding: {
      ...config.branding,
      logo: brandingUrls.logo,
      secondaryLogo: brandingUrls.secondaryLogo ?? config.branding.secondaryLogo,
      heroImage: brandingUrls.hero,
      favicon: brandingUrls.favicon ?? config.branding.favicon,
    },
  };

  return <BlockRenderer blocks={resolved} config={enrichedConfig} preview={preview} />;
}
