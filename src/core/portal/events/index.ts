import "server-only";

import type { BlockType } from "@/types/page";

export async function publishPageViewed(input: {
  tenantId: string;
  pageSlug: string;
  pageTitle?: string;
  blockCount: number;
}): Promise<void> {
  const { publish } = await import("@/core/events/publisher");
  await publish({
    type: "PageViewed",
    tenantId: input.tenantId,
    entityType: "portal.page",
    entityId: input.pageSlug,
    payload: {
      pageTitle: input.pageTitle,
      blockCount: input.blockCount,
    },
  }).catch(() => undefined);
}

export async function publishBlockRendered(input: {
  tenantId: string;
  pageSlug: string;
  blockId: string;
  blockType: BlockType;
}): Promise<void> {
  const { publish } = await import("@/core/events/publisher");
  await publish({
    type: "BlockRendered",
    tenantId: input.tenantId,
    entityType: "portal.block",
    entityId: input.blockId,
    payload: {
      pageSlug: input.pageSlug,
      blockType: input.blockType,
    },
  }).catch(() => undefined);
}

export async function publishCtaViewed(input: {
  tenantId: string;
  pageSlug: string;
  blockId: string;
  ctaLabel?: string;
  ctaHref?: string;
}): Promise<void> {
  const { publish } = await import("@/core/events/publisher");
  await publish({
    type: "CTAViewed",
    tenantId: input.tenantId,
    entityType: "portal.cta",
    entityId: input.blockId,
    payload: {
      pageSlug: input.pageSlug,
      ctaLabel: input.ctaLabel,
      ctaHref: input.ctaHref,
    },
  }).catch(() => undefined);
}
