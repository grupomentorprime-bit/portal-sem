import { PortalHome } from "@/components/portal/PortalHome";
import { PortalContainer, PortalSection } from "@/components/portal/layout";
import { getPortalContext } from "@/lib/portal/site";
import type { Metadata } from "next";

export default async function HomePage() {
  const ctx = await getPortalContext();

  if (!ctx) {
    return (
      <PortalSection padding="lg">
        <PortalContainer size="sm" className="text-center">
          <p className="text-body text-muted">Configuración institucional no disponible.</p>
        </PortalContainer>
      </PortalSection>
    );
  }

  const { institution } = ctx.config;

  if (institution.status === "maintenance") {
    return (
      <PortalSection padding="lg">
        <PortalContainer size="sm" className="text-center">
          <p className="text-caption font-semibold uppercase tracking-widest text-secondary">
            Mantenimiento
          </p>
          <h1 className="mt-4 text-display-l text-foreground">{institution.name}</h1>
          <p className="mt-6 text-body text-muted">Estamos realizando mejoras. Vuelve pronto.</p>
        </PortalContainer>
      </PortalSection>
    );
  }

  if (institution.status === "inactive") {
    return (
      <PortalSection padding="lg">
        <PortalContainer size="sm" className="text-center">
          <p className="text-body text-muted">Portal temporalmente no disponible.</p>
        </PortalContainer>
      </PortalSection>
    );
  }

  return <PortalHome ctx={ctx} />;
}

export async function generateMetadata(): Promise<Metadata> {
  const ctx = await getPortalContext();
  if (!ctx) return { title: "Portal SEM" };

  return {
    title: ctx.config.seo.title,
    description: ctx.config.seo.description,
  };
}
