import type { FormLandingConfig } from "@/lib/admin/forms-center";
import type {
  ExperienceFormExperience,
  FormExperienceBlock,
} from "@/types/experience-form-experience";

function sortBlocks(blocks: FormExperienceBlock[]): FormExperienceBlock[] {
  return [...blocks].sort((a, b) => a.order - b.order);
}

/** Compatibilidad con FormLandingConfig para componentes existentes. */
export function toFormLandingConfig(experience: ExperienceFormExperience): FormLandingConfig {
  const visibleCards = experience.infoCards.filter((card) => card.visible);
  return {
    formId: experience._id,
    theme: experience.appearance.theme,
    eyebrow: experience.hero.eyebrow,
    headline: experience.hero.headline,
    subheadline: experience.hero.subheadline,
    motivational: experience.hero.motivational,
    highlights: visibleCards.map((card) => ({
      icon: card.icon as FormLandingConfig["highlights"][number]["icon"],
      label: card.label,
      value: card.value,
    })),
    ctaLabel: experience.formShell.submitLabel,
  };
}

export function reorderFormExperienceBlocks(
  blocks: FormExperienceBlock[],
  draggedId: string,
  targetId: string
): FormExperienceBlock[] {
  const sorted = sortBlocks(blocks);
  const fromIndex = sorted.findIndex((block) => block.id === draggedId);
  const toIndex = sorted.findIndex((block) => block.id === targetId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return sorted;

  const next = [...sorted];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next.map((block, index) => ({ ...block, order: index }));
}
