"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ClipboardList,
  ExternalLink,
  FileText,
  HelpCircle,
  Layout,
  Palette,
  Search,
  Settings,
  Trash2,
  Users,
} from "lucide-react";
import { AdminModuleLayout } from "@/components/admin/AdminModuleLayout";
import { AdminModuleCenter } from "@/components/admin/AdminModuleCenter";
import { ConvocatoriaRosterPanel } from "@/components/admin/forms/ConvocatoriaRosterPanel";
import { ExperienceFormFieldsEditor } from "@/components/admin/forms/ExperienceFormFieldsEditor";
import { FormExperienceEditor } from "@/components/admin/forms/FormExperienceEditor";
import { FormSubmissionsPanel } from "@/components/admin/forms/FormSubmissionsPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { publicFormUrl, isExperienceFormArchived, type FormConvocatoria } from "@/lib/admin/forms-center";
import type { ExperienceFormDefinition } from "@/types/experience-forms";

type TabId =
  | "respuestas"
  | "participantes"
  | "campos"
  | "experiencia"
  | "seo"
  | "apariencia"
  | "configuracion";

const TAB_HELP: Record<TabId, string> = {
  respuestas: "Revisa quién respondió, teléfono, generación y gestiona inasistencias.",
  participantes:
    "Sube el Excel institucional con Rut, Nombre, Apellidos y Generación. El alumno completa el resto.",
  campos: "Define las preguntas: tipo, etiqueta y si son obligatorias.",
  experiencia:
    "Diseña hero, tarjetas, bloques editoriales, banners, estados y pie de página sin escribir código.",
  seo: "Título, descripción, Open Graph y textos para compartir en redes.",
  apariencia: "Tema visual, diseño, colores, sombras y espaciado del formulario público.",
  configuracion: "Nombre, mensajes del motor y si el formulario está abierto al público.",
};

interface FormDetailClientProps {
  form: ExperienceFormDefinition;
  convocatoria?: FormConvocatoria;
  tenantId: string;
}

export function FormDetailClient({ form: initialForm, convocatoria, tenantId }: FormDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab");
  const [tab, setTab] = useState<TabId>(
    initialTab === "campos" ||
    initialTab === "configuracion" ||
    initialTab === "participantes" ||
    initialTab === "experiencia" ||
    initialTab === "seo" ||
    initialTab === "apariencia"
      ? initialTab
      : "respuestas"
  );
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [purging, setPurging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const isArchived = isExperienceFormArchived(form);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch(`/api/experience/forms/${form._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          successMessage: form.successMessage,
          errorMessage: form.errorMessage,
          destination: form.destination,
          postSubmit: form.postSubmit,
          active: form.active,
          visible: form.visible,
          fields: form.fields,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Error al guardar.");
        return;
      }
      setForm(data.form);
      setSaved(true);
      router.refresh();
    } catch {
      setError("Error de red.");
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (
      !window.confirm(
        "¿Archivar este formulario? Pasará a Archivados y dejará de mostrarse en el portal público."
      )
    ) {
      return;
    }

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
    if (
      !window.confirm(
        "¿Eliminar definitivamente este formulario y todas sus respuestas? Esta acción no se puede deshacer."
      )
    ) {
      return;
    }

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

  const isLive = form.active && form.visible && !isArchived;

  return (
    <AdminModuleLayout
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: "Portal", href: "/admin/pages" },
        { label: "Centro de formularios", href: "/admin/portal/forms" },
        { label: form.name },
      ]}
      title={form.name}
      description={form.description ?? "Gestiona respuestas, campos y publicación."}
      actions={
        <div className="flex flex-wrap gap-2">
          {isLive ? (
            <Link
              href={publicFormUrl(form._id)}
              target="_blank"
              className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm font-medium"
            >
              Ver público
              <ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          ) : null}
          {tab !== "respuestas" && !isArchived ? (
            <Button variant="primary" onClick={handleSave} loading={saving}>
              Guardar cambios
            </Button>
          ) : null}
          {isArchived ? (
            <>
              <Button variant="secondary" onClick={handleRestore} loading={archiving}>
                Restaurar
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={handlePurge}
                loading={purging}
                className="text-primary"
              >
                <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                Eliminar definitivamente
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              type="button"
              onClick={handleArchive}
              loading={archiving}
              className="text-primary"
            >
              <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
              Archivar
            </Button>
          )}
        </div>
      }
    >
      <AdminModuleCenter className="admin-form-detail">
        <div className="admin-form-detail__summary">
          <div className="admin-form-detail__summary-main">
            <p className="admin-form-detail__eyebrow">Formulario · {form._id}</p>
            <div className="admin-form-detail__badges">
              <StatusPill
                label={form.active ? "Acepta envíos" : "Cerrado"}
                tone={form.active ? "active" : "neutral"}
              />
              <StatusPill
                label={form.visible ? "En el portal" : "No publicado"}
                tone={form.visible ? "published" : "neutral"}
              />
              {isArchived ? <StatusPill label="Archivado" tone="archived" /> : null}
              <span className="admin-form-detail__meta">
                <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                {form.fields.length} campos
              </span>
            </div>
          </div>
          {!isArchived && !form.active && (
            <p className="admin-form-detail__hint">
              Para abrir el formulario: ve a <strong>Configuración</strong> → activa
              &quot;Acepta envíos&quot; → publica en portal → guarda.
            </p>
          )}
        </div>

        <nav className="admin-form-detail__tabs" aria-label="Secciones del formulario">
          <TabButton
            active={tab === "respuestas"}
            icon={ClipboardList}
            onClick={() => setTab("respuestas")}
          >
            Respuestas
          </TabButton>
          {convocatoria ? (
            <TabButton
              active={tab === "participantes"}
              icon={Users}
              onClick={() => setTab("participantes")}
            >
              Participantes
            </TabButton>
          ) : null}
          <TabButton
            active={tab === "campos"}
            icon={FileText}
            onClick={() => setTab("campos")}
          >
            Campos
          </TabButton>
          <TabButton
            active={tab === "experiencia"}
            icon={Layout}
            onClick={() => setTab("experiencia")}
          >
            Experiencia
          </TabButton>
          <TabButton active={tab === "seo"} icon={Search} onClick={() => setTab("seo")}>
            SEO
          </TabButton>
          <TabButton
            active={tab === "apariencia"}
            icon={Palette}
            onClick={() => setTab("apariencia")}
          >
            Apariencia
          </TabButton>
          <TabButton
            active={tab === "configuracion"}
            icon={Settings}
            onClick={() => setTab("configuracion")}
          >
            Configuración
          </TabButton>
        </nav>

        <p className="admin-form-detail__tab-help">
          <HelpCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {TAB_HELP[tab]}
        </p>

        {error ? <p className="admin-form-detail__alert admin-form-detail__alert--error">{error}</p> : null}
        {saved ? (
          <p className="admin-form-detail__alert admin-form-detail__alert--success">
            Guardado correctamente.
          </p>
        ) : null}
        {isArchived ? (
          <p className="admin-form-detail__alert">
            Este formulario está archivado. Restáuralo para volver a usarlo o elimínalo
            definitivamente.
          </p>
        ) : null}

        {tab === "respuestas" ? <FormSubmissionsPanel formId={form._id} /> : null}

        {tab === "participantes" && convocatoria ? (
          <ConvocatoriaRosterPanel convocatoriaSlug={convocatoria.slug} />
        ) : null}

        {tab === "campos" ? (
          <ExperienceFormFieldsEditor
            fields={form.fields}
            onChange={(fields) => setForm({ ...form, fields })}
          />
        ) : null}

        {tab === "experiencia" ? (
          <FormExperienceEditor
            formId={form._id}
            formName={form.name}
            tenantId={tenantId}
            mode="experience"
            isConvocatoria={Boolean(convocatoria)}
          />
        ) : null}

        {tab === "seo" ? (
          <FormExperienceEditor
            formId={form._id}
            formName={form.name}
            tenantId={tenantId}
            mode="seo"
          />
        ) : null}

        {tab === "apariencia" ? (
          <FormExperienceEditor
            formId={form._id}
            formName={form.name}
            tenantId={tenantId}
            mode="appearance"
          />
        ) : null}

        {tab === "configuracion" ? (
          <div className="admin-form-detail__config">
            <section className="admin-form-detail__section">
              <h3 className="admin-form-detail__section-title">Publicación</h3>
              <p className="admin-form-detail__section-desc">
                Controla si el formulario está abierto y visible para las personas del portal.
              </p>
              <div className="space-y-3">
                <Switch
                  checked={form.active}
                  onChange={(active) => setForm({ ...form, active })}
                  label="Acepta envíos"
                  description="Si está apagado, nadie puede enviar respuestas aunque tenga el enlace."
                />
                <Switch
                  checked={form.visible}
                  onChange={(visible) => setForm({ ...form, visible })}
                  label="Publicado en el portal"
                  description="Si está apagado, no aparece en /formularios ni en listados públicos."
                />
              </div>
            </section>

            <section className="admin-form-detail__section">
              <h3 className="admin-form-detail__section-title">Información del formulario</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre interno</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                  <p className="mt-1 text-xs text-muted">Solo visible en el panel de administración.</p>
                </div>
                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    rows={2}
                    value={form.description ?? ""}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              </div>
            </section>

            <section className="admin-form-detail__section">
              <h3 className="admin-form-detail__section-title">Mensajes al enviar</h3>
              <p className="admin-form-detail__section-desc">
                Texto que ve la persona después de completar el formulario o si ocurre un error.
              </p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="success">Mensaje de éxito</Label>
                  <Textarea
                    id="success"
                    rows={2}
                    value={form.successMessage}
                    onChange={(e) => setForm({ ...form, successMessage: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="error">Mensaje de error</Label>
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
      </AdminModuleCenter>
    </AdminModuleLayout>
  );
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "active" | "published" | "neutral" | "archived";
}) {
  return (
    <span className={`admin-form-detail__pill admin-form-detail__pill--${tone}`}>{label}</span>
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
