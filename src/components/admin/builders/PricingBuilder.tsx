"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { CmsPricingItem } from "@/types/cms-shared";
import { BuilderShell, createCmsId, reorderBuilderItems } from "./BuilderShell";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

interface PricingBuilderProps {
  items: CmsPricingItem[];
  onChange: (items: CmsPricingItem[]) => void;
}

export function PricingBuilder({ items, onChange }: PricingBuilderProps) {
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);
  const selected = items.find((i) => i.id === selectedId) ?? items[0];

  const update = (patch: Partial<CmsPricingItem>) => {
    if (!selected) return;
    onChange(items.map((i) => (i.id === selected.id ? { ...i, ...patch } : i)));
  };

  return (
    <BuilderShell
      items={items.map((i) => ({ id: i.id, label: i.name, subtitle: i.price }))}
      selectedId={selected?.id ?? null}
      onSelect={setSelectedId}
      onReorder={(from, to) => onChange(reorderBuilderItems(items, from, to))}
      onAdd={() => {
        const id = createCmsId("price");
        onChange([...items, { id, name: "Nuevo plan", price: "$0", description: "" }]);
        setSelectedId(id);
      }}
      addLabel="Agregar plan"
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
          <Field label="Precio">
            <Input value={selected.price} onChange={(e) => update({ price: e.target.value })} />
          </Field>
          <Field label="Descripción">
            <Textarea
              rows={2}
              value={selected.description ?? ""}
              onChange={(e) => update({ description: e.target.value })}
            />
          </Field>
          <Field label="Nota">
            <Input value={selected.note ?? ""} onChange={(e) => update({ note: e.target.value })} />
          </Field>
          <Field label="Icono">
            <Input value={selected.icon ?? ""} onChange={(e) => update({ icon: e.target.value })} />
          </Field>
          <Field label="Texto del botón">
            <Input
              value={selected.buttonText ?? ""}
              onChange={(e) => update({ buttonText: e.target.value })}
            />
          </Field>
          <Field label="URL del botón">
            <Input
              value={selected.buttonUrl ?? ""}
              onChange={(e) => update({ buttonUrl: e.target.value })}
            />
          </Field>
          <Switch
            checked={Boolean(selected.highlighted)}
            onChange={(highlighted) => update({ highlighted })}
            label="Destacado"
          />
        </div>
      ) : (
        <p className="text-sm text-muted">Agregue un plan para comenzar.</p>
      )}
    </BuilderShell>
  );
}
