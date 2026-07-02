/**
 * @deprecated
 *
 * Reemplazado por:
 * ResourcesSectionContent
 *
 * Eliminación prevista:
 * Core UI v2.0
 *
 * @see docs/frontend/CORE-UI-CANON.md
 */

import { asString } from "@/lib/cms/block-utils";
import { extractResources } from "@/lib/portal/blocks";
import { ResourcesSectionContent } from "@/components/portal/ecosystem/EcosystemSectionContent";
import type { PageBlock } from "@/types/page";

interface ResourcesGridProps {
  settings: Record<string, unknown>;
}

export function ResourcesGrid({ settings }: ResourcesGridProps) {
  const block: PageBlock = {
    id: "resources-preview",
    type: "resources",
    visible: true,
    order: 0,
    settings,
  };
  const items = extractResources(block);

  return (
    <ResourcesSectionContent
      items={items}
      settings={{
        overline: asString(settings.overline) || undefined,
        title: asString(settings.title, "Recursos destacados"),
        description: asString(settings.description) || undefined,
      }}
    />
  );
}
