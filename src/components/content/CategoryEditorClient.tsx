"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  FormSection,
  InlineActions,
  ValidationSummary,
} from "@/components/admin/kit";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import { useConfirmDialog } from "@/components/admin/kit/hooks/useConfirmDialog";
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
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
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
    if (!item) return;
    const ok = await confirm({
      title: "Eliminar categoría",
      description: `¿Eliminar la categoría «${name}»? Esta acción no se puede deshacer.`,
      confirmLabel: "Eliminar",
      destructive: true,
    });
    if (!ok) return;
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
    <AdminModulePage
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: "Comunicaciones", href: "/admin/content" },
        { label: "Categorías", href: sectionHref },
        { label: isNew ? "Nueva categoría" : "Editar categoría" },
      ]}
      title={isNew ? "Nueva categoría" : "Editar categoría"}
      description="Categorías académicas del seminario"
      maxWidth="6xl"
      actions={
        <>
          {!isNew ? (
            <Button type="button" variant="outline" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Eliminando…" : "Eliminar"}
            </Button>
          ) : null}
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </>
      }
    >
      {error ? <ValidationSummary errors={[error]} /> : null}

      <FormSection title="Datos generales" description="Nombre, slug y descripción de la categoría.">
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
      </FormSection>

      <FormSection title="Publicación" description="Orden de aparición y visibilidad.">
        <Input
          label="Orden"
          type="number"
          value={order}
          onChange={(e) => setOrder(e.target.value)}
          helper="Menor número = aparece primero"
        />
        <Switch label="Activa" checked={enabled} onChange={setEnabled} />
      </FormSection>

      <InlineActions>
        <Button type="button" variant="outline" href={sectionHref}>
          Cancelar
        </Button>
        {!isNew ? (
          <Button type="button" variant="outline" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Eliminando…" : "Eliminar"}
          </Button>
        ) : null}
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving ? "Guardando…" : "Guardar"}
        </Button>
      </InlineActions>

      {confirmDialog}
    </AdminModulePage>
  );
}
