"use client";

import { ExperienceActionProvider } from "@/components/portal/experience/ExperienceActionProvider";
import { BlockRenderer } from "./BlockRenderer";
import { useResolvedBlocks } from "./useResolvedBlocks";
import type { SiteConfig } from "@/types/cms";
import type { PageBlock } from "@/types/page";
import { buildRenderContext } from "@/core/portal/render-context";
import { getRenderableBlocks } from "@/core/portal/visibility";

interface BlockPreviewProps {
  blocks: PageBlock[];
  config: SiteConfig;
  tenant: string;
  pageSlug?: string;
  selectedBlockId?: string | null;
  onSelectBlock?: (id: string) => void;
  selectable?: boolean;
}

export function BlockPreview({
  blocks,
  config,
  tenant,
  pageSlug,
  selectedBlockId,
  onSelectBlock,
  selectable,
}: BlockPreviewProps) {
  const { blocks: resolved, loading } = useResolvedBlocks(blocks, tenant, true);
  const renderCtx = buildRenderContext({
    tenantId: tenant,
    config,
    preview: true,
  });
  const visibleBlocks = getRenderableBlocks(resolved, renderCtx);

  if (loading) {
    return (
      <div className="flex min-h-48 items-center justify-center text-sm text-muted">
        Cargando contenido dinámico…
      </div>
    );
  }

  return (
    <ExperienceActionProvider>
      <BlockRenderer
        blocks={visibleBlocks}
        config={config}
        preview
        pageSlug={pageSlug}
        selectedBlockId={selectedBlockId}
        onSelectBlock={onSelectBlock}
        selectable={selectable}
      />
    </ExperienceActionProvider>
  );
}
