import { Suspense } from "react";
import { ContentListClient } from "@/components/content/ContentListClient";
import { PeopleListClient } from "@/components/content/PeopleListClient";
import { enrichContentDocumentsMedia } from "@/core/media";
import { filterByAcademicCatalogKind } from "@/lib/admin/catalog-kind";
import { executeContentQuery } from "@/lib/content/query";
import { CONTENT_SECTIONS, getSectionBySlug } from "@/lib/content/content-sections";
import { getSiteConfigUncached } from "@/lib/cms/config";
import type { ContentDocument } from "@/types/content";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ section: string }>;
}

export default async function AdminContentSectionPage({ params }: PageProps) {
  const { section } = await params;
  const meta = getSectionBySlug(section);
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
      { tenant, collection: meta.collection, pagination: { page: 1, limit: 100 } },
      { includeDraft: true, mapItems: false, skipCache: true }
    );
    let items =
      section === "people"
        ? await enrichContentDocumentsMedia(tenant, result.items)
        : result.items;

    if (meta.catalogKind) {
      items = filterByAcademicCatalogKind(items, meta.catalogKind);
    }

    initialItems = items;
    initialTotal = items.length;
  } catch {
    /* empty */
  }

  if (section === "people") {
    return (
      <Suspense fallback={<div className="p-8 text-center text-muted">Cargando personas…</div>}>
        <PeopleListClient
          tenant={tenant}
          initialItems={initialItems}
          initialTotal={initialTotal}
        />
      </Suspense>
    );
  }

  const listBreadcrumbs =
    meta.catalogKind !== undefined
      ? [
          { label: "Inicio", href: "/admin" },
          { label: "Oferta académica" },
          { label: meta.title },
        ]
      : undefined;

  const newItemLabel =
    meta.catalogKind === "courses"
      ? "Nuevo curso"
      : meta.catalogKind === "programs"
        ? "Nuevo programa"
        : undefined;

  return (
    <ContentListClient
      tenant={tenant}
      collection={meta.collection}
      title={meta.title}
      description={meta.description}
      sectionSlug={section}
      catalogKind={meta.catalogKind}
      breadcrumbs={listBreadcrumbs}
      newItemLabel={newItemLabel}
      initialItems={initialItems}
      initialTotal={initialTotal}
    />
  );
}

/** Re-export para descubrimiento de rutas */
export { CONTENT_SECTIONS };
