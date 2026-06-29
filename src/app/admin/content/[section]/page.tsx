import { ContentListClient } from "@/components/content/ContentListClient";
import { executeContentQuery } from "@/lib/content/query";
import { getSiteConfigUncached } from "@/lib/cms/config";
import type { ContentDocument } from "@/types/content";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ section: string }>;
}

const SECTIONS: Record<string, { collection: string; title: string; description: string }> = {
  programs: {
    collection: "academy_programs",
    title: "Programas",
    description: "Programas académicos del seminario",
  },
  news: {
    collection: "content_news",
    title: "Noticias",
    description: "Noticias institucionales",
  },
  team: {
    collection: "academy_team",
    title: "Equipo",
    description: "Formadores y equipo institucional",
  },
  library: {
    collection: "content_library",
    title: "Biblioteca",
    description: "Recursos bibliográficos",
  },
  events: {
    collection: "content_events",
    title: "Eventos",
    description: "Eventos institucionales",
  },
  testimonials: {
    collection: "academy_testimonials",
    title: "Testimonios",
    description: "Testimonios de la comunidad",
  },
  gallery: {
    collection: "academy_gallery",
    title: "Galería",
    description: "Imágenes institucionales",
  },
  categories: {
    collection: "academy_categories",
    title: "Categorías",
    description: "Categorías académicas",
  },
};

export default async function AdminContentSectionPage({ params }: PageProps) {
  const { section } = await params;
  const meta = SECTIONS[section];
  if (!meta) {
    return (
      <div className="p-8 text-center text-muted">Sección no encontrada.</div>
    );
  }

  const config = await getSiteConfigUncached();
  const tenant = config?.institution.tenant ?? "default";

  let initialItems: ContentDocument[] = [];
  let initialTotal = 0;
  try {
    const result = await executeContentQuery<ContentDocument>(
      { tenant, collection: meta.collection, pagination: { page: 1, limit: 50 } },
      { includeDraft: true, mapItems: false, skipCache: true }
    );
    initialItems = result.items;
    initialTotal = result.total;
  } catch {
    /* empty */
  }

  return (
    <ContentListClient
      tenant={tenant}
      collection={meta.collection}
      title={meta.title}
      description={meta.description}
      initialItems={initialItems}
      initialTotal={initialTotal}
    />
  );
}
