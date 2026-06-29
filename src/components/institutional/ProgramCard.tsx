import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { iconSizes } from "@/design";
import type { ProgramItem } from "@/lib/institutional/home-content";
import { InstitutionalCard } from "./InstitutionalCard";

interface ProgramCardProps {
  program: ProgramItem;
}

export function ProgramCard({ program }: ProgramCardProps) {
  const Icon = program.icon;

  return (
    <Link href={program.href} className="group block h-full">
      <InstitutionalCard className="flex h-full flex-col animate-scale-in">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[var(--radius-xl)] bg-accent/15 text-secondary">
          <Icon size={iconSizes.lg} strokeWidth={2} aria-hidden />
        </div>
        <h3 className="text-heading text-foreground">{program.title}</h3>
        <p className="mt-2 flex-1 text-body text-muted">{program.description}</p>
        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <span className="flex items-center gap-1.5 text-caption text-muted">
            <Clock size={iconSizes.sm} strokeWidth={2} aria-hidden />
            {program.duration}
          </span>
          <span className="flex items-center gap-1 text-caption font-medium text-secondary transition-colors group-hover:text-accent">
            Ver programa
            <ArrowRight
              size={iconSizes.sm}
              strokeWidth={2}
              className="transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </span>
        </div>
      </InstitutionalCard>
    </Link>
  );
}
