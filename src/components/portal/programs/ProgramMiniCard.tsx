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

interface ProgramMiniCardProps {
  program: ProgramItem;
  programIndex?: number;
  ctaLabel?: string;
  className?: string;
}

export function ProgramMiniCard({
  program,
  programIndex = 0,
  ctaLabel = "Conocer programa",
  className,
}: ProgramMiniCardProps) {
  const comingSoon = program.status === "coming_soon";
  const badges = resolveProgramBadges(program);
  const economics = resolveProgramEconomics(program);
  const label = resolveProgramCtaLabel(program, ctaLabel);
  const imageSrc = resolveProgramImage(program, programIndex);
  const titleId = `program-mini-${program.id}-title`;
  const titleLines = formatProgramTitleLines(program.title);

  const content = (
    <>
      <ProgramCardMedia
        src={imageSrc}
        alt=""
        sizes="(max-width: 768px) 100vw, 360px"
        className="program-mini-card__media"
      />

      <div className="program-mini-card__body">
        <div className="program-mini-card__header">
          {badges.length > 0 ? (
            <ProgramBadgeList
              badges={badges.slice(0, 2)}
              className="program-mini-card__badges"
            />
          ) : null}
          <h3 id={titleId} className="program-mini-card__title">
            {titleLines ? (
              <>
                <span className="program-mini-card__title-line">
                  {titleLines[0]}
                </span>
                <span className="program-mini-card__title-line">
                  {titleLines[1]}
                </span>
              </>
            ) : (
              program.title
            )}
          </h3>
        </div>

        <ProgramMeta
          modality={program.modality}
          duration={program.duration}
          startDate={program.startDate}
          variant="magazine"
          className="program-mini-card__meta"
        />

        {economics ? (
          <ProgramPrice
            economics={economics}
            variant="compact"
            className="program-mini-card__price"
          />
        ) : null}

        <ProgramCTA
          label={label}
          showCircle
          disabled={comingSoon}
          className="program-mini-card__cta"
        />
      </div>
    </>
  );

  if (comingSoon) {
    return (
      <article
        className={cn("program-mini-card program-mini-card--magazine group", className)}
        aria-labelledby={titleId}
        aria-disabled
      >
        <div className="program-mini-card__surface">{content}</div>
      </article>
    );
  }

  return (
    <article
      className={cn("program-mini-card program-mini-card--magazine group", className)}
      aria-labelledby={titleId}
    >
      <Link
        href={program.href}
        className={cn("program-mini-card__surface", focusRing)}
        aria-label={`${label}: ${program.title}`}
      >
        {content}
      </Link>
    </article>
  );
}
