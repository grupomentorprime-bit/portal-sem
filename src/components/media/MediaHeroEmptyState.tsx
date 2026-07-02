"use client";

import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MediaHeroEmptyStateProps {
  onUploadClick?: () => void;
  compact?: boolean;
}

export function MediaHeroEmptyState({ onUploadClick, compact }: MediaHeroEmptyStateProps) {
  return (
    <div
      className={`rounded-lg border border-dashed border-border bg-muted/20 text-center ${
        compact ? "p-6" : "p-10"
      }`}
    >
      <Upload className="mx-auto h-10 w-10 text-muted" strokeWidth={1.5} />
      <p className="mt-4 text-base font-medium text-foreground">
        No existen imágenes para el Hero.
      </p>
      <div className="mx-auto mt-3 max-w-sm space-y-1 text-sm text-muted">
        <p>
          <span className="font-medium text-foreground">Resolución recomendada:</span> 1920×900 px
        </p>
        <p>
          <span className="font-medium text-foreground">Formato:</span> JPG / WEBP
        </p>
        <p>
          <span className="font-medium text-foreground">Peso máximo:</span> 1 MB
        </p>
        <p>
          <span className="font-medium text-foreground">Relación:</span> 16:9
        </p>
      </div>
      {onUploadClick ? (
        <Button type="button" className="mt-6" onClick={onUploadClick}>
          Subir imágenes
        </Button>
      ) : (
        <label className="mt-6 inline-block cursor-pointer">
          <input
            type="file"
            multiple
            accept=".jpg,.jpeg,.webp"
            className="hidden"
            id="hero-empty-upload"
          />
          <span className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-text-inverse">
            Subir imágenes
          </span>
        </label>
      )}
    </div>
  );
}
