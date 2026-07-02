import type { CmsPage, PageBlock } from "@/types/page";
import type { PageExportDocument } from "./schema/types";

export function exportPageDocument(page: CmsPage): PageExportDocument {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    tenant: page.tenant,
    page: {
      title: page.title,
      slug: page.slug,
      description: page.description,
      template: page.template,
      seo: page.seo as Record<string, unknown>,
      blocks: page.blocks.map((block) => ({
        id: block.id,
        type: block.type,
        visible: block.visible,
        order: block.order,
        settings: block.settings as Record<string, unknown>,
      })),
    },
  };
}

export function importPageDocument(
  doc: PageExportDocument,
  target: CmsPage
): CmsPage {
  if (doc.version !== 1) {
    throw new Error("Formato de página no compatible.");
  }

  return {
    ...target,
    title: doc.page.title,
    slug: doc.page.slug,
    description: doc.page.description,
    template: doc.page.template as CmsPage["template"],
    seo: doc.page.seo as CmsPage["seo"],
    blocks: doc.page.blocks as PageBlock[],
  };
}

export function downloadPageJson(page: CmsPage, filename?: string) {
  const doc = exportPageDocument(page);
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename ?? `${page.slug.replace(/\//g, "-") || "page"}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
