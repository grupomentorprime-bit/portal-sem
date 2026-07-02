import Link from "next/link";
import {
  BookOpen,
  GraduationCap,
  Sparkles,
  Users,
} from "lucide-react";
import { PROGRAM_AUDIENCE_PROFILES } from "@/lib/portal/program-audience-profiles";
import { focusRing } from "@/components/ui/shared";
import { cn } from "@/lib/utils";

const AUDIENCE_ICONS = {
  Users,
  BookOpen,
  GraduationCap,
  Sparkles,
} as const;

interface ProgramAudienceSectionProps {
  className?: string;
}

export function ProgramAudienceSection({ className }: ProgramAudienceSectionProps) {
  return (
    <section
      className={cn("program-audience-section", className)}
      aria-labelledby="program-audience-heading"
    >
      <h3 id="program-audience-heading" className="program-audience-section__heading">
        ¿Este seminario es para ti?
      </h3>
      <p className="program-audience-section__lead">
        Encuentra la formación que se adapta a tu llamado y etapa ministerial.
      </p>
      <ul className="program-audience-section__grid" role="list">
        {PROGRAM_AUDIENCE_PROFILES.map((profile) => {
          const Icon = AUDIENCE_ICONS[profile.icon];
          return (
            <li key={profile.id} className="program-audience-section__item">
              <Link
                href={profile.href}
                className={cn("program-audience-card", focusRing)}
              >
                <span className="program-audience-card__icon" aria-hidden>
                  <Icon size={22} strokeWidth={1.5} />
                </span>
                <span className="program-audience-card__text">
                  <strong className="program-audience-card__title">
                    {profile.title}
                  </strong>
                  <span className="program-audience-card__description">
                    {profile.description}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
