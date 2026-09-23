import { AdmissionProcessSection } from "@/components/portal/conversion/AdmissionProcessSection";
import { SemAdmissionDates } from "@/components/portal/home/admission/SemAdmissionDates";
import { isSemTenant } from "@/core/tenant/is-sem";
import { parseExperienceAction, isValidExperienceAction } from "@/core/experience/actions";
import { asBoolean, asString } from "@/lib/cms/block-utils";
import { blockSettings, extractProcessSteps } from "@/lib/portal/blocks";
import type { PortalCtaButton } from "@/types/cta-premium";
import type { PortalTimelineLayout, PortalTimelineVariant } from "@/types/timeline";
import type { PageBlock } from "@/types/page";

interface AdmissionProcessBlockSectionProps {
  block: PageBlock;
  tenant?: string;
}

function extractButtons(block: PageBlock): PortalCtaButton[] {
  const raw = block.settings?.buttons;
  if (!Array.isArray(raw)) return [];

  const buttons: PortalCtaButton[] = [];

  for (const [index, item] of raw.entries()) {
    if (typeof item !== "object" || item === null) continue;

    const record = item as Record<string, unknown>;
    const action = parseExperienceAction(record.action, {
      href: asString(record.href),
      newTab: asBoolean(record.newTab, false),
    });

    if (!isValidExperienceAction(action)) continue;

    const label = asString(record.label);
    if (!label || record.visible === false) continue;

    buttons.push({
      id: asString(record.id, `btn-${index + 1}`),
      label,
      action,
      variant: asString(record.variant, "primary") as PortalCtaButton["variant"],
      visible: true,
    });

    if (buttons.length >= 3) break;
  }

  return buttons;
}

export function AdmissionProcessBlockSection({
  block,
  tenant,
}: AdmissionProcessBlockSectionProps) {
  const settings = blockSettings<{
    overline?: string;
    title?: string;
    description?: string;
    layout?: PortalTimelineLayout;
    variant?: PortalTimelineVariant;
  }>(block);

  return (
    <>
      {isSemTenant(tenant) ? <SemAdmissionDates /> : null}
      <AdmissionProcessSection
        overline={settings.overline}
        title={settings.title}
        description={settings.description}
        items={extractProcessSteps(block)}
        layout={settings.layout}
        variant={settings.variant}
        buttons={extractButtons(block)}
      />
    </>
  );
}
