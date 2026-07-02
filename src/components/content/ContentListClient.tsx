"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { CheckCircle, FileText, Layers } from "lucide-react";
import { AdminModuleLayout } from "@/components/admin/AdminModuleLayout";
import {
  AdminModuleCenter,
  AdminModuleHero,
  AdminModuleSectionHeader,
  AdminModuleStats,
} from "@/components/admin/AdminModuleCenter";
import { getContentSectionPanel } from "@/lib/admin/module-panels";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSectionByCollection, isEditableCollection } from "@/lib/content/content-sections";
import type { ContentDocument } from "@/types/content";

interface ContentListClientProps {
  tenant: string;
  collection: string;
  title: string;
  description: string;
  sectionSlug: string;
  initialItems: ContentDocument[];
  initialTotal: number;
}

function getItemLabel(item: ContentDocument, collection: string): string {
  if (collection === "academy_categories") {
    return (item as { name?: string }).name ?? item.title ?? item._id;
  }
  if (collection === "academy_testimonials") {
    return item.author ?? item.title ?? item._id;
  }
  return item.title ?? item.name ?? item._id;
}

function getItemSubtitle(item: ContentDocument, collection: string): string {
  const parts: string[] = [];

  if (collection === "academy_categories") {
    const enabled = (item as { enabled?: boolean }).enabled;
    parts.push(enabled === false ? "inactiva" : "activa");
    if (item.order !== undefined) parts.push(`orden ${item.order}`);
    parts.push(item.slug);
    return parts.join(" · ");
  }

  if (item.status) parts.push(item.status);
  if (collection === "academy_programs" && item.modality) parts.push(item.modality);
  if (collection === "content_news" && item.category) parts.push(item.category);
  if (collection === "content_events" && item.location) parts.push(item.location);
  if (collection === "content_library" && item.author) parts.push(item.author);
  if (collection === "academy_testimonials" && item.role) parts.push(item.role);
  parts.push(item.slug || item._id);
  return parts.join(" · ");
}

export function ContentListClient({
  tenant,
  collection,
  title,
  description,
  sectionSlug,
  initialItems,
  initialTotal,
}: ContentListClientProps) {
  const [items, setItems] = useState(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editable = isEditableCollection(collection);
  const section = getSectionByCollection(collection);
  const newLabel =
    collection === "academy_programs"
      ? "Nuevo programa"
      : collection === "content_news"
        ? "Nueva noticia"
        : collection === "content_events"
          ? "Nuevo evento"
          : collection === "content_library"
            ? "Nuevo recurso"
            : collection === "academy_testimonials"
              ? "Nuevo testimonio"
              : collection === "academy_gallery"
                ? "Nueva imagen"
                : collection === "academy_categories"
                  ? "Nueva categoría"
                  : "Nuevo";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cms/content-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant,
          collection,
          pagination: { page: 1, limit: 50 },
          preview: true,
          mapItems: false,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.errors?.[0]?.message ?? data.error ?? "No se pudo cargar el contenido.");
        return;
      }
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  }, [tenant, collection]);

  const panel = getContentSectionPanel(sectionSlug);
  const publishedCount = useMemo(
    () => items.filter((item) => item.status === "published").length,
    [items]
  );
  const draftCount = items.length - publishedCount;

  return (
    <AdminModuleLayout
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: "Comunicaciones", href: "/admin/content" },
        { label: title },
      ]}
      title={title}
      description={description}
      actions={
        <>
          <Link href="/admin/content">
            <Button variant="outline">Centro editorial</Button>
          </Link>
          <Button variant="outline" onClick={load} disabled={loading}>
            {loading ? "Actualizando…" : "Actualizar"}
          </Button>
          {editable ? (
            <Link href={`/admin/content/${sectionSlug}/edit/new`}>
              <Button>{newLabel}</Button>
            </Link>
          ) : null}
        </>
      }
    >
      <AdminModuleCenter>
        {error ? (
          <div className="mb-4 rounded-xl border border-[var(--state-danger-border)] bg-[var(--state-danger-bg)] px-4 py-3 text-sm text-[var(--color-danger)]">
            {error}
          </div>
        ) : null}

        <AdminModuleHero {...panel} />

        <AdminModuleStats
          items={[
            { label: "Registros totales", value: total, icon: Layers, tone: "total" },
            { label: "Publicados", value: publishedCount, icon: CheckCircle, tone: "published" },
            { label: "Borradores", value: draftCount, icon: FileText, tone: "active" },
          ]}
        />

        <AdminModuleSectionHeader
          icon={FileText}
          title={title}
          description={description}
        />

      <div className="grid gap-3">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted">
            {editable ? (
              <>
                <p>No hay contenido en esta sección.</p>
                <Link href={`/admin/content/${sectionSlug}/edit/new`} className="mt-4 inline-block">
                  <Button size="sm">{newLabel}</Button>
                </Link>
              </>
            ) : (
              "No hay contenido publicado en esta sección."
            )}
          </div>
        ) : (
          items.map((item) => {
            const label = getItemLabel(item, collection);
            const subtitle = getItemSubtitle(item, collection);

            if (!editable) {
              return (
                <Card key={item._id}>
                  <CardHeader>
                    <CardTitle className="text-base">{label}</CardTitle>
                    <CardDescription>{subtitle}</CardDescription>
                  </CardHeader>
                </Card>
              );
            }

            return (
              <Link
                key={item._id}
                href={`/admin/content/${sectionSlug}/edit/${item._id}`}
                className="block"
              >
                <Card className="transition hover:border-primary/30 hover:shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base">{label}</CardTitle>
                      <CardDescription className="mt-1">{subtitle}</CardDescription>
                    </div>
                    <span className="ml-4 shrink-0 text-sm font-medium text-secondary">
                      Editar →
                    </span>
                  </CardHeader>
                </Card>
              </Link>
            );
          })
        )}
      </div>
      </AdminModuleCenter>
    </AdminModuleLayout>
  );
}
