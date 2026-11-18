import { getDatabase } from "@/lib/mongodb";
import type { SiteContentValue } from "@/sites/types";

export const SITE_PAGE_CONTENT_COLLECTION = "site_page_content";

export interface SitePageContentDoc {
  tenantId: string;
  path: string;
  values: Record<string, SiteContentValue>;
  updatedAt: Date;
}

export async function getSitePageContent(
  tenantId: string,
  path: string
): Promise<SitePageContentDoc | null> {
  const db = await getDatabase();
  return db
    .collection<SitePageContentDoc>(SITE_PAGE_CONTENT_COLLECTION)
    .findOne({ tenantId, path });
}

export async function saveSitePageContent(
  tenantId: string,
  path: string,
  values: Record<string, SiteContentValue>
): Promise<void> {
  const db = await getDatabase();
  const now = new Date();
  await db.collection<SitePageContentDoc>(SITE_PAGE_CONTENT_COLLECTION).updateOne(
    { tenantId, path },
    { $set: { tenantId, path, values, updatedAt: now } },
    { upsert: true }
  );
}
