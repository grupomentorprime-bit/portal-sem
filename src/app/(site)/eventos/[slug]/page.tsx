import Image from "next/image";
import { Calendar, MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { iconSizes } from "@/design";
import { Badge } from "@/components/ui";
import { PortalBreadcrumb, PortalContainer, PortalSection } from "@/components/portal/layout";
import { PortalEmptyState } from "@/components/portal/PortalEmptyState";
import { EventCard } from "@/components/portal/cards";
import { ShareBar } from "@/components/portal/ShareBar";
import { fetchEventBySlug, fetchRelatedEvents } from "@/lib/portal/content";
import { getActivePortal } from "@/lib/portal/site";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const ctx = await getActivePortal();
  if (!ctx) return { title: "Evento" };
  const event = await fetchEventBySlug(ctx.tenant, slug);
  if (!event) return { title: "Evento no encontrado" };
  return {
    title: event.seo.title || event.title,
    description: event.seo.description || event.summary,
  };
}

export default async function EventoDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const ctx = await getActivePortal();
  if (!ctx) notFound();

  const event = await fetchEventBySlug(ctx.tenant, slug);
  if (!event) notFound();

  const related = await fetchRelatedEvents(ctx.tenant, slug, 3);

  return (
    <>
      <PortalBreadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Eventos", href: "/eventos" },
          { label: event.title },
        ]}
      />

      <PortalSection padding="md">
        <PortalContainer size="md">
          <article>
            <header>
              <Badge variant="info">Evento</Badge>
              <h1 className="mt-4 text-display-s font-semibold text-foreground sm:text-display-m">
                {event.title}
              </h1>
              <ul className="mt-4 flex flex-wrap gap-4 text-body text-muted">
                {event.publishedAt || event.date ? (
                  <li className="flex items-center gap-2">
                    <Calendar size={iconSizes.sm} strokeWidth={2} />
                    <time>
                      {event.date ||
                        new Intl.DateTimeFormat("es-CL", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }).format(new Date(event.publishedAt))}
                    </time>
                  </li>
                ) : null}
                {event.location ? (
                  <li className="flex items-center gap-2">
                    <MapPin size={iconSizes.sm} strokeWidth={2} />
                    {event.location}
                  </li>
                ) : null}
              </ul>
            </header>

            {event.image ? (
              <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-[var(--radius-xl)]">
                <Image
                  src={event.image}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 768px"
                  priority
                />
              </div>
            ) : null}

            <div className="mt-8">
              {event.content ? (
                <div className="whitespace-pre-line text-body text-muted">{event.content}</div>
              ) : event.summary ? (
                <p className="text-body text-muted">{event.summary}</p>
              ) : (
                <PortalEmptyState
                  title="Detalle en preparación"
                  description="La información del evento se completará desde el CMS."
                />
              )}
            </div>

            <ShareBar title={event.title} className="mt-10 border-t border-border pt-6" />
          </article>

          {related.length > 0 ? (
            <section className="mt-16">
              <h2 className="text-heading text-foreground">Eventos relacionados</h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((item) => (
                  <EventCard key={item.id} event={item} />
                ))}
              </div>
            </section>
          ) : null}
        </PortalContainer>
      </PortalSection>
    </>
  );
}
