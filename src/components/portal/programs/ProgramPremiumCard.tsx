"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { focusRing } from "@/components/ui/shared";
import { cn } from "@/lib/utils";
import type { ProgramItem } from "@/types/content";
import { ProgramBadge } from "./ProgramBadge";
import { ProgramBadgeList } from "./ProgramBadgeList";
import { ProgramCardMedia } from "./ProgramCardMedia";
import { ProgramCTA } from "./ProgramCTA";
import { ProgramMetaGrid } from "./ProgramMetaGrid";
import {
  resolveProgramBadges,
  resolveProgramCtaLabel,
  resolveProgramImage,
  resolveProgramImageBadge,
} from "./program-utils";

interface ProgramPremiumCardProps {
  program: ProgramItem;
  programIndex?: number;
  ctaLabel?: string;
  priorityImage?: boolean;
  className?: string;
}

export function ProgramPremiumCard({
  program,
  programIndex = 0,
  ctaLabel = "Conocer programa",
  priorityImage = false,
  className,
}: ProgramPremiumCardProps) {
  const comingSoon = program.status === "coming_soon";
  const badges = resolveProgramBadges(program);
  const imageBadge = resolveProgramImageBadge(program);
  const label = resolveProgramCtaLabel(program, ctaLabel);
  const imageSrc = resolveProgramImage(program, programIndex);
  const titleId = `program-premium-${program.id}-title`;

  const content = (
    <>
      <div className="program-premium-card__media-wrap">
        <ProgramCardMedia
          src={imageSrc}
          alt=""
          priority={priorityImage}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          showBrandMark={false}
          className="program-premium-card__media"
        />
        {imageBadge ? (
          <ProgramBadge
            label={imageBadge.label}
            tone={imageBadge.tone}
            className="program-premium-card__image-badge"
          />
        ) : null}
        <span className="program-premium-card__media-action" aria-hidden>
          <ArrowRight strokeWidth={2} />
        </span>
      </div>

      <div className="program-premium-card__body">
        {badges.length > 0 ? (
          <ProgramBadgeList
            badges={badges}
            className="program-premium-card__badges"
          />
        ) : null}

        <h3 id={titleId} className="program-premium-card__title">
          {program.title}
        </h3>

        {program.description ? (
          <p className="program-premium-card__description">{program.description}</p>
        ) : null}

        <ProgramMetaGrid
          modality={program.modality}
          duration={program.duration}
          certification={program.certification}
          startDate={program.startDate}
          className="program-premium-card__meta"
        />

        <div className="program-premium-card__footer">
          <ProgramCTA label={label} className="program-premium-card__cta" />
        </div>
      </div>
    </>
  );

  if (comingSoon) {
    return (
      <article
        className={cn("program-premium-card group", className)}
        aria-labelledby={titleId}
        aria-disabled
      >
        <div className="program-premium-card__surface">{content}</div>
      </article>
    );
  }

  return (
    <article
      className={cn("program-premium-card group", className)}
      aria-labelledby={titleId}
    >
      <Link
        href={program.href}
        className={cn("program-premium-card__surface", focusRing)}
        aria-label={`${label}: ${program.title}`}
      >
        {content}
      </Link>
    </article>
  );
}
