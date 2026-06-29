import "server-only";

import type { CmsPage } from "@/types/page";

export async function emitPageCreated(page: CmsPage, userId?: string): Promise<void> {
  const { publish } = await import("@/core/events/publisher");
  await publish({
    type: "PageCreated",
    tenantId: page.tenant,
    entityType: "cms.page",
    entityId: page._id,
    userId,
    payload: { slug: page.slug, title: page.title, status: page.status },
  });
}

export async function emitPageStatusChange(
  page: CmsPage,
  previousStatus: string | undefined,
  userId?: string
): Promise<void> {
  const { publish } = await import("@/core/events/publisher");

  if (page.status === "published" && previousStatus !== "published") {
    await publish({
      type: "PagePublished",
      tenantId: page.tenant,
      entityType: "cms.page",
      entityId: page._id,
      userId,
      payload: { slug: page.slug, title: page.title },
    });
  }

  if (page.status === "archived" && previousStatus !== "archived") {
    await publish({
      type: "PageArchived",
      tenantId: page.tenant,
      entityType: "cms.page",
      entityId: page._id,
      userId,
      payload: { slug: page.slug, title: page.title },
    });
  }
}
