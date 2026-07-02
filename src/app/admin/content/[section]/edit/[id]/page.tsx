import { Suspense } from "react";
import { CategoryEditorClient } from "@/components/content/CategoryEditorClient";
import { PersonEditorClient } from "@/components/content/PersonEditorClient";
import { ContentEditorClient } from "@/components/content/ContentEditorClient";
import { getCategoryItem, getContentItem } from "@/lib/content/content-write";
import { CONTENT_SECTIONS, getSectionBySlug } from "@/lib/content/content-sections";
import { getSiteConfigUncached } from "@/lib/cms/config";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ section: string; id: string }>;
}

export default async function ContentEditPage({ params }: PageProps) {
  const { section, id } = await params;
  const meta = getSectionBySlug(section);
  if (!meta) notFound();

  const config = await getSiteConfigUncached();
  const tenant = config?.institution.tenant ?? "default";

  if (meta.editor === "person") {
    if (id === "new") {
      return (
        <Suspense fallback={<div className="p-8 text-center text-muted">Cargando editor…</div>}>
          <PersonEditorClient tenant={tenant} sectionHref={meta.href} />
        </Suspense>
      );
    }

    const item = await getContentItem(tenant, meta.collection, id);
    if (!item) notFound();

    return <PersonEditorClient tenant={tenant} sectionHref={meta.href} item={item} />;
  }

  if (meta.editor === "category") {
    if (id === "new") {
      return <CategoryEditorClient tenant={tenant} sectionHref={meta.href} />;
    }

    const item = await getCategoryItem(tenant, id);
    if (!item) notFound();

    return <CategoryEditorClient tenant={tenant} sectionHref={meta.href} item={item} />;
  }

  if (id === "new") {
    return (
      <ContentEditorClient
        tenant={tenant}
        collection={meta.collection}
        sectionHref={meta.href}
        sectionTitle={meta.title}
      />
    );
  }

  const item = await getContentItem(tenant, meta.collection, id);
  if (!item) notFound();

  return (
    <ContentEditorClient
      tenant={tenant}
      collection={meta.collection}
      sectionHref={meta.href}
      sectionTitle={meta.title}
      item={item}
    />
  );
}

/** Re-export for static analysis / route discovery */
export { CONTENT_SECTIONS };
