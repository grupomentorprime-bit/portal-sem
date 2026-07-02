"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { CmsFaqItem } from "@/types/cms-shared";
import { BuilderShell, createCmsId, reorderBuilderItems } from "./BuilderShell";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

interface FAQBuilderProps {
  items: CmsFaqItem[];
  onChange: (items: CmsFaqItem[]) => void;
}

export function FAQBuilder({ items, onChange }: FAQBuilderProps) {
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);
  const selected = items.find((i) => i.id === selectedId) ?? items[0];

  const update = (patch: Partial<CmsFaqItem>) => {
    if (!selected) return;
    onChange(items.map((i) => (i.id === selected.id ? { ...i, ...patch } : i)));
  };

  return (
    <BuilderShell
      items={items.map((i) => ({ id: i.id, label: i.question }))}
      selectedId={selected?.id ?? null}
      onSelect={setSelectedId}
      onReorder={(from, to) => onChange(reorderBuilderItems(items, from, to))}
      onAdd={() => {
        const id = createCmsId("faq");
        onChange([...items, { id, question: "Nueva pregunta", answer: "", enabled: true }]);
        setSelectedId(id);
      }}
      addLabel="Agregar pregunta"
      onRemove={(id) => {
        onChange(items.filter((i) => i.id !== id));
        setSelectedId(null);
      }}
    >
      {selected ? (
        <div className="space-y-4">
          <Field label="Pregunta">
            <Input value={selected.question} onChange={(e) => update({ question: e.target.value })} />
          </Field>
          <Field label="Respuesta">
            <Textarea
              rows={4}
              value={selected.answer}
              onChange={(e) => update({ answer: e.target.value })}
            />
          </Field>
          <Switch
            checked={selected.enabled !== false}
            onChange={(enabled) => update({ enabled })}
            label="Activa"
          />
        </div>
      ) : (
        <p className="text-sm text-muted">Agregue una pregunta para comenzar.</p>
      )}
    </BuilderShell>
  );
}
