import { PortalRenderer } from "@/components/portal/PortalRenderer";
import {
  buildRenderContext,
  consolidatePageSeo,
  loadPublishedPage,
  preparePageBlocks,
  seoToMetadata,
} from "@/core/portal";
import { getPortalContext } from "@/lib/portal/site";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CmsDynamicPage({ params }: PageProps) {
  const { slug } = await params;
  const ctx = await getPortalContext();

  if (!ctx || ctx.config.institution.status !== "active") {
    notFound();
  }

  const pageSlug = `/${slug}`;
  const page = await loadPublishedPage(pageSlug, ctx.tenant);
  if (!page) notFound();

  return <PortalRenderer page={page} ctx={ctx} />;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const ctx = await getPortalContext();
  if (!ctx) return { title: "Portal Institucional" };

  const page = await loadPublishedPage(`/${slug}`, ctx.tenant);
  if (!page) return { title: ctx.config.seo.title };

  const renderCtx = buildRenderContext({ tenantId: ctx.tenant, config: ctx.config });
  const blocks = preparePageBlocks(page, renderCtx);
  const seo = consolidatePageSeo(page, ctx.config, blocks);

  return seoToMetadata(seo);
}
