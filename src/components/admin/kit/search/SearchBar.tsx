"use client";

import { Input } from "@/components/ui/input";
import { aek } from "@/components/admin/kit/utils/tokens";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
  const [inner, setInner] = useState(value ?? defaultValue);
  const onChangeRef = useRef(onChange);
  const lastEmittedRef = useRef(value ?? defaultValue);

  onChangeRef.current = onChange;

  useEffect(() => {
    if (value === undefined) return;
    if (value === lastEmittedRef.current) return;
    lastEmittedRef.current = value;
    setInner(value);
  }, [value]);

  useEffect(() => {
    const cb = onChangeRef.current;
    if (!cb) return;
    if (inner === lastEmittedRef.current) return;
    const t = window.setTimeout(() => {
      lastEmittedRef.current = inner;
      cb(inner);
    }, debounceMs);
    return () => window.clearTimeout(t);
  }, [inner, debounceMs]);

  const clear = () => {
    setInner("");
    lastEmittedRef.current = "";
    onChangeRef.current?.("");
  };

  return (
    <div className={cn("relative max-w-md", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <Input
        value={inner}
        onChange={(event) => setInner(event.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-9"
        autoComplete="off"
        type="search"
      />
      {inner ? (
        <button
          type="button"
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-foreground",
            aek.focus
          )}
          onClick={clear}
          aria-label="Limpiar búsqueda"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
