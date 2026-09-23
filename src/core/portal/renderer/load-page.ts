import "server-only";

import { blocksFromTemplate, DEFAULT_TEMPLATES } from "@/lib/cms/page-defaults";
import { isSemTenant } from "@/core/tenant/is-sem";
import { semEditorialPage } from "@/lib/portal/sem-identity-v7";
import { getPublishedPageBySlug } from "@/lib/cms/pages";
import type { PortalPageModel, PortalRenderContext } from "@/types/portal";
import { getRenderableBlocks } from "@/core/portal/visibility";
import { composeStoredPublicHome } from "@/core/portal/renderer/public-home";

export async function loadPublishedPage(
  slug: string,
  tenantId: string,
  fallbackTemplateId?: string
): Promise<PortalPageModel | null> {
  const normalized = slug.startsWith("/") ? slug : `/${slug}`;
  const page = await getPublishedPageBySlug(normalized, tenantId);
  if (page && page.tenant !== tenantId) return null;

  if (page?.blocks?.length) {
    return {
      slug: page.slug,
      title: page.title,
      blocks: page.blocks,
      seo: page.seo,
      tenantId: page.tenant,
    };
  }

  // El CMS publicado es el origen. El editorial de código solo cubre páginas aún vacías.
  const editorial = semEditorialPage(normalized, tenantId);
  if (editorial) return editorial;

  if (page) {
    return {
      slug: page.slug,
      title: page.title,
      blocks: page.blocks,
      seo: page.seo,
      tenantId: page.tenant,
    };
  }

  const templateId =
    fallbackTemplateId === "home" && !isSemTenant(tenantId) ? undefined : fallbackTemplateId;
  if (templateId) {
    const template = DEFAULT_TEMPLATES.find((t) => t._id === templateId);
    if (template) {
      return {
        slug: normalized,
        title: template.name,
        blocks: blocksFromTemplate(template),
        seo: {},
        tenantId,
      };
    }
  }

  return null;
}

export function preparePageBlocks(
  page: PortalPageModel,
  ctx: PortalRenderContext
) {
  return getRenderableBlocks(page.blocks, ctx);
}

export async function loadHomePage(tenantId: string): Promise<PortalPageModel> {
  const published = await getPublishedPageBySlug("/", tenantId);
  if (published?.blocks?.length && published.tenant === tenantId) {
    return {
      slug: published.slug,
      title: published.title,
      blocks: published.blocks,
      seo: published.seo,
      tenantId: published.tenant,
    };
  }

  const page = await loadPublishedPage("/", tenantId);
  return composeStoredPublicHome(tenantId, page);
}
