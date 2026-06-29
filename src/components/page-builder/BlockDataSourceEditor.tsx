"use client";

import { Input, Label } from "@/components/ui";
import { ALLOWED_COLLECTIONS } from "@/lib/content/types";
import { blockTypeToDefaultQuery } from "@/lib/content/block-query-defaults";
import type { BlockContentQuery } from "@/types/content";
import type { PageBlock } from "@/types/page";

interface BlockDataSourceEditorProps {
  block: PageBlock;
  onChange: (block: PageBlock) => void;
}

function getQuery(block: PageBlock): BlockContentQuery {
  const raw = block.settings.query;
  if (raw && typeof raw === "object" && "collection" in raw) {
    return raw as BlockContentQuery;
  }
  return blockTypeToDefaultQuery(block.type) ?? { collection: "content_news", limit: 6 };
}

function updateQuery(
  block: PageBlock,
  patch: Partial<BlockContentQuery>,
  onChange: (block: PageBlock) => void
) {
  const current = getQuery(block);
  onChange({
    ...block,
    settings: {
      ...block.settings,
      query: { ...current, ...patch },
    },
  });
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function BlockDataSourceEditor({ block, onChange }: BlockDataSourceEditorProps) {
  const s = block.settings;
  const query = getQuery(block);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-secondary">Origen de datos</p>
        <p className="mt-1 text-caption text-muted">
          El contenido se obtiene del Content Engine. No se almacenan elementos en la página.
        </p>
      </div>

      <Field label="Título de sección">
        <Input
          value={String(s.title ?? "")}
          onChange={(e) =>
            onChange({ ...block, settings: { ...block.settings, title: e.target.value } })
          }
        />
      </Field>

      <Field label="Overline">
        <Input
          value={String(s.overline ?? "")}
          onChange={(e) =>
            onChange({ ...block, settings: { ...block.settings, overline: e.target.value } })
          }
        />
      </Field>

      <Field label="Descripción">
        <Input
          value={String(s.description ?? "")}
          onChange={(e) =>
            onChange({ ...block, settings: { ...block.settings, description: e.target.value } })
          }
        />
      </Field>

      <Field label="Colección">
        <select
          className="w-full rounded-[var(--radius-md)] border border-border bg-background px-3 py-2 text-sm"
          value={query.collection}
          onChange={(e) => updateQuery(block, { collection: e.target.value }, onChange)}
        >
          {ALLOWED_COLLECTIONS.map((col) => (
            <option key={col} value={col}>
              {col}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Cantidad (limit)">
        <Input
          type="number"
          min={1}
          max={50}
          value={String(query.limit ?? 6)}
          onChange={(e) => updateQuery(block, { limit: Number(e.target.value) }, onChange)}
        />
      </Field>

      <Field label="Categoría">
        <Input
          value={query.category ?? ""}
          onChange={(e) => updateQuery(block, { category: e.target.value || undefined }, onChange)}
          placeholder="Opcional"
        />
      </Field>

      <Field label="Tags (separados por coma)">
        <Input
          value={(query.tags ?? []).join(", ")}
          onChange={(e) => {
            const tags = e.target.value
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean);
            updateQuery(block, { tags: tags.length ? tags : undefined }, onChange);
          }}
          placeholder="tag1, tag2"
        />
      </Field>

      <Field label="Orden — campo">
        <Input
          value={query.sort?.field ?? "order"}
          onChange={(e) =>
            updateQuery(
              block,
              { sort: { field: e.target.value, direction: query.sort?.direction ?? "asc" } },
              onChange
            )
          }
        />
      </Field>

      <Field label="Orden — dirección">
        <select
          className="w-full rounded-[var(--radius-md)] border border-border bg-background px-3 py-2 text-sm"
          value={query.sort?.direction ?? "asc"}
          onChange={(e) =>
            updateQuery(
              block,
              {
                sort: {
                  field: query.sort?.field ?? "order",
                  direction: e.target.value as "asc" | "desc",
                },
              },
              onChange
            )
          }
        >
          <option value="asc">Ascendente</option>
          <option value="desc">Descendente</option>
        </select>
      </Field>

      <Field label="Estado">
        <select
          className="w-full rounded-[var(--radius-md)] border border-border bg-background px-3 py-2 text-sm"
          value={query.status ?? "published"}
          onChange={(e) =>
            updateQuery(
              block,
              { status: e.target.value as BlockContentQuery["status"] },
              onChange
            )
          }
        >
          <option value="published">Publicado</option>
          <option value="draft">Borrador</option>
          <option value="archived">Archivado</option>
        </select>
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={query.featured === true}
          onChange={(e) =>
            updateQuery(block, { featured: e.target.checked ? true : undefined }, onChange)
          }
        />
        Solo destacados
      </label>
    </div>
  );
}
