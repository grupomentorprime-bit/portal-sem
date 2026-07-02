"use client";

import { Button } from "@/components/ui/button";
import { Grid3X3, List, Upload } from "lucide-react";
import type { MediaDropzoneHandle } from "./MediaDropzone";

interface MediaToolbarProps {
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
  total: number;
  dropzoneRef?: React.RefObject<MediaDropzoneHandle | null>;
  showUpload?: boolean;
}

export function MediaToolbar({
  view,
  onViewChange,
  total,
  dropzoneRef,
  showUpload,
}: MediaToolbarProps) {
  return (
    <div className="media-toolbar flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted" aria-live="polite">
        {total} archivo{total === 1 ? "" : "s"}
      </p>
      <div className="flex items-center gap-2">
        {showUpload && dropzoneRef ? (
          <Button
            type="button"
            size="sm"
            onClick={() => dropzoneRef.current?.openFileDialog()}
            aria-label="Subir archivos"
            className="min-h-10"
          >
            <Upload className="mr-1.5 h-4 w-4" aria-hidden />
            Subir
          </Button>
        ) : null}
        <Button
          type="button"
          variant={view === "grid" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onViewChange("grid")}
          aria-label="Vista cuadrícula"
          aria-pressed={view === "grid"}
          className="min-h-10 min-w-10"
        >
          <Grid3X3 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={view === "list" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onViewChange("list")}
          aria-label="Vista lista"
          aria-pressed={view === "list"}
          className="min-h-10 min-w-10"
        >
          <List className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
