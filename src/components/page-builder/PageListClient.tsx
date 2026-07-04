"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ExternalLink, Eye, Layers, Menu, Plus } from "lucide-react";
import {
  AdminDataTable,
  ColumnActions,
  ContentGrid,
  EmptyState,
  FilterBar,
  KpiCard,
  LoadingState,
  QuickActions,
  StatusBadge,
  type AdminDataTableColumn,
} from "@/components/admin/kit";
import { useInputDialog } from "@/components/admin/kit/hooks/useInputDialog";
import { useToast } from "@/components/admin/kit/states/Toast";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import { useConfirmDialog } from "@/components/admin/kit/hooks/useConfirmDialog";
import { Button } from "@/components/ui";
import { blocksFromTemplate } from "@/lib/cms/page-defaults";
import { normalizeSlug } from "@/lib/cms/page-utils";
import type { CmsPage, CmsTemplate } from "@/types/page";

type StatusFilter = "all" | "published" | "draft";

interface PageListClientProps {
  pages: CmsPage[];
  templates: CmsTemplate[];
  tenant: string;
}

export function PageListClient({ pages, templates, tenant }: PageListClientProps) {
  const router = useRouter();
  const { push } = useToast();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const { prompt, dialog: inputDialog } = useInputDialog();

  const seedCms = async () => {
    setLoading(true);
    await fetch("/api/cms/blocks?seed=true");
    await fetch("/api/cms/templates?seed=true");
    setLoading(false);
    router.refresh();
  };

  const createPage = async () => {
    const values = await prompt({
      title: "Nueva página",
      description: "Define el identificador y la ruta de la nueva página.",
      submitLabel: "Crear",
      fields: [
        { id: "id", label: "ID", placeholder: "programas", required: true },
        { id: "title", label: "Título", defaultValue: "Nueva página", required: true },
        { id: "slug", label: "Slug", placeholder: "/programas" },
      ],
    });
    if (!values) return;

    const id = values.id.trim();
    const title = values.title.trim() || "Nueva página";
    const slug = normalizeSlug(values.slug.trim() || `/${id}`);
    const templateId = templates[0]?._id ?? "landing";
    const template = templates.find((t) => t._id === templateId) ?? templates[0];
    const blocks = template ? blocksFromTemplate(template) : [];

    setLoading(true);
    const res = await fetch("/api/cms/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        _id: id,
        tenant,
        title,
        slug,
        description: "",
        template: template?.template ?? "institutional",
        status: "draft",
        seo: { title, description: "" },
        blocks,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.ok) router.push(`/admin/pages/${id}`);
    else push({ title: "Error al crear página", description: data.error ?? "Intenta de nuevo.", tone: "error" });
  };

  const deletePage = async (id: string) => {
    const ok = await confirm({
      title: "Eliminar página",
      description: `¿Eliminar la página "${id}"? Esta acción no se puede deshacer.`,
      confirmLabel: "Eliminar",
      destructive: true,
    });
    if (!ok) return;
    setLoading(true);
    await fetch(`/api/cms/pages/${id}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  };

  const duplicatePage = async (page: CmsPage) => {
    const values = await prompt({
      title: "Duplicar página",
      description: `Duplicar "${page.title}" con un nuevo identificador.`,
      submitLabel: "Duplicar",
      fields: [
        { id: "newId", label: "Nuevo ID", defaultValue: `${page._id}-copia`, required: true },
      ],
    });
    if (!values) return;
    const newId = values.newId.trim();
    setLoading(true);
    const res = await fetch(`/api/cms/pages/${page._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        duplicateAs: {
          newId,
          newTitle: `${page.title} (copia)`,
          newSlug: `${page.slug === "/" ? "" : page.slug}-copia`,
        },
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.ok) router.push(`/admin/pages/${newId}`);
  };

  const publishedCount = useMemo(
    () => pages.filter((page) => page.status === "published").length,
    [pages]
  );
  const draftCount = pages.length - publishedCount;
  const needsAttention = draftCount;

  const filteredPages = useMemo(() => {
    const query = search.trim().toLowerCase();
    return pages.filter((page) => {
      if (statusFilter !== "all" && page.status !== statusFilter) return false;
      if (!query) return true;
      return (
        page.title.toLowerCase().includes(query) ||
        page.slug.toLowerCase().includes(query) ||
        page._id.toLowerCase().includes(query)
      );
    });
  }, [pages, search, statusFilter]);

  const columns: AdminDataTableColumn<CmsPage>[] = [
    {
      id: "title",
      header: "Página",
      cell: (page) => (
        <div>
          <p className="font-medium text-foreground">{page.title}</p>
          <p className="text-xs text-muted">
            {page.slug} · {page.blocks.length} bloques
          </p>
        </div>
      ),
    },
    {
      id: "status",
      header: "Estado",
      cell: (page) => (
        <StatusBadge
          tone={page.status === "published" ? "active" : "draft"}
          label={page.status === "published" ? "Publicada" : "Borrador"}
        />
      ),
    },
    {
      id: "id",
      header: "ID",
      cell: (page) => <span className="font-mono text-xs text-muted">{page._id}</span>,
    },
  ];

  return (
    <AdminModulePage
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: "Portal", href: "/admin/pages" },
        { label: "Páginas del sitio" },
      ]}
      title="Páginas del portal"
      description="Estructura, bloques y contenido de cada página institucional"
      actions={
        <>
          <Link href="/admin/menus">
            <Button type="button" variant="outline">
              Menús
            </Button>
          </Link>
          <Link href="/" target="_blank">
            <Button type="button" variant="outline">
              Ver portal
              <ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
          <Button type="button" variant="outline" disabled={loading} onClick={seedCms}>
            Preparar plantillas
          </Button>
          <Button type="button" disabled={loading} onClick={createPage}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Nueva página
          </Button>
        </>
      }
    >
      {loading ? <LoadingState variant="cards" className="mb-6" /> : null}

      <ContentGrid cols={4} className="mb-6">
        <KpiCard label="Páginas totales" value={pages.length} />
        <KpiCard label="Publicadas" value={publishedCount} variant="success" />
        <KpiCard label="Borradores" value={draftCount} variant="info" />
        <KpiCard
          label="Requieren atención"
          value={needsAttention}
          variant={needsAttention > 0 ? "warning" : "neutral"}
          delta={needsAttention > 0 ? "Borradores sin publicar" : undefined}
        />
      </ContentGrid>

      <QuickActions
        className="mb-6"
        items={[
          { id: "new", title: "Nueva página", description: "Crear página con plantilla", onClick: createPage, icon: <Plus className="h-5 w-5" /> },
          { id: "menus", title: "Menús", description: "Navegación del sitio", href: "/admin/menus", icon: <Menu className="h-5 w-5" /> },
          { id: "forms", title: "Formularios", description: "Gestión de formularios institucionales", href: "/admin/portal/forms", icon: <Layers className="h-5 w-5" /> },
        ]}
      />

      <FilterBar
        className="mb-4"
        search={{
          placeholder: "Buscar por título, slug o ID…",
          value: search,
          onChange: setSearch,
        }}
        filters={
          <div className="flex flex-wrap gap-2">
            {(["all", "published", "draft"] as const).map((value) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={statusFilter === value ? "primary" : "outline"}
                onClick={() => setStatusFilter(value)}
              >
                {value === "all" ? "Todas" : value === "published" ? "Publicadas" : "Borradores"}
              </Button>
            ))}
          </div>
        }
        onReset={
          search || statusFilter !== "all"
            ? () => {
                setSearch("");
                setStatusFilter("all");
              }
            : undefined
        }
      />

      {pages.length === 0 ? (
        <EmptyState
          title="Sin páginas"
          description='Usa "Preparar plantillas" para crear la biblioteca y la home.'
          action={{ label: "Preparar plantillas", onClick: seedCms }}
        />
      ) : (
        <AdminDataTable
          columns={columns}
          data={filteredPages}
          rowKey={(page) => page._id}
          emptyTitle="Sin resultados"
          emptyDescription="Prueba con otros términos o filtros."
          rowActions={(page) => (
            <ColumnActions>
              <Button href={`/admin/pages/${page._id}`} variant="primary" size="sm">
                Editar
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => duplicatePage(page)}>
                Duplicar
              </Button>
              {page._id !== "home" ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => deletePage(page._id)}>
                  Eliminar
                </Button>
              ) : null}
              {page.status === "published" ? (
                <Link
                  href={page.slug}
                  className="px-2 text-xs text-secondary underline"
                  target="_blank"
                >
                  <Eye className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
                  Ver
                </Link>
              ) : null}
            </ColumnActions>
          )}
        />
      )}

      {confirmDialog}
      {inputDialog}
    </AdminModulePage>
  );
}
