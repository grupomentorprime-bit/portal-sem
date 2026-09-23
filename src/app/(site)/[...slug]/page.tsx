import { PortalRenderer } from "@/components/portal/PortalRenderer";
import { SemPreparedPublicPage } from "@/components/portal/SemPreparedPublicPage";
import {
  buildRenderContext,
  consolidatePageSeo,
  loadPublishedPage,
  preparePageBlocks,
  seoToMetadata,
} from "@/core/portal";
import { parsePublicCmsSegments } from "@/core/portal/public-cms-path";
import { isSemTenant } from "@/core/tenant/is-sem";
import { semCanonicalRedirect } from "@/lib/portal/sem-legacy-redirects";
import { getSemPreparedPage } from "@/lib/portal/sem-prepared-pages";
import { getPortalContext } from "@/lib/portal/site";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export default async function CmsDynamicPage({ params }: PageProps) {
  const { slug: segments } = await params;
  const parsed = parsePublicCmsSegments(segments);
  if (!parsed.ok) notFound();

  const ctx = await getPortalContext();
  if (!ctx || ctx.config.institution.status !== "active") notFound();

  if (isSemTenant(ctx.tenant)) {
    const target = semCanonicalRedirect(parsed.slug);
    if (target) permanentRedirect(target);
  }

  const prepared = isSemTenant(ctx.tenant) ? getSemPreparedPage(parsed.slug) : undefined;
  if (prepared) {
    return <SemPreparedPublicPage spec={prepared} />;
  }

  const page = await loadPublishedPage(parsed.slug, ctx.tenant);
  if (!page) notFound();

  return <PortalRenderer page={page} ctx={ctx} />;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug: segments } = await params;
  const parsed = parsePublicCmsSegments(segments);
  const ctx = await getPortalContext();
  if (!parsed.ok || !ctx) return { title: "Portal Institucional" };

  const prepared = isSemTenant(ctx.tenant) ? getSemPreparedPage(parsed.slug) : undefined;
  const page = await loadPublishedPage(parsed.slug, ctx.tenant);
  if (!page) {
    return {
      title: prepared ? `${prepared.title} | ${ctx.config.institution.shortName}` : ctx.config.seo.title,
    };
  }

  const renderCtx = buildRenderContext({ tenantId: ctx.tenant, config: ctx.config });
  const blocks = preparePageBlocks(page, renderCtx);
  const seo = consolidatePageSeo(page, ctx.config, blocks);
  return seoToMetadata(seo);
}
