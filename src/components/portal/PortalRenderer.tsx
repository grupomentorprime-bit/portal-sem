import "server-only";

import { Suspense } from "react";
import {
  buildRenderContext,
  consolidatePageSeo,
  preparePageBlocks,
  publishPageViewed,
} from "@/core/portal";
import { PortalBlockSection } from "@/components/portal/PortalBlockSection";
import { PortalBlockSkeleton } from "@/components/portal/PortalBlockSkeleton";
import { PortalStructuredData } from "@/components/portal/seo/PortalStructuredData";
import type { PortalContext } from "@/lib/portal/site";
import type { PortalPageModel } from "@/types/portal";

interface PortalRendererProps {
  page: PortalPageModel;
  ctx: PortalContext;
  preview?: boolean;
}

export async function PortalRenderer({ page, ctx, preview }: PortalRendererProps) {
  const renderCtx = buildRenderContext({
    tenantId: ctx.tenant,
    config: ctx.config,
    preview,
  });

  const blocks = preparePageBlocks(page, renderCtx);
  const seo = consolidatePageSeo(page, ctx.config, blocks);

  await publishPageViewed({
    tenantId: ctx.tenant,
    pageSlug: page.slug,
    pageTitle: page.title,
    blockCount: blocks.length,
  });

  return (
    <>
      {blocks.map((block) => (
        <Suspense key={block.id} fallback={<PortalBlockSkeleton type={block.type} />}>
          <PortalBlockSection
            block={block}
            tenant={ctx.tenant}
            ctx={ctx}
            allBlocks={blocks}
            pageSlug={page.slug}
          />
        </Suspense>
      ))}
      <PortalStructuredData jsonLd={seo.jsonLd} />
    </>
  );
}
