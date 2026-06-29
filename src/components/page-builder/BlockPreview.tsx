"use client";

import { BlockRenderer } from "./BlockRenderer";
import { useResolvedBlocks } from "./useResolvedBlocks";
import type { PageBlock } from "@/types/page";
import type { SiteConfig } from "@/types/cms";

interface BlockPreviewProps {
  blocks: PageBlock[];
  config: SiteConfig;
  tenant: string;
}

export function BlockPreview({ blocks, config, tenant }: BlockPreviewProps) {
  const { blocks: resolved, loading } = useResolvedBlocks(blocks, tenant, true);

  if (loading) {
    return (
      <div className="flex min-h-48 items-center justify-center text-sm text-muted">
        Cargando contenido dinámico…
      </div>
    );
  }

  return <BlockRenderer blocks={resolved} config={config} preview />;
}
