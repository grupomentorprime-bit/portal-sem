import { ServerBlockRenderer } from "@/components/page-builder/ServerBlockRenderer";
import { getSiteConfig } from "@/lib/cms/config";
import { getPublishedPageBySlug } from "@/lib/cms/pages";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CmsDynamicPage({ params }: PageProps) {
  const { slug } = await params;
  const config = await getSiteConfig();

  if (!config || config.institution.status !== "active") {
    notFound();
  }

  const pageSlug = `/${slug}`;
  const page = await getPublishedPageBySlug(pageSlug, config.institution.tenant);
  if (!page) notFound();

  return (
    <ServerBlockRenderer
      blocks={page.blocks}
      config={config}
      tenant={config.institution.tenant}
    />
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const config = await getSiteConfig();
  if (!config) return { title: "Portal Institucional" };

  const page = await getPublishedPageBySlug(`/${slug}`, config.institution.tenant);
  if (!page) return { title: config.seo.title };

  return {
    title: page.seo.title ?? page.title,
    description: page.seo.description ?? page.description,
  };
}
