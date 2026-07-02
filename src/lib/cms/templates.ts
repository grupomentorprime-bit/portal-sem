import { unstable_cache, revalidateTag } from "next/cache";
import { getDatabase } from "@/lib/mongodb";
import { blocksFromTemplate, DEFAULT_TEMPLATES, SEED_HOME_BLOCK_DATA } from "@/lib/cms/page-defaults";
import { buildPortal001HomeBlocks } from "@/lib/cms/home-portal-001";
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

  return fetchTemplatesFromDb();
}

/** Invalidar caché — solo en Route Handlers / Server Actions, no durante render */
export function revalidateTemplatesCache(): void {
  revalidateTag(CMS_TEMPLATES_TAG, "max");
}

export async function seedDefaultHomePage(
  tenant: string,
  institutionName: string,
  seoDescription: string,
  options?: { revalidate?: boolean }
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
      ...SEED_HOME_BLOCK_DATA.hero,
      institutionName,
      motto: "Equipando a los santos para la obra del ministerio",
    };
  }

  const presentation = blocks.find((b) => b.type === "presentation");
  if (presentation) {
    presentation.settings = {
      ...presentation.settings,
      ...SEED_HOME_BLOCK_DATA.presentation,
      description: seoDescription,
    };
  }

  const featureGrid = blocks.find((b) => b.type === "feature_grid");
  if (featureGrid) {
    featureGrid.settings = {
      ...featureGrid.settings,
      ...SEED_HOME_BLOCK_DATA.feature_grid,
      description: seoDescription,
    };
  }

  const modality = blocks.find((b) => b.type === "modality");
  if (modality) {
    modality.settings = { ...modality.settings, ...SEED_HOME_BLOCK_DATA.modality };
  }

  const gallery = blocks.find((b) => b.type === "gallery");
  if (gallery) {
    gallery.settings = { ...gallery.settings, ...SEED_HOME_BLOCK_DATA.gallery };
  }

  const verse = blocks.find((b) => b.type === "verse");
  if (verse) {
    verse.settings = { ...verse.settings, ...SEED_HOME_BLOCK_DATA.verse };
  }

  const academicOffer = blocks.find((b) => b.type === "academic_offer");
  if (academicOffer) {
    academicOffer.settings = {
      ...academicOffer.settings,
      overline: "Nuestra oferta académica",
      title: "Programas que transforman vidas",
      description: "y preparan para el ministerio.",
    };
  }

  const stats = blocks.find((b) => b.type === "stats");
  if (stats) stats.settings = { ...stats.settings, ...SEED_HOME_BLOCK_DATA.stats };

  const timeline = blocks.find((b) => b.type === "timeline");
  if (timeline) {
    timeline.settings = {
      ...timeline.settings,
      ...SEED_HOME_BLOCK_DATA.timeline,
    };
  }

  const people = blocks.find((b) => b.type === "people");
  if (people) {
    people.settings = { ...people.settings, ...SEED_HOME_BLOCK_DATA.people };
  }

  const ctaPremium = blocks.find((b) => b.type === "cta_premium");
  if (ctaPremium) {
    ctaPremium.settings = {
      ...ctaPremium.settings,
      ...SEED_HOME_BLOCK_DATA.cta_premium,
    };
  }

  const news = blocks.find((b) => b.type === "news");
  if (news) news.settings = { ...news.settings, ...SEED_HOME_BLOCK_DATA.news };

  const events = blocks.find((b) => b.type === "events");
  if (events) events.settings = { ...events.settings, ...SEED_HOME_BLOCK_DATA.events };

  const library = blocks.find((b) => b.type === "library");
  if (library) library.settings = { ...library.settings, ...SEED_HOME_BLOCK_DATA.library };

  const resources = blocks.find((b) => b.type === "resources");
  if (resources) resources.settings = { ...resources.settings, ...SEED_HOME_BLOCK_DATA.resources };

  const cta = blocks.find((b) => b.type === "cta");
  if (cta) cta.settings = { ...cta.settings, ...SEED_HOME_BLOCK_DATA.cta };

  const portal001Blocks = buildPortal001HomeBlocks(blocks);

  return createPage(
    {
      _id: "home",
      tenant,
      title: "Inicio",
      slug: "/",
      description: "Página principal",
      template: "institutional",
      status: "published",
      seo: { title: institutionName, description: seoDescription },
      blocks: portal001Blocks,
    },
    { revalidate: options?.revalidate }
  );
}
