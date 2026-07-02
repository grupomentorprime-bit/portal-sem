import { ContentHubClient } from "@/components/content/ContentHubClient";
import { createDefaultSiteConfig } from "@/lib/cms/defaults";
import { executeContentQuery } from "@/lib/content/query";
import { getSiteConfigUncached } from "@/lib/cms/config";

export const dynamic = "force-dynamic";

const SECTION_COLLECTIONS = [
  "academy_programs",
  "content_news",
  "content_people",
  "academy_team",
  "content_library",
  "content_events",
  "content_academic_agenda",
  "content_institutional_notices",
  "academy_testimonials",
  "academy_gallery",
  "academy_categories",
] as const;

export default async function AdminContentPage() {
  const config = await getSiteConfigUncached();
  const tenant = config?.institution.tenant ?? "default";

  const initialCounts: Record<string, number> = {};
  for (const collection of SECTION_COLLECTIONS) {
    try {
      const result = await executeContentQuery(
        { tenant, collection, pagination: { page: 1, limit: 1 } },
        { includeDraft: true, mapItems: false, skipCache: true }
      );
      initialCounts[collection] = result.total;
    } catch {
      initialCounts[collection] = 0;
    }
  }

  return (
    <ContentHubClient
      tenant={tenant}
      features={config?.features ?? createDefaultSiteConfig().features}
      initialCounts={initialCounts}
    />
  );
}
