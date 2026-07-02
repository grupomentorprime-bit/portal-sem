"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { CmsDocumentItem } from "@/types/cms-shared";
import { BuilderShell, createCmsId, reorderBuilderItems } from "./BuilderShell";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

interface DocumentBuilderProps {
  items: CmsDocumentItem[];
  onChange: (items: CmsDocumentItem[]) => void;
}

export function DocumentBuilder({ items, onChange }: DocumentBuilderProps) {
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);
  const selected = items.find((i) => i.id === selectedId) ?? items[0];

  const update = (patch: Partial<CmsDocumentItem>) => {
    if (!selected) return;
    onChange(items.map((i) => (i.id === selected.id ? { ...i, ...patch } : i)));
  };

  return (
    <BuilderShell
      items={items.map((i) => ({ id: i.id, label: i.name }))}
      selectedId={selected?.id ?? null}
      onSelect={setSelectedId}
      onReorder={(from, to) => onChange(reorderBuilderItems(items, from, to))}
      onAdd={() => {
        const id = createCmsId("doc");
        onChange([...items, { id, name: "Nuevo documento", description: "", required: true }]);
        setSelectedId(id);
      }}
      addLabel="Agregar documento"
      onRemove={(id) => {
        onChange(items.filter((i) => i.id !== id));
        setSelectedId(null);
      }}
    >
      {selected ? (
        <div className="space-y-4">
          <Field label="Nombre">
            <Input value={selected.name} onChange={(e) => update({ name: e.target.value })} />
          </Field>
          <Field label="Descripción">
            <Textarea
              rows={2}
              value={selected.description ?? ""}
              onChange={(e) => update({ description: e.target.value })}
            />
          </Field>
          <Field label="Icono">
            <Input value={selected.icon ?? ""} onChange={(e) => update({ icon: e.target.value })} />
          </Field>
          <Switch
            checked={selected.required}
            onChange={(required) => update({ required })}
            label="Obligatorio"
          />
        </div>
      ) : (
        <p className="text-sm text-muted">Agregue un documento para comenzar.</p>
      )}
    </BuilderShell>
  );
}
