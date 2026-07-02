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
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { AdminModuleLayout } from "@/components/admin/AdminModuleLayout";
import {
  AdminModuleCenter,
  AdminModuleHero,
  AdminModuleSectionHeader,
  AdminModuleStats,
} from "@/components/admin/AdminModuleCenter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  FORM_CENTER_CATEGORIES,
  FORM_CONVOCATORIAS,
  formatConvocatoriaDate,
  getFormLandingByFormId,
  publicFormUrl,
} from "@/lib/admin/forms-center";
import type { FormLandingTheme } from "@/lib/admin/forms-center";
import { ADMIN_PANEL_META } from "@/lib/admin/module-panels";
import type { ExperienceFormDefinition } from "@/types/experience-forms";

interface FormsCenterClientProps {
  initialForms: ExperienceFormDefinition[];
}

export function FormsCenterClient({ initialForms }: FormsCenterClientProps) {
  const router = useRouter();
  const [forms, setForms] = useState(initialForms);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const generalForms = forms.filter((form) => !convocatoriaFormIds.has(form._id));
  const activeCount = forms.filter((f) => f.active).length;
  const publishedCount = forms.filter((f) => f.visible).length;

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
            { label: "Formularios totales", value: forms.length, icon: ClipboardList, tone: "total" },
            { label: "Activos", value: activeCount, icon: Sparkles, tone: "active" },
            { label: "Publicados en portal", value: publishedCount, icon: Eye, tone: "published" },
          ]}
        />

        <section>
          <AdminModuleSectionHeader
            icon={Calendar}
            title="Convocatorias"
            description={
              FORM_CENTER_CATEGORIES.find((c) => c.id === "convocatorias")?.description
            }
          />

          <div className="grid gap-4 lg:grid-cols-2">
            {FORM_CONVOCATORIAS.map((convocatoria) => {
              const form = forms.find((item) => item._id === convocatoria.formId);
              const landing = convocatoria.landing;
              return (
                <Card key={convocatoria.slug} className="admin-forms-center__convocatoria-card">
                  <div className="admin-forms-center__convocatoria-header">
                    <div className="admin-forms-center__convocatoria-header-top">
                      <div>
                        <h3 className="admin-forms-center__convocatoria-title">
                          {convocatoria.title}
                        </h3>
                        <p className="admin-forms-center__convocatoria-subtitle">
                          {formatConvocatoriaDate(convocatoria.date)} · {convocatoria.location}
                        </p>
                      </div>
                      <span
                        className={`admin-forms-center__badge ${
                          convocatoria.active
                            ? "admin-forms-center__badge--active"
                            : "admin-forms-center__badge--closed"
                        }`}
                      >
                        {convocatoria.active ? "Activa" : "Cerrada"}
                      </span>
                    </div>

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
                  </div>

                  <div className="admin-forms-center__convocatoria-body">
                    <p className="admin-forms-center__convocatoria-desc">
                      {landing?.subheadline ?? convocatoria.description}
                    </p>

                    {landing?.motivational ? (
                      <blockquote className="admin-forms-center__motivational">
                        <Sparkles
                          className="admin-forms-center__motivational-icon"
                          aria-hidden="true"
                        />
                        <span>{landing.motivational}</span>
                      </blockquote>
                    ) : null}

                    <div className="admin-forms-center__actions">
                      <Link
                        href={`/admin/portal/forms/convocatorias/${convocatoria.slug}`}
                        className="admin-forms-center__btn admin-forms-center__btn--primary"
                      >
                        Gestionar respuestas
                      </Link>
                      {form ? (
                        <>
                          <Link
                            href={publicFormUrl(form._id)}
                            target="_blank"
                            className="admin-forms-center__btn admin-forms-center__btn--accent"
                          >
                            Ver landing pública
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                          </Link>
                          <Link
                            href={`/admin/portal/forms/${form._id}`}
                            className="admin-forms-center__btn admin-forms-center__btn--outline"
                          >
                            Editar
                          </Link>
                        </>
                      ) : (
                        <span className="text-sm text-muted">
                          Ejecuta &quot;Sincronizar formularios base&quot; para crear el
                          formulario.
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="mt-10">
          <AdminModuleSectionHeader
            icon={ClipboardList}
            title="Todos los formularios"
            description="Definiciones reutilizables en páginas del portal y convocatorias."
          />

          <div className="grid gap-3">
            {generalForms.map((form) => (
              <FormRow
                key={form._id}
                form={form}
                onToggle={handleToggle}
                onDuplicate={handleDuplicate}
              />
            ))}
          </div>

          {forms.length === 0 ? (
            <p className="text-sm text-muted">
              No hay formularios. Usa &quot;Sincronizar formularios base&quot; para crear los
              formularios institucionales.
            </p>
          ) : null}
        </section>
      </AdminModuleCenter>
    </AdminModuleLayout>
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
  onToggle,
  onDuplicate,
}: {
  form: ExperienceFormDefinition;
  onToggle: (form: ExperienceFormDefinition, field: "active" | "visible") => void;
  onDuplicate: (form: ExperienceFormDefinition) => void;
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
            </div>
          </div>
        </div>

        <div className="admin-forms-center__form-actions">
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
            href={`/admin/portal/forms/${form._id}`}
            className="admin-forms-center__btn admin-forms-center__btn--primary admin-forms-center__btn--sm"
          >
            Gestionar
          </Link>
        </div>
      </div>
    </Card>
  );
}
