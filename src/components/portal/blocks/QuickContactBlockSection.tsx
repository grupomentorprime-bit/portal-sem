import { QuickContactSection } from "@/components/portal/conversion/QuickContactSection";
import { blockSettings } from "@/lib/portal/blocks";
import type { ContactInfo } from "@/types/cms";
import type { PageBlock } from "@/types/page";

interface QuickContactBlockSectionProps {
  block: PageBlock;
  contact: ContactInfo;
}

export function QuickContactBlockSection({ block, contact }: QuickContactBlockSectionProps) {
  const settings = blockSettings<{
    overline?: string;
    title?: string;
    description?: string;
    showWhatsapp?: boolean;
    showEmail?: boolean;
    showPhone?: boolean;
    showHours?: boolean;
    showAddress?: boolean;
  }>(block);

  return (
    <QuickContactSection
      overline={settings.overline}
      title={settings.title}
      description={settings.description}
      contact={contact}
      showWhatsapp={settings.showWhatsapp}
      showEmail={settings.showEmail}
      showPhone={settings.showPhone}
      showHours={settings.showHours}
      showAddress={settings.showAddress}
    />
  );
}
