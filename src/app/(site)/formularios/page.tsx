import Link from "next/link";
import { PortalBreadcrumb, PortalContainer, PortalSection } from "@/components/portal/layout";
import { PortalPageHeader } from "@/components/portal/PortalSectionHeader";
import { getActivePortal } from "@/lib/portal/site";
import {
  ensureDefaultExperienceForms,
  listExperienceForms,
  seedExperienceForms,
} from "@/lib/experience/forms/repository";
import { FORM_CONVOCATORIAS, publicFormUrl } from "@/lib/admin/forms-center";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Formularios",
  description: "Formularios y convocatorias del Seminario Eclesiástico Mayor.",
};

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
      <PortalPageHeader
        title="Formularios"
        description="Convocatorias, confirmaciones de asistencia y solicitudes institucionales."
      />
      <PortalSection padding="md">
        <PortalContainer size="md">
          <div className="space-y-10">
            {convocatorias.length > 0 ? (
              <section>
                <h2 className="text-lg font-semibold text-foreground">Convocatorias activas</h2>
                <ul className="mt-4 space-y-3">
                  {convocatorias.map((form) => (
                    <li key={form._id}>
                      <Link
                        href={publicFormUrl(form._id)}
                        className="block rounded-xl border border-border bg-background p-5 transition hover:border-primary/30 hover:shadow-sm"
                      >
                        <p className="font-medium text-foreground">{form.name}</p>
                        {form.description ? (
                          <p className="mt-1 text-sm text-muted">{form.description}</p>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {otros.length > 0 ? (
              <section>
                <h2 className="text-lg font-semibold text-foreground">Otros formularios</h2>
                <ul className="mt-4 space-y-3">
                  {otros.map((form) => (
                    <li key={form._id}>
                      <Link
                        href={publicFormUrl(form._id)}
                        className="block rounded-xl border border-border bg-background p-5 transition hover:border-primary/30 hover:shadow-sm"
                      >
                        <p className="font-medium text-foreground">{form.name}</p>
                        {form.description ? (
                          <p className="mt-1 text-sm text-muted">{form.description}</p>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
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
