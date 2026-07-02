"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/slugify";
import type { CategoryItem } from "@/types/content";

interface CategoryEditorClientProps {
  tenant: string;
  sectionHref: string;
  item?: CategoryItem;
}

export function CategoryEditorClient({ tenant, sectionHref, item }: CategoryEditorClientProps) {
  const router = useRouter();
  const isNew = !item;

  const [name, setName] = useState(item?.name ?? "");
  const slug = slugify(name);
  const [description, setDescription] = useState(item?.description ?? "");
  const [order, setOrder] = useState(String(item?.order ?? 0));
  const [enabled, setEnabled] = useState(item?.enabled !== false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        tenant,
        collection: "academy_categories",
        title: name,
        name,
        slug: slug || undefined,
        summary: description,
        order: Number(order) || 0,
        enabled,
      };

      const url = isNew ? "/api/cms/content-items" : `/api/cms/content-items/${item!._id}`;
      const res = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.errors?.[0]?.message ?? data.error ?? "Error al guardar.");
        return;
      }
      router.push(sectionHref);
      router.refresh();
    } catch {
      setError("Error de red.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!item || !confirm(`¿Eliminar la categoría «${name}»?`)) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/cms/content-items/${item._id}?tenant=${encodeURIComponent(tenant)}&collection=academy_categories`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo eliminar.");
        return;
      }
      router.push(sectionHref);
      router.refresh();
    } catch {
      setError("Error de red.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-soft">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <Link href={sectionHref} className="text-sm text-muted hover:text-foreground">
              ← Categorías
            </Link>
            <h1 className="text-xl font-semibold">
              {isNew ? "Nueva categoría" : "Editar categoría"}
            </h1>
          </div>
          <div className="flex gap-2">
            {!isNew ? (
              <Button type="button" variant="outline" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Eliminando…" : "Eliminar"}
              </Button>
            ) : null}
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6">
        {error ? (
          <div className="rounded-lg border border-[var(--state-danger-border)] bg-[var(--state-danger-bg)] px-4 py-3 text-sm text-[var(--color-danger)]">
            {error}
          </div>
        ) : null}

        <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input
          label="Slug"
          value={slug}
          readOnly
          tabIndex={-1}
          className="cursor-default bg-background-soft text-muted"
          helper="Se genera automáticamente del nombre"
        />
        <Textarea
          label="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        <Input
          label="Orden"
          type="number"
          value={order}
          onChange={(e) => setOrder(e.target.value)}
          helper="Menor número = aparece primero"
        />
        <Switch label="Activa" checked={enabled} onChange={setEnabled} />
      </main>
    </div>
  );
}
