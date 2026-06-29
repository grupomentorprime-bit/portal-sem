export {
  PORTAL_BLOCK_REGISTRY,
  getBlockDefinition,
  isRegisteredBlockType,
  listBlockDefinitions,
} from "@/core/portal/registry";

export {
  getRenderableBlocks,
  sortBlocksByOrder,
  evaluateBlockVisibility,
  filterVisibleBlocks,
  parseBlockConditions,
} from "@/core/portal/visibility";

export {
  resolveBlockData,
  resolveBlockMedia,
  getResolverKey,
} from "@/core/portal/resolver";

export {
  buildRenderContext,
  loadPublishedPage,
  loadHomePage,
  preparePageBlocks,
} from "@/core/portal/renderer/load-page";

export { consolidatePageSeo, seoToMetadata } from "@/core/portal/seo";

export {
  publishPageViewed,
  publishBlockRendered,
  publishCtaViewed,
} from "@/core/portal/events";

export { resolveLayoutConfig, DEFAULT_PORTAL_LAYOUT } from "@/core/portal/layout";

export type {
  PortalAudience,
  PortalBlockConditions,
  PortalBlockDefinition,
  PortalPageModel,
  PortalRenderContext,
  PortalSeoPayload,
  ResolvedBlockData,
} from "@/types/portal";
