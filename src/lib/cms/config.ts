import { unstable_cache, revalidatePath, revalidateTag } from "next/cache";
import { getDatabase } from "@/lib/mongodb";
import { normalizeSiteConfig } from "@/lib/cms/normalize";
import type { SiteConfig, SiteConfigUpdate } from "@/types/cms";
import { SITE_CONFIG_ID } from "@/types/cms";

const CMS_CONFIG_TAG = "cms-config";

async function fetchSiteConfigFromDb(): Promise<SiteConfig | null> {
  const db = await getDatabase();
  const raw = await db
    .collection<SiteConfig>("cms_config")
    .findOne({ _id: SITE_CONFIG_ID });

  return normalizeSiteConfig(raw);
}

export const getSiteConfig = unstable_cache(
  fetchSiteConfigFromDb,
  ["site-config"],
  { tags: [CMS_CONFIG_TAG], revalidate: 60 }
);

export async function getSiteConfigUncached(): Promise<SiteConfig | null> {
  return fetchSiteConfigFromDb();
}

export async function updateSiteConfig(
  update: SiteConfigUpdate
): Promise<SiteConfig | null> {
  const db = await getDatabase();
  const existing = await fetchSiteConfigFromDb();

  if (!existing) {
    return null;
  }

  const now = new Date().toISOString();
  const merged = {
    ...existing,
    ...update,
    _id: SITE_CONFIG_ID,
    createdAt: existing.createdAt,
    updatedAt: now,
  };

  const document = normalizeSiteConfig(merged);
  if (!document) {
    return null;
  }

  await db.collection<SiteConfig>("cms_config").replaceOne(
    { _id: SITE_CONFIG_ID },
    document
  );

  revalidateTag(CMS_CONFIG_TAG, "max");
  revalidatePath("/", "layout");

  return document;
}
