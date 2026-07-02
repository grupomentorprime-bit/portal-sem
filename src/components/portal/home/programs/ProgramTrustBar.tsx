import {
  BookOpen,
  GraduationCap,
  Monitor,
  Shield,
} from "lucide-react";
import { DEMO_PROGRAM_TRUST_STATS } from "@/lib/portal/program-trust-stats";
import { cn } from "@/lib/utils";

const TRUST_ICONS = {
  GraduationCap,
  BookOpen,
  Monitor,
  Shield,
} as const;

interface ProgramTrustBarProps {
  className?: string;
}

export function ProgramTrustBar({ className }: ProgramTrustBarProps) {
  return (
    <section
      className={cn("program-trust-section", className)}
      aria-labelledby="program-trust-heading"
    >
      <h3 id="program-trust-heading" className="program-trust-section__heading">
        ¿Por qué estudiar con nosotros?
      </h3>
      <div className="program-trust-bar" role="list">
        {DEMO_PROGRAM_TRUST_STATS.map((stat, index) => {
          const Icon = TRUST_ICONS[stat.icon];
          return (
            <div
              key={stat.id}
              className={cn(
                "program-trust-bar__item",
                index > 0 && "program-trust-bar__item--divided"
              )}
              role="listitem"
            >
              <span className="program-trust-bar__icon" aria-hidden>
                <Icon size={28} strokeWidth={1.5} />
              </span>
              <span className="program-trust-bar__text">
                <strong className="program-trust-bar__value">{stat.value}</strong>
                <span className="program-trust-bar__title">{stat.title}</span>
                <span className="program-trust-bar__description">
                  {stat.description}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
