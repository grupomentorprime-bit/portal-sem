import Image from "next/image";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui";
import { PortalBreadcrumb, PortalContainer, PortalSection } from "@/components/portal/layout";
import { InstitutionalNoticeCard } from "@/components/portal/cards";
import { ShareBar } from "@/components/portal/ShareBar";
import { resolveMediaRef } from "@/core/media";
import { fetchInstitutionalNoticeBySlug, fetchInstitutionalNotices } from "@/lib/portal/content";
import { getActivePortal } from "@/lib/portal/site";
import { institutionalNoticeCategoryLabel } from "@/types/academic-portal";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const ctx = await getActivePortal();
  if (!ctx) return { title: "Aviso" };
  const notice = await fetchInstitutionalNoticeBySlug(ctx.tenant, slug);
  if (!notice) return { title: "Aviso no encontrado" };
  return {
    title: notice.seo.title || notice.title,
    description: notice.seo.description || notice.summary,
  };
}

export default async function AvisoDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const ctx = await getActivePortal();
  if (!ctx) notFound();
  const notice = await fetchInstitutionalNoticeBySlug(ctx.tenant, slug);
  if (!notice) notFound();

  const attachmentUrl = notice.attachmentMediaId
    ? await resolveMediaRef(ctx.tenant, { mediaId: notice.attachmentMediaId })
    : undefined;

  const related = (await fetchInstitutionalNotices(ctx.tenant, { limit: 4 }))
    .filter((n) => n.id !== notice._id)
    .slice(0, 3);

  const categoryLabel = institutionalNoticeCategoryLabel(notice.category || "");

  return (
    <>
      <PortalBreadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Avisos", href: "/avisos" },
          { label: notice.title },
        ]}
      />

      <PortalSection padding="md">
        <PortalContainer size="md">
          <article>
            <header>
              <div className="flex flex-wrap items-center gap-3">
                {categoryLabel ? <Badge variant="info">{categoryLabel}</Badge> : null}
                {notice.featured ? <Badge variant="warning">Destacado</Badge> : null}
                {notice.publishedAt ? (
                  <time className="text-caption text-muted" dateTime={notice.publishedAt}>
                    {new Intl.DateTimeFormat("es-CL", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }).format(new Date(notice.publishedAt))}
                  </time>
                ) : null}
              </div>
              <h1 className="mt-4 text-display-s font-semibold text-foreground sm:text-display-m">
                {notice.title}
              </h1>
              {notice.summary ? (
                <p className="mt-4 text-lg text-muted">{notice.summary}</p>
              ) : null}
            </header>

            {notice.image ? (
              <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-xl">
                <Image
                  src={notice.image}
                  alt={notice.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 720px"
                  priority
                />
              </div>
            ) : null}

            {notice.content ? (
              <div className="prose prose-zinc mt-8 max-w-none dark:prose-invert">
                <p className="whitespace-pre-wrap text-body">{notice.content}</p>
              </div>
            ) : null}

            {attachmentUrl ? (
              <div className="mt-8">
                <a
                  href={attachmentUrl}
                  className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-background-muted"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Descargar adjunto
                </a>
              </div>
            ) : null}

            <ShareBar title={notice.title} className="mt-10" />
          </article>

          {related.length > 0 ? (
            <aside className="mt-16 border-t border-border pt-10">
              <h2 className="text-heading font-semibold text-foreground">Más avisos</h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((item) => (
                  <InstitutionalNoticeCard key={item.id} notice={item} ctaLabel="Leer aviso" />
                ))}
              </div>
            </aside>
          ) : null}
        </PortalContainer>
      </PortalSection>
    </>
  );
}
