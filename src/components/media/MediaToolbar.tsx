"use client";

import { Button } from "@/components/ui/button";
import { Grid3X3, List, Trash2 } from "lucide-react";

interface MediaToolbarProps {
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
  total: number;
  selectedCount?: number;
  onTrashSelected?: () => void;
  showTrash?: boolean;
}

export function MediaToolbar({
  view,
  onViewChange,
  total,
  selectedCount = 0,
  onTrashSelected,
  showTrash,
}: MediaToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted">{total} archivos</p>
      <div className="flex items-center gap-2">
        {showTrash && selectedCount > 0 && onTrashSelected ? (
          <Button type="button" variant="outline" size="sm" onClick={onTrashSelected}>
            <Trash2 className="mr-1 h-4 w-4" />
            Papelera ({selectedCount})
          </Button>
        ) : null}
        <Button
          type="button"
          variant={view === "grid" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onViewChange("grid")}
          aria-label="Vista cuadrícula"
        >
          <Grid3X3 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={view === "list" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onViewChange("list")}
          aria-label="Vista lista"
        >
          <List className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
