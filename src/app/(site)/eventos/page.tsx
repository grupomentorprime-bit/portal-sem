import { PortalBreadcrumb, PortalContainer, PortalSection } from "@/components/portal/layout";
import { PortalEmptyState } from "@/components/portal/PortalEmptyState";
import { PortalPageHeader } from "@/components/portal/PortalSectionHeader";
import { EventCard } from "@/components/portal/cards";
import { fetchEvents } from "@/lib/portal/content";
import { getActivePortal } from "@/lib/portal/site";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const ctx = await getActivePortal();
  if (!ctx) return { title: "Eventos" };
  return {
    title: `Eventos | ${ctx.config.institution.shortName}`,
    description: "Calendario de eventos institucionales.",
  };
}

export default async function EventosPage() {
  const ctx = await getActivePortal();
  if (!ctx) notFound();

  const events = await fetchEvents(ctx.tenant);

  return (
    <>
      <PortalBreadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Eventos" },
        ]}
      />
      <PortalPageHeader
        title="Eventos"
        description="Actividades, encuentros y celebraciones de nuestra comunidad académica."
      />
      <PortalSection padding="md">
        <PortalContainer>
          {events.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <PortalEmptyState
              title="Sin eventos programados"
              description="Los eventos aparecerán aquí cuando se publiquen desde el CMS."
            />
          )}
        </PortalContainer>
      </PortalSection>
    </>
  );
}
