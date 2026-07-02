/**
 * @deprecated
 *
 * Reemplazado por:
 * ModalitySectionContent
 *
 * Eliminación prevista:
 * Core UI v2.0
 *
 * @see docs/frontend/CORE-UI-CANON.md
 */

import { asString } from "@/lib/cms/block-utils";
import { extractModalityItems } from "@/lib/portal/blocks";
import { ModalitySectionContent } from "@/components/portal/institution/InstitutionSectionContent";

interface ModalitySectionProps {
  settings: Record<string, unknown>;
  image?: string;
}

export function ModalitySection({ settings, image }: ModalitySectionProps) {
  const items = extractModalityItems({
    id: "modality-block",
    type: "modality",
    visible: true,
    order: 0,
    settings,
  });

  return (
    <ModalitySectionContent
      overline={asString(settings.overline) || undefined}
      title={asString(settings.title) || undefined}
      subtitle={asString(settings.subtitle) || undefined}
      description={asString(settings.description) || undefined}
      items={items}
      image={image}
      buttonLabel={asString(settings.buttonLabel) || undefined}
      buttonHref={asString(settings.buttonHref) || undefined}
    />
  );
}
