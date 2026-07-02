"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  ClipboardList,
  ExternalLink,
  Eye,
  FileText,
  MapPin,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { AdminModuleLayout } from "@/components/admin/AdminModuleLayout";
import {
  AdminModuleCenter,
  AdminModuleHero,
  AdminModuleSectionHeader,
  AdminModuleStats,
} from "@/components/admin/AdminModuleCenter";
import { CreateFormDialog } from "@/components/admin/forms/CreateFormDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  FORM_CONVOCATORIAS,
  formatConvocatoriaDate,
  getConvocatoriaByFormId,
  getFormLandingByFormId,
  getSupersededFormIds,
  isExperienceFormArchived,
  publicFormUrl,
  type FormConvocatoria,
} from "@/lib/admin/forms-center";
import type { FormLandingTheme } from "@/lib/admin/forms-center";
import { ADMIN_PANEL_META } from "@/lib/admin/module-panels";
import type { ExperienceFormDefinition } from "@/types/experience-forms";

type FormsFilter = "live" | "archived";

interface FormsCenterClientProps {
  initialForms: ExperienceFormDefinition[];
}

export function FormsCenterClient({ initialForms }: FormsCenterClientProps) {
  const router = useRouter();
  const [forms, setForms] = useState(initialForms);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [filter, setFilter] = useState<FormsFilter>("live");
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const convocatoriaFormIds = new Set(FORM_CONVOCATORIAS.map((item) => item.formId));

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
    if (
      !window.confirm(
        `¿Archivar "${form.name}"? Pasará a la pestaña Archivados y dejará de mostrarse en el portal.`
      )
    ) {
      return;
    }
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
    if (
      !window.confirm(
        `¿Eliminar definitivamente "${form.name}"?\n\nSe borrará el formulario y todas sus respuestas. Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }
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

  const activeForms = forms.filter((f) => !isExperienceFormArchived(f));
  const archivedForms = forms.filter((f) => isExperienceFormArchived(f));
  const supersededFormIds = getSupersededFormIds();
  const publishedForms = activeForms.filter(
    (f) => f.active && f.visible && !supersededFormIds.has(f._id)
  );
  const unpublishedForms = activeForms.filter(
    (f) => !f.active || !f.visible || supersededFormIds.has(f._id)
  );
  const orphanConvocatorias = FORM_CONVOCATORIAS.filter(
    (convocatoria) => !forms.find((item) => item._id === convocatoria.formId)
  );

  const activeCount = activeForms.filter((f) => f.active).length;
  const publishedCount = publishedForms.length;

  return (
    <AdminModuleLayout
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: "Portal", href: "/admin/pages" },
        { label: "Centro de formularios" },
      ]}
      title="Centro de formularios"
      description="Convocatorias, confirmaciones de asistencia, justificaciones y otros formularios del portal."
      actions={
        <>
          <Button variant="primary" type="button" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Nuevo formulario
          </Button>
          <Link href="/" target="_blank">
            <Button variant="outline" type="button">
              Ver portal público
              <ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
          <Button variant="secondary" onClick={handleSeed} loading={loading}>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Sincronizar formularios base
          </Button>
        </>
      }
    >
      <AdminModuleCenter className="admin-forms-center">
        {error ? <p className="mb-4 text-sm font-medium text-primary">{error}</p> : null}

        <AdminModuleHero {...ADMIN_PANEL_META.forms} />

        <AdminModuleStats
          items={[
            { label: "Formularios totales", value: activeForms.length, icon: ClipboardList, tone: "total" },
            { label: "Activos", value: activeCount, icon: Sparkles, tone: "active" },
            { label: "Publicados en portal", value: publishedCount, icon: Eye, tone: "published" },
          ]}
        />

        <div className="admin-forms-center__filters" role="toolbar" aria-label="Filtrar formularios">
          <FilterButton active={filter === "live"} onClick={() => setFilter("live")}>
            En uso ({activeForms.length})
          </FilterButton>
          <FilterButton active={filter === "archived"} onClick={() => setFilter("archived")}>
            Archivados ({archivedForms.length})
          </FilterButton>
        </div>

        {filter === "live" ? (
          <>
            <section>
              <AdminModuleSectionHeader
                icon={Eye}
                title="Publicados en el portal"
                description="Formularios activos y visibles para el público. Aparecen en /formularios y aceptan respuestas."
              />

              {publishedForms.length > 0 ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {publishedForms.map((form) => (
                    <FormFeaturedCard
                      key={form._id}
                      form={form}
                      convocatoria={getConvocatoriaByFormId(form._id)}
                      onToggle={handleToggle}
                      onArchive={handleArchive}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">
                  No hay formularios publicados. Activa y publica uno desde la sección de abajo.
                </p>
              )}
            </section>

            <section className="mt-10">
              <AdminModuleSectionHeader
                icon={ClipboardList}
                title="No publicados o cerrados"
                description="Formularios ocultos, inactivos o en borrador. Publícalos para moverlos arriba."
              />

              <div className="grid gap-3">
                {unpublishedForms.map((form) => (
                  <FormRow
                    key={form._id}
                    form={form}
                    isConvocatoria={convocatoriaFormIds.has(form._id)}
                    onToggle={handleToggle}
                    onDuplicate={handleDuplicate}
                    onArchive={handleArchive}
                    onRestore={handleRestore}
                    onPurge={handlePurge}
                  />
                ))}

                {orphanConvocatorias.map((convocatoria) => (
                  <OrphanConvocatoriaRow
                    key={convocatoria.slug}
                    convocatoria={convocatoria}
                    restoring={restoringId === convocatoria.formId}
                    onRestore={() => handleRestoreConvocatoria(convocatoria.formId)}
                  />
                ))}
              </div>

              {unpublishedForms.length === 0 && orphanConvocatorias.length === 0 ? (
                <p className="text-sm text-muted">No hay formularios pendientes de publicar.</p>
              ) : null}
            </section>
          </>
        ) : (
          <section>
            <AdminModuleSectionHeader
              icon={ClipboardList}
              title="Formularios archivados"
              description="Formularios retirados del portal. Puedes restaurarlos o eliminarlos definitivamente."
            />

            <div className="grid gap-3">
              {archivedForms.map((form) => (
                <FormRow
                  key={form._id}
                  form={form}
                  isConvocatoria={convocatoriaFormIds.has(form._id)}
                  isArchived
                  onToggle={handleToggle}
                  onDuplicate={handleDuplicate}
                  onArchive={handleArchive}
                  onRestore={handleRestore}
                  onPurge={handlePurge}
                />
              ))}
            </div>

            {archivedForms.length === 0 ? (
              <p className="text-sm text-muted">No hay formularios archivados.</p>
            ) : null}
          </section>
        )}

      </AdminModuleCenter>

      <CreateFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => void refresh()}
      />
    </AdminModuleLayout>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`admin-forms-center__filter-btn${active ? " admin-forms-center__filter-btn--active" : ""}`}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

function featuredHeaderClass(theme: FormLandingTheme | undefined): string {
  const base = "admin-forms-center__convocatoria-header";
  if (!theme) return base;
  return `${base} admin-forms-center__featured-header--${theme}`;
}

function FormFeaturedCard({
  form,
  convocatoria,
  onToggle,
  onArchive,
}: {
  form: ExperienceFormDefinition;
  convocatoria?: FormConvocatoria;
  onToggle: (form: ExperienceFormDefinition, field: "active" | "visible") => void;
  onArchive: (form: ExperienceFormDefinition) => void;
}) {
  const landing = getFormLandingByFormId(form._id);
  const theme = landing?.theme;
  const title = convocatoria?.title ?? landing?.headline ?? form.name;
  const subtitle = convocatoria
    ? `${formatConvocatoriaDate(convocatoria.date)} · ${convocatoria.location}`
    : landing?.eyebrow ?? form.description;

  return (
    <Card className="admin-forms-center__convocatoria-card">
      <div className={featuredHeaderClass(theme)}>
        <div className="admin-forms-center__convocatoria-header-top">
          <div>
            <h3 className="admin-forms-center__convocatoria-title">{title}</h3>
            {subtitle ? (
              <p className="admin-forms-center__convocatoria-subtitle">{subtitle}</p>
            ) : null}
          </div>
          <span className="admin-forms-center__badge admin-forms-center__badge--active">Activo</span>
          <span
            className={`admin-forms-center__badge ${
              form.visible
                ? "admin-forms-center__badge--published"
                : "admin-forms-center__badge--hidden"
            }`}
          >
            {form.visible ? "Publicado" : "Oculto"}
          </span>
          {convocatoria ? (
            <span className="admin-forms-center__badge admin-forms-center__badge--landing">
              Convocatoria
            </span>
          ) : landing ? (
            <span className="admin-forms-center__badge admin-forms-center__badge--landing">
              Con landing
            </span>
          ) : null}
        </div>

        {convocatoria ? (
          <div className="admin-forms-center__convocatoria-meta">
            <span className="admin-forms-center__meta-pill">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              {formatConvocatoriaDate(convocatoria.date)}
            </span>
            <span className="admin-forms-center__meta-pill">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {convocatoria.location}
            </span>
          </div>
        ) : null}
      </div>

      <div className="admin-forms-center__convocatoria-body">
        <p className="admin-forms-center__convocatoria-desc">
          {landing?.subheadline ?? convocatoria?.description ?? form.description}
        </p>

        {landing?.motivational ? (
          <blockquote className="admin-forms-center__motivational">
            <Sparkles className="admin-forms-center__motivational-icon" aria-hidden="true" />
            <span>{landing.motivational}</span>
          </blockquote>
        ) : null}

        <div className="admin-forms-center__actions">
          <Link
            href={
              convocatoria
                ? `/admin/portal/forms/convocatorias/${convocatoria.slug}`
                : `/admin/portal/forms/${form._id}?tab=respuestas`
            }
            className="admin-forms-center__btn admin-forms-center__btn--primary"
          >
            Gestionar respuestas
          </Link>
          <Link
            href={`/admin/portal/forms/${form._id}?tab=experiencia`}
            className="admin-forms-center__btn admin-forms-center__btn--outline"
          >
            Editar experiencia
          </Link>
          <Link
            href={`/admin/portal/forms/${form._id}?tab=campos`}
            className="admin-forms-center__btn admin-forms-center__btn--outline"
          >
            Editar campos
          </Link>
          <button
            type="button"
            className="admin-forms-center__ghost-btn"
            onClick={() => onToggle(form, "active")}
          >
            Desactivar
          </button>
          <button
            type="button"
            className="admin-forms-center__ghost-btn"
            onClick={() => onToggle(form, "visible")}
          >
            {form.visible ? "Ocultar" : "Publicar"}
          </button>
          {form.visible ? (
            <Link
              href={publicFormUrl(form._id)}
              target="_blank"
              className="admin-forms-center__btn admin-forms-center__btn--accent"
            >
              Ver landing pública
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          ) : null}
          <button
            type="button"
            className="admin-forms-center__ghost-btn admin-forms-center__ghost-btn--danger"
            onClick={() => onArchive(form)}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Archivar
          </button>
        </div>
      </div>
    </Card>
  );
}

function OrphanConvocatoriaRow({
  convocatoria,
  restoring,
  onRestore,
}: {
  convocatoria: FormConvocatoria;
  restoring: boolean;
  onRestore: () => void;
}) {
  const landing = convocatoria.landing;

  return (
    <Card className="admin-forms-center__form-row admin-forms-center__form-row--convocatoria">
      <div className="admin-forms-center__form-row-inner">
        <div className="admin-forms-center__form-content">
          <span
            className="admin-forms-center__form-icon admin-forms-center__form-icon--convocatoria"
            aria-hidden="true"
          >
            <Calendar className="h-4 w-4" />
          </span>
          <div>
            <h3 className="admin-forms-center__form-title">{convocatoria.title}</h3>
            <p className="admin-forms-center__form-desc">
              {landing?.subheadline ?? convocatoria.description}
            </p>
            <div className="admin-forms-center__form-badges">
              <span className="admin-forms-center__badge admin-forms-center__badge--hidden">
                Sin formulario
              </span>
              <span className="admin-forms-center__badge admin-forms-center__badge--landing">
                Convocatoria
              </span>
            </div>
          </div>
        </div>
        <div className="admin-forms-center__form-actions">
          <button
            type="button"
            className="admin-forms-center__btn admin-forms-center__btn--primary admin-forms-center__btn--sm"
            onClick={onRestore}
            disabled={restoring}
          >
            {restoring ? "Creando formulario…" : "Crear formulario de convocatoria"}
          </button>
        </div>
      </div>
    </Card>
  );
}

function themeClass(theme: FormLandingTheme | undefined): string {
  if (!theme) return "";
  return `admin-forms-center__form-row--${theme}`;
}

function iconClass(theme: FormLandingTheme | undefined): string {
  if (!theme) return "admin-forms-center__form-icon--default";
  return `admin-forms-center__form-icon--${theme}`;
}

function FormRow({
  form,
  isConvocatoria,
  isArchived,
  onToggle,
  onDuplicate,
  onArchive,
  onRestore,
  onPurge,
}: {
  form: ExperienceFormDefinition;
  isConvocatoria?: boolean;
  isArchived?: boolean;
  onToggle: (form: ExperienceFormDefinition, field: "active" | "visible") => void;
  onDuplicate: (form: ExperienceFormDefinition) => void;
  onArchive: (form: ExperienceFormDefinition) => void;
  onRestore: (form: ExperienceFormDefinition) => void;
  onPurge: (form: ExperienceFormDefinition) => void;
}) {
  const landing = getFormLandingByFormId(form._id);
  const theme = landing?.theme;

  return (
    <Card className={`admin-forms-center__form-row ${themeClass(theme)}`}>
      <div className="admin-forms-center__form-row-inner">
        <div className="admin-forms-center__form-content">
          <span
            className={`admin-forms-center__form-icon ${iconClass(theme)}`}
            aria-hidden="true"
          >
            <FileText className="h-4 w-4" />
          </span>
          <div>
            <h3 className="admin-forms-center__form-title">
              <Link href={`/admin/portal/forms/${form._id}`}>
                {landing?.headline ?? form.name}
              </Link>
            </h3>
            <p className="admin-forms-center__form-desc">
              {landing?.subheadline ?? form.description ?? `Destino: ${form.destination}`}
            </p>
            <div className="admin-forms-center__form-badges">
              <span
                className={`admin-forms-center__badge ${
                  form.active
                    ? "admin-forms-center__badge--active"
                    : "admin-forms-center__badge--closed"
                }`}
              >
                {form.active ? "Activo" : "Inactivo"}
              </span>
              <span
                className={`admin-forms-center__badge ${
                  form.visible
                    ? "admin-forms-center__badge--published"
                    : "admin-forms-center__badge--hidden"
                }`}
              >
                {form.visible ? "Publicado" : "Oculto"}
              </span>
              {landing ? (
                <span className="admin-forms-center__badge admin-forms-center__badge--landing">
                  Con landing
                </span>
              ) : null}
              {isConvocatoria ? (
                <span className="admin-forms-center__badge admin-forms-center__badge--landing">
                  Convocatoria
                </span>
              ) : null}
              {isArchived ? (
                <span className="admin-forms-center__badge admin-forms-center__badge--hidden">
                  Archivado
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="admin-forms-center__form-actions">
          {isArchived ? (
            <>
              <button
                type="button"
                className="admin-forms-center__ghost-btn"
                onClick={() => onRestore(form)}
              >
                Restaurar
              </button>
              <button
                type="button"
                className="admin-forms-center__ghost-btn admin-forms-center__ghost-btn--danger"
                onClick={() => onPurge(form)}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Eliminar definitivamente
              </button>
              <Link
                href={`/admin/portal/forms/${form._id}`}
                className="admin-forms-center__btn admin-forms-center__btn--outline admin-forms-center__btn--sm"
              >
                Ver detalle
              </Link>
            </>
          ) : (
            <>
          <button
            type="button"
            className="admin-forms-center__ghost-btn"
            onClick={() => onToggle(form, "active")}
          >
            {form.active ? "Desactivar" : "Activar"}
          </button>
          <button
            type="button"
            className="admin-forms-center__ghost-btn"
            onClick={() => onToggle(form, "visible")}
          >
            {form.visible ? "Ocultar" : "Publicar"}
          </button>
          <button
            type="button"
            className="admin-forms-center__ghost-btn"
            onClick={() => onDuplicate(form)}
          >
            Duplicar
          </button>
          <button
            type="button"
            className="admin-forms-center__ghost-btn admin-forms-center__ghost-btn--danger"
            onClick={() => onArchive(form)}
          >
            Archivar
          </button>
          {form.visible ? (
            <Link
              href={publicFormUrl(form._id)}
              target="_blank"
              className="admin-forms-center__btn admin-forms-center__btn--outline admin-forms-center__btn--sm"
            >
              Ver
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </Link>
          ) : null}
          <Link
            href={`/admin/portal/forms/${form._id}?tab=campos`}
            className="admin-forms-center__btn admin-forms-center__btn--primary admin-forms-center__btn--sm"
          >
            Gestionar
          </Link>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
