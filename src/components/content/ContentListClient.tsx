"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import {
  AdminDataTable,
  AlertBanner,
  ColumnActions,
  ContentGrid,
  EmptyState,
  FilterBar,
  KpiCard,
  LoadingState,
  StatusBadge,
  type AdminDataTableColumn,
} from "@/components/admin/kit";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import type { SortState } from "@/components/admin/kit/utils/types";
import type { BreadcrumbItem } from "@/components/ui/breadcrumb";
import {
  getContentStatusTone,
  getItemLabel,
  getItemSubtitle,
  getNewItemLabel,
  isDraftItem,
  isPublishedItem,
  matchesStatusFilter,
  type ContentStatusFilter,
} from "@/components/content/content-list-utils";
import { filterByAcademicCatalogKind, type AcademicCatalogKind } from "@/lib/admin/catalog-kind";
import { isEditableCollection } from "@/lib/content/content-sections";
import type { ContentDocument } from "@/types/content";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 20;

interface ContentListClientProps {
  tenant: string;
  collection: string;
  title: string;
  description: string;
  sectionSlug: string;
  initialItems: ContentDocument[];
  initialTotal: number;
  catalogKind?: AcademicCatalogKind;
  breadcrumbs?: BreadcrumbItem[];
  newItemLabel?: string;
}

function applyCatalogKind(
  items: ContentDocument[],
  catalogKind?: AcademicCatalogKind
): ContentDocument[] {
  if (!catalogKind) return items;
  return filterByAcademicCatalogKind(items, catalogKind);
}

export function ContentListClient({
  tenant,
  collection,
  title,
  description,
  sectionSlug,
  initialItems,
  initialTotal,
  catalogKind,
  breadcrumbs,
  newItemLabel: newItemLabelProp,
}: ContentListClientProps) {
  const router = useRouter();
  const [items, setItems] = useState(() => applyCatalogKind(initialItems, catalogKind));
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContentStatusFilter>("all");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortState>({ columnId: "title", direction: "asc" });

  const editable = isEditableCollection(collection);
  const newLabel = newItemLabelProp ?? getNewItemLabel(collection);
  const editBase = `/admin/content/${sectionSlug}/edit`;
  const pageBreadcrumbs =
    breadcrumbs ??
    [
      { label: "Inicio", href: "/admin" },
      { label: "Comunicaciones", href: "/admin/content" },
      { label: title },
    ];

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
          pagination: { page: 1, limit: 100 },
          preview: true,
          mapItems: false,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.errors?.[0]?.message ?? data.error ?? "No se pudo cargar el contenido.");
        return;
      }
      setItems(applyCatalogKind(data.items ?? [], catalogKind));
      setTotal(applyCatalogKind(data.items ?? [], catalogKind).length);
      setPage(1);
      router.refresh();
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  }, [tenant, collection, router, catalogKind]);

  const publishedCount = useMemo(
    () => items.filter((item) => isPublishedItem(item, collection)).length,
    [items, collection]
  );
  const draftCount = useMemo(
    () => items.filter((item) => isDraftItem(item, collection)).length,
    [items, collection]
  );
  const needsAttention = draftCount;

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      if (!matchesStatusFilter(item, collection, statusFilter)) return false;
      if (!query) return true;
      const label = getItemLabel(item, collection).toLowerCase();
      const subtitle = getItemSubtitle(item, collection).toLowerCase();
      return label.includes(query) || subtitle.includes(query);
    });
  }, [items, collection, search, statusFilter]);

  const sortedItems = useMemo(() => {
    const sorted = [...filteredItems];
    const dir = sort.direction === "asc" ? 1 : -1;
    sorted.sort((a, b) => {
      if (sort.columnId === "status") {
        const sa = getContentStatusTone(a, collection).label;
        const sb = getContentStatusTone(b, collection).label;
        return sa.localeCompare(sb) * dir;
      }
      if (sort.columnId === "order") {
        return ((a.order ?? 0) - (b.order ?? 0)) * dir;
      }
      const la = getItemLabel(a, collection);
      const lb = getItemLabel(b, collection);
      return la.localeCompare(lb, "es") * dir;
    });
    return sorted;
  }, [filteredItems, sort, collection]);

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / PAGE_SIZE));
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedItems.slice(start, start + PAGE_SIZE);
  }, [sortedItems, page]);

  const handleSort = (columnId: string) => {
    setSort((prev) => ({
      columnId,
      direction: prev.columnId === columnId && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const columns: AdminDataTableColumn<ContentDocument>[] = [
    {
      id: "title",
      header: "Contenido",
      sortable: true,
      cell: (item) => (
        <div>
          <p className="font-medium text-foreground">{getItemLabel(item, collection)}</p>
          <p className="text-xs text-muted">{getItemSubtitle(item, collection)}</p>
        </div>
      ),
    },
    {
      id: "status",
      header: "Estado",
      sortable: true,
      cell: (item) => {
        const { tone, label } = getContentStatusTone(item, collection);
        return <StatusBadge tone={tone} label={label} />;
      },
    },
    {
      id: "order",
      header: "Orden",
      sortable: true,
      cell: (item) => (
        <span className="text-muted">{item.order !== undefined ? item.order : "—"}</span>
      ),
    },
  ];

  return (
    <AdminModulePage
      breadcrumbs={pageBreadcrumbs}
      title={title}
      description={description}
      actions={
        <>
          <Link href="/admin/content">
            <Button type="button" variant="outline">
              Centro editorial
            </Button>
          </Link>
          <Button type="button" variant="outline" onClick={load} disabled={loading}>
            {loading ? "Actualizando…" : "Actualizar"}
          </Button>
          {editable ? (
            <Button href={`${editBase}/new`}>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              {newLabel}
            </Button>
          ) : null}
        </>
      }
    >
      {loading ? <LoadingState variant="table" className="mb-6" /> : null}

      {error ? (
        <AlertBanner variant="error" title="Error al cargar" className="mb-6">
          {error}
        </AlertBanner>
      ) : null}

      <ContentGrid cols={4} className="mb-6">
        <KpiCard label="Registros totales" value={total} />
        <KpiCard label="Publicados" value={publishedCount} variant="success" />
        <KpiCard label="Borradores" value={draftCount} variant="info" />
        <KpiCard
          label="Requieren atención"
          value={needsAttention}
          variant={needsAttention > 0 ? "warning" : "neutral"}
          delta={needsAttention > 0 ? "Borradores sin publicar" : undefined}
        />
      </ContentGrid>

      <FilterBar
        className="mb-4"
        search={{
          placeholder: "Buscar por título, slug o detalle…",
          value: search,
          onChange: (value) => {
            setSearch(value);
            setPage(1);
          },
        }}
        filters={
          <div className="flex flex-wrap gap-2">
            {(["all", "published", "draft", "archived"] as const).map((value) => {
              if (value === "archived" && collection === "academy_categories") return null;
              const labels: Record<ContentStatusFilter, string> = {
                all: "Todos",
                published: collection === "academy_categories" ? "Activas" : "Publicados",
                draft: collection === "academy_categories" ? "Inactivas" : "Borradores",
                archived: "Archivados",
              };
              return (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={statusFilter === value ? "primary" : "outline"}
                  onClick={() => {
                    setStatusFilter(value);
                    setPage(1);
                  }}
                >
                  {labels[value]}
                </Button>
              );
            })}
          </div>
        }
        onReset={
          search || statusFilter !== "all"
            ? () => {
                setSearch("");
                setStatusFilter("all");
                setPage(1);
              }
            : undefined
        }
      />

      {items.length === 0 && !loading ? (
        <EmptyState
          title="Sin contenido"
          description={
            editable
              ? `No hay registros en ${title.toLowerCase()}. Crea el primero para empezar.`
              : "No hay contenido publicado en esta sección."
          }
          action={
            editable
              ? { label: newLabel, href: `${editBase}/new` }
              : undefined
          }
        />
      ) : (
        <AdminDataTable
          columns={columns}
          data={paginatedItems}
          rowKey={(item) => item._id}
          sort={sort}
          onSort={handleSort}
          pagination={
            totalPages > 1
              ? {
                  page,
                  totalPages,
                  onPageChange: setPage,
                }
              : undefined
          }
          emptyTitle="Sin resultados"
          emptyDescription="Prueba con otros términos o filtros."
          rowActions={
            editable
              ? (item) => (
                  <ColumnActions>
                    <Button href={`${editBase}/${item._id}`} variant="primary" size="sm">
                      Editar
                    </Button>
                  </ColumnActions>
                )
              : undefined
          }
        />
      )}
    </AdminModulePage>
  );
}
