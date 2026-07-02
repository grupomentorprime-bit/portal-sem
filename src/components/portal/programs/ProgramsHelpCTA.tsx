import Link from "next/link";
import { ArrowRight, GraduationCap, User } from "lucide-react";
import { focusRing } from "@/components/ui/shared";
import { cn } from "@/lib/utils";
import type { ProgramsHelpCtaConfig } from "@/lib/portal/program-premium-config";

interface ProgramsHelpCTAProps {
  config: ProgramsHelpCtaConfig;
  className?: string;
}

export function ProgramsHelpCTA({ config, className }: ProgramsHelpCTAProps) {
  return (
    <aside
      className={cn("programs-premium__help", className)}
      aria-labelledby="programs-help-title"
    >
      <div className="programs-premium__help-icon" aria-hidden>
        <GraduationCap strokeWidth={1.75} />
      </div>

      <div className="programs-premium__help-copy">
        <h3 id="programs-help-title" className="programs-premium__help-title">
          {config.title}
        </h3>
        <p className="programs-premium__help-desc">{config.description}</p>
      </div>

      <div className="programs-premium__help-actions">
        <Link
          href={config.primaryHref}
          className={cn("programs-premium__help-btn", focusRing)}
        >
          <User className="programs-premium__help-btn-icon" strokeWidth={2} aria-hidden />
          {config.primaryLabel}
        </Link>
        <Link
          href={config.secondaryHref}
          className={cn("programs-premium__help-link", focusRing)}
        >
          {config.secondaryLabel}
          <ArrowRight className="programs-premium__help-link-arrow" strokeWidth={2} aria-hidden />
        </Link>
      </div>
    </aside>
  );
}
