import { PortalCmsPage, buildPortalPageMetadata } from "@/components/portal/PortalCmsPage";
import { isSemTenant } from "@/core/tenant/is-sem";
import { semCanonicalRedirect } from "@/lib/portal/sem-legacy-redirects";
import { getActivePortal } from "@/lib/portal/site";
import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

export async function generateMetadata(): Promise<Metadata> {
  return buildPortalPageMetadata("institucion", "Institución");
}

export default async function InstitucionPage() {
  const ctx = await getActivePortal();
  const target = ctx && isSemTenant(ctx.tenant) ? semCanonicalRedirect("/institucion") : null;
  if (target) permanentRedirect(target);

  return (
    <PortalCmsPage
      slug="institucion"
      fallbackTitle="Institución"
    />
  );
}
