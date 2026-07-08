"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDeferredEffect } from "@/hooks/use-deferred-effect";
import { Plus, RefreshCw } from "lucide-react";
import { AdminModuleLayout } from "@/components/admin/AdminModuleLayout";
import { ProgramHubCard } from "@/components/admin/programs/ProgramHubCard";
import { ProgramHubCardSkeleton } from "@/components/admin/programs/ProgramHubCardSkeleton";
import { ProgramHubMetricsBar } from "@/components/admin/programs/ProgramHubMetricsBar";
import { ProgramHubSidebar } from "@/components/admin/programs/ProgramHubSidebar";
import { ProgramHubToolbar } from "@/components/admin/programs/ProgramHubToolbar";
import { useConfirmDialog } from "@/components/admin/kit/hooks/useConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  computeProgramHubMetrics,
  exportProgramsCatalog,
  filterPrograms,
  sortPrograms,
  type ProgramHubFilter,
  type ProgramHubSort,
} from "@/lib/admin/programs-hub-utils";
import { slugify } from "@/lib/slugify";
import type { ContentDocument, ContentStatus } from "@/types/content";

interface ProgramsHubClientProps {
  tenant: string;
  initialItems: ContentDocument[];
  initialTotal: number;
}

async function fetchPrograms(tenant: string): Promise<ContentDocument[]> {
  const res = await fetch("/api/cms/content-query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tenant,
      collection: "academy_programs",
      pagination: { page: 1, limit: 200 },
      preview: true,
      mapItems: false,
    }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error ?? "No se pudieron cargar los programas.");
  return data.items ?? [];
}

async function fetchInsights(tenant: string): Promise<{
  applicantCounts: Record<string, number>;
  featuredProgramId?: string;
}> {
  const res = await fetch(`/api/cms/programs-hub?tenant=${encodeURIComponent(tenant)}`);
  const data = await res.json();
  if (!data.ok) return { applicantCounts: {} };
  return {
    applicantCounts: data.applicantCounts ?? {},
    featuredProgramId: data.featuredProgramId,
  };
}

export function ProgramsHubClient({
  tenant,
  initialItems,
  initialTotal,
}: ProgramsHubClientProps) {
  const [items, setItems] = useState(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [applicantCounts, setApplicantCounts] = useState<Record<string, number>>({});
  const [featuredProgramId, setFeaturedProgramId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ProgramHubFilter>("all");
  const [sort, setSort] = useState<ProgramHubSort>("updated_desc");
  const { confirm, dialog } = useConfirmDialog();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [programs, insights] = await Promise.all([
        fetchPrograms(tenant),
        fetchInsights(tenant),
      ]);
      setItems(programs);
      setTotal(programs.length);
      setApplicantCounts(insights.applicantCounts);
      setFeaturedProgramId(insights.featuredProgramId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión.");
    } finally {
      setLoading(false);
    }
  }, [tenant]);

  useDeferredEffect(() => {
    void refresh();
  }, [refresh]);

  const metrics = useMemo(() => computeProgramHubMetrics(items), [items]);

  const visiblePrograms = useMemo(
    () => sortPrograms(filterPrograms(items, filter, search), sort, applicantCounts),
    [items, filter, search, sort, applicantCounts]
  );

  const updateProgramStatus = useCallback(
    async (program: ContentDocument, status: ContentStatus) => {
      setBusyId(program._id);
      setError(null);
      try {
        const res = await fetch(`/api/cms/content-items/${program._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenant,
            collection: "academy_programs",
            title: program.title,
            status,
            publishedAt:
              status === "published"
                ? program.publishedAt || new Date().toISOString()
                : program.publishedAt,
          }),
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error ?? "No se pudo actualizar el programa.");
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al actualizar.");
      } finally {
        setBusyId(null);
      }
    },
    [tenant, refresh]
  );

  const duplicateProgram = useCallback(
    async (program: ContentDocument) => {
      setBusyId(program._id);
      setError(null);
      try {
        const getRes = await fetch(
          `/api/cms/content-items/${program._id}?tenant=${encodeURIComponent(tenant)}&collection=academy_programs`
        );
        const getData = await getRes.json();
        if (!getData.ok || !getData.item) {
          throw new Error("No se pudo leer el programa original.");
        }

        const source = getData.item as ContentDocument;
        const copyTitle = `${source.title} (copia)`;
        const copySlug = slugify(`${source.slug}-copia-${Date.now().toString(36).slice(-4)}`);

        const res = await fetch("/api/cms/content-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenant,
            collection: "academy_programs",
            title: copyTitle,
            slug: copySlug,
            summary: source.summary,
            content: source.content,
            status: "draft",
            modality: source.modality,
            duration: source.duration,
            programStatus: source.programStatus,
            certification: source.certification,
            startDate: source.startDate,
            category: source.category,
            featured: false,
            imageMediaId: source.imageMediaId || source.coverMediaId,
            icon: source.icon,
            badge: source.badge,
            fees: source.fees,
            showPrice: source.showPrice,
          }),
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error ?? "No se pudo duplicar el programa.");
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al duplicar.");
      } finally {
        setBusyId(null);
      }
    },
    [tenant, refresh]
  );

  const deleteProgram = useCallback(
    async (program: ContentDocument) => {
      const ok = await confirm({
        title: "Eliminar programa",
        description: `¿Eliminar "${program.title}"? Esta acción no se puede deshacer.`,
        confirmLabel: "Eliminar",
        destructive: true,
      });
      if (!ok) return;

      setBusyId(program._id);
      setError(null);
      try {
        const res = await fetch(
          `/api/cms/content-items/${program._id}?tenant=${encodeURIComponent(tenant)}&collection=academy_programs`,
          { method: "DELETE" }
        );
        const data = await res.json();
        if (!data.ok) throw new Error(data.error ?? "No se pudo eliminar el programa.");
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al eliminar.");
      } finally {
        setBusyId(null);
      }
    },
    [tenant, refresh, confirm]
  );

  return (
    <AdminModuleLayout
      className="programs-hub"
      maxWidth="7xl"
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: "Programas y cursos" },
      ]}
      title="Programas Académicos"
      description="Administra toda la oferta formativa de la institución, su publicación, admisiones y configuración."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden />
            {loading ? "Actualizando…" : "Actualizar"}
          </Button>
          <Link href="/admin/content/programs/edit/new">
            <Button size="sm">
              <Plus className="h-4 w-4" aria-hidden />
              Nuevo programa
            </Button>
          </Link>
        </div>
      }
    >
      {error ? (
        <div className="mb-4 rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 px-4 py-3 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      ) : null}

      <ProgramHubMetricsBar metrics={metrics} />

      <div className="programs-hub__layout">
        <div className="programs-hub__main">
          <ProgramHubToolbar
            search={search}
            filter={filter}
            sort={sort}
            onSearchChange={setSearch}
            onFilterChange={setFilter}
            onSortChange={setSort}
          />

          <p className="programs-hub__results">
            {loading
              ? "Cargando programas…"
              : `${visiblePrograms.length} de ${total} programas`}
          </p>

          <div className="programs-hub__grid">
            {loading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <ProgramHubCardSkeleton key={`skeleton-${index}`} />
                ))
              : visiblePrograms.length === 0
                ? (
                    <div className="programs-hub__empty">
                      <p>No hay programas que coincidan con este criterio.</p>
                      <Link href="/admin/content/programs/edit/new">
                        <Button size="sm">Crear primer programa</Button>
                      </Link>
                    </div>
                  )
                : visiblePrograms.map((program, index) => (
                    <ProgramHubCard
                      key={program._id}
                      program={program}
                      index={index}
                      applicantCount={applicantCounts[program._id] ?? 0}
                      isFeatured={program._id === featuredProgramId}
                      busy={busyId === program._id}
                      onDuplicate={duplicateProgram}
                      onPublish={(item) => void updateProgramStatus(item, "published")}
                      onUnpublish={(item) => void updateProgramStatus(item, "draft")}
                      onArchive={(item) => void updateProgramStatus(item, "archived")}
                      onDelete={deleteProgram}
                    />
                  ))}
          </div>
        </div>

        <ProgramHubSidebar
          programs={items}
          applicantCounts={applicantCounts}
          featuredProgramId={featuredProgramId}
          onExport={() => exportProgramsCatalog(visiblePrograms)}
          onImport={() => {
            window.alert(
              "La importación masiva estará disponible próximamente. Por ahora puedes crear programas individualmente o duplicar existentes."
            );
          }}
        />
      </div>
      {dialog}
    </AdminModuleLayout>
  );
}
