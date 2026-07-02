import "server-only";

import { notFound } from "next/navigation";
import type { FeatureFlags } from "@/types/cms";
import { getActivePortal } from "@/lib/portal/site";
import { isFeatureEnabled } from "@/lib/portal/feature-flags";

export async function requirePortalFeature(feature: keyof FeatureFlags) {
  const ctx = await getActivePortal();
  if (!ctx || !isFeatureEnabled(ctx.config.features, feature)) {
    notFound();
  }
  return ctx;
}
