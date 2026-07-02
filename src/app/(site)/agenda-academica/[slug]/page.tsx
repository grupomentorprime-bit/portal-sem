import { notFound } from "next/navigation";
import { Badge } from "@/components/ui";
import { PortalBreadcrumb, PortalContainer, PortalSection } from "@/components/portal/layout";
import { AcademicAgendaCard } from "@/components/portal/cards";
import { ShareBar } from "@/components/portal/ShareBar";
import { fetchAcademicAgenda, fetchAcademicAgendaBySlug } from "@/lib/portal/content";
import { getActivePortal } from "@/lib/portal/site";
import { academicAgendaCategoryLabel } from "@/types/academic-portal";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const ctx = await getActivePortal();
  if (!ctx) return { title: "Hito académico" };
  const item = await fetchAcademicAgendaBySlug(ctx.tenant, slug);
  if (!item) return { title: "Hito no encontrado" };
  return {
    title: item.seo.title || item.title,
    description: item.seo.description || item.summary,
  };
}

export default async function AgendaAcademicaDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const ctx = await getActivePortal();
  if (!ctx) notFound();
  const item = await fetchAcademicAgendaBySlug(ctx.tenant, slug);
  if (!item) notFound();

  const related = (await fetchAcademicAgenda(ctx.tenant, { limit: 4 }))
    .filter((a) => a.id !== item._id)
    .slice(0, 3);

  const categoryLabel = academicAgendaCategoryLabel(item.category || "");

  return (
    <>
      <PortalBreadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Agenda Académica", href: "/agenda-academica" },
          { label: item.title },
        ]}
      />

      <PortalSection padding="md">
        <PortalContainer size="md">
          <article>
            <header>
              <div className="flex flex-wrap items-center gap-3">
                {categoryLabel ? <Badge variant="info">{categoryLabel}</Badge> : null}
                {item.startDate ? (
                  <time className="text-caption text-muted" dateTime={item.startDate}>
                    {new Intl.DateTimeFormat("es-CL", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }).format(new Date(item.startDate))}
                    {item.endDate
                      ? ` — ${new Intl.DateTimeFormat("es-CL", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }).format(new Date(item.endDate))}`
                      : ""}
                  </time>
                ) : null}
              </div>
              <h1 className="mt-4 text-display-s font-semibold text-foreground sm:text-display-m">
                {item.title}
              </h1>
              {item.summary ? (
                <p className="mt-4 text-lg text-muted">{item.summary}</p>
              ) : null}
            </header>

            {item.content ? (
              <div className="prose prose-zinc mt-8 max-w-none dark:prose-invert">
                <p className="whitespace-pre-wrap text-body">{item.content}</p>
              </div>
            ) : null}

            <ShareBar title={item.title} className="mt-10" />
          </article>

          {related.length > 0 ? (
            <aside className="mt-16 border-t border-border pt-10">
              <h2 className="text-heading font-semibold text-foreground">Próximos hitos</h2>
              <ul className="mt-6 space-y-4" role="list">
                {related.map((agenda) => (
                  <li key={agenda.id}>
                    <AcademicAgendaCard item={agenda} variant="timeline" />
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}
        </PortalContainer>
      </PortalSection>
    </>
  );
}
