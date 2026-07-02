"use client";

import Link from "next/link";
import { focusRing } from "@/components/ui/shared";
import { cn } from "@/lib/utils";
import type { ProgramItem } from "@/types/content";
import { ProgramBadgeList } from "./ProgramBadgeList";
import { ProgramCardMedia } from "./ProgramCardMedia";
import { ProgramCTA } from "./ProgramCTA";
import { ProgramMeta } from "./ProgramMeta";
import { ProgramPrice } from "./ProgramPrice";
import {
  formatProgramTitleLines,
  resolveProgramBadges,
  resolveProgramCtaLabel,
  resolveProgramEconomics,
  resolveProgramImage,
} from "./program-utils";

interface FeaturedProgramCardProps {
  program: ProgramItem;
  programIndex?: number;
  ctaLabel?: string;
  priorityImage?: boolean;
  className?: string;
}

export function FeaturedProgramCard({
  program,
  programIndex = 0,
  ctaLabel = "Conocer programa",
  priorityImage = false,
  className,
}: FeaturedProgramCardProps) {
  const comingSoon = program.status === "coming_soon";
  const badges = resolveProgramBadges(program);
  const economics = resolveProgramEconomics(program);
  const label = resolveProgramCtaLabel(program, ctaLabel);
  const imageSrc = resolveProgramImage(program, programIndex);
  const titleId = `featured-program-${program.id}-title`;
  const titleLines = formatProgramTitleLines(program.title);

  const content = (
    <>
      <ProgramCardMedia
        src={imageSrc}
        alt=""
        priority={priorityImage}
        sizes="(max-width: 768px) 100vw, 420px"
        className="featured-program-card__media"
      />

      <div className="featured-program-card__body">
        <div className="featured-program-card__header">
          {badges.length > 0 ? (
            <ProgramBadgeList
              badges={badges}
              className="featured-program-card__badges"
            />
          ) : null}
          <h3 id={titleId} className="featured-program-card__title">
            {titleLines ? (
              <>
                <span className="featured-program-card__title-line">
                  {titleLines[0]}
                </span>
                <span className="featured-program-card__title-line">
                  {titleLines[1]}
                </span>
              </>
            ) : (
              program.title
            )}
          </h3>
          {program.description ? (
            <p className="featured-program-card__description">
              {program.description}
            </p>
          ) : null}
        </div>

        <ProgramMeta
          modality={program.modality}
          duration={program.duration}
          certification={program.certification}
          startDate={program.startDate}
          variant="academic-grid"
          className="featured-program-card__meta"
        />

        {economics ? (
          <div className="featured-program-card__price-band">
            <ProgramPrice
              economics={economics}
              variant="featured"
              className="featured-program-card__price"
            />
          </div>
        ) : null}

        <div className="featured-program-card__footer">
          <ProgramCTA
            label={label}
            disabled={comingSoon}
            className="featured-program-card__cta"
          />
        </div>
      </div>
    </>
  );

  if (comingSoon) {
    return (
      <article
        className={cn("featured-program-card group", className)}
        aria-labelledby={titleId}
        aria-disabled
      >
        <div className="featured-program-card__surface">{content}</div>
      </article>
    );
  }

  return (
    <article
      className={cn("featured-program-card group", className)}
      aria-labelledby={titleId}
    >
      <Link
        href={program.href}
        className={cn("featured-program-card__surface", focusRing)}
        aria-label={`${label}: ${program.title}`}
      >
        {content}
      </Link>
    </article>
  );
}
