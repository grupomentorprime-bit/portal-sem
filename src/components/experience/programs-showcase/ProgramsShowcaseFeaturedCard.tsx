"use client";

import Link from "next/link";
import { focusRing } from "@/components/ui/shared";
import { cn } from "@/lib/utils";
import type { ProgramItem } from "@/types/content";
import { ProgramBadgeList } from "@/components/portal/programs/ProgramBadgeList";
import { ProgramCardMedia } from "@/components/portal/programs/ProgramCardMedia";
import { ProgramCTA } from "@/components/portal/programs/ProgramCTA";
import { ProgramMetaGrid } from "@/components/portal/programs/ProgramMetaGrid";
import {
  resolveProgramBadges,
  resolveProgramCtaLabel,
  resolveProgramImage,
} from "@/components/portal/programs/program-utils";

interface ProgramsShowcaseFeaturedCardProps {
  program: ProgramItem;
  programIndex?: number;
  ctaLabel?: string;
  priorityImage?: boolean;
  className?: string;
}

export function ProgramsShowcaseFeaturedCard({
  program,
  programIndex = 0,
  ctaLabel = "Conocer programa",
  priorityImage = false,
  className,
}: ProgramsShowcaseFeaturedCardProps) {
  const comingSoon = program.status === "coming_soon";
  const badges = resolveProgramBadges(program);
  const label = resolveProgramCtaLabel(program, ctaLabel);
  const imageSrc = resolveProgramImage(program, programIndex);
  const titleId = `programs-showcase-featured-${program.id}-title`;

  const content = (
    <>
      <ProgramCardMedia
        src={imageSrc}
        alt={program.title}
        priority={priorityImage}
        sizes="(max-width: 768px) 100vw, 50vw"
        showBrandMark={false}
        className="programs-showcase-featured__media"
      />

      <div className="programs-showcase-featured__body">
        {badges.length > 0 ? (
          <ProgramBadgeList badges={badges} className="programs-showcase-featured__badges" />
        ) : null}

        <h3 id={titleId} className="programs-showcase-featured__title">
          {program.title}
        </h3>

        {program.description ? (
          <p className="programs-showcase-featured__description">{program.description}</p>
        ) : null}

        <ProgramMetaGrid
          modality={program.modality}
          duration={program.duration}
          certification={program.certification}
          startDate={program.startDate}
          className="programs-showcase-featured__meta"
        />

        <div className="programs-showcase-featured__footer">
          <ProgramCTA label={label} className="programs-showcase-featured__cta" />
        </div>
      </div>
    </>
  );

  if (comingSoon) {
    return (
      <article
        className={cn("programs-showcase-featured group", className)}
        aria-labelledby={titleId}
        aria-disabled
      >
        <div className="programs-showcase-featured__surface">{content}</div>
      </article>
    );
  }

  return (
    <article
      className={cn("programs-showcase-featured group", className)}
      aria-labelledby={titleId}
    >
      <Link
        href={program.href}
        className={cn("programs-showcase-featured__surface", focusRing)}
        aria-label={`${label}: ${program.title}`}
      >
        {content}
      </Link>
    </article>
  );
}
