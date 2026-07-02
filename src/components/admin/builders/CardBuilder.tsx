"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MediaField } from "@/components/media/MediaPicker";
import type { CmsCardItem } from "@/types/cms-shared";
import { BuilderShell, createCmsId, reorderBuilderItems } from "./BuilderShell";

interface CardBuilderProps {
  items: CmsCardItem[];
  tenant: string;
  onChange: (items: CmsCardItem[]) => void;
  addLabel?: string;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

export function CardBuilder({ items, tenant, onChange, addLabel = "Agregar tarjeta" }: CardBuilderProps) {
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);
  const selected = items.find((i) => i.id === selectedId) ?? items[0];

  const update = (patch: Partial<CmsCardItem>) => {
    if (!selected) return;
    onChange(items.map((i) => (i.id === selected.id ? { ...i, ...patch } : i)));
  };

  return (
    <BuilderShell
      items={items.map((i) => ({ id: i.id, label: i.title, subtitle: i.subtitle }))}
      selectedId={selected?.id ?? null}
      onSelect={setSelectedId}
      onReorder={(from, to) => onChange(reorderBuilderItems(items, from, to))}
      onAdd={() => {
        const id = createCmsId("card");
        onChange([...items, { id, title: "Nueva tarjeta", description: "" }]);
        setSelectedId(id);
      }}
      onRemove={(id) => {
        onChange(items.filter((i) => i.id !== id));
        setSelectedId(null);
      }}
      addLabel={addLabel}
    >
      {selected ? (
        <div className="space-y-4">
          <Field label="Título">
            <Input value={selected.title} onChange={(e) => update({ title: e.target.value })} />
          </Field>
          <Field label="Subtítulo">
            <Input
              value={selected.subtitle ?? ""}
              onChange={(e) => update({ subtitle: e.target.value })}
            />
          </Field>
          <Field label="Descripción">
            <Textarea
              rows={3}
              value={selected.description ?? ""}
              onChange={(e) => update({ description: e.target.value })}
            />
          </Field>
          <Field label="Icono (Lucide)">
            <Input
              value={selected.icon ?? ""}
              onChange={(e) => update({ icon: e.target.value })}
              placeholder="Users"
            />
          </Field>
          <MediaField
            label="Imagen"
            tenant={tenant}
            folder="Galería"
            value={selected.imageMediaId ?? ""}
            onChange={(mediaId) => update({ imageMediaId: mediaId })}
          />
          <Field label="Enlace">
            <Input value={selected.link ?? ""} onChange={(e) => update({ link: e.target.value })} />
          </Field>
          <Field label="Texto del botón">
            <Input
              value={selected.buttonText ?? ""}
              onChange={(e) => update({ buttonText: e.target.value })}
            />
          </Field>
          <Field label="Color">
            <Input value={selected.color ?? ""} onChange={(e) => update({ color: e.target.value })} />
          </Field>
        </div>
      ) : (
        <p className="text-sm text-muted">Agregue una tarjeta para comenzar.</p>
      )}
    </BuilderShell>
  );
}
