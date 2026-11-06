"use client";

import Link from "next/link";
import { useCallback, useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  Eye,
  Plus,
  RefreshCw,
} from "lucide-react";
import type { KpiAccent } from "@/components/admin/kit/dashboard/KpiCard";
import {
  ActionMenu,
  ActionMenuItem,
  AdminDataTable,
  ColumnActions,
  ContentGrid,
  KpiCard,
  LoadingState,
  SearchBar,
  StatusBadge,
  type AdminDataTableColumn,
} from "@/components/admin/kit";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import { useConfirmDialog } from "@/components/admin/kit/hooks/useConfirmDialog";
import { CreateFormDialog } from "@/components/admin/forms/CreateFormDialog";
import {
  spacePublicHref,
  useSpacePublicOrigin,
} from "@/components/admin/SpacePublicOrigin";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  listFormConvocatorias,
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
  tenantId: string;
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
  none: "General",
};

function FormName({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle?: string;
  href?: string;
}) {
  const heading = href ? (
    <Link href={href} className="forms-hub__title hover:underline">
      {title}
    </Link>
  ) : (
    <p className="forms-hub__title">{title}</p>
  );

  return (
    <div className="forms-hub__name">
      {heading}
      {subtitle ? (
        <p className="forms-hub__subtitle" title={subtitle}>
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function HubKpi({
  selected = false,
  onSelect,
  label,
  value,
  delta,
  accent,
  icon,
}: {
  selected?: boolean;
  onSelect?: () => void;
  label: string;
  value: number;
  delta: string;
  accent: KpiAccent;
  icon: ReactNode;
}) {
  const activate = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onSelect) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect();
    }
  };

  return (
    <KpiCard
      layout="classic"
      accent={accent}
      icon={icon}
      label={label}
      value={value}
      delta={delta}
      className={cn(
        "forms-hub__kpi text-left",
        onSelect && "cursor-pointer",
        selected && "forms-hub__kpi--selected"
      )}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-pressed={onSelect ? selected : undefined}
      onClick={onSelect}
      onKeyDown={onSelect ? activate : undefined}
    />
  );
}

export function FormsCenterClient({
  initialForms,
  tenantId,
  scope = "all",
}: FormsCenterClientProps) {
  const publicOrigin = useSpacePublicOrigin();
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

  const tenantConvocatorias = useMemo(
    () => listFormConvocatorias(tenantId),
    [tenantId]
  );
  const convocatoriaFormIds = useMemo(
    () => new Set(tenantConvocatorias.map((item) => item.formId)),
    [tenantConvocatorias]
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
      router.push(`/admin/portal/forms/${formId}?tab=formulario`);
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
      tenantConvocatorias.filter(
        (convocatoria) => !forms.find((item) => item._id === convocatoria.formId)
      ),
    [forms, tenantConvocatorias]
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
        <ColumnActions className="forms-hub__actions">
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
        <ColumnActions className="forms-hub__actions">
          <Link href={manageHref}>
            <Button type="button" variant="primary" size="sm">
              {convocatoria ? "Ir a operación" : "Gestionar respuestas"}
            </Button>
          </Link>
          <ActionMenu label="Más acciones">
            <ActionMenuItem href={`${formDetailHref}${convocatoria ? "?tab=participantes" : ""}`}>
              {convocatoria ? "Editar participantes" : "Ver detalle"}
            </ActionMenuItem>
            <ActionMenuItem href={`${formDetailHref}?tab=formulario`}>
              Editar formulario
            </ActionMenuItem>
            <ActionMenuItem href={`${formDetailHref}?tab=experiencia`}>
              Más opciones · Presentación
            </ActionMenuItem>
            <ActionMenuItem onClick={() => handleToggle(form, "active")}>Desactivar</ActionMenuItem>
            <ActionMenuItem onClick={() => handleToggle(form, "visible")}>
              {form.visible ? "Ocultar del portal" : "Publicar en portal"}
            </ActionMenuItem>
            {canOpenDirectLink(form) ? (
              <ActionMenuItem href={spacePublicHref(publicOrigin, publicFormUrl(form._id))} external>
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
      <ColumnActions className="forms-hub__actions">
        <Link href={`${formDetailHref}${convocatoria ? "?tab=participantes" : "?tab=formulario"}`}>
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
            <ActionMenuItem href={spacePublicHref(publicOrigin, publicFormUrl(form._id))} external>
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
            <FormName
              title={convocatoria.title}
              subtitle={landing?.subheadline ?? convocatoria.description}
            />
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
          <FormName
            title={title}
            subtitle={subtitle}
            href={`/admin/portal/forms/${form._id}`}
          />
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
          return <span className="forms-hub__tipo forms-hub__tipo--convocatoria">Convocatoria</span>;
        }
        const tipo = getFormTipo(row.form._id, convocatoriaFormIds);
        return (
          <span
            className={cn(
              "forms-hub__tipo",
              tipo === "convocatoria" && "forms-hub__tipo--convocatoria",
              tipo === "landing" && "forms-hub__tipo--landing"
            )}
          >
            {tipoLabel[tipo]}
          </span>
        );
      },
    },
  ];

  const filtersDirty = Boolean(search) || filter !== "live" || publishFilter !== "all";
  const portalHref = spacePublicHref(publicOrigin, "/");

  return (
    <AdminModulePage
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: "Sitio web", href: "/admin/config" },
        { label: "Formularios" },
      ]}
      title="Formularios"
      description="Crea, publica y archiva los formularios del sitio."
      actions={
        <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              window.open(portalHref, publicOrigin ? "_blank" : "_self", "noopener,noreferrer");
            }}
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            Ver portal
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleSeed()}
            loading={loading}
            disabled={loading}
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Formularios base
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Nuevo formulario
          </Button>
        </>
      }
    >
      <div className="forms-hub">
      {error ? (
        <div className="rounded-lg border border-[var(--state-danger-border)] bg-[var(--state-danger-bg)] px-4 py-3 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      ) : null}

      {loading ? <LoadingState variant="cards" /> : null}

      <ContentGrid cols={4}>
        <HubKpi
          accent="primary"
          icon={<ClipboardList className="h-4 w-4" />}
          label="En uso"
          value={activeForms.length}
          delta="Sin archivar"
          selected={filter === "live" && publishFilter === "all"}
          onSelect={() => {
            setFilter("live");
            setPublishFilter("all");
          }}
        />
        <HubKpi
          accent="success"
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Activos"
          value={activeCount}
          delta="Pueden recibir respuestas"
        />
        <HubKpi
          accent="info"
          icon={<Eye className="h-4 w-4" />}
          label="En el portal"
          value={publishedCount}
          delta="Visibles en el sitio"
          selected={filter === "live" && publishFilter === "published"}
          onSelect={() => {
            setFilter("live");
            setPublishFilter("published");
          }}
        />
        <HubKpi
          accent="neutral"
          icon={<Archive className="h-4 w-4" />}
          label="Archivados"
          value={archivedForms.length}
          delta="Fuera del sitio"
          selected={filter === "archived"}
          onSelect={() => setFilter("archived")}
        />
      </ContentGrid>

      <section className="forms-hub__workspace" aria-label="Listado de formularios">
        <div className="forms-hub__toolbar">
          <div className="forms-hub__segments" role="group" aria-label="Archivo">
            <button
              type="button"
              className={cn("forms-hub__segment", filter === "live" && "forms-hub__segment--active")}
              aria-pressed={filter === "live"}
              onClick={() => setFilter("live")}
            >
              En uso
              <span className="forms-hub__segment-count">{activeForms.length}</span>
            </button>
            <button
              type="button"
              className={cn(
                "forms-hub__segment",
                filter === "archived" && "forms-hub__segment--active"
              )}
              aria-pressed={filter === "archived"}
              onClick={() => setFilter("archived")}
            >
              Archivados
              <span className="forms-hub__segment-count">{archivedForms.length}</span>
            </button>
          </div>

          {filter === "live" ? (
            <div className="forms-hub__segments" role="group" aria-label="Publicación">
              {(
                [
                  ["all", "Todos"],
                  ["published", "Publicados"],
                  ["unpublished", "No publicados"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={cn(
                    "forms-hub__segment",
                    publishFilter === value && "forms-hub__segment--active"
                  )}
                  aria-pressed={publishFilter === value}
                  onClick={() => setPublishFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}

          <SearchBar
            className="forms-hub__search"
            placeholder="Buscar por nombre…"
            value={search}
            onChange={setSearch}
          />

          {filtersDirty ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setFilter("live");
                setPublishFilter("all");
              }}
            >
              Limpiar
            </Button>
          ) : null}
        </div>

      <AdminDataTable
        className="forms-hub__table"
        columns={columns}
        data={tableRows}
        rowActionsLabel="Acciones"
        rowKey={(row) =>
          row.kind === "form" ? row.form._id : `orphan-${row.convocatoria.slug}`
        }
        emptyTitle={
          filter === "archived"
            ? "No hay formularios archivados"
            : "Aún no hay formularios"
        }
        emptyDescription={
          filter === "archived"
            ? "Cuando archives uno, aparecerá aquí."
            : "Crea uno nuevo o trae los formularios base."
        }
        rowActions={(row) => {
          if (row.kind === "orphan") {
            return (
              <ColumnActions className="forms-hub__actions">
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
      </section>
      </div>

      <CreateFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => void refresh()}
      />
      {dialog}
    </AdminModulePage>
  );
}
