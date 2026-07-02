import { PortalBreadcrumb, PortalContainer, PortalSection } from "@/components/portal/layout";
import { PortalEmptyState } from "@/components/portal/PortalEmptyState";
import { PortalPageHeader } from "@/components/portal/PortalSectionHeader";
import { LibraryCard } from "@/components/portal/cards";
import { fetchLibrary } from "@/lib/portal/content";
import { getActivePortal } from "@/lib/portal/site";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const ctx = await getActivePortal();
  if (!ctx) return { title: "Biblioteca institucional" };
  return {
    title: `Biblioteca institucional | ${ctx.config.institution.shortName}`,
    description:
      "Material formativo, estudios bíblicos y recursos académicos del Seminario Eclesiástico Mayor.",
  };
}

export default async function BibliotecaPage() {
  const ctx = await getActivePortal();
  if (!ctx) notFound();

  const items = await fetchLibrary(ctx.tenant);
  const resourceTypes = [...new Set(items.map((item) => item.resourceType).filter(Boolean))];

  return (
    <>
      <PortalBreadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Biblioteca" },
        ]}
      />
      <PortalPageHeader
        title="Biblioteca institucional"
        description="Material formativo, estudios bíblicos y recursos académicos para acompañar tu formación ministerial."
      />
      <PortalSection padding="md">
        <PortalContainer>
          {resourceTypes.length > 0 ? (
            <div className="mb-8 flex flex-wrap gap-2">
              {resourceTypes.map((type) => (
                <span
                  key={type}
                  className="rounded-full bg-background-soft px-3 py-1 text-caption font-medium text-muted"
                >
                  {type}
                </span>
              ))}
            </div>
          ) : null}

          {items.length > 0 ? (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" role="list">
              {items.map((item) => (
                <li key={item.id} className="h-full">
                  <LibraryCard item={item} ctaLabel="Consultar recurso" />
                </li>
              ))}
            </ul>
          ) : (
            <PortalEmptyState
              title="Biblioteca en preparación"
              description="El material formativo institucional se publicará próximamente desde el panel de administración."
            />
          )}
        </PortalContainer>
      </PortalSection>
    </>
  );
}
