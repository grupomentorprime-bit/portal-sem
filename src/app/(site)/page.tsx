import { ServerBlockRenderer } from "@/components/page-builder/ServerBlockRenderer";
import { Container, Page, Section } from "@/components/layout";
import { getSiteConfig } from "@/lib/cms/config";
import { getPublishedPageBySlug } from "@/lib/cms/pages";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export default async function HomePage() {
  const config = await getSiteConfig();

  if (!config) {
    return (
      <Page centered>
        <Section padding="lg">
          <Container size="sm" className="text-center">
            <p className="text-body text-muted">Configuración institucional no disponible.</p>
          </Container>
        </Section>
      </Page>
    );
  }

  const { institution } = config;

  if (institution.status === "maintenance") {
    return (
      <Page centered>
        <Section padding="lg">
          <Container size="sm" className="text-center">
            <p className="text-caption font-semibold uppercase tracking-widest text-secondary">
              Mantenimiento
            </p>
            <h1 className="mt-4 text-display-l text-foreground">{institution.name}</h1>
            <p className="mt-6 text-body text-muted">Estamos realizando mejoras. Vuelve pronto.</p>
          </Container>
        </Section>
      </Page>
    );
  }

  if (institution.status === "inactive") {
    return (
      <Page centered>
        <Section padding="lg">
          <Container size="sm" className="text-center">
            <p className="text-body text-muted">Portal temporalmente no disponible.</p>
          </Container>
        </Section>
      </Page>
    );
  }

  const page = await getPublishedPageBySlug("/", config.institution.tenant);
  if (!page) notFound();

  return (
    <ServerBlockRenderer
      blocks={page.blocks}
      config={config}
      tenant={config.institution.tenant}
    />
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig();
  if (!config) return { title: "Portal SEM" };

  const page = await getPublishedPageBySlug("/", config.institution.tenant);
  return {
    title: page?.seo.title ?? config.seo.title,
    description: page?.seo.description ?? config.seo.description,
  };
}
