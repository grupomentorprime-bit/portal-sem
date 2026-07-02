"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ContentDocument } from "@/types/content";

interface AdmissionSecondaryProgramsPickerProps {
  tenant: string;
  selectedIds: string[];
  maxVisible: number;
  onChange: (ids: string[]) => void;
}

export function AdmissionSecondaryProgramsPicker({
  tenant,
  selectedIds,
  maxVisible,
  onChange,
}: AdmissionSecondaryProgramsPickerProps) {
  const [programs, setPrograms] = useState<ContentDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/cms/content-query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenant,
            collection: "academy_programs",
            pagination: { page: 1, limit: 100 },
            preview: true,
            mapItems: false,
          }),
        });
        const data = await res.json();
        if (!cancelled && data.ok) {
          setPrograms(data.items ?? []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tenant]);

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
      return;
    }
    if (selectedIds.length >= maxVisible) return;
    onChange([...selectedIds, id]);
  };

  if (loading) {
    return <p className="text-sm text-muted">Cargando programas…</p>;
  }

  if (programs.length === 0) {
    return (
      <p className="text-sm text-muted">
        Sin programas en el catálogo.{" "}
        <Link href="/admin/content/programs" className="font-medium text-primary underline">
          Crear programas
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">
        Seleccione hasta {maxVisible} programas secundarios. Si no elige ninguno, se muestran
        automáticamente los siguientes al destacado.
      </p>
      <ul className="space-y-2" role="list">
        {programs.map((program) => {
          const selected = selectedIds.includes(program._id);
          const disabled = !selected && selectedIds.length >= maxVisible;
          return (
            <li key={program._id}>
              <button
                type="button"
                onClick={() => toggle(program._id)}
                disabled={disabled}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition",
                  selected
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border bg-background text-foreground hover:border-primary/30",
                  disabled && "cursor-not-allowed opacity-50"
                )}
              >
                <span className="font-medium">{program.title ?? program.slug}</span>
                <span className="shrink-0 text-xs text-muted">
                  {selected ? "Seleccionado" : program.status ?? "—"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
