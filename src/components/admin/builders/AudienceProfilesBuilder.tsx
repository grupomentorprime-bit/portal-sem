"use client";

import { useState } from "react";
import { BlockIcon } from "@/components/portal/BlockIcon";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { AudienceProfileItem } from "@/components/portal/home/audience";
import { programIconOptions } from "@/types/content";
import { BuilderShell, createCmsId, reorderBuilderItems } from "./BuilderShell";

const COMMON_LINK_OPTIONS = [
  { value: "/admision", label: "Admisión" },
  { value: "/programas", label: "Programas" },
  { value: "/programas?perfil=pastores", label: "Programas — Pastores" },
  { value: "/programas?perfil=hermanos", label: "Programas — Hermanos(as)" },
  { value: "/programas?perfil=lideres", label: "Programas — Líderes" },
];

function linkOptions(current?: string) {
  const trimmed = current?.trim();
  if (trimmed && !COMMON_LINK_OPTIONS.some((option) => option.value === trimmed)) {
    return [{ value: trimmed, label: trimmed }, ...COMMON_LINK_OPTIONS];
  }
  return COMMON_LINK_OPTIONS;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

interface AudienceProfilesBuilderProps {
  items: AudienceProfileItem[];
  onChange: (items: AudienceProfileItem[]) => void;
}

export function AudienceProfilesBuilder({ items, onChange }: AudienceProfilesBuilderProps) {
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);
  const selected = items.find((item) => item.id === selectedId) ?? items[0];

  const update = (patch: Partial<AudienceProfileItem>) => {
    if (!selected) return;
    onChange(items.map((item) => (item.id === selected.id ? { ...item, ...patch } : item)));
  };

  const setFeatured = (featured: boolean) => {
    if (!selected) return;
    if (!featured) {
      update({ featured: false });
      return;
    }
    onChange(
      items.map((item) =>
        item.id === selected.id ? { ...item, featured: true } : { ...item, featured: false }
      )
    );
  };

  return (
    <BuilderShell
      items={items.map((item) => ({
        id: item.id,
        label: item.title,
        subtitle: item.featured ? "Destacado" : undefined,
      }))}
      selectedId={selected?.id ?? null}
      onSelect={setSelectedId}
      onReorder={(from, to) => onChange(reorderBuilderItems(items, from, to))}
      onAdd={() => {
        const id = createCmsId("profile");
        onChange([
          ...items,
          {
            id,
            title: "Nuevo perfil",
            description: "",
            icon: "BookOpen",
            href: "",
            visible: true,
            featured: false,
          },
        ]);
        setSelectedId(id);
      }}
      onRemove={(id) => {
        onChange(items.filter((item) => item.id !== id));
        setSelectedId(null);
      }}
      addLabel="Agregar perfil"
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
            <Select
              value={selected.icon ?? "BookOpen"}
              onChange={(e) => update({ icon: e.target.value })}
              options={programIconOptions(selected.icon)}
            />
            <p className="mt-1 flex items-center gap-2 text-xs text-muted">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-background-soft">
                <BlockIcon name={selected.icon} className="h-3.5 w-3.5 text-secondary" aria-hidden />
              </span>
              Vista previa
            </p>
          </Field>
          <Field label="Enlace">
            <Select
              value={selected.href ?? ""}
              onChange={(e) => update({ href: e.target.value })}
              placeholder="Seleccionar…"
              options={linkOptions(selected.href)}
            />
          </Field>
          <Switch
            label="Visible en el portal"
            checked={selected.visible !== false}
            onChange={(checked) => update({ visible: checked })}
          />
          <Switch
            label="Tarjeta destacada"
            checked={selected.featured === true}
            onChange={setFeatured}
          />
        </div>
      ) : (
        <p className="text-sm text-muted">Agrega un perfil para comenzar.</p>
      )}
    </BuilderShell>
  );
}
