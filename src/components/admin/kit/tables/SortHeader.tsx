import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { SortDirection } from "@/components/admin/kit/utils/types";

export interface SortHeaderProps {
  label: string;
  columnId: string;
  activeColumnId?: string;
  direction?: SortDirection;
  onSort?: (columnId: string) => void;
  className?: string;
}

/** Cabecera de columna ordenable. */
export function SortHeader({
  label,
  columnId,
  activeColumnId,
  direction = "asc",
  onSort,
  className,
}: SortHeaderProps) {
  const active = activeColumnId === columnId;
  const Icon = !active ? ArrowUpDown : direction === "asc" ? ArrowUp : ArrowDown;

  if (!onSort) {
    return <span className={className}>{label}</span>;
  }

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-1 text-left text-xs font-bold uppercase tracking-wide text-muted hover:text-foreground",
        className
      )}
      onClick={() => onSort(columnId)}
      aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}
    >
      {label}
      <Icon className="h-3.5 w-3.5" aria-hidden />
    </button>
  );
}
