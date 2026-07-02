"use client";

import { Button } from "@/components/ui/button";
import type { PageVersion } from "@/types/page";

interface StudioHistoryPanelProps {
  versions: PageVersion[];
  onRestore: (index: number) => void;
  onClose: () => void;
}

function formatTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function StudioHistoryPanel({ versions, onRestore, onClose }: StudioHistoryPanelProps) {
  return (
    <aside className="border-b border-border bg-background px-4 py-3 lg:border-b-0 lg:border-l">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Historial de versiones</h2>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Cerrar
        </Button>
      </div>
      {versions.length === 0 ? (
        <p className="text-sm text-muted">
          Aún no hay versiones guardadas. Publica la página para crear la primera instantánea.
        </p>
      ) : (
        <ol className="space-y-3">
          {versions.map((version, index) => (
            <li key={`${version.savedAt}-${index}`} className="studio-history__item">
              <p className="text-sm font-medium text-foreground">{formatTime(version.savedAt)}</p>
              <p className="text-xs text-muted">
                {version.title} · {version.blocks.length} bloques
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => onRestore(index)}
              >
                Restaurar
              </Button>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}
