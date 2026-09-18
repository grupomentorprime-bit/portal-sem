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
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import { StatusBadge } from "@/components/admin/kit";
import { AdminModuleCenter } from "@/components/admin/AdminModuleCenter";
import { ConvocatoriaRosterPanel } from "@/components/admin/forms/ConvocatoriaRosterPanel";
import { ExperienceFormFieldsEditor } from "@/components/admin/forms/ExperienceFormFieldsEditor";
import { FormExperienceEditor } from "@/components/admin/forms/FormExperienceEditor";
import { FormSubmissionsPanel } from "@/components/admin/forms/FormSubmissionsPanel";
import { useConfirmDialog } from "@/components/admin/kit/hooks/useConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { publicFormUrl, isExperienceFormArchived, type FormConvocatoria, isExperienceFormPrivate, isPrivateExperienceForm, PRIVATE_EXPERIENCE_FORM_LABEL } from "@/lib/admin/forms-center";
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
  respuestas: "Quién respondió y qué contestó.",
  participantes: "Lista de alumnos convocados (Excel o uno a uno).",
  campos: "Las preguntas que verá quien complete el formulario.",
  experiencia:
    "Cómo se ve al abrirlo. Para una página completa usa Sitio web → Páginas.",
  seo: "Cómo aparece al buscarlo o compartirlo.",
  apariencia: "Colores y estilo.",
  configuracion: "Nombre, mensajes y publicación.",
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
  const resolvedInitialTab: TabId =
    initialTab === "campos" ||
    initialTab === "configuracion" ||
    initialTab === "participantes" ||
    initialTab === "experiencia" ||
    initialTab === "seo" ||
    initialTab === "apariencia"
      ? initialTab
      : convocatoria
        ? "participantes"
        : "respuestas";

  const [tab, setTab] = useState<TabId>(resolvedInitialTab);
  const [form, setForm] = useState(initialForm);
  const { confirm, dialog } = useConfirmDialog();
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
        setError(data.error ?? "No se pudo guardar.");
        return;
      }
      setForm(data.form);
      setSaved(true);
      router.refresh();
    } catch {
      setError("No se pudo guardar. Revisa tu conexión.");
    } finally {
      setSaving(false);
    }
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

  return (
    <AdminModulePage
      breadcrumbs={
        convocatoria
          ? [
              { label: "Inicio", href: "/admin" },
              { label: "Formularios" },
              { label: "Gestión", href: "/admin/portal/forms" },
              { label: form.name },
            ]
          : [
              { label: "Inicio", href: "/admin" },
              { label: "Formularios" },
              { label: "Gestión", href: "/admin/portal/forms" },
              { label: form.name },
            ]
      }
      title={form.name}
      description={
        convocatoria
          ? "Participantes, preguntas y publicación de la convocatoria."
          : (form.description ?? "Respuestas, preguntas y publicación.")
      }
      actions={
        <div className="flex flex-wrap gap-2">
          {convocatoria ? (
            <Link href={`/admin/portal/asuntos-estudiantiles/${encodeURIComponent(form._id)}`}>
              <Button variant="outline" size="sm">
                Ir a operación
              </Button>
            </Link>
          ) : null}
          {isDirectLinkLive ? (
            <Link
              href={publicFormUrl(form._id)}
              target="_blank"
              className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm font-medium"
            >
              {isPrivate ? "Abrir enlace privado" : "Ver público"}
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
            <p className="admin-form-detail__eyebrow">Formulario</p>
            <div className="admin-form-detail__badges">
              <StatusBadge
                tone={form.active ? "active" : "inactive"}
                label={form.active ? "Abierto" : "Cerrado"}
              />
              <StatusBadge
                tone={isPrivate ? "neutral" : form.visible ? "active" : "draft"}
                label={isPrivate ? PRIVATE_EXPERIENCE_FORM_LABEL : form.visible ? "En el portal" : "No publicado"}
              />
              {isArchived ? <StatusBadge tone="inactive" label="Archivado" /> : null}
              <span className="admin-form-detail__meta">
                <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                {form.fields.length}{" "}
                {form.fields.length === 1 ? "pregunta" : "preguntas"}
              </span>
            </div>
          </div>
          {!isArchived && !form.active && (
            <p className="admin-form-detail__hint">
              Para abrirlo: en <strong>Configuración</strong> activa &quot;Acepta respuestas&quot;
              {isPrivate ? ", comparte el enlace" : ", publícalo en el portal"} y guarda.
            </p>
          )}
          {isPrivate ? (
            <p className="admin-form-detail__hint">
              Solo se abre con el enlace directo. No aparece en el menú ni en el listado público.
            </p>
          ) : null}
        </div>

        <nav className="admin-form-detail__tabs" aria-label="Secciones del formulario">
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
          <TabButton
            active={tab === "campos"}
            icon={FileText}
            onClick={() => setTab("campos")}
          >
            Preguntas
          </TabButton>
          <TabButton
            active={tab === "experiencia"}
            icon={Layout}
            onClick={() => setTab("experiencia")}
          >
            Presentación
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
            Listo, guardamos los cambios.
          </p>
        ) : null}
        {isArchived ? (
          <p className="admin-form-detail__alert">
            Este formulario está archivado. Restáuralo para volver a usarlo o elimínalo
            definitivamente.
          </p>
        ) : null}

        {tab === "respuestas" && !convocatoria ? (
          <FormSubmissionsPanel formId={form._id} />
        ) : null}

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
