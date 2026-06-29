import { unstable_cache, revalidateTag } from "next/cache";
import { getDatabase } from "@/lib/mongodb";
import { blocksFromTemplate, DEFAULT_TEMPLATES, SEED_HOME_BLOCK_DATA } from "@/lib/cms/page-defaults";
import type { CmsPage, CmsTemplate } from "@/types/page";

const CMS_TEMPLATES_TAG = "cms-templates";

async function fetchTemplatesFromDb(): Promise<CmsTemplate[]> {
  const db = await getDatabase();
  const templates = await db
    .collection<CmsTemplate>("cms_templates")
    .find({ enabled: true })
    .sort({ name: 1 })
    .toArray();
  return templates.length > 0 ? templates : DEFAULT_TEMPLATES;
}

export const getTemplates = unstable_cache(
  fetchTemplatesFromDb,
  ["cms-templates-all"],
  { tags: [CMS_TEMPLATES_TAG], revalidate: 300 }
);

export async function getTemplatesUncached(): Promise<CmsTemplate[]> {
  return fetchTemplatesFromDb();
}

export async function seedTemplates(): Promise<CmsTemplate[]> {
  const db = await getDatabase();
  const collection = db.collection<CmsTemplate>("cms_templates");

  for (const template of DEFAULT_TEMPLATES) {
    await collection.updateOne(
      { _id: template._id },
      { $setOnInsert: template },
      { upsert: true }
    );
  }

  revalidateTag(CMS_TEMPLATES_TAG, "max");
  return fetchTemplatesFromDb();
}

export async function seedDefaultHomePage(
  tenant: string,
  institutionName: string,
  seoDescription: string
): Promise<CmsPage | null> {
  const { getPageByIdUncached, createPage, pageExists } = await import("@/lib/cms/pages");
  if (await pageExists("home")) return getPageByIdUncached("home");

  const homeTemplate = DEFAULT_TEMPLATES.find((t) => t._id === "home");
  if (!homeTemplate) return null;

  const blocks = blocksFromTemplate(homeTemplate);

  const hero = blocks.find((b) => b.type === "hero");
  if (hero) {
    hero.settings = {
      ...hero.settings,
      institutionName,
      motto: "Equipando a los santos para la obra del ministerio",
    };
  }

  const presentation = blocks.find((b) => b.type === "presentation");
  if (presentation) {
    presentation.settings = {
      ...presentation.settings,
      title: "Formación al servicio de la Iglesia",
      description: seoDescription,
      verseText:
        "Y él mismo constituyó a algunos en apóstoles, a otros en profetas, a otros en evangelistas, a otros en pastores y maestros, para equipar a los santos para la obra del ministerio.",
      verseReference: "Efesios 4:11-12",
    };
  }

  const programs = blocks.find((b) => b.type === "programs");
  if (programs) {
    programs.settings = { ...programs.settings, title: "Nuestros programas" };
  }

  const stats = blocks.find((b) => b.type === "stats");
  if (stats) stats.settings = { ...stats.settings, ...SEED_HOME_BLOCK_DATA.stats };

  const cta = blocks.find((b) => b.type === "cta");
  if (cta) cta.settings = { ...cta.settings, ...SEED_HOME_BLOCK_DATA.cta };

  return createPage({
    _id: "home",
    tenant,
    title: "Inicio",
    slug: "/",
    description: "Página principal",
    template: "institutional",
    status: "published",
    seo: { title: institutionName, description: seoDescription },
    blocks,
  });
}
