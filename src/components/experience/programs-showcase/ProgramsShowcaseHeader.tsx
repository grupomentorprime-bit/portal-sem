"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { focusRing } from "@/components/ui/shared";
import { cn } from "@/lib/utils";
import type { ProgramsShowcaseConfig } from "@/types/programs-showcase";

interface ProgramsShowcaseHeaderProps {
  config: Pick<
    ProgramsShowcaseConfig,
    "overline" | "title" | "description" | "tagline" | "catalogHref" | "catalogLabel"
  >;
  titleId?: string;
  className?: string;
}

export function ProgramsShowcaseHeader({
  config,
  titleId = "programs-showcase-title",
  className,
}: ProgramsShowcaseHeaderProps) {
  return (
    <header className={cn("programs-showcase__header", className)}>
      <div className="programs-showcase__header-copy">
        {config.overline ? (
          <p className="programs-showcase__overline">{config.overline}</p>
        ) : null}
        <h2 id={titleId} className="programs-showcase__title">
          {config.title}
        </h2>
        {config.description ? (
          <p className="programs-showcase__description">{config.description}</p>
        ) : null}
        {config.tagline ? (
          <p className="programs-showcase__tagline">{config.tagline}</p>
        ) : null}
      </div>

      {config.catalogHref && config.catalogLabel ? (
        <Link
          href={config.catalogHref}
          className={cn("programs-showcase__catalog-link", focusRing)}
        >
          {config.catalogLabel}
          <ArrowRight strokeWidth={2} aria-hidden />
        </Link>
      ) : null}
    </header>
  );
}
