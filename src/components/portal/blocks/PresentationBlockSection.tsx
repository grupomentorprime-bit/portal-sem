import "server-only";

import {
  PortalFeatureGrid,
  extractFeatureGridItems,
} from "@/components/portal/experience/feature-grid";
import { SemAffiliationBand } from "@/components/portal/home/affiliation/SemAffiliationBand";
import { blockSettings } from "@/lib/portal/blocks";
import type { PortalFeatureGridSettings } from "@/types/feature-grid";
import type { PageBlock } from "@/types/page";

interface PresentationBlockSectionProps {
  block: PageBlock;
}

/**
 * @deprecated Bloque legacy — delega a Feature Grid (Experience Module).
 * Usar bloque `feature_grid` en páginas nuevas.
 */
export function PresentationBlockSection({ block }: PresentationBlockSectionProps) {
  const settings = blockSettings<{
    overline?: string;
    title?: string;
    subtitle?: string;
    description?: string;
    emptyTitle?: string;
    emptyDescription?: string;
  }>(block);

  const title = settings.title?.trim() ?? "";
  if (/IPN Chile/i.test(title)) {
    return (
      <SemAffiliationBand
        title={title}
        subtitle={settings.subtitle?.trim()}
        description={settings.description?.trim()}
      />
    );
  }

  const gridSettings: PortalFeatureGridSettings = {
    overline: settings.overline,
    title: settings.title,
    description: settings.description || settings.subtitle,
    emptyTitle: settings.emptyTitle,
    emptyDescription: settings.emptyDescription,
  };

  return (
    <PortalFeatureGrid
      settings={gridSettings}
      features={extractFeatureGridItems(block)}
      id="presentacion"
    />
  );
}
