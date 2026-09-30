import { PortalCmsPage, buildPortalPageMetadata } from "@/components/portal/PortalCmsPage";
import { SemPreparedPublicPage } from "@/components/portal/SemPreparedPublicPage";
import { getPublishedPageBySlug } from "@/lib/cms/pages";
import { getSemPreparedPage } from "@/lib/portal/sem-prepared-pages";
import { isSemTenant } from "@/core/tenant/is-sem";
import { getActivePortal } from "@/lib/portal/site";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

const SLUG = "/admision";

export async function generateMetadata(): Promise<Metadata> {
  return buildPortalPageMetadata(SLUG, "Admisión");
}

export default async function AdmisionPage() {
  const ctx = await getActivePortal();
  if (!ctx) notFound();

  const published = await getPublishedPageBySlug(SLUG, ctx.tenant);
  if (published?.blocks?.length) {
    return <PortalCmsPage slug={SLUG} fallbackTitle="Admisión" />;
  }

  const prepared = getSemPreparedPage(SLUG);
  if (prepared && isSemTenant(ctx.tenant)) {
    return <SemPreparedPublicPage spec={prepared} />;
  }

  return <PortalCmsPage slug={SLUG} fallbackTitle="Admisión" />;
}
