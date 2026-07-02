"use client";

import Link from "next/link";
import {
  Download,
  ExternalLink,
  Monitor,
  Redo2,
  Save,
  Smartphone,
  Tablet,
  Undo2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PreviewDevice } from "@/components/page-builder/PreviewDevice";
import type { CmsPage } from "@/types/page";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<CmsPage["status"], string> = {
  draft: "Borrador",
  published: "Publicada",
  scheduled: "Programada",
  archived: "Archivada",
};

interface StudioToolbarProps {
  page: CmsPage;
  device: PreviewDevice;
  isDirty: boolean;
  saving: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onDeviceChange: (device: PreviewDevice) => void;
  onSave: (publish?: boolean) => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onToggleHistory: () => void;
  historyOpen: boolean;
}

export function StudioToolbar({
  page,
  device,
  isDirty,
  saving,
  canUndo,
  canRedo,
  onDeviceChange,
  onSave,
  onUndo,
  onRedo,
  onExport,
  onImport,
  onToggleHistory,
  historyOpen,
}: StudioToolbarProps) {
  const siteHref =
    page.slug === "/" || page.slug === "home" || !page.slug
      ? "/"
      : page.slug.startsWith("/")
        ? page.slug
        : `/${page.slug}`;

  return (
    <header className="experience-studio__toolbar sticky top-0 z-20 border-b border-border bg-background px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <nav className="mb-1 text-xs text-muted">
            <Link href="/admin" className="hover:text-foreground">
              Inicio
            </Link>
            <span className="mx-1">/</span>
            <Link href="/admin/pages" className="hover:text-foreground">
              Páginas
            </Link>
            <span className="mx-1">/</span>
            <span className="text-foreground">Experience Studio</span>
          </nav>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-lg font-semibold text-foreground">{page.title}</h1>
            <span className="rounded-full bg-background-soft px-2 py-0.5 text-xs font-medium text-muted">
              {STATUS_LABELS[page.status]}
            </span>
            {isDirty ? (
              <span className="text-xs text-[var(--color-warning)]">Cambios sin guardar</span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-lg border border-border p-0.5">
            {([
              ["desktop", Monitor, "Escritorio"],
              ["tablet", Tablet, "Tablet"],
              ["mobile", Smartphone, "Móvil"],
            ] as const).map(([id, Icon, label]) => (
              <button
                key={id}
                type="button"
                title={label}
                onClick={() => onDeviceChange(id)}
                className={cn(
                  "rounded-md p-2 transition",
                  device === id ? "bg-primary text-inverse" : "text-muted hover:bg-background-soft"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </button>
            ))}
          </div>

          <Button type="button" variant="ghost" size="sm" onClick={onUndo} disabled={!canUndo}>
            <Undo2 className="h-4 w-4" aria-hidden />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onRedo} disabled={!canRedo}>
            <Redo2 className="h-4 w-4" aria-hidden />
          </Button>

          <Button
            type="button"
            variant={historyOpen ? "primary" : "outline"}
            size="sm"
            onClick={onToggleHistory}
          >
            Historial
          </Button>

          <Button type="button" variant="outline" size="sm" onClick={onExport}>
            <Download className="mr-1 h-4 w-4" aria-hidden />
            Exportar
          </Button>

          <label className="inline-flex cursor-pointer">
            <input
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImport(file);
                e.currentTarget.value = "";
              }}
            />
            <span className="inline-flex h-9 items-center rounded-md border border-border px-3 text-sm font-medium text-foreground hover:bg-background-soft">
              <Upload className="mr-1 h-4 w-4" aria-hidden />
              Importar
            </span>
          </label>

          <a
            href={siteHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground hover:bg-background-soft"
          >
            <ExternalLink className="mr-1 h-4 w-4" aria-hidden />
            Ver sitio
          </a>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={saving || !isDirty}
            onClick={() => onSave(false)}
          >
            <Save className="mr-1 h-4 w-4" aria-hidden />
            Guardar
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={saving || !isDirty}
            onClick={() => onSave(true)}
          >
            Publicar
          </Button>
        </div>
      </div>
    </header>
  );
}
