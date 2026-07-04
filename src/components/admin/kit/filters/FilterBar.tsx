import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { SearchBar } from "@/components/admin/kit/search/SearchBar";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface FilterBarProps {
  search?: {
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
  };
  filters?: ReactNode;
  onReset?: () => void;
  className?: string;
}

/** Barra de filtros + búsqueda + reset. */
export function FilterBar({ search, filters, onReset, className }: FilterBarProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {search ? (
        <SearchBar
          placeholder={search.placeholder}
          value={search.value}
          onChange={search.onChange}
          className="min-w-[200px] flex-1"
        />
      ) : null}
      {filters}
      {onReset ? (
        <Button type="button" variant="outline" size="sm" onClick={onReset}>
          Limpiar
        </Button>
      ) : null}
    </div>
  );
}

export { Select as FilterSelect };
