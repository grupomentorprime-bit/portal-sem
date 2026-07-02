import { PageEditorClient } from "@/components/page-builder/PageEditorClient";
import { getSiteConfigUncached } from "@/lib/cms/config";
import { getPageByIdUncached } from "@/lib/cms/pages";
import { getBlockLibraryUncached } from "@/lib/cms/blocks";
import { getTemplatesUncached } from "@/lib/cms/templates";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminPageEditorPage({ params }: PageProps) {
  const { id } = await params;
  const [page, config, blockLibrary, templates] = await Promise.all([
    getPageByIdUncached(id),
    getSiteConfigUncached(),
    getBlockLibraryUncached(),
    getTemplatesUncached(),
  ]);

  if (!page || !config) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground">Página no encontrada</h1>
        </div>
      </div>
    );
  }

  return (
    <PageEditorClient
      initialPage={page}
      blockLibrary={blockLibrary}
      templates={templates}
      config={config}
    />
  );
}
