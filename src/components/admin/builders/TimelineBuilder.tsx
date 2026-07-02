"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import type { CmsTimelineItem } from "@/types/cms-shared";
import { BuilderShell, createCmsId, reorderBuilderItems } from "./BuilderShell";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

interface TimelineBuilderProps {
  items: CmsTimelineItem[];
  onChange: (items: CmsTimelineItem[]) => void;
}

export function TimelineBuilder({ items, onChange }: TimelineBuilderProps) {
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);
  const selected = items.find((i) => i.id === selectedId) ?? items[0];

  const update = (patch: Partial<CmsTimelineItem>) => {
    if (!selected) return;
    onChange(items.map((i) => (i.id === selected.id ? { ...i, ...patch } : i)));
  };

  return (
    <BuilderShell
      items={items.map((i) => ({ id: i.id, label: `${i.step}. ${i.title}` }))}
      selectedId={selected?.id ?? null}
      onSelect={setSelectedId}
      onReorder={(from, to) => {
        const reordered = reorderBuilderItems(items, from, to).map((item, index) => ({
          ...item,
          step: index + 1,
        }));
        onChange(reordered);
      }}
      onAdd={() => {
        const id = createCmsId("step");
        onChange([
          ...items,
          {
            id,
            step: items.length + 1,
            title: "Nuevo paso",
            description: "",
            status: "upcoming",
          },
        ]);
        setSelectedId(id);
      }}
      addLabel="Agregar paso"
      onRemove={(id) => {
        onChange(
          items
            .filter((i) => i.id !== id)
            .map((item, index) => ({ ...item, step: index + 1 }))
        );
        setSelectedId(null);
      }}
    >
      {selected ? (
        <div className="space-y-4">
          <Field label="Título">
            <Input value={selected.title} onChange={(e) => update({ title: e.target.value })} />
          </Field>
          <Field label="Descripción">
            <Textarea
              rows={3}
              value={selected.description}
              onChange={(e) => update({ description: e.target.value })}
            />
          </Field>
          <Field label="Icono">
            <Input value={selected.icon ?? ""} onChange={(e) => update({ icon: e.target.value })} />
          </Field>
          <Field label="Color">
            <Input value={selected.color ?? ""} onChange={(e) => update({ color: e.target.value })} />
          </Field>
          <Field label="Estado">
            <Select
              value={selected.status ?? "upcoming"}
              onChange={(e) =>
                update({ status: e.target.value as CmsTimelineItem["status"] })
              }
              options={[
                { value: "completed", label: "Completado" },
                { value: "active", label: "Activo" },
                { value: "upcoming", label: "Próximo" },
                { value: "pending", label: "Pendiente" },
              ]}
            />
          </Field>
        </div>
      ) : (
        <p className="text-sm text-muted">Agregue un paso para comenzar.</p>
      )}
    </BuilderShell>
  );
}
