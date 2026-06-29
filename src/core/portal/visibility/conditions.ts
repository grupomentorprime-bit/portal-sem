import type { FeatureFlags } from "@/types/cms";
import type { PageBlock } from "@/types/page";
import type { PortalAudience, PortalBlockConditions, PortalRenderContext } from "@/types/portal";

export function parseBlockConditions(block: PageBlock): PortalBlockConditions {
  const raw = block.settings?.conditions;
  if (!raw || typeof raw !== "object") return {};
  return raw as PortalBlockConditions;
}

function isWithinDateRange(from?: string, to?: string, now = new Date()): boolean {
  if (from && now < new Date(from)) return false;
  if (to && now > new Date(to)) return false;
  return true;
}

function matchesFeatureFlag(
  flag: keyof FeatureFlags | undefined,
  features: FeatureFlags
): boolean {
  if (!flag) return true;
  return Boolean(features[flag]);
}

function matchesRole(roles: PortalAudience[] | undefined, audience: PortalAudience): boolean {
  if (!roles?.length) return true;
  return roles.includes(audience);
}

function matchesTenant(tenantIds: string[] | undefined, tenantId: string): boolean {
  if (!tenantIds?.length) return true;
  return tenantIds.includes(tenantId);
}

function matchesLanguage(language: string | undefined, pageLanguage?: string): boolean {
  if (!language) return true;
  if (!pageLanguage) return true;
  return language === pageLanguage;
}

export function evaluateBlockVisibility(
  block: PageBlock,
  ctx: PortalRenderContext
): boolean {
  if (!block.visible && !ctx.preview) return false;

  const conditions = parseBlockConditions(block);

  if (!matchesTenant(conditions.tenantIds, ctx.tenantId)) return false;
  if (!matchesRole(conditions.roles, ctx.audience)) return false;
  if (!matchesFeatureFlag(conditions.featureFlag, ctx.featureFlags)) return false;
  if (!isWithinDateRange(conditions.dateFrom, conditions.dateTo)) return false;
  if (!matchesLanguage(conditions.language, ctx.language)) return false;

  return true;
}

export function filterVisibleBlocks(
  blocks: PageBlock[],
  ctx: PortalRenderContext
): PageBlock[] {
  return blocks.filter((block) => evaluateBlockVisibility(block, ctx));
}
