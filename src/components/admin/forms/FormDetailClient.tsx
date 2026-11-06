"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Archive,
  Check,
  ClipboardList,
  ExternalLink,
  Eye,
  FileText,
  HelpCircle,
  Inbox,
  Layout,
  Link2,
  Monitor,
  MoreHorizontal,
  Palette,
  Play,
  Search,
  Settings,
  Trash2,
  Users,
} from "lucide-react";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import { AdminModuleCenter } from "@/components/admin/AdminModuleCenter";
import { ConvocatoriaRosterPanel } from "@/components/admin/forms/ConvocatoriaRosterPanel";
import { ExperienceFormFieldsEditor } from "@/components/admin/forms/ExperienceFormFieldsEditor";
import { FormExperienceEditor } from "@/components/admin/forms/FormExperienceEditor";
import { FormSimpleVisualEditor } from "@/components/admin/forms/FormSimpleVisualEditor";
import { FormSubmissionsPanel } from "@/components/admin/forms/FormSubmissionsPanel";
import { useConfirmDialog } from "@/components/admin/kit/hooks/useConfirmDialog";
import { spacePublicHref, useSpacePublicOrigin } from "@/components/admin/SpacePublicOrigin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  publicFormUrl,
  isExperienceFormArchived,
  type FormConvocatoria,
  isPrivateExperienceForm,
  PRIVATE_EXPERIENCE_FORM_LABEL,
} from "@/lib/admin/forms-center";
import type { ExperienceFormDefinition } from "@/types/experience-forms";

type PrimaryTabId = "formulario" | "respuestas" | "participantes" | "mas";

type MoreSectionId =
  | "presentacion"
  | "seo"
  | "apariencia"
  | "configuracion"
  | "preguntas-avanzado";

const PRIMARY_HELP: Record<PrimaryTabId, string> = {
  formulario: "Así se verá para quien responde. Ajusta título, texto y preguntas.",
  respuestas: "Quién respondió y qué contestó.",
  participantes: "Lista de alumnos convocados (Excel o uno a uno).",
  mas: "Presentación, apariencia y ajustes poco frecuentes.",
};

const MORE_SECTIONS: Array<{ id: MoreSectionId; label: string; icon: typeof Layout }> = [
  { id: "presentacion", label: "Presentación", icon: Layout },
  { id: "seo", label: "Cómo se comparte", icon: Search },
  { id: "apariencia", label: "Apariencia", icon: Palette },
  { id: "configuracion", label: "Configuración", icon: Settings },
  { id: "preguntas-avanzado", label: "Lista de preguntas", icon: FileText },
];

interface FormDetailClientProps {
  form: ExperienceFormDefinition;
  convocatoria?: FormConvocatoria;
  tenantId: string;
  /** Dirección del formulario en la web. La vista previa usa el sitio local. */
  publishedFormHref?: string | null;
}

function resolvePrimaryTab(
  raw: string | null,
  hasConvocatoria: boolean
): PrimaryTabId {
  if (raw === "respuestas" && !hasConvocatoria) return "respuestas";
  if (raw === "participantes" && hasConvocatoria) return "participantes";
  if (
    raw === "mas" ||
    raw === "experiencia" ||
    raw === "seo" ||
    raw === "apariencia" ||
    raw === "configuracion" ||
    raw === "preguntas-avanzado"
  ) {
    return "mas";
  }
  // formulario | editor | campos (legacy) → editor visual principal
  if (raw === "formulario" || raw === "editor" || raw === "campos") return "formulario";
  // Default: editor for normal forms; participantes for convocatoria operations.
  return hasConvocatoria ? "participantes" : "formulario";
}

function resolveMoreSection(raw: string | null): MoreSectionId {
  if (raw === "experiencia" || raw === "presentacion") return "presentacion";
  if (raw === "seo") return "seo";
  if (raw === "apariencia") return "apariencia";
  if (raw === "configuracion") return "configuracion";
  if (raw === "preguntas-avanzado") return "preguntas-avanzado";
  return "presentacion";
}

export function FormDetailClient({
  form: initialForm,
  convocatoria,
  tenantId,
  publishedFormHref,
}: FormDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const publicOrigin = useSpacePublicOrigin();
  const initialTabParam = searchParams.get("tab");
  const [tab, setTab] = useState<PrimaryTabId>(() =>
    resolvePrimaryTab(initialTabParam, Boolean(convocatoria))
  );
  const [moreSection, setMoreSection] = useState<MoreSectionId>(() =>
    resolveMoreSection(initialTabParam)
  );
  const [form, setForm] = useState(initialForm);
  const { confirm, dialog } = useConfirmDialog();
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [purging, setPurging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [publishedMsg, setPublishedMsg] = useState(false);
  const isArchived = isExperienceFormArchived(form);

  const persistForm = async (
    next: ExperienceFormDefinition,
    options?: { asPublish?: boolean }
  ): Promise<ExperienceFormDefinition | null> => {
    setError(null);
    setSaved(false);
    setPublishedMsg(false);

    const res = await fetch(`/api/experience/forms/${next._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: next.name,
        description: next.description,
        successMessage: next.successMessage,
        errorMessage: next.errorMessage,
        destination: next.destination,
        postSubmit: next.postSubmit,
        active: next.active,
        visible: next.visible,
        fields: next.fields,
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      setError(data.error ?? "No se pudo guardar.");
      return null;
    }
    setForm(data.form);
    if (options?.asPublish) {
      setPublishedMsg(true);
    } else {
      setSaved(true);
    }
    router.refresh();
    return data.form as ExperienceFormDefinition;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await persistForm(form);
    } catch {
      setError("No se pudo guardar. Revisa tu conexión.");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Publicar = una sola intención: aceptar respuestas y (si no es privado) mostrar en portal.
   * active y visible siguen existiendo por separado en «Más opciones» para casos especiales
   * (cerrar envíos sin ocultar, o enlace privado sin listado).
   */
  const handlePublish = async () => {
    setPublishing(true);
    try {
      const isPrivate = isPrivateExperienceForm(form);
      const next: ExperienceFormDefinition = {
        ...form,
        active: true,
        visible: isPrivate ? form.visible : true,
      };
      await persistForm(next, { asPublish: true });
    } catch {
      setError("No se pudo publicar. Revisa tu conexión.");
    } finally {
      setPublishing(false);
    }
  };

  const previewHref = spacePublicHref(publicOrigin, publicFormUrl(form._id));
  const liveHref = publishedFormHref || previewHref;

  const handlePreview = () => {
    window.open(previewHref, "_blank", "noopener,noreferrer");
  };

  const handleArchive = async () => {
    const ok = await confirm({
      title: "Archivar formulario",
      description:
        "¿Archivar este formulario? Pasará a Archivados y dejará de mostrarse en el portal público.",
      confirmLabel: "Archivar",
    });
    if (!ok) return;

    setArchiving(true);
    setError(null);
    try {
      const res = await fetch(`/api/experience/forms/${form._id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo archivar el formulario.");
        return;
      }
      router.push("/admin/portal/forms");
      router.refresh();
    } catch {
      setError("Error de red al archivar.");
    } finally {
      setArchiving(false);
    }
  };

  const handleRestore = async () => {
    setArchiving(true);
    setError(null);
    try {
      const res = await fetch(`/api/experience/forms/${form._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore" }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo restaurar el formulario.");
        return;
      }
      setForm(data.form);
      router.refresh();
    } catch {
      setError("Error de red al restaurar.");
    } finally {
      setArchiving(false);
    }
  };

  const handlePurge = async () => {
    const ok = await confirm({
      title: "Eliminar definitivamente",
      description:
        "¿Eliminar definitivamente este formulario y todas sus respuestas? Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar",
      destructive: true,
    });
    if (!ok) return;

    setPurging(true);
    setError(null);
    try {
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
      router.push("/admin/portal/forms");
      router.refresh();
    } catch {
      setError("Error de red al eliminar.");
    } finally {
      setPurging(false);
    }
  };

  const isPrivate = isPrivateExperienceForm(form);
  const isDirectLinkLive = form.active && !isArchived && (form.visible || isPrivate);
  const isPublished = form.active && (isPrivate || form.visible);
  const summary = form.description?.trim()
    ? form.description
    : convocatoria
      ? "Nómina de alumnos, preguntas y publicación."
      : "Edita las preguntas y publícalo cuando esté listo.";
  const questionLabel = `${form.fields.length} ${form.fields.length === 1 ? "pregunta" : "preguntas"}`;

  const openMore = (section: MoreSectionId) => {
    setMoreSection(section);
    setTab("mas");
  };

  return (
    <AdminModulePage
      hideTitle
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: "Formularios" },
        { label: "Gestión", href: "/admin/portal/forms" },
        { label: form.name },
      ]}
      title={form.name}
      description={summary}
    >
      <AdminModuleCenter className="admin-form-detail">
        <header className="admin-form-detail__hero">
          <div className="admin-form-detail__hero-main">
            <span className="admin-form-detail__hero-icon" aria-hidden="true">
              <FileText className="h-5 w-5" />
            </span>
            <div className="admin-form-detail__hero-copy">
              <h1 className="admin-form-detail__hero-title">{form.name}</h1>
              <p className="admin-form-detail__hero-desc">{summary}</p>
            </div>
          </div>

          <div className="admin-form-detail__header-actions">
            {isDirectLinkLive ? (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="admin-form-detail__btn admin-form-detail__btn--quiet"
                onClick={() => window.open(liveHref, "_blank", "noopener,noreferrer")}
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                {isPrivate ? "Enlace privado" : "Ver público"}
              </Button>
            ) : null}
            {!isArchived ? (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="admin-form-detail__btn admin-form-detail__btn--quiet"
                onClick={handlePreview}
              >
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                Vista previa
              </Button>
            ) : null}
            {isArchived ? (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  className="admin-form-detail__btn admin-form-detail__btn--primary"
                  onClick={handleRestore}
                  loading={archiving}
                >
                  Restaurar
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  type="button"
                  className="admin-form-detail__btn"
                  onClick={handlePurge}
                  loading={purging}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Eliminar
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="admin-form-detail__btn"
                  onClick={handleSave}
                  loading={saving}
                >
                  Guardar
                </Button>
                <Button
                  variant={convocatoria ? "outline" : "primary"}
                  size="sm"
                  className={`admin-form-detail__btn${convocatoria ? "" : " admin-form-detail__btn--primary"}`}
                  onClick={handlePublish}
                  loading={publishing}
                >
                  {isPublished ? "Actualizar publicación" : "Publicar"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  className="admin-form-detail__btn admin-form-detail__btn--danger"
                  onClick={handleArchive}
                  loading={archiving}
                >
                  <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                  Archivar
                </Button>
                {convocatoria ? (
                  <Button
                    variant="primary"
                    size="sm"
                    className="admin-form-detail__btn admin-form-detail__btn--primary"
                    href={`/admin/portal/asuntos-estudiantiles/${encodeURIComponent(form._id)}`}
                  >
                    <Play className="h-3.5 w-3.5" aria-hidden="true" />
                    Ir a operación
                  </Button>
                ) : null}
              </>
            )}
          </div>

          <div className="admin-form-detail__status" aria-label="Estado del formulario">
            <StatusChip tone={isPublished ? "ok" : "off"} icon={isPublished ? Check : FileText}>
              {isPublished ? "Publicado" : "Borrador"}
            </StatusChip>
            <StatusChip tone={form.active ? "ok" : "off"} icon={Inbox}>
              {form.active ? "Acepta respuestas" : "Sin respuestas"}
            </StatusChip>
            {isPrivate ? (
              <StatusChip tone="meta" icon={Link2}>
                {PRIVATE_EXPERIENCE_FORM_LABEL}
              </StatusChip>
            ) : (
              <StatusChip tone={form.visible ? "ok" : "off"} icon={Monitor}>
                {form.visible ? "En el portal" : "Fuera del listado"}
              </StatusChip>
            )}
            {isArchived ? (
              <StatusChip tone="off" icon={Archive}>
                Archivado
              </StatusChip>
            ) : null}
            <StatusChip tone="meta" icon={FileText}>
              {questionLabel}
            </StatusChip>
          </div>

          {!isArchived && !isPublished ? (
            <p className="admin-form-detail__hint">
              Cuando esté listo, pulsa <strong>Publicar</strong> para empezar a recibir respuestas
              {isPrivate ? " por el enlace." : " y mostrarlo en el portal."}
            </p>
          ) : null}
          {isPrivate ? (
            <p className="admin-form-detail__hint">
              Solo se abre con el enlace directo. No aparece en el menú ni en el listado público.
            </p>
          ) : null}
        </header>

        <div className="admin-form-detail__workspace">
        <nav className="admin-form-detail__tabs" aria-label="Secciones del formulario">
          <TabButton active={tab === "formulario"} icon={FileText} onClick={() => setTab("formulario")}>Formulario</TabButton>
          {!convocatoria ? (
            <TabButton
              active={tab === "respuestas"}
              icon={ClipboardList}
              onClick={() => setTab("respuestas")}
            >
              Respuestas
            </TabButton>
          ) : null}
          {convocatoria ? (
            <TabButton
              active={tab === "participantes"}
              icon={Users}
              onClick={() => setTab("participantes")}
            >
              Participantes
            </TabButton>
          ) : null}
          <TabButton active={tab === "mas"} icon={MoreHorizontal} onClick={() => setTab("mas")}>
            Más opciones
          </TabButton>
        </nav>

        <div className="admin-form-detail__panel">
        {tab === "mas" ? (
          <p className="admin-form-detail__tab-help">
            <HelpCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {PRIMARY_HELP.mas}
          </p>
        ) : null}

        {error ? (
          <p className="admin-form-detail__alert admin-form-detail__alert--error" role="alert">
            {error}
          </p>
        ) : null}
        {saved ? (
          <p className="admin-form-detail__alert admin-form-detail__alert--success" role="status">
            Listo, guardamos los cambios.
          </p>
        ) : null}
        {publishedMsg ? (
          <p className="admin-form-detail__alert admin-form-detail__alert--success" role="status">
            Publicado. Ya puede recibir respuestas
            {isPrivate ? "." : " y aparece en el portal."}
          </p>
        ) : null}
        {isArchived ? (
          <p className="admin-form-detail__alert">
            Este formulario está archivado. Restáuralo para volver a usarlo o elimínalo
            definitivamente.
          </p>
        ) : null}

        {tab === "formulario" ? (
          <FormSimpleVisualEditor
            name={form.name}
            description={form.description}
            fields={form.fields}
            onNameChange={(name) => setForm({ ...form, name })}
            onDescriptionChange={(description) => setForm({ ...form, description })}
            onFieldsChange={(fields) => setForm({ ...form, fields })}
          />
        ) : null}

        {tab === "respuestas" && !convocatoria ? (
          <FormSubmissionsPanel formId={form._id} />
        ) : null}

        {tab === "participantes" && convocatoria ? (
          <ConvocatoriaRosterPanel convocatoriaSlug={convocatoria.slug} />
        ) : null}

        {tab === "mas" ? (
          <div className="admin-form-detail__more">
            <nav className="admin-form-detail__more-nav" aria-label="Más opciones">
              {MORE_SECTIONS.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => openMore(section.id)}
                    className={`admin-form-detail__more-item${
                      moreSection === section.id ? " admin-form-detail__more-item--active" : ""
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {section.label}
                  </button>
                );
              })}
            </nav>

            <div className="admin-form-detail__more-body">
              {moreSection === "presentacion" ? (
                <FormExperienceEditor
                  formId={form._id}
                  formName={form.name}
                  tenantId={tenantId}
                  mode="experience"
                  isConvocatoria={Boolean(convocatoria)}
                />
              ) : null}

              {moreSection === "seo" ? (
                <FormExperienceEditor
                  formId={form._id}
                  formName={form.name}
                  tenantId={tenantId}
                  mode="seo"
                />
              ) : null}

              {moreSection === "apariencia" ? (
                <FormExperienceEditor
                  formId={form._id}
                  formName={form.name}
                  tenantId={tenantId}
                  mode="appearance"
                />
              ) : null}

              {moreSection === "preguntas-avanzado" ? (
                <ExperienceFormFieldsEditor
                  fields={form.fields}
                  onChange={(fields) => setForm({ ...form, fields })}
                />
              ) : null}

              {moreSection === "configuracion" ? (
                <div className="admin-form-detail__config">
                  <section className="admin-form-detail__section">
                    <h3 className="admin-form-detail__section-title">Publicación</h3>
                    <p className="admin-form-detail__section-desc">
                      En el día a día usa el botón Publicar arriba. Estos interruptores sirven para
                      casos especiales (cerrar envíos sin ocultar el formulario, o al revés).
                    </p>
                    <div className="space-y-3">
                      <Switch
                        checked={form.active}
                        onChange={(active) => setForm({ ...form, active })}
                        label="Acepta respuestas"
                        description="Si está apagado, nadie puede enviar aunque tenga el enlace."
                      />
                      <Switch
                        checked={form.visible}
                        onChange={(visible) => setForm({ ...form, visible })}
                        label="Mostrar en el portal"
                        description={
                          isPrivate
                            ? "Este formulario es privado: solo se abre con el enlace."
                            : "Si está apagado, no aparece en el listado público."
                        }
                        disabled={isPrivate}
                      />
                    </div>
                  </section>

                  <section className="admin-form-detail__section">
                    <h3 className="admin-form-detail__section-title">Datos del formulario</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Nombre</Label>
                        <Input
                          id="name"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                          id="description"
                          rows={2}
                          value={form.description ?? ""}
                          onChange={(e) => setForm({ ...form, description: e.target.value })}
                          placeholder="Opcional"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="admin-form-detail__section">
                    <h3 className="admin-form-detail__section-title">Mensajes al enviar</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="success">Si todo sale bien</Label>
                        <Textarea
                          id="success"
                          rows={2}
                          value={form.successMessage}
                          onChange={(e) => setForm({ ...form, successMessage: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="error">Si algo falla</Label>
                        <Textarea
                          id="error"
                          rows={2}
                          value={form.errorMessage}
                          onChange={(e) => setForm({ ...form, errorMessage: e.target.value })}
                        />
                      </div>
                    </div>
                  </section>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
        </div>
        </div>
      </AdminModuleCenter>
      {dialog}
    </AdminModulePage>
  );
}

function TabButton({
  active,
  icon: Icon,
  onClick,
  children,
}: {
  active: boolean;
  icon: typeof ClipboardList;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`admin-form-detail__tab${active ? " admin-form-detail__tab--active" : ""}`}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {children}
    </button>
  );
}

function StatusChip({
  tone,
  icon: Icon,
  children,
}: {
  tone: "ok" | "off" | "meta";
  icon: typeof FileText;
  children: React.ReactNode;
}) {
  return (
    <span className={`admin-form-detail__status-chip admin-form-detail__status-chip--${tone}`}>
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {children}
    </span>
  );
}
