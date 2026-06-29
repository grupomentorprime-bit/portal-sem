import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock } from "lucide-react";
import { iconSizes } from "@/design";
import { Badge } from "@/components/ui";
import { BlockIcon } from "@/components/portal/BlockIcon";
import type { ProgramItem } from "@/types/content";
import { PortalCard } from "./PortalCard";

const STATUS_LABELS: Record<string, { label: string; variant: "success" | "warning" | "info" }> = {
  active: { label: "Activo", variant: "success" },
  admission_open: { label: "Admisión abierta", variant: "info" },
  coming_soon: { label: "Próximamente", variant: "warning" },
};

interface ProgramCardProps {
  program: ProgramItem;
}

export function ProgramCard({ program }: ProgramCardProps) {
  const status = program.status ? STATUS_LABELS[program.status] : null;

  return (
    <Link href={program.href} className="group block h-full">
      <PortalCard className="flex h-full flex-col overflow-hidden p-0 animate-scale-in">
        <div className="relative aspect-[16/10] overflow-hidden bg-background-soft">
          {program.image ? (
            <Image
              src={program.image}
              alt=""
              fill
              className="object-cover transition-transform duration-[var(--transition-slow)] group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-primary/5">
              <BlockIcon name={program.icon} size={iconSizes.xl} className="text-secondary/40" strokeWidth={1.5} />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {status ? <Badge variant={status.variant}>{status.label}</Badge> : null}
            {program.modality ? (
              <Badge variant="neutral">{program.modality}</Badge>
            ) : null}
          </div>
          <h3 className="text-heading text-foreground group-hover:text-secondary">{program.title}</h3>
          <p className="mt-2 flex-1 text-body text-muted">{program.description}</p>
          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            {program.duration ? (
              <span className="flex items-center gap-1.5 text-caption text-muted">
                <Clock size={iconSizes.sm} strokeWidth={2} aria-hidden />
                {program.duration}
              </span>
            ) : (
              <span />
            )}
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
        </div>
      </PortalCard>
    </Link>
  );
}
