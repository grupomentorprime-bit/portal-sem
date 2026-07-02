"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Copy,
  Eye,
  MoreHorizontal,
  Pencil,
  Upload,
  XCircle,
} from "lucide-react";
import { useResolvedMediaUrl } from "@/hooks/useResolvedMediaUrl";
import { formatRelativeTime } from "@/lib/admin/audit-labels";
import {
  admissionBadgeLabel,
  formatProgramStartDate,
  programPreviewHref,
  resolveProgramCardImage,
  resolveProgramCategory,
  statusBadgeLabel,
  statusBadgeVariant,
} from "@/lib/admin/programs-hub-utils";
import type { ContentDocument } from "@/types/content";
import { Badge } from "@/components/ui";
import { Dropdown } from "@/components/ui/dropdown";
import { focusRing } from "@/components/ui/shared";
import { cn } from "@/lib/utils";

interface ProgramHubCardProps {
  program: ContentDocument;
  index: number;
  applicantCount: number;
  isFeatured?: boolean;
  busy?: boolean;
  onDuplicate: (program: ContentDocument) => void;
  onPublish: (program: ContentDocument) => void;
  onUnpublish: (program: ContentDocument) => void;
  onArchive: (program: ContentDocument) => void;
  onDelete: (program: ContentDocument) => void;
}

function ProgramHubCardMedia({
  program,
  index,
}: {
  program: ContentDocument;
  index: number;
}) {
  const mediaId = program.imageMediaId || program.coverMediaId || program.featuredMediaId;
  const resolved = useResolvedMediaUrl(mediaId, program.image);
  const src = resolved || resolveProgramCardImage(program, index);

  return (
    <div className="program-hub-card__media">
      <Image
        src={src}
        alt=""
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="program-hub-card__image"
      />
      <div className="program-hub-card__media-overlay" aria-hidden />
    </div>
  );
}

export function ProgramHubCard({
  program,
  index,
  applicantCount,
  isFeatured,
  busy,
  onDuplicate,
  onPublish,
  onUnpublish,
  onArchive,
  onDelete,
}: ProgramHubCardProps) {
  const admissionLabel = admissionBadgeLabel(program);
  const previewHref = programPreviewHref(program);
  const editHref = `/admin/content/programs/edit/${program._id}`;

  const moreItems = [
    program.status !== "archived"
      ? { label: "Archivar", onClick: () => onArchive(program) }
      : { label: "Restaurar borrador", onClick: () => onUnpublish(program) },
    { label: "Eliminar", onClick: () => onDelete(program) },
  ];

  return (
    <article
      className={cn("program-hub-card group", busy && "program-hub-card--busy")}
      aria-busy={busy}
    >
      <ProgramHubCardMedia program={program} index={index} />

      <div className="program-hub-card__body">
        <div className="program-hub-card__badges">
          <Badge variant={statusBadgeVariant(program.status)}>
            {statusBadgeLabel(program.status)}
          </Badge>
          {admissionLabel ? (
            <Badge
              variant={
                program.programStatus === "admission_open"
                  ? "info"
                  : program.programStatus === "coming_soon"
                    ? "warning"
                    : "neutral"
              }
            >
              {admissionLabel}
            </Badge>
          ) : null}
          {isFeatured ? <Badge variant="success">Destacado</Badge> : null}
        </div>

        <h3 className="program-hub-card__title">{program.title}</h3>
        <p className="program-hub-card__category">{resolveProgramCategory(program)}</p>

        <dl className="program-hub-card__meta">
          {program.modality ? (
            <div className="program-hub-card__meta-item">
              <dt>Modalidad</dt>
              <dd>{program.modality}</dd>
            </div>
          ) : null}
          {program.duration ? (
            <div className="program-hub-card__meta-item">
              <dt>Duración</dt>
              <dd>{program.duration}</dd>
            </div>
          ) : null}
          <div className="program-hub-card__meta-item">
            <dt>Inicio</dt>
            <dd>{formatProgramStartDate(program.startDate)}</dd>
          </div>
        </dl>

        <div className="program-hub-card__indicators">
          <div className="program-hub-card__indicator">
            <span className="program-hub-card__indicator-value">{applicantCount}</span>
            <span className="program-hub-card__indicator-label">Postulantes</span>
          </div>
          <div className="program-hub-card__indicator">
            <span className="program-hub-card__indicator-value">—</span>
            <span className="program-hub-card__indicator-label">Visitas</span>
          </div>
          <div className="program-hub-card__indicator">
            <span className="program-hub-card__indicator-value">—</span>
            <span className="program-hub-card__indicator-label">Conversión</span>
          </div>
        </div>

        <p className="program-hub-card__updated">
          Actualizado {formatRelativeTime(program.updatedAt)}
          {program.publishedAt ? ` · Publicado ${formatRelativeTime(program.publishedAt)}` : ""}
        </p>

        <div className="program-hub-card__actions">
          <Link href={editHref} className={cn("program-hub-card__action program-hub-card__action--primary", focusRing)}>
            <Pencil className="h-4 w-4" aria-hidden />
            Editar
          </Link>
          <button
            type="button"
            className="program-hub-card__action"
            onClick={() => onDuplicate(program)}
            disabled={busy}
          >
            <Copy className="h-4 w-4" aria-hidden />
            Duplicar
          </button>
          <Link
            href={previewHref}
            target="_blank"
            rel="noreferrer"
            className={cn("program-hub-card__action", focusRing)}
          >
            <Eye className="h-4 w-4" aria-hidden />
            Vista previa
          </Link>
          {program.status !== "published" ? (
            <button
              type="button"
              className="program-hub-card__action"
              onClick={() => onPublish(program)}
              disabled={busy}
            >
              <Upload className="h-4 w-4" aria-hidden />
              Publicar
            </button>
          ) : (
            <button
              type="button"
              className="program-hub-card__action"
              onClick={() => onUnpublish(program)}
              disabled={busy}
            >
              <XCircle className="h-4 w-4" aria-hidden />
              Despublicar
            </button>
          )}
          <Dropdown
            align="right"
            trigger={
              <span className="program-hub-card__action">
                <MoreHorizontal className="h-4 w-4" aria-hidden />
                Más
              </span>
            }
            items={moreItems}
          />
        </div>
      </div>
    </article>
  );
}
