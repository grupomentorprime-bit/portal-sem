"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, ExternalLink, Eye, Plus, RefreshCw } from "lucide-react";
import {
  ActionMenu,
  ActionMenuItem,
  AdminDataTable,
  ColumnActions,
  ContentGrid,
  FilterBar,
  KpiCard,
  LoadingState,
  QuickActions,
  StatusBadge,
  type AdminDataTableColumn,
} from "@/components/admin/kit";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import { useConfirmDialog } from "@/components/admin/kit/hooks/useConfirmDialog";
import { CreateFormDialog } from "@/components/admin/forms/CreateFormDialog";
import { Button } from "@/components/ui/button";
import {
  FORM_CONVOCATORIAS,
  formatConvocatoriaDate,
  getConvocatoriaByFormId,
  getFormLandingByFormId,
  getSupersededFormIds,
  isExperienceFormArchived,
  isExperienceFormPrivate,
  isPrivateExperienceForm,
  PRIVATE_EXPERIENCE_FORM_LABEL,
  publicFormUrl,
  type FormConvocatoria,
} from "@/lib/admin/forms-center";
import type { ExperienceFormDefinition } from "@/types/experience-forms";

type FormsFilter = "live" | "archived";
type PublishFilter = "all" | "published" | "unpublished";

type FormTableRow =
  | { kind: "form"; form: ExperienceFormDefinition }
  | { kind: "orphan"; convocatoria: FormConvocatoria };

interface FormsCenterClientProps {
  initialForms: ExperienceFormDefinition[];
  scope?: "all" | "convocatorias";
}

function isFormPublished(
  form: ExperienceFormDefinition,
  supersededFormIds: Set<string>
): boolean {
  return form.active && form.visible && !supersededFormIds.has(form._id) && !isExperienceFormPrivate(form);
}

function canOpenDirectLink(form: ExperienceFormDefinition): boolean {
  return form.active && !isExperienceFormArchived(form) && (form.visible || isExperienceFormPrivate(form));
}

function getFormTipo(
  formId: string,
  convocatoriaFormIds: Set<string>
): "convocatoria" | "landing" | "none" {
  if (convocatoriaFormIds.has(formId)) return "convocatoria";
  if (getFormLandingByFormId(formId)) return "landing";
  return "none";
}

const tipoLabel: Record<"convocatoria" | "landing" | "none", string> = {
  convocatoria: "Convocatoria",
  landing: "Con landing",
  none: "—",
};

export function FormsCenterClient({ initialForms, scope = "all" }: FormsCenterClientProps) {
  const isConvocatoriasScope = scope === "convocatorias";
  const router = useRouter();
  const [forms, setForms] = useState(initialForms);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [filter, setFilter] = useState<FormsFilter>("live");
  const [publishFilter, setPublishFilter] = useState<PublishFilter>("all");
  const [search, setSearch] = useState("");
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const { confirm, dialog } = useConfirmDialog();

  const convocatoriaFormIds = useMemo(
    () => new Set(FORM_CONVOCATORIAS.map((item) => item.formId)),
    []
  );
  const supersededFormIds = useMemo(() => getSupersededFormIds(), []);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/experience/forms");
    const data = await res.json();
    if (data.ok) setForms(data.forms);
  }, []);

  const handleSeed = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/experience/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed: true }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Error al inicializar formularios.");
        return;
      }
      setForms(data.forms);
    } catch {
      setError("Error de red.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (form: ExperienceFormDefinition, field: "active" | "visible") => {
    await fetch(`/api/experience/forms/${form._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: !form[field] }),
    });
    await refresh();
  };

  const handleDuplicate = async (form: ExperienceFormDefinition) => {
    const res = await fetch(`/api/experience/forms/${form._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "duplicate" }),
    });
    const data = await res.json();
    if (data.ok) router.push(`/admin/portal/forms/${data.form._id}`);
  };

  const handleArchive = async (form: ExperienceFormDefinition) => {
    const ok = await confirm({
      title: "Archivar formulario",
      description: `¿Archivar "${form.name}"? Pasará a la pestaña Archivados y dejará de mostrarse en el portal.`,
      confirmLabel: "Archivar",
    });
    if (!ok) return;
    await fetch(`/api/experience/forms/${form._id}`, { method: "DELETE" });
    await refresh();
  };

  const handleRestore = async (form: ExperienceFormDefinition) => {
    await fetch(`/api/experience/forms/${form._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "restore" }),
    });
    await refresh();
  };

  const handlePurge = async (form: ExperienceFormDefinition) => {
    const ok = await confirm({
      title: "Eliminar definitivamente",
      description: `¿Eliminar definitivamente "${form.name}"?\n\nSe borrará el formulario y todas sus respuestas. Esta acción no se puede deshacer.`,
      confirmLabel: "Eliminar",
      destructive: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/experience/forms/${form._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "purge" }),
    });
    const data = await res.json();
    if (!data.ok) {
      setError(data.error ?? "No se pudo eliminar el formulario.");
      return;
    }
    await refresh();
  };

  const handleRestoreConvocatoria = async (formId: string) => {
    setRestoringId(formId);
    setError(null);
    try {
      const res = await fetch("/api/experience/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restoreDefaultId: formId }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo crear el formulario de la convocatoria.");
        return;
      }
      await refresh();
      router.push(`/admin/portal/forms/${formId}?tab=campos`);
    } catch {
      setError("Error de red al restaurar el formulario.");
    } finally {
      setRestoringId(null);
    }
  };

  const activeForms = useMemo(
    () => forms.filter((f) => !isExperienceFormArchived(f)),
    [forms]
  );
  const archivedForms = useMemo(
    () => forms.filter((f) => isExperienceFormArchived(f)),
    [forms]
  );
  const orphanConvocatorias = useMemo(
    () =>
      FORM_CONVOCATORIAS.filter(
        (convocatoria) => !forms.find((item) => item._id === convocatoria.formId)
      ),
    [forms]
  );

  const activeCount = useMemo(
    () => activeForms.filter((f) => f.active).length,
    [activeForms]
  );
  const publishedCount = useMemo(
    () => activeForms.filter((f) => isFormPublished(f, supersededFormIds)).length,
    [activeForms, supersededFormIds]
  );

  const tableRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    const matchesForm = (form: ExperienceFormDefinition) => {
      if (!query) return true;
      const landing = getFormLandingByFormId(form._id);
      const convocatoria = getConvocatoriaByFormId(form._id);
      const name = (convocatoria?.title ?? landing?.headline ?? form.name).toLowerCase();
      const desc = (
        landing?.subheadline ??
        convocatoria?.description ??
        form.description ??
        ""
      ).toLowerCase();
      return name.includes(query) || desc.includes(query);
    };

    const matchesOrphan = (convocatoria: FormConvocatoria) => {
      if (!query) return true;
      const landing = convocatoria.landing;
      const title = convocatoria.title.toLowerCase();
      const desc = (landing?.subheadline ?? convocatoria.description).toLowerCase();
      return title.includes(query) || desc.includes(query);
    };

    if (filter === "archived") {
      return archivedForms
        .filter(matchesForm)
        .filter((form) => !isConvocatoriasScope || convocatoriaFormIds.has(form._id))
        .map((form): FormTableRow => ({ kind: "form", form }));
    }

    let liveForms = activeForms;
    if (publishFilter === "published") {
      liveForms = liveForms.filter((f) => isFormPublished(f, supersededFormIds));
    } else if (publishFilter === "unpublished") {
      liveForms = liveForms.filter((f) => !isFormPublished(f, supersededFormIds));
    }

    const rows: FormTableRow[] = liveForms
      .filter(matchesForm)
      .filter((form) => !isConvocatoriasScope || convocatoriaFormIds.has(form._id))
      .map((form) => ({ kind: "form", form }));

    if (publishFilter === "all" || publishFilter === "unpublished") {
      rows.push(
        ...orphanConvocatorias
          .filter(matchesOrphan)
          .map((convocatoria): FormTableRow => ({ kind: "orphan", convocatoria }))
      );
    }

    return rows;
  }, [
    filter,
    publishFilter,
    search,
    activeForms,
    archivedForms,
    orphanConvocatorias,
    supersededFormIds,
    convocatoriaFormIds,
    isConvocatoriasScope,
  ]);

  const renderFormActions = (form: ExperienceFormDefinition) => {
    const archived = isExperienceFormArchived(form);
    const published = isFormPublished(form, supersededFormIds);
    const convocatoria = getConvocatoriaByFormId(form._id);
    const formDetailHref = `/admin/portal/forms/${form._id}`;
    const directLinkLabel = isExperienceFormPrivate(form) ? "Abrir enlace" : "Ver landing";

    if (archived) {
      return (
        <ColumnActions>
          <Button type="button" variant="primary" size="sm" onClick={() => handleRestore(form)}>
            Restaurar
          </Button>
          <ActionMenu label="Más acciones">
            <ActionMenuItem href={formDetailHref}>Ver detalle</ActionMenuItem>
            <ActionMenuItem destructive onClick={() => handlePurge(form)}>
              Eliminar definitivamente
            </ActionMenuItem>
          </ActionMenu>
        </ColumnActions>
      );
    }

    if (published) {
      const manageHref = convocatoria
        ? `/admin/portal/asuntos-estudiantiles/${encodeURIComponent(form._id)}`
        : `${formDetailHref}?tab=respuestas`;

      return (
        <ColumnActions>
          <Link href={manageHref}>
            <Button type="button" variant="primary" size="sm">
              {convocatoria ? "Ir a operación" : "Gestionar respuestas"}
            </Button>
          </Link>
          <ActionMenu label="Más acciones">
            <ActionMenuItem href={`${formDetailHref}${convocatoria ? "?tab=participantes" : ""}`}>
              {convocatoria ? "Editar participantes" : "Ver detalle"}
            </ActionMenuItem>
            <ActionMenuItem href={`${formDetailHref}?tab=experiencia`}>
              Editar experiencia
            </ActionMenuItem>
            <ActionMenuItem href={`${formDetailHref}?tab=campos`}>Editar campos</ActionMenuItem>
            <ActionMenuItem onClick={() => handleToggle(form, "active")}>Desactivar</ActionMenuItem>
            <ActionMenuItem onClick={() => handleToggle(form, "visible")}>
              {form.visible ? "Ocultar del portal" : "Publicar en portal"}
            </ActionMenuItem>
            {canOpenDirectLink(form) ? (
              <ActionMenuItem href={publicFormUrl(form._id)} external>
                {directLinkLabel}
              </ActionMenuItem>
            ) : null}
            <ActionMenuItem destructive onClick={() => handleArchive(form)}>
              Archivar
            </ActionMenuItem>
          </ActionMenu>
        </ColumnActions>
      );
    }

    return (
      <ColumnActions>
        <Link href={`${formDetailHref}${convocatoria ? "?tab=participantes" : "?tab=campos"}`}>
          <Button type="button" variant="primary" size="sm">
            {convocatoria ? "Configurar" : "Gestionar"}
          </Button>
        </Link>
        <ActionMenu label="Más acciones">
          <ActionMenuItem onClick={() => handleToggle(form, "active")}>
            {form.active ? "Desactivar" : "Activar"}
          </ActionMenuItem>
          <ActionMenuItem onClick={() => handleToggle(form, "visible")}>
            {form.visible ? "Ocultar del portal" : "Publicar en portal"}
          </ActionMenuItem>
          <ActionMenuItem onClick={() => handleDuplicate(form)}>Duplicar</ActionMenuItem>
          {canOpenDirectLink(form) ? (
            <ActionMenuItem href={publicFormUrl(form._id)} external>
              {directLinkLabel}
            </ActionMenuItem>
          ) : null}
          <ActionMenuItem destructive onClick={() => handleArchive(form)}>
            Archivar
          </ActionMenuItem>
        </ActionMenu>
      </ColumnActions>
    );
  };

  const columns: AdminDataTableColumn<FormTableRow>[] = [
    {
      id: "name",
      header: "Formulario",
      cell: (row) => {
        if (row.kind === "orphan") {
          const { convocatoria } = row;
          const landing = convocatoria.landing;
          return (
            <div>
              <p className="font-medium text-foreground">{convocatoria.title}</p>
              <p className="text-xs text-muted">
                {landing?.subheadline ?? convocatoria.description}
              </p>
            </div>
          );
        }

        const { form } = row;
        const landing = getFormLandingByFormId(form._id);
        const convocatoria = getConvocatoriaByFormId(form._id);
        const title = convocatoria?.title ?? landing?.headline ?? form.name;
        const subtitle = convocatoria
          ? `${formatConvocatoriaDate(convocatoria.date)} · ${convocatoria.location}`
          : (landing?.subheadline ?? form.description);

        return (
          <div>
            <p className="font-medium text-foreground">
              <Link href={`/admin/portal/forms/${form._id}`} className="hover:underline">
                {title}
              </Link>
            </p>
            {subtitle ? <p className="text-xs text-muted">{subtitle}</p> : null}
          </div>
        );
      },
    },
    {
      id: "status",
      header: "Estado",
      cell: (row) => {
        if (row.kind === "orphan") {
          return <StatusBadge tone="pending" label="Sin formulario" />;
        }
        return (
          <StatusBadge tone={row.form.active ? "active" : "inactive"} />
        );
      },
    },
    {
      id: "portal",
      header: "Portal",
      cell: (row) => {
        if (row.kind === "orphan") {
          return <StatusBadge tone="inactive" label="Oculto" />;
        }
        const published = isFormPublished(row.form, supersededFormIds);
        const isPrivate = isExperienceFormPrivate(row.form);
        return (
          <StatusBadge
            tone={isPrivate ? "neutral" : published ? "active" : "inactive"}
            label={isPrivate ? PRIVATE_EXPERIENCE_FORM_LABEL : published ? "Publicado" : "Oculto"}
          />
        );
      },
    },
    {
      id: "tipo",
      header: "Tipo",
      cell: (row) => {
        if (row.kind === "orphan") {
          return <span className="text-sm text-muted">Convocatoria</span>;
        }
        const tipo = getFormTipo(row.form._id, convocatoriaFormIds);
        return <span className="text-sm text-muted">{tipoLabel[tipo]}</span>;
      },
    },
  ];

  return (
    <AdminModulePage
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: "Formularios" },
        { label: "Gestión" },
      ]}
      title="Gestión de formularios"
      description="Crea, configura y publica formularios institucionales."
    >
      {error ? (
        <div className="mb-4 rounded-lg border border-[var(--state-danger-border)] bg-[var(--state-danger-bg)] px-4 py-3 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      ) : null}

      {loading ? <LoadingState variant="cards" className="mb-6" /> : null}

      <ContentGrid cols={4} className="mb-6">
        <KpiCard label="Formularios activos" value={activeForms.length} />
        <KpiCard label="Activos" value={activeCount} variant="success" />
        <KpiCard label="Publicados en portal" value={publishedCount} variant="info" />
        <KpiCard label="Archivados" value={archivedForms.length} variant="neutral" />
      </ContentGrid>

      <QuickActions
        className="mb-6"
        items={[
          {
            id: "new",
            title: "Nuevo formulario",
            description: "Crear formulario personalizado",
            onClick: () => setCreateOpen(true),
            icon: <Plus className="h-5 w-5" />,
          },
          {
            id: "portal",
            title: "Ver portal",
            description: "Abrir sitio público",
            href: "/",
            icon: <ExternalLink className="h-5 w-5" />,
          },
          {
            id: "seed",
            title: "Sincronizar",
            description: "Formularios base del portal",
            onClick: handleSeed,
            icon: <RefreshCw className="h-5 w-5" />,
          },
        ]}
      />

      <FilterBar
        className="mb-4"
        search={{
          placeholder: "Buscar por nombre…",
          value: search,
          onChange: setSearch,
        }}
        filters={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={filter === "live" ? "primary" : "outline"}
              onClick={() => setFilter("live")}
            >
              <ClipboardList className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              En uso ({activeForms.length})
            </Button>
            <Button
              type="button"
              size="sm"
              variant={filter === "archived" ? "primary" : "outline"}
              onClick={() => setFilter("archived")}
            >
              Archivados ({archivedForms.length})
            </Button>
            {filter === "live" ? (
              <>
                {(["all", "published", "unpublished"] as const).map((value) => (
                  <Button
                    key={value}
                    type="button"
                    size="sm"
                    variant={publishFilter === value ? "primary" : "outline"}
                    onClick={() => setPublishFilter(value)}
                  >
                    {value === "all" ? (
                      "Todos"
                    ) : value === "published" ? (
                      <>
                        <Eye className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                        Publicados
                      </>
                    ) : (
                      "No publicados"
                    )}
                  </Button>
                ))}
              </>
            ) : null}
          </div>
        }
        onReset={
          search || filter !== "live" || publishFilter !== "all"
            ? () => {
                setSearch("");
                setFilter("live");
                setPublishFilter("all");
              }
            : undefined
        }
      />

      <AdminDataTable
        columns={columns}
        data={tableRows}
        rowKey={(row) =>
          row.kind === "form" ? row.form._id : `orphan-${row.convocatoria.slug}`
        }
        emptyTitle={
          filter === "archived"
            ? "Sin formularios archivados"
            : "Sin formularios"
        }
        emptyDescription={
          filter === "archived"
            ? "Los formularios archivados aparecerán aquí."
            : "Crea uno nuevo o sincroniza los formularios base."
        }
        rowActions={(row) => {
          if (row.kind === "orphan") {
            return (
              <ColumnActions>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => handleRestoreConvocatoria(row.convocatoria.formId)}
                  disabled={restoringId === row.convocatoria.formId}
                >
                  {restoringId === row.convocatoria.formId
                    ? "Creando formulario…"
                    : "Crear formulario"}
                </Button>
              </ColumnActions>
            );
          }
          return renderFormActions(row.form);
        }}
      />

      <CreateFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => void refresh()}
      />
      {dialog}
    </AdminModulePage>
  );
}
