import "server-only";

import { blocksFromTemplate, DEFAULT_TEMPLATES } from "@/lib/cms/page-defaults";
import { getPublishedPageBySlug } from "@/lib/cms/pages";
import type { PortalPageModel, PortalRenderContext } from "@/types/portal";
import type { SiteConfig } from "@/types/cms";
import { getRenderableBlocks } from "@/core/portal/visibility";

export function buildRenderContext(input: {
  tenantId: string;
  config: SiteConfig;
  preview?: boolean;
  audience?: PortalRenderContext["audience"];
  language?: string;
}): PortalRenderContext {
  return {
    tenantId: input.tenantId,
    audience: input.audience ?? "guest",
    featureFlags: input.config.features,
    language: input.language,
    preview: input.preview,
  };
}

export async function loadPublishedPage(
  slug: string,
  tenantId: string,
  fallbackTemplateId?: string
): Promise<PortalPageModel | null> {
  const normalized = slug.startsWith("/") ? slug : `/${slug}`;
  const page = await getPublishedPageBySlug(normalized, tenantId);

  if (page) {
    return {
      slug: page.slug,
      title: page.title,
      blocks: page.blocks,
      seo: page.seo,
      tenantId: page.tenant,
    };
  }

  if (fallbackTemplateId) {
    const template = DEFAULT_TEMPLATES.find((t) => t._id === fallbackTemplateId);
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
  const page = await loadPublishedPage("/", tenantId, "home");
  return (
    page ?? {
      slug: "/",
      title: "Inicio",
      blocks: [],
      seo: {},
      tenantId,
    }
  );
}
