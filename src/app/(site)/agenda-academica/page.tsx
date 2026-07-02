import { PortalBreadcrumb, PortalContainer, PortalSection } from "@/components/portal/layout";
import { PortalEmptyState } from "@/components/portal/PortalEmptyState";
import { PortalPageHeader } from "@/components/portal/PortalSectionHeader";
import { AcademicAgendaCard } from "@/components/portal/cards";
import { fetchAcademicAgenda } from "@/lib/portal/content";
import { getActivePortal } from "@/lib/portal/site";
import { ACADEMIC_AGENDA_CATEGORIES } from "@/types/academic-portal";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const ctx = await getActivePortal();
  if (!ctx) return { title: "Agenda Académica" };
  return {
    title: `Agenda Académica | ${ctx.config.institution.shortName}`,
    description: "Calendario oficial de hitos académicos del seminario.",
  };
}

export default async function AgendaAcademicaPage() {
  const ctx = await getActivePortal();
  if (!ctx) notFound();
  const items = await fetchAcademicAgenda(ctx.tenant, { upcoming: false, limit: 48 });

  return (
    <>
      <PortalBreadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Agenda Académica" },
        ]}
      />
      <PortalPageHeader
        title="Agenda académica"
        description="Calendario oficial con los principales hitos del año formativo."
      />
      <PortalSection padding="md">
        <PortalContainer>
          <div className="mb-8 flex flex-wrap gap-2">
            {ACADEMIC_AGENDA_CATEGORIES.map((cat) => (
              <span
                key={cat.value}
                className="rounded-full bg-background-soft px-3 py-1 text-caption font-medium text-muted"
              >
                {cat.label}
              </span>
            ))}
          </div>

          {items.length > 0 ? (
            <ul className="eco-events-timeline max-w-3xl" role="list">
              {items.map((item) => (
                <li key={item.id}>
                  <AcademicAgendaCard item={item} variant="timeline" ctaLabel="Ver detalle" />
                </li>
              ))}
            </ul>
          ) : (
            <PortalEmptyState
              title="Sin hitos programados"
              description="El calendario académico se publicará desde el CMS."
            />
          )}
        </PortalContainer>
      </PortalSection>
    </>
  );
}
