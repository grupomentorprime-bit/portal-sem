import { ServerBlockRenderer } from "@/components/page-builder/ServerBlockRenderer";
import { PortalBreadcrumb, PortalContainer, PortalSection } from "@/components/portal/layout";
import { PortalEmptyState } from "@/components/portal/PortalEmptyState";
import { PortalPageHeader } from "@/components/portal/PortalSectionHeader";
import { getPublishedPageBySlug } from "@/lib/cms/pages";
import { getActivePortal } from "@/lib/portal/site";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

interface PortalCmsPageProps {
  slug: string;
  fallbackTitle: string;
  fallbackDescription?: string;
}

export async function PortalCmsPage({
  slug,
  fallbackTitle,
  fallbackDescription,
}: PortalCmsPageProps) {
  const ctx = await getActivePortal();
  if (!ctx) notFound();

  const pageSlug = slug.startsWith("/") ? slug : `/${slug}`;
  const page = await getPublishedPageBySlug(pageSlug, ctx.tenant);

  if (page?.blocks?.length) {
    return (
      <>
        <PortalBreadcrumb
          items={[
            { label: "Inicio", href: "/" },
            { label: page.title || fallbackTitle },
          ]}
        />
        <ServerBlockRenderer
          blocks={page.blocks}
          config={ctx.config}
          tenant={ctx.tenant}
        />
      </>
    );
  }

  return (
    <>
      <PortalBreadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: fallbackTitle },
        ]}
      />
      <PortalPageHeader title={fallbackTitle} description={fallbackDescription} />
      <PortalSection padding="md">
        <PortalContainer>
          <PortalEmptyState
            title="Contenido en preparación"
            description="Esta página se editará desde el panel de administración."
          />
        </PortalContainer>
      </PortalSection>
    </>
  );
}

export async function buildPortalPageMetadata(
  slug: string,
  fallbackTitle: string
): Promise<Metadata> {
  const ctx = await getActivePortal();
  if (!ctx) return { title: fallbackTitle };

  const pageSlug = slug.startsWith("/") ? slug : `/${slug}`;
  const page = await getPublishedPageBySlug(pageSlug, ctx.tenant);

  return {
    title: page?.seo.title ?? `${fallbackTitle} | ${ctx.config.institution.shortName}`,
    description: page?.seo.description ?? ctx.config.seo.description,
  };
}
