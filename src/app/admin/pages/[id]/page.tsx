import { PageEditorClient } from "@/components/page-builder/PageEditorClient";
import { getOperationalSiteConfig } from "@/lib/cms/config";
import { getPageByIdUncached } from "@/lib/cms/pages";
import { getBlockLibraryUncached } from "@/lib/cms/blocks";
import { getTemplatesUncached } from "@/lib/cms/templates";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminPageEditorPage({ params }: PageProps) {
  const { id } = await params;
  const config = await getOperationalSiteConfig();
  const activeTenant = config?.institution.tenant?.trim() ?? "";
  const [page, blockLibrary, templates] = await Promise.all([
    activeTenant ? getPageByIdUncached(id, activeTenant) : Promise.resolve(null),
    getBlockLibraryUncached(),
    getTemplatesUncached(),
  ]);

  if (!page || !config || !activeTenant) {
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
