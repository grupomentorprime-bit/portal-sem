import { PortalBreadcrumb } from "@/components/portal/layout";
import { PortalExperienceForm } from "@/components/portal/experience/forms";
import { FormLanding } from "@/components/portal/forms";
import { getFormLandingByFormId } from "@/lib/admin/forms-center";
import { getActivePortal } from "@/lib/portal/site";
import {
  ensureDefaultExperienceForms,
  getPublicExperienceForm,
  seedExperienceForms,
} from "@/lib/experience/forms/repository";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

interface FormularioPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: FormularioPageProps): Promise<Metadata> {
  const { id } = await params;
  const ctx = await getActivePortal();
  if (!ctx) return { title: "Formulario" };

  await seedExperienceForms(ctx.tenant);
  const form = await getPublicExperienceForm(ctx.tenant, id);
  const landing = getFormLandingByFormId(id);

  return {
    title: landing?.headline ?? form?.name ?? "Formulario",
    description: landing?.subheadline ?? form?.description ?? undefined,
    robots: form ? undefined : { index: false, follow: false },
  };
}

export default async function FormularioPublicPage({ params }: FormularioPageProps) {
  const { id } = await params;
  const ctx = await getActivePortal();
  if (!ctx) notFound();

  await seedExperienceForms(ctx.tenant);
  await ensureDefaultExperienceForms(ctx.tenant);

  const form = await getPublicExperienceForm(ctx.tenant, id);
  if (!form) notFound();

  const landing = getFormLandingByFormId(id);

  const breadcrumb = (
    <PortalBreadcrumb
      items={[
        { label: "Inicio", href: "/" },
        { label: "Formularios", href: "/formularios" },
        { label: landing?.headline ?? form.name },
      ]}
    />
  );

  if (landing) {
    return (
      <FormLanding config={landing} breadcrumb={breadcrumb}>
        <PortalExperienceForm
          form={form}
          overline="Tu respuesta"
          title="Completa el formulario"
          description="Los campos marcados son obligatorios."
          submitLabel={landing.ctaLabel}
        />
      </FormLanding>
    );
  }

  return (
    <>
      {breadcrumb}
      <section className="py-8 md:py-12">
        <div className="mx-auto max-w-2xl px-4">
          <PortalExperienceForm form={form} title={form.name} description={form.description} />
        </div>
      </section>
    </>
  );
}
