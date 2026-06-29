import { PortalBreadcrumb, PortalContainer, PortalSection } from "@/components/portal/layout";
import { PortalEmptyState } from "@/components/portal/PortalEmptyState";
import { PortalPageHeader } from "@/components/portal/PortalSectionHeader";
import { NewsCard } from "@/components/portal/cards";
import { fetchNews } from "@/lib/portal/content";
import { getActivePortal } from "@/lib/portal/site";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const ctx = await getActivePortal();
  if (!ctx) return { title: "Noticias" };
  return {
    title: `Noticias | ${ctx.config.institution.shortName}`,
    description: "Novedades y actualidad institucional.",
  };
}

export default async function NoticiasPage() {
  const ctx = await getActivePortal();
  if (!ctx) notFound();
  const news = await fetchNews(ctx.tenant);

  const categories = [...new Set(news.map((n) => n.category).filter(Boolean))];

  return (
    <>
      <PortalBreadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Noticias" },
        ]}
      />
      <PortalPageHeader
        title="Noticias y novedades"
        description="Mantente informado sobre la vida académica e institucional."
      />
      <PortalSection padding="md">
        <PortalContainer>
          {categories.length > 0 ? (
            <div className="mb-8 flex flex-wrap gap-2">
              {categories.map((cat) => (
                <span
                  key={cat}
                  className="rounded-full bg-background-soft px-3 py-1 text-caption font-medium text-muted"
                >
                  {cat}
                </span>
              ))}
            </div>
          ) : null}

          {news.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {news.map((item) => (
                <NewsCard key={item.id} news={item} />
              ))}
            </div>
          ) : (
            <PortalEmptyState
              title="Sin noticias publicadas"
              description="Las novedades aparecerán aquí cuando se publiquen desde el CMS."
            />
          )}
        </PortalContainer>
      </PortalSection>
    </>
  );
}
