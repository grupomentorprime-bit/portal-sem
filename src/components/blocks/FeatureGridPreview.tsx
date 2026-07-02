/**
 * @deprecated
 *
 * Reemplazado por:
 * PortalFeatureGrid
 *
 * @see docs/core/CORE-FEATURE-GRID-v1.md
 */

import { asString } from "@/lib/cms/block-utils";
import { PortalFeatureGrid } from "@/components/portal/experience/feature-grid";
import { extractFeatureGridItems } from "@/components/portal/experience/feature-grid/extract";
import type { PageBlock } from "@/types/page";

interface FeatureGridPreviewProps {
  settings: Record<string, unknown>;
}

export function FeatureGridPreview({ settings }: FeatureGridPreviewProps) {
  const block: PageBlock = {
    id: "preview-feature-grid",
    type: "feature_grid",
    visible: true,
    order: 0,
    settings,
  };

  return (
    <PortalFeatureGrid
      settings={{
        overline: asString(settings.overline) || undefined,
        title: asString(settings.title) || undefined,
        description: asString(settings.description) || undefined,
        emptyTitle: asString(settings.emptyTitle) || undefined,
        emptyDescription: asString(settings.emptyDescription) || undefined,
      }}
      features={extractFeatureGridItems(block)}
    />
  );
}
