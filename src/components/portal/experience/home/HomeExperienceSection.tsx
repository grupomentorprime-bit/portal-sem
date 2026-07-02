import { HomeExperienceReveal } from "./HomeExperienceReveal";
import { getHomeSectionExperience } from "@/lib/portal/home-experience";
import type { BlockType } from "@/types/page";
import type { ReactNode } from "react";

interface HomeExperienceSectionProps {
  blockType: BlockType;
  index: number;
  children: ReactNode;
}

export function HomeExperienceSection({
  blockType,
  index,
  children,
}: HomeExperienceSectionProps) {
  const experience = getHomeSectionExperience(blockType);

  return (
    <div
      className={`portal-home-x__section portal-home-x__section--${experience.surface}`}
      data-block={blockType}
      data-home-section={index}
      data-feeling={experience.feeling}
      data-action={experience.action}
      style={
        {
          "--home-section-py": `${experience.paddingY}px`,
          "--home-reveal-delay": `${Math.min(index * 0.06, 0.36)}s`,
        } as React.CSSProperties
      }
    >
      <HomeExperienceReveal>{children}</HomeExperienceReveal>
    </div>
  );
}
