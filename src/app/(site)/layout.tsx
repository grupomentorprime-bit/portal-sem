import { PublicSurface } from "@/components/portal/PublicSurface";
import { ComingSoonPage } from "@/components/sites/ComingSoonPage";
import { CodedSiteView } from "@/components/sites/CodedSiteView";
import { getPortalContext } from "@/lib/portal/site";
import { getCodedPageView } from "@/sites/page-views";
import { ensureProductionCodedSites } from "@/sites/production";
import { resolvePageContent } from "@/sites/content/overlay";
import { comingSoonModel, decidePublicSite } from "@/sites/public-decision";
import { getCodedSite } from "@/sites/registry";
import {
  resolveRequestHost,
  shouldEnterPlatformHome,
} from "@/core/tenant/hosts";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { after } from "next/server";

export const dynamic = "force-dynamic";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const host = resolveRequestHost(headerList);
  const pathname = headerList.get("x-pathname") ?? "/";
  const ctx = await getPortalContext();

  if (shouldEnterPlatformHome(host, Boolean(ctx))) {
    if (pathname !== "/" && pathname !== "") {
      redirect("/");
    }
    return <PublicSurface>{children}</PublicSurface>;
  }

  if (!ctx) {
    return <PublicSurface>{children}</PublicSurface>;
  }

  ensureProductionCodedSites();
  const site = getCodedSite(ctx.tenant);
  if (site) {
    try {
      const { syncCodedSiteForms } = await import("@/sites/sync-forms");
      const {
        listExperienceForms,
        createExperienceForm,
        updateExperienceForm,
        revalidateExperienceFormsCache,
      } = await import("@/lib/experience/forms/repository");
      const synced = await syncCodedSiteForms(ctx.tenant, site.forms, {
        list: listExperienceForms,
        create: (data) => createExperienceForm(data, { revalidate: false }),
        update: (tenant, id, update) =>
          updateExperienceForm(tenant, id, update, { revalidate: false }),
      });
      const changed = [...synced.upserted, ...synced.archived];
      if (changed.length > 0) {
        after(() => {
          for (const id of changed) revalidateExperienceFormsCache(id);
        });
      }
    } catch (error) {
      console.error(
        "[coded-site] no se pudieron sincronizar los formularios",
        error instanceof Error ? error.message : error
      );
    }
  }

  const decision = decidePublicSite({
    hasTenant: true,
    sitePublished: ctx.config.sitePublished === true,
    hasSiteModule: Boolean(site),
    pathname,
    registeredPaths: site?.pages.map((page) => page.path) ?? [],
  });

  if (decision.kind === "passthrough") {
    return <PublicSurface>{children}</PublicSurface>;
  }

  if (decision.kind === "coming-soon") {
    return (
      <PublicSurface>
        <ComingSoonPage
          model={comingSoonModel({
            institutionName: ctx.config.institution.name,
            contact: ctx.config.contact,
            social: ctx.config.social,
          })}
        />
      </PublicSurface>
    );
  }

  if (decision.kind === "not-found") {
    notFound();
  }

  if (decision.kind === "page" && site) {
    const { registerProductionPageViews } = await import("@/sites/production-views");
    registerProductionPageViews();
    const page = site.pages.find((item) => item.path === decision.path);
    let content = resolvePageContent(page, undefined);
    if (page?.slots?.length) {
      try {
        const { getSitePageContent } = await import("@/sites/content/store");
        const stored = await getSitePageContent(ctx.tenant, decision.path);
        content = resolvePageContent(page, stored?.values);
      } catch (error) {
        console.error(
          "[coded-site] no se pudo leer el contenido de la página",
          error instanceof Error ? error.message : error
        );
      }
    }
    const PageView = getCodedPageView(ctx.tenant, decision.path);
    if (PageView) {
      return (
        <PublicSurface>
          <PageView
            institutionName={ctx.config.institution.name}
            contact={ctx.config.contact}
            social={ctx.config.social}
            content={content}
          />
        </PublicSurface>
      );
    }
    return (
      <PublicSurface>
        <CodedSiteView
          site={site}
          path={decision.path}
          institutionName={ctx.config.institution.name}
          contact={ctx.config.contact}
          social={ctx.config.social}
          content={content}
        />
      </PublicSurface>
    );
  }

  notFound();
}
