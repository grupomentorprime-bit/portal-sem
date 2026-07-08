"use client";

import { Input } from "@/components/ui/input";
import { aek } from "@/components/admin/kit/utils/tokens";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

export interface SearchBarProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

/** Búsqueda contextual con debounce opcional. */
export function SearchBar({
  value,
  defaultValue = "",
  onChange,
  placeholder = "Buscar…",
  debounceMs = 300,
  className,
}: SearchBarProps) {
  const isControlled = value !== undefined;
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const query = isControlled ? value : uncontrolled;

  useEffect(() => {
    if (!onChange) return;
    const t = setTimeout(() => onChange(query), debounceMs);
    return () => clearTimeout(t);
  }, [query, debounceMs, onChange]);

  return (
    <div className={cn("relative max-w-md", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <Input
        value={query}
        onChange={(e) => {
          const next = e.target.value;
          if (!isControlled) setUncontrolled(next);
        }}
        placeholder={placeholder}
        className="pl-9 pr-9"
      />
      {query ? (
        <button
          type="button"
          className={cn("absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-foreground", aek.focus)}
          onClick={() => {
            if (!isControlled) setUncontrolled("");
            onChange?.("");
          }}
          aria-label="Limpiar búsqueda"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
