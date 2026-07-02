import { ContentHubClient } from "@/components/content/ContentHubClient";
import { createDefaultSiteConfig } from "@/lib/cms/defaults";
import { countContentDocuments } from "@/lib/content/query";
import { getSiteConfig } from "@/lib/cms/config";
import type { AllowedCollection } from "@/lib/content/types";

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
] as const satisfies readonly AllowedCollection[];

export default async function AdminContentPage() {
  const config = await getSiteConfig();
  const tenant = config?.institution.tenant ?? "default";

  const countResults = await Promise.all(
    SECTION_COLLECTIONS.map(async (collection) => {
      try {
        const total = await countContentDocuments(tenant, collection, { includeDraft: true });
        return [collection, total] as const;
      } catch {
        return [collection, 0] as const;
      }
    })
  );

  const initialCounts = Object.fromEntries(countResults) as Record<string, number>;

  return (
    <ContentHubClient
      tenant={tenant}
      features={config?.features ?? createDefaultSiteConfig().features}
      initialCounts={initialCounts}
    />
  );
}
