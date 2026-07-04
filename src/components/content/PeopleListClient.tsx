"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { getContentStatusTone } from "@/components/content/content-list-utils";
import { TEAM_GROUPS, getTeamGroup, getTeamGroupBySlug } from "@/lib/content/team-groups";
import type { ContentDocument } from "@/types/content";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 20;

interface PeopleListClientProps {
  tenant: string;
  initialItems: ContentDocument[];
  initialTotal: number;
}

export function PeopleListClient({
  tenant,
  initialItems,
  initialTotal,
}: PeopleListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupSlug = searchParams.get("group");
  const activeGroup = getTeamGroupBySlug(groupSlug) ?? null;

  const [items, setItems] = useState(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortState>({ columnId: "name", direction: "asc" });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cms/content-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant,
          collection: "content_people",
          pagination: { page: 1, limit: 200 },
          preview: true,
          mapItems: false,
          filters: activeGroup ? { category: activeGroup.id } : undefined,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.errors?.[0]?.message ?? data.error ?? "No se pudo cargar el equipo.");
        return;
      }
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
      setPage(1);
      router.refresh();
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  }, [tenant, activeGroup, router]);

  const countsByGroup = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const group of TEAM_GROUPS) {
      counts[group.id] = items.filter((item) => item.category === group.id).length;
    }
    return counts;
  }, [items]);

  const publishedCount = useMemo(
    () => items.filter((item) => item.status === "published").length,
    [items]
  );
  const draftCount = items.length - publishedCount;
  const needsAttention = draftCount;

  const newHref = activeGroup
    ? `/admin/content/people/edit/new?group=${activeGroup.slug}`
    : "/admin/content/people/edit/new?group=leadership";

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    let list = activeGroup
      ? items.filter((item) => item.category === activeGroup.id)
      : items;

    if (statusFilter !== "all") {
      list = list.filter((item) => item.status === statusFilter);
    }

    if (!query) return list;

    return list.filter((item) => {
      const name = (item.name ?? item.title ?? "").toLowerCase();
      const role = (item.role ?? "").toLowerCase();
      const group = getTeamGroup(item.category)?.label.toLowerCase() ?? "";
      return name.includes(query) || role.includes(query) || group.includes(query);
    });
  }, [items, activeGroup, search, statusFilter]);

  const sortedItems = useMemo(() => {
    const sorted = [...filteredItems];
    const dir = sort.direction === "asc" ? 1 : -1;
    sorted.sort((a, b) => {
      if (sort.columnId === "status") {
        const sa = getContentStatusTone(a, "content_people").label;
        const sb = getContentStatusTone(b, "content_people").label;
        return sa.localeCompare(sb) * dir;
      }
      if (sort.columnId === "order") {
        return ((a.order ?? 0) - (b.order ?? 0)) * dir;
      }
      if (sort.columnId === "group") {
        const ga = getTeamGroup(a.category)?.label ?? "";
        const gb = getTeamGroup(b.category)?.label ?? "";
        return ga.localeCompare(gb, "es") * dir;
      }
      const na = a.name ?? a.title ?? "";
      const nb = b.name ?? b.title ?? "";
      return na.localeCompare(nb, "es") * dir;
    });
    return sorted;
  }, [filteredItems, sort]);

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
      id: "name",
      header: "Persona",
      sortable: true,
      cell: (item) => {
        const group = getTeamGroup(item.category);
        return (
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-background-soft">
              {item.image ? (
                <Image src={item.image} alt="" fill className="object-cover" sizes="40px" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] text-muted">
                  —
                </div>
              )}
            </div>
            <div>
              <p className="font-medium text-foreground">{item.name ?? item.title}</p>
              <p className="text-xs text-muted">
                {item.role ?? "Sin cargo"}
                {group ? ` · ${group.label}` : ""}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      id: "group",
      header: "Equipo",
      sortable: true,
      cell: (item) => (
        <span className="text-muted">{getTeamGroup(item.category)?.label ?? "—"}</span>
      ),
    },
    {
      id: "status",
      header: "Estado",
      sortable: true,
      cell: (item) => {
        const { tone, label } = getContentStatusTone(item, "content_people");
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
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: "Comunicaciones", href: "/admin/content" },
        { label: "Personas" },
      ]}
      title="Personas del seminario"
      description="Gestiona el equipo directivo, docente y técnico por separado"
      actions={
        <>
          <Button type="button" variant="outline" onClick={load} disabled={loading}>
            {loading ? "Actualizando…" : "Actualizar"}
          </Button>
          <Button href={newHref}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Nueva persona
          </Button>
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
        <KpiCard label="Personas totales" value={total} />
        <KpiCard label="Publicadas" value={publishedCount} variant="success" />
        <KpiCard label="Borradores" value={draftCount} variant="info" />
        <KpiCard
          label="Requieren atención"
          value={needsAttention}
          variant={needsAttention > 0 ? "warning" : "neutral"}
          delta={needsAttention > 0 ? "Perfiles sin publicar" : undefined}
        />
      </ContentGrid>

      <FilterBar
        className="mb-4"
        search={{
          placeholder: "Buscar por nombre, cargo o equipo…",
          value: search,
          onChange: (value) => {
            setSearch(value);
            setPage(1);
          },
        }}
        filters={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/content/people">
              <Button
                type="button"
                size="sm"
                variant={!activeGroup ? "primary" : "outline"}
              >
                Todos ({total})
              </Button>
            </Link>
            {TEAM_GROUPS.map((group) => (
              <Link key={group.id} href={`/admin/content/people?group=${group.slug}`}>
                <Button
                  type="button"
                  size="sm"
                  variant={activeGroup?.id === group.id ? "primary" : "outline"}
                >
                  {group.label} ({countsByGroup[group.id] ?? 0})
                </Button>
              </Link>
            ))}
            <span className="mx-1 hidden h-6 w-px bg-border sm:inline-block" aria-hidden="true" />
            {(["all", "published", "draft"] as const).map((value) => (
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
                {value === "all" ? "Todos los estados" : value === "published" ? "Publicadas" : "Borradores"}
              </Button>
            ))}
          </div>
        }
        onReset={
          search || statusFilter !== "all" || activeGroup
            ? () => {
                setSearch("");
                setStatusFilter("all");
                setPage(1);
                if (activeGroup) router.push("/admin/content/people");
              }
            : undefined
        }
      />

      {activeGroup ? (
        <p className="mb-4 text-sm text-muted">{activeGroup.description}</p>
      ) : null}

      {items.length === 0 && !loading ? (
        <EmptyState
          title="Sin personas"
          description={
            activeGroup
              ? `No hay personas en «${activeGroup.label}».`
              : "No hay personas registradas en el seminario."
          }
          action={{ label: "Agregar primera persona", href: newHref }}
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
          rowActions={(item) => (
            <ColumnActions>
              <Button href={`/admin/content/people/edit/${item._id}`} variant="primary" size="sm">
                Editar
              </Button>
            </ColumnActions>
          )}
        />
      )}
    </AdminModulePage>
  );
}
