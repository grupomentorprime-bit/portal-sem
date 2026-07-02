import type { AdmissionSectionId, AdmissionSectionMeta } from "@/types/admission";
import { ADMISSION_SECTION_LABELS } from "@/types/admission";

export const DEFAULT_ADMISSION_SECTIONS: AdmissionSectionMeta[] = (
  [
    "hero",
    "programs",
    "why_study",
    "profiles",
    "requirements",
    "dates",
    "documents",
    "timeline",
    "fees",
    "scholarships",
    "form",
    "faq",
    "closing",
  ] as AdmissionSectionId[]
).map((id, order) => ({
  id,
  label: ADMISSION_SECTION_LABELS[id],
  enabled: true,
  order,
}));

export function sortAdmissionSections(sections: AdmissionSectionMeta[]): AdmissionSectionMeta[] {
  return [...sections].sort((a, b) => a.order - b.order);
}

export function reorderAdmissionSections(
  sections: AdmissionSectionMeta[],
  draggedId: AdmissionSectionId,
  targetId: AdmissionSectionId
): AdmissionSectionMeta[] {
  const sorted = sortAdmissionSections(sections);
  const from = sorted.findIndex((s) => s.id === draggedId);
  const to = sorted.findIndex((s) => s.id === targetId);
  if (from < 0 || to < 0 || from === to) return sections;

  const next = [...sorted];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next.map((section, index) => ({ ...section, order: index }));
}
