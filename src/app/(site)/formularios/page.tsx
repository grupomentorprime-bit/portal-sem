import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PortalBreadcrumb, PortalContainer, PortalSection } from "@/components/portal/layout";
import { getActivePortal } from "@/lib/portal/site";
import {
  ensureDefaultExperienceForms,
  listExperienceForms,
  seedExperienceForms,
} from "@/lib/experience/forms/repository";
import {
  FORM_CONVOCATORIAS,
  FORM_LANDINGS,
  getFormLandingByFormId,
  publicFormUrl,
} from "@/lib/admin/forms-center";
import type { FormLandingTheme } from "@/lib/admin/forms-center";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Formularios",
  description: "Formularios y convocatorias del Seminario Eclesiástico Mayor.",
};

function themeForForm(formId: string): FormLandingTheme | "default" {
  return getFormLandingByFormId(formId)?.theme ?? "default";
}

export default async function FormulariosIndexPage() {
  const ctx = await getActivePortal();
  if (!ctx) notFound();

  await seedExperienceForms(ctx.tenant);
  await ensureDefaultExperienceForms(ctx.tenant);

  const forms = (await listExperienceForms(ctx.tenant)).filter(
    (form) => form.active && form.visible
  );

  const convocatoriaFormIds = new Set(FORM_CONVOCATORIAS.map((item) => item.formId));
  const convocatorias = forms.filter((form) => convocatoriaFormIds.has(form._id));
  const otros = forms.filter((form) => !convocatoriaFormIds.has(form._id));

  return (
    <>
      <PortalBreadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Formularios" },
        ]}
      />
      <PortalSection padding="md">
        <PortalContainer size="md">
          <div className="forms-hub">
            <header className="forms-hub__hero">
              <div className="forms-hub__hero-inner">
                <p className="forms-hub__hero-eyebrow">Centro de formularios</p>
                <h1 className="forms-hub__hero-title">Convocatorias y solicitudes</h1>
                <p className="forms-hub__hero-desc">
                  Confirma tu asistencia, justifica inasistencias o solicita información. Cada
                  formulario tiene una experiencia clara y guiada.
                </p>
              </div>
            </header>

            {convocatorias.length > 0 ? (
              <section>
                <h2 className="forms-hub__section-title">Convocatorias activas</h2>
                <div className="forms-hub__grid forms-hub__grid--convocatorias">
                  {convocatorias.map((form) => {
                    const convocatoria = FORM_CONVOCATORIAS.find((c) => c.formId === form._id);
                    const landing = getFormLandingByFormId(form._id);
                    return (
                      <Link
                        key={form._id}
                        href={publicFormUrl(form._id)}
                        className="forms-hub__card forms-hub__card--convocatoria"
                      >
                        <span className="forms-hub__card-eyebrow">
                          {landing?.eyebrow ?? "Convocatoria"}
                        </span>
                        <h3 className="forms-hub__card-title">
                          {landing?.headline ?? form.name}
                        </h3>
                        <p className="forms-hub__card-desc">
                          {convocatoria?.description ?? form.description}
                        </p>
                        <span className="forms-hub__card-cta">
                          Responder ahora <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {otros.length > 0 ? (
              <section className={convocatorias.length > 0 ? "mt-10" : undefined}>
                <h2 className="forms-hub__section-title">Otros formularios</h2>
                <div className="forms-hub__grid">
                  {otros.map((form) => {
                    const theme = themeForForm(form._id);
                    const landing = FORM_LANDINGS.find((l) => l.formId === form._id);
                    const cardClass =
                      theme !== "default"
                        ? `forms-hub__card forms-hub__card--${theme}`
                        : "forms-hub__card";
                    return (
                      <Link key={form._id} href={publicFormUrl(form._id)} className={cardClass}>
                        <span className="forms-hub__card-eyebrow">
                          {landing?.eyebrow ?? "Formulario"}
                        </span>
                        <h3 className="forms-hub__card-title">
                          {landing?.headline ?? form.name}
                        </h3>
                        <p className="forms-hub__card-desc">
                          {landing?.subheadline ?? form.description}
                        </p>
                        <span className="forms-hub__card-cta">
                          Completar <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {forms.length === 0 ? (
              <p className="text-sm text-muted">No hay formularios publicados en este momento.</p>
            ) : null}
          </div>
        </PortalContainer>
      </PortalSection>
    </>
  );
}
