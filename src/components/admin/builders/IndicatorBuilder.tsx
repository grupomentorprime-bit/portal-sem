"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import type { CmsIndicatorItem } from "@/types/cms-shared";
import { BuilderShell, createCmsId, reorderBuilderItems } from "./BuilderShell";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

interface IndicatorBuilderProps {
  items: CmsIndicatorItem[];
  onChange: (items: CmsIndicatorItem[]) => void;
}

export function IndicatorBuilder({ items, onChange }: IndicatorBuilderProps) {
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);
  const selected = items.find((i) => i.id === selectedId) ?? items[0];

  const update = (patch: Partial<CmsIndicatorItem>) => {
    if (!selected) return;
    onChange(items.map((i) => (i.id === selected.id ? { ...i, ...patch } : i)));
  };

  return (
    <BuilderShell
      items={items.map((i) => ({ id: i.id, label: i.value, subtitle: i.label }))}
      selectedId={selected?.id ?? null}
      onSelect={setSelectedId}
      onReorder={(from, to) => onChange(reorderBuilderItems(items, from, to))}
      onAdd={() => {
        const id = createCmsId("ind");
        onChange([...items, { id, value: "100%", label: "Nuevo indicador" }]);
        setSelectedId(id);
      }}
      addLabel="Agregar indicador"
      onRemove={(id) => {
        onChange(items.filter((i) => i.id !== id));
        setSelectedId(null);
      }}
    >
      {selected ? (
        <div className="space-y-4">
          <Field label="Valor">
            <Input value={selected.value} onChange={(e) => update({ value: e.target.value })} />
          </Field>
          <Field label="Texto">
            <Input value={selected.label} onChange={(e) => update({ label: e.target.value })} />
          </Field>
          <Field label="Icono (Lucide)">
            <Input
              value={selected.icon ?? ""}
              onChange={(e) => update({ icon: e.target.value })}
              placeholder="Award"
            />
          </Field>
          <Field label="Enlace (opcional)">
            <Input value={selected.link ?? ""} onChange={(e) => update({ link: e.target.value })} />
          </Field>
        </div>
      ) : (
        <p className="text-sm text-muted">Agregue un indicador para comenzar.</p>
      )}
    </BuilderShell>
  );
}
