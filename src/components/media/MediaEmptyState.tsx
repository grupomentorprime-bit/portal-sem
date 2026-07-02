"use client";

import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFolderHint } from "@/lib/cms/media-folder-hints";

interface MediaEmptyStateProps {
  folder?: string;
  onUpload?: () => void;
  uploading?: boolean;
  embedded?: boolean;
}

export function MediaEmptyState({
  folder,
  onUpload,
  uploading,
  embedded,
}: MediaEmptyStateProps) {
  const hint = getFolderHint(folder);
  const uploadLabel =
    folder === "Documentos" ? "Subir documentos" : folder === "Hero" ? "Subir imágenes" : "Subir archivos";

  return (
    <div
      className={`media-empty-state text-center ${embedded ? "rounded-lg border border-dashed border-border bg-muted/10 p-8" : "rounded-xl border-2 border-dashed border-border bg-muted/20 p-10"}`}
      role="status"
    >
      <Upload className="mx-auto h-10 w-10 text-muted" strokeWidth={1.5} aria-hidden />
      <p className="mt-4 text-lg font-semibold text-foreground">{hint.title}</p>
      <div className="mx-auto mt-4 max-w-md space-y-1 text-left text-sm text-muted">
        <p className="text-center font-medium text-foreground">Recomendaciones:</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          {hint.recommendations.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
      {onUpload ? (
        <Button
          type="button"
          className="mt-6 min-h-11"
          loading={uploading}
          onClick={onUpload}
          aria-label={`Subir archivos a ${folder ?? "biblioteca"}`}
        >
          <Upload size={18} className="mr-2" aria-hidden />
          {uploading ? "Procesando…" : uploadLabel}
        </Button>
      ) : null}
    </div>
  );
}
