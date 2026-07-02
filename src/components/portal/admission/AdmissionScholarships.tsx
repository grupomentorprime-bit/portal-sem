import { ScholarshipsSection } from "@/components/portal/conversion/ScholarshipsSection";
import type { AdmissionScholarshipItem } from "@/types/admission";
import type { CmsSectionLayout } from "@/types/cms-shared";

interface AdmissionScholarshipsProps {
  items: AdmissionScholarshipItem[];
  description?: string;
  layout?: CmsSectionLayout;
  anchor?: string;
}

export function AdmissionScholarships({
  items,
  description,
  layout,
  anchor,
}: AdmissionScholarshipsProps) {
  return (
    <ScholarshipsSection
      overline={layout?.badge}
      title={layout?.title ?? ""}
      description={description ?? layout?.description}
      items={items}
      id={anchor}
    />
  );
}
