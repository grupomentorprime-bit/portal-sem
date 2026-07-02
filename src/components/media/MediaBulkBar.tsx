"use client";

import { Copy, FolderInput, Power, PowerOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { MEDIA_FOLDERS, type MediaFolder } from "@/types/media";

interface MediaBulkBarProps {
  count: number;
  onTrash: () => void;
  onDuplicate: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onMove: (folder: MediaFolder) => void;
  loading?: boolean;
}

export function MediaBulkBar({
  count,
  onTrash,
  onDuplicate,
  onActivate,
  onDeactivate,
  onMove,
  loading,
}: MediaBulkBarProps) {
  if (count === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-secondary/30 bg-secondary/5 px-4 py-3">
      <span className="text-sm font-medium text-foreground">{count} seleccionado(s)</span>
      <Button type="button" size="sm" variant="outline" loading={loading} onClick={onDuplicate}>
        <Copy size={14} className="mr-1" />
        Duplicar
      </Button>
      <Button type="button" size="sm" variant="outline" loading={loading} onClick={onActivate}>
        <Power size={14} className="mr-1" />
        Activar
      </Button>
      <Button type="button" size="sm" variant="outline" loading={loading} onClick={onDeactivate}>
        <PowerOff size={14} className="mr-1" />
        Desactivar
      </Button>
      <div className="flex items-center gap-2">
        <Select
          label=""
          placeholder="Mover a…"
          className="h-8 min-w-[8rem] text-xs"
          onChange={(e) => {
            const folder = e.target.value as MediaFolder;
            if (folder) onMove(folder);
          }}
          options={MEDIA_FOLDERS.map((f) => ({ value: f, label: f }))}
        />
        <FolderInput size={16} className="text-muted" aria-hidden />
      </div>
      <Button type="button" size="sm" variant="danger" loading={loading} onClick={onTrash}>
        <Trash2 size={14} className="mr-1" />
        Papelera
      </Button>
    </div>
  );
}
