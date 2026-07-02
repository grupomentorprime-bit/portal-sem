import { PortalBreadcrumb, PortalContainer, PortalSection } from "@/components/portal/layout";
import { PortalExperienceForm } from "@/components/portal/experience/forms";
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

  return {
    title: form?.name ?? "Formulario",
    description: form?.description ?? undefined,
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

  return (
    <>
      <PortalBreadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Formularios", href: "/formularios" },
          { label: form.name },
        ]}
      />
      <PortalSection padding="md">
        <PortalContainer size="md">
          <PortalExperienceForm form={form} title={form.name} description={form.description} />
        </PortalContainer>
      </PortalSection>
    </>
  );
}
