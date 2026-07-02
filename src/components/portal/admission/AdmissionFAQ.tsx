import { FaqSection } from "@/components/portal/conversion/FaqSection";
import type { AdmissionFaqItem } from "@/types/admission";
import type { CmsSectionLayout } from "@/types/cms-shared";

interface AdmissionFAQProps {
  items: AdmissionFaqItem[];
  layout?: CmsSectionLayout;
  anchor?: string;
}

export function AdmissionFAQ({ items, layout, anchor }: AdmissionFAQProps) {
  const visible = items.filter((item) => item.enabled !== false);
  if (visible.length === 0) return null;

  return (
    <FaqSection
      overline={layout?.badge}
      title={layout?.title ?? ""}
      description={layout?.description}
      items={visible}
      id={anchor}
    />
  );
}
