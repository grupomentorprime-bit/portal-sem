"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Select } from "@/components/ui/select";
import type { ContentDocument } from "@/types/content";

interface AdmissionProgramPickerProps {
  tenant: string;
  label: string;
  value: string;
  onChange: (programId: string) => void;
  placeholder?: string;
  allowEmpty?: boolean;
}

export function AdmissionProgramPicker({
  tenant,
  label,
  value,
  onChange,
  placeholder = "Seleccionar programa…",
  allowEmpty = true,
}: AdmissionProgramPickerProps) {
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

  const options = [
    ...(allowEmpty ? [{ value: "", label: placeholder }] : []),
    ...programs.map((program) => ({
      value: program._id,
      label: program.title ?? program.slug ?? program._id,
    })),
  ];

  return (
    <div className="space-y-2">
      <Select
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        options={options}
        disabled={loading}
      />
      {loading ? (
        <p className="text-xs text-muted">Cargando catálogo de programas…</p>
      ) : programs.length === 0 ? (
        <p className="text-xs text-muted">
          No hay programas publicados.{" "}
          <Link href="/admin/content/programs" className="font-medium text-primary underline">
            Crear en Programas y cursos
          </Link>
        </p>
      ) : (
        <p className="text-xs text-muted">
          {programs.length} programa{programs.length === 1 ? "" : "s"} disponible
          {programs.length === 1 ? "" : "s"}.{" "}
          <Link href="/admin/content/programs" className="font-medium text-primary underline">
            Gestionar catálogo
          </Link>
        </p>
      )}
    </div>
  );
}
