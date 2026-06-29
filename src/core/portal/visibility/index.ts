import type { PageBlock } from "@/types/page";
import type { PortalRenderContext } from "@/types/portal";
import { filterVisibleBlocks } from "@/core/portal/visibility/conditions";

export function sortBlocksByOrder(blocks: PageBlock[]): PageBlock[] {
  return [...blocks].sort((a, b) => a.order - b.order);
}

/** Bloques listos para render — orden exclusivo desde `cms_pages.blocks[]` */
export function getRenderableBlocks(
  blocks: PageBlock[],
  ctx: PortalRenderContext
): PageBlock[] {
  const sorted = sortBlocksByOrder(blocks);
  return filterVisibleBlocks(sorted, ctx);
}

export { evaluateBlockVisibility, filterVisibleBlocks, parseBlockConditions } from "@/core/portal/visibility/conditions";
