import { BlockRenderer } from "@/components/page-builder/BlockRenderer";
import { resolvePageBlocks } from "@/lib/content/block-queries";
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
  const resolved = await resolvePageBlocks(blocks, tenant, { includeDraft: preview });
  return <BlockRenderer blocks={resolved} config={config} preview={preview} />;
}
