import "server-only";

import type { BlockType } from "@/types/page";

const RENDER_TELEMETRY_OPTIONS = { skipPersist: true } as const;

function fireRenderTelemetry(task: Promise<unknown>): void {
  void task.catch(() => undefined);
}

export function publishPageViewed(input: {
  tenantId: string;
  pageSlug: string;
  pageTitle?: string;
  blockCount: number;
}): void {
  fireRenderTelemetry(
    import("@/core/events/publisher").then(({ publish }) =>
      publish(
        {
          type: "PageViewed",
          tenantId: input.tenantId,
          entityType: "portal.page",
          entityId: input.pageSlug,
          payload: {
            pageTitle: input.pageTitle,
            blockCount: input.blockCount,
          },
        },
        RENDER_TELEMETRY_OPTIONS
      )
    )
  );
}

export function publishBlockRendered(input: {
  tenantId: string;
  pageSlug: string;
  blockId: string;
  blockType: BlockType;
}): void {
  fireRenderTelemetry(
    import("@/core/events/publisher").then(({ publish }) =>
      publish(
        {
          type: "BlockRendered",
          tenantId: input.tenantId,
          entityType: "portal.block",
          entityId: input.blockId,
          payload: {
            pageSlug: input.pageSlug,
            blockType: input.blockType,
          },
        },
        RENDER_TELEMETRY_OPTIONS
      )
    )
  );
}

export function publishCtaViewed(input: {
  tenantId: string;
  pageSlug: string;
  blockId: string;
  ctaLabel?: string;
  ctaHref?: string;
}): void {
  fireRenderTelemetry(
    import("@/core/events/publisher").then(({ publish }) =>
      publish(
        {
          type: "CTAViewed",
          tenantId: input.tenantId,
          entityType: "portal.cta",
          entityId: input.blockId,
          payload: {
            pageSlug: input.pageSlug,
            ctaLabel: input.ctaLabel,
            ctaHref: input.ctaHref,
          },
        },
        RENDER_TELEMETRY_OPTIONS
      )
    )
  );
}
