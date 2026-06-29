import Image from "next/image";
import { Button } from "@/components/ui";
import { PortalBreadcrumb, PortalContainer, PortalSection } from "@/components/portal/layout";
import { PortalEmptyState } from "@/components/portal/PortalEmptyState";
import { PortalPageHeader } from "@/components/portal/PortalSectionHeader";
import { getPublishedPageBySlug } from "@/lib/cms/pages";
import { getActivePortal } from "@/lib/portal/site";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const ctx = await getActivePortal();
  if (!ctx) return { title: "IPN Chile" };
  const page = await getPublishedPageBySlug("/ipn-chile", ctx.tenant);
  return {
    title: page?.seo.title ?? `IPN Chile | ${ctx.config.institution.shortName}`,
    description: page?.seo.description ?? ctx.config.seo.description,
  };
}

export default async function IpnChilePage() {
  const ctx = await getActivePortal();
  if (!ctx) notFound();

  const page = await getPublishedPageBySlug("/ipn-chile", ctx.tenant);
  const { institution, seo } = ctx.config;

  return (
    <>
      <PortalBreadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "IPN Chile" },
        ]}
      />
      <PortalPageHeader
        title="Vinculación con IPN Chile"
        description={
          page?.description ||
          "Alianza institucional con el Instituto Patrístico Nacional de Chile."
        }
      />
      <PortalSection padding="md">
        <PortalContainer size="md">
          <div className="rounded-[var(--radius-2xl)] border border-border bg-background p-8 sm:p-12">
            <div className="flex flex-col items-center gap-8 text-center lg:flex-row lg:text-left">
              {ctx.logos.ipn ? (
                <Image
                  src={ctx.logos.ipn}
                  alt="Instituto Patrístico Nacional de Chile"
                  width={160}
                  height={160}
                  className="h-32 w-auto shrink-0"
                />
              ) : null}
              <div className="flex-1">
                {page?.blocks?.length ? (
                  <p className="text-body text-muted">
                    {page.description || seo.description}
                  </p>
                ) : institution.organization ? (
                  <p className="text-body text-muted">{institution.organization}</p>
                ) : (
                  <PortalEmptyState
                    title="Información institucional en preparación"
                    description="El contenido de vinculación con IPN Chile se editará desde el CMS."
                  />
                )}
                <Button href="/institucion" variant="outline" className="mt-6">
                  Información institucional
                </Button>
              </div>
            </div>
          </div>
        </PortalContainer>
      </PortalSection>
    </>
  );
}
