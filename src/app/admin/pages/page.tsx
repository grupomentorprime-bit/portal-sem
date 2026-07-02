import { PageListClient } from "@/components/page-builder/PageListClient";
import { getSiteConfigUncached } from "@/lib/cms/config";
import { getAllPagesUncached } from "@/lib/cms/pages";
import { getTemplatesUncached, seedDefaultHomePage, seedTemplates } from "@/lib/cms/templates";
import { seedBlockLibrary } from "@/lib/cms/blocks";
import { seedContentCollections } from "@/lib/content/seed";

export const dynamic = "force-dynamic";

export default async function AdminPagesPage() {
  const config = await getSiteConfigUncached();
  let pages = await getAllPagesUncached(config?.institution.tenant);

  if (pages.length === 0 && config) {
    await seedBlockLibrary();
    await seedTemplates();
    await seedContentCollections(config.institution.tenant, { revalidate: false });
    await seedDefaultHomePage(
      config.institution.tenant,
      config.institution.name,
      config.seo.description,
      { revalidate: false }
    );
    pages = await getAllPagesUncached(config.institution.tenant);
  }

  const templates = await getTemplatesUncached();

  return (
    <PageListClient
      pages={pages}
      templates={templates}
      tenant={config?.institution.tenant ?? "default"}
    />
  );
}
