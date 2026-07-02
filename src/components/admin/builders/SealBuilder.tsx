"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { MediaField } from "@/components/media/MediaPicker";
import { Select } from "@/components/ui/select";
import type { CmsSealItem } from "@/types/cms-shared";
import { BuilderShell, createCmsId, reorderBuilderItems } from "./BuilderShell";

const INSTITUTIONAL_SEALS = [
  { value: "", label: "— Ninguno (usar imagen) —" },
  { value: "formacion-biblica", label: "Formación bíblica" },
  { value: "cien-online", label: "100% Online" },
  { value: "respaldo-institucional", label: "Respaldo institucional" },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

interface SealBuilderProps {
  items: CmsSealItem[];
  tenant: string;
  onChange: (items: CmsSealItem[]) => void;
}

export function SealBuilder({ items, tenant, onChange }: SealBuilderProps) {
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);
  const selected = items.find((i) => i.id === selectedId) ?? items[0];

  const update = (patch: Partial<CmsSealItem>) => {
    if (!selected) return;
    onChange(items.map((i) => (i.id === selected.id ? { ...i, ...patch } : i)));
  };

  return (
    <BuilderShell
      items={items.map((i) => ({ id: i.id, label: i.label ?? "Sello", subtitle: i.assetId ?? i.imageMediaId }))}
      selectedId={selected?.id ?? null}
      onSelect={setSelectedId}
      onReorder={(from, to) => onChange(reorderBuilderItems(items, from, to))}
      onAdd={() => {
        const id = createCmsId("seal");
        onChange([...items, { id, label: "Nuevo sello" }]);
        setSelectedId(id);
      }}
      addLabel="Agregar sello"
      onRemove={(id) => {
        onChange(items.filter((i) => i.id !== id));
        setSelectedId(null);
      }}
    >
      {selected ? (
        <div className="space-y-4">
          <Field label="Etiqueta (alt)">
            <Input
              value={selected.label ?? ""}
              onChange={(e) => update({ label: e.target.value })}
            />
          </Field>
          <Select
            label="Sello institucional"
            value={selected.assetId ?? ""}
            onChange={(e) =>
              update({
                assetId: e.target.value || undefined,
                imageMediaId: e.target.value ? undefined : selected.imageMediaId,
              })
            }
            options={INSTITUTIONAL_SEALS}
          />
          {!selected.assetId ? (
            <MediaField
              label="Imagen personalizada"
              description="Biblioteca de Medios — reemplaza sello institucional."
              tenant={tenant}
              folder="Logos"
              value={selected.imageMediaId ?? ""}
              onChange={(imageMediaId) => update({ imageMediaId, assetId: undefined })}
            />
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted">Agregue un sello para comenzar.</p>
      )}
    </BuilderShell>
  );
}
