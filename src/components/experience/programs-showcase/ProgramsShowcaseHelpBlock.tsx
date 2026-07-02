import Link from "next/link";
import { ArrowRight, GraduationCap, User } from "lucide-react";
import { focusRing } from "@/components/ui/shared";
import { cn } from "@/lib/utils";
import type { ProgramsShowcaseHelpConfig } from "@/types/programs-showcase";

interface ProgramsShowcaseHelpBlockProps {
  config: ProgramsShowcaseHelpConfig;
  className?: string;
}

export function ProgramsShowcaseHelpBlock({
  config,
  className,
}: ProgramsShowcaseHelpBlockProps) {
  if (!config.enabled) return null;

  return (
    <aside
      className={cn("programs-showcase__help", className)}
      aria-labelledby="programs-showcase-help-title"
    >
      <div className="programs-showcase__help-icon" aria-hidden>
        <GraduationCap strokeWidth={1.75} />
      </div>

      <div className="programs-showcase__help-copy">
        <h3 id="programs-showcase-help-title" className="programs-showcase__help-title">
          {config.title}
        </h3>
        <p className="programs-showcase__help-desc">{config.description}</p>
      </div>

      <div className="programs-showcase__help-actions">
        <Link
          href={config.primaryHref}
          className={cn("programs-showcase__help-btn", focusRing)}
        >
          <User className="programs-showcase__help-btn-icon" strokeWidth={2} aria-hidden />
          {config.primaryLabel}
        </Link>
        <Link
          href={config.secondaryHref}
          className={cn("programs-showcase__help-link", focusRing)}
        >
          {config.secondaryLabel}
          <ArrowRight className="programs-showcase__help-link-arrow" strokeWidth={2} aria-hidden />
        </Link>
      </div>
    </aside>
  );
}
