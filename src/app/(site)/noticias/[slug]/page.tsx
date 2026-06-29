import Image from "next/image";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui";
import { PortalBreadcrumb, PortalContainer, PortalSection } from "@/components/portal/layout";
import { PortalEmptyState } from "@/components/portal/PortalEmptyState";
import { NewsCard } from "@/components/portal/cards";
import { ShareBar } from "@/components/portal/ShareBar";
import { fetchNewsBySlug, fetchRelatedNews } from "@/lib/portal/content";
import { getActivePortal } from "@/lib/portal/site";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const ctx = await getActivePortal();
  if (!ctx) return { title: "Noticia" };
  const article = await fetchNewsBySlug(ctx.tenant, slug);
  if (!article) return { title: "Noticia no encontrada" };
  return {
    title: article.seo.title || article.title,
    description: article.seo.description || article.summary,
  };
}

export default async function NoticiaDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const ctx = await getActivePortal();
  if (!ctx) notFound();
  const article = await fetchNewsBySlug(ctx.tenant, slug);

  if (!article) notFound();

  const related = await fetchRelatedNews(
    ctx.tenant,
    slug,
    article.category || article.categories?.[0],
    3
  );

  return (
    <>
      <PortalBreadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Noticias", href: "/noticias" },
          { label: article.title },
        ]}
      />

      <PortalSection padding="md">
        <PortalContainer size="md">
          <article>
            <header>
              <div className="flex flex-wrap items-center gap-3">
                {article.category || article.categories?.[0] ? (
                  <Badge variant="info">
                    {article.category || article.categories[0]}
                  </Badge>
                ) : null}
                {article.publishedAt ? (
                  <time className="text-caption text-muted">
                    {new Intl.DateTimeFormat("es-CL", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }).format(new Date(article.publishedAt))}
                  </time>
                ) : null}
              </div>
              <h1 className="mt-4 text-display-s font-semibold text-foreground sm:text-display-m">
                {article.title}
              </h1>
              {article.summary ? (
                <p className="mt-4 text-lg text-muted">{article.summary}</p>
              ) : null}
            </header>

            {article.image ? (
              <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-[var(--radius-xl)]">
                <Image
                  src={article.image}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 768px"
                  priority
                />
              </div>
            ) : null}

            <div className="mt-8">
              {article.content ? (
                <div className="whitespace-pre-line text-body text-muted">{article.content}</div>
              ) : (
                <PortalEmptyState
                  title="Contenido en preparación"
                  description="El cuerpo de la noticia se completará desde el CMS."
                />
              )}
            </div>

            <ShareBar title={article.title} className="mt-10 border-t border-border pt-6" />
          </article>

          {related.length > 0 ? (
            <section className="mt-16">
              <h2 className="text-heading text-foreground">Noticias relacionadas</h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((item) => (
                  <NewsCard key={item.id} news={item} />
                ))}
              </div>
            </section>
          ) : null}
        </PortalContainer>
      </PortalSection>
    </>
  );
}
