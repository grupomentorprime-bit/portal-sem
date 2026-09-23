"use client";

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
import { CreatePageWizard } from "@/components/page-builder/CreatePageWizard";
import {
  spacePublicHref,
  useSpacePublicOrigin,
} from "@/components/admin/SpacePublicOrigin";
import { Button } from "@/components/ui";
import { objectiveLabelForTemplate, pageIdFromTitle } from "@/lib/cms/page-objectives";
import type { CmsPage } from "@/types/page";

type StatusFilter = "all" | "published" | "draft";
type ObjectiveFilter = "all" | "institutional" | "landing" | "program" | "contact";

interface PageListClientProps {
  pages: CmsPage[];
  tenant: string;
}

function hasCaptureForm(page: CmsPage): boolean {
  return page.blocks.some((block) => block.type === "experience_form" && block.visible !== false);
}

export function PageListClient({ pages, tenant }: PageListClientProps) {
  const publicOrigin = useSpacePublicOrigin();
  const router = useRouter();
  const { push } = useToast();
  const [loading, setLoading] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [objectiveFilter, setObjectiveFilter] = useState<ObjectiveFilter>("all");
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const { prompt, dialog: inputDialog } = useInputDialog();

  const deletePage = async (page: CmsPage) => {
    const ok = await confirm({
      title: "Eliminar página",
      description: `¿Eliminar «${page.title}»? Esta acción no se puede deshacer.`,
      confirmLabel: "Eliminar",
      destructive: true,
    });
    if (!ok) return;
    setLoading(true);
    await fetch(`/api/cms/pages/${page._id}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  };

  const duplicatePage = async (page: CmsPage) => {
    const values = await prompt({
      title: "Duplicar página",
      description: `Se creará una copia de «${page.title}».`,
      submitLabel: "Duplicar",
      fields: [
        {
          id: "newTitle",
          label: "Nombre de la copia",
          defaultValue: `${page.title} (copia)`,
          required: true,
        },
      ],
    });
    if (!values) return;
    const newTitle = values.newTitle.trim();
    const newId = pageIdFromTitle(newTitle);
    setLoading(true);
    const res = await fetch(`/api/cms/pages/${page._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        duplicateAs: {
          newId,
          newTitle,
          newSlug: `${page.slug === "/" ? "" : page.slug}-copia`,
        },
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.ok) router.push(`/admin/pages/${newId}`);
    else push({ title: "No se pudo duplicar", description: data.error ?? "Intenta de nuevo.", tone: "error" });
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
      if (objectiveFilter !== "all" && page.template !== objectiveFilter) return false;
      if (!query) return true;
      return (
        page.title.toLowerCase().includes(query) ||
        page.slug.toLowerCase().includes(query) ||
        objectiveLabelForTemplate(page.template).toLowerCase().includes(query)
      );
    });
  }, [pages, search, statusFilter, objectiveFilter]);

  const columns: AdminDataTableColumn<CmsPage>[] = [
    {
      id: "title",
      header: "Página",
      cell: (page) => (
        <div>
          <p className="font-medium text-foreground">{page.title}</p>
          <p className="text-xs text-muted">
            {page.slug} · {page.blocks.length} bloques
            {hasCaptureForm(page) ? " · Captación" : ""}
          </p>
        </div>
      ),
    },
    {
      id: "objective",
      header: "Objetivo",
      cell: (page) => (
        <span className="text-sm text-foreground">{objectiveLabelForTemplate(page.template)}</span>
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
  ];

  return (
    <AdminModulePage
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: "Sitio web", href: "/admin/pages" },
        { label: "Páginas" },
      ]}
      title="Páginas"
      description="Crea y publica las páginas de tu sitio. Un solo editor para todas."
      actions={
        <>
          <a href={spacePublicHref(publicOrigin, "/")} target="_blank" rel="noopener noreferrer">
            <Button type="button" variant="outline">
              Ver sitio
              <ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
          </a>
          <Button type="button" disabled={loading} onClick={() => setWizardOpen(true)}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Crear página
          </Button>
        </>
      }
    >
      {loading ? <LoadingState variant="cards" className="mb-6" /> : null}

      <ContentGrid cols={4} className="mb-6">
        <KpiCard label="Páginas" value={pages.length} />
        <KpiCard label="Publicadas" value={publishedCount} variant="success" />
        <KpiCard label="Borradores" value={draftCount} variant="info" />
        <KpiCard
          label="Sin publicar"
          value={needsAttention}
          variant={needsAttention > 0 ? "warning" : "neutral"}
          delta={needsAttention > 0 ? "Borradores pendientes" : undefined}
        />
      </ContentGrid>

      <QuickActions
        className="mb-6"
        items={[
          {
            id: "new",
            title: "Crear página",
            description: "Elige qué quieres lograr",
            onClick: () => setWizardOpen(true),
            icon: <Plus className="h-5 w-5" />,
          },
          {
            id: "menus",
            title: "Menús",
            description: "Navegación del sitio",
            href: "/admin/menus",
            icon: <Menu className="h-5 w-5" />,
          },
          {
            id: "forms",
            title: "Formularios",
            description: "Captación de interesados",
            href: "/admin/portal/forms",
            icon: <Layers className="h-5 w-5" />,
          },
        ]}
      />

      <FilterBar
        className="mb-4"
        search={{
          placeholder: "Buscar por nombre o dirección…",
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
            {(
              [
                ["all", "Cualquier objetivo"],
                ["institutional", "Normal"],
                ["landing", "Captación"],
                ["program", "Servicio / curso"],
                ["contact", "Contacto"],
              ] as const
            ).map(([value, label]) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={objectiveFilter === value ? "primary" : "outline"}
                onClick={() => setObjectiveFilter(value)}
              >
                {label}
              </Button>
            ))}
          </div>
        }
        onReset={
          search || statusFilter !== "all" || objectiveFilter !== "all"
            ? () => {
                setSearch("");
                setStatusFilter("all");
                setObjectiveFilter("all");
              }
            : undefined
        }
      />

      {pages.length === 0 ? (
        <EmptyState
          title="Aún no hay páginas"
          description="Crea la primera página para empezar a armar tu sitio."
          action={{ label: "Crear página", onClick: () => setWizardOpen(true) }}
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
              {page.slug !== "/" && !page._id.endsWith(":home") && page._id !== "home" ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => deletePage(page)}>
                  Eliminar
                </Button>
              ) : null}
              {page.status === "published" ? (
                <a
                  href={spacePublicHref(publicOrigin, page.slug)}
                  className="px-2 text-xs text-secondary underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Eye className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
                  Ver
                </a>
              ) : null}
            </ColumnActions>
          )}
        />
      )}

      <CreatePageWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        tenant={tenant}
        onCreated={(pageId) => {
          setWizardOpen(false);
          router.push(`/admin/pages/${pageId}`);
        }}
        onError={(message) =>
          push({ title: "No se pudo crear la página", description: message, tone: "error" })
        }
      />

      {confirmDialog}
      {inputDialog}
    </AdminModulePage>
  );
}
