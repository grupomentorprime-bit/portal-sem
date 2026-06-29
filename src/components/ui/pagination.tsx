import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { focusRing } from "./shared";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav aria-label="Paginación" className={className}>
      <ul className="flex items-center gap-1">
        <li>
          <button
            type="button"
            aria-label="Página anterior"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-border text-muted transition-colors hover:bg-background-muted disabled:cursor-not-allowed disabled:opacity-50",
              focusRing
            )}
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          </button>
        </li>
        {pages.map((page) => (
          <li key={page}>
            <button
              type="button"
              aria-label={`Página ${page}`}
              aria-current={page === currentPage ? "page" : undefined}
              onClick={() => onPageChange(page)}
              className={cn(
                "inline-flex h-9 min-w-9 items-center justify-center rounded-[var(--radius-md)] px-2 text-sm font-medium transition-colors",
                focusRing,
                page === currentPage
                  ? "bg-primary text-text-inverse"
                  : "border border-border text-muted hover:bg-background-muted"
              )}
            >
              {page}
            </button>
          </li>
        ))}
        <li>
          <button
            type="button"
            aria-label="Página siguiente"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-border text-muted transition-colors hover:bg-background-muted disabled:cursor-not-allowed disabled:opacity-50",
              focusRing
            )}
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </button>
        </li>
      </ul>
    </nav>
  );
}
