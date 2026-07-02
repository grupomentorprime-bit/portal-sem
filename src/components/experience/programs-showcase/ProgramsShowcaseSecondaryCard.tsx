"use client";

import Link from "next/link";
import { focusRing } from "@/components/ui/shared";
import { cn } from "@/lib/utils";
import type { ProgramItem } from "@/types/content";
import { ProgramCardMedia } from "@/components/portal/programs/ProgramCardMedia";
import { ProgramCTA } from "@/components/portal/programs/ProgramCTA";
import {
  resolveModalityDisplay,
  resolveProgramCtaLabel,
  resolveProgramImage,
} from "@/components/portal/programs/program-utils";

interface ProgramsShowcaseSecondaryCardProps {
  program: ProgramItem;
  programIndex?: number;
  ctaLabel?: string;
  className?: string;
}

export function ProgramsShowcaseSecondaryCard({
  program,
  programIndex = 0,
  ctaLabel = "Conocer programa",
  className,
}: ProgramsShowcaseSecondaryCardProps) {
  const comingSoon = program.status === "coming_soon";
  const label = resolveProgramCtaLabel(program, ctaLabel);
  const imageSrc = resolveProgramImage(program, programIndex);
  const titleId = `programs-showcase-secondary-${program.id}-title`;
  const modality = resolveModalityDisplay(program.modality);

  const content = (
    <>
      <ProgramCardMedia
        src={imageSrc}
        alt={program.title}
        sizes="(max-width: 768px) 100vw, 33vw"
        showBrandMark={false}
        className="programs-showcase-secondary__media"
      />

      <div className="programs-showcase-secondary__body">
        <h3 id={titleId} className="programs-showcase-secondary__title">
          {program.title}
        </h3>

        {program.description ? (
          <p className="programs-showcase-secondary__description">{program.description}</p>
        ) : null}

        <dl className="programs-showcase-secondary__meta">
          {modality ? (
            <div className="programs-showcase-secondary__meta-item">
              <dt className="programs-showcase-secondary__meta-label">Modalidad</dt>
              <dd className="programs-showcase-secondary__meta-value">{modality}</dd>
            </div>
          ) : null}
          {program.duration?.trim() ? (
            <div className="programs-showcase-secondary__meta-item">
              <dt className="programs-showcase-secondary__meta-label">Duración</dt>
              <dd className="programs-showcase-secondary__meta-value">{program.duration}</dd>
            </div>
          ) : null}
        </dl>

        <ProgramCTA
          label={label}
          showCircle
          disabled={comingSoon}
          className="programs-showcase-secondary__cta"
        />
      </div>
    </>
  );

  if (comingSoon) {
    return (
      <article
        className={cn("programs-showcase-secondary group", className)}
        aria-labelledby={titleId}
        aria-disabled
      >
        <div className="programs-showcase-secondary__surface">{content}</div>
      </article>
    );
  }

  return (
    <article
      className={cn("programs-showcase-secondary group", className)}
      aria-labelledby={titleId}
    >
      <Link
        href={program.href}
        className={cn("programs-showcase-secondary__surface", focusRing)}
        aria-label={`${label}: ${program.title}`}
      >
        {content}
      </Link>
    </article>
  );
}
