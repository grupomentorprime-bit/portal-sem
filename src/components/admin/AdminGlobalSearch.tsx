"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { ADMIN_SEARCH_CATEGORIES } from "@/lib/admin/institutional";
import { cn } from "@/lib/utils";

interface AdminGlobalSearchProps {
  className?: string;
}

export function AdminGlobalSearch({ className }: AdminGlobalSearchProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const filtered = ADMIN_SEARCH_CATEGORIES.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "hidden items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-muted transition hover:bg-background-muted xl:inline-flex",
          className
        )}
      >
        <Search className="h-4 w-4" />
        <span>Buscar</span>
        <kbd className="rounded border border-border px-1.5 text-[10px]">⌘K</kbd>
      </button>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex rounded-lg border border-border p-2 text-muted xl:hidden"
        aria-label="Buscar"
      >
        <Search className="h-4 w-4" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[60] flex items-start justify-center bg-primary/30 p-4 pt-[12vh]">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Cerrar búsqueda"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-xl rounded-xl border border-border bg-background shadow-[var(--shadow-xl)]">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Search className="h-4 w-4 text-muted" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar noticias, personas, programas, usuarios…"
                className="flex-1 bg-transparent text-sm outline-none"
              />
              <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar">
                <X className="h-4 w-4 text-muted" />
              </button>
            </div>
            <ul className="max-h-80 overflow-y-auto p-2">
              {filtered.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="flex w-full rounded-lg px-3 py-2.5 text-left text-sm hover:bg-background-muted"
                    onClick={() => {
                      setOpen(false);
                      router.push(item.href);
                    }}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
              {filtered.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-muted">
                  Sin resultados. Prueba con otra palabra clave.
                </li>
              ) : null}
            </ul>
            <p className="border-t border-border px-4 py-2 text-xs text-muted">
              Acceso rápido a secciones del CMS. La búsqueda de contenido llegará en la siguiente fase.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
