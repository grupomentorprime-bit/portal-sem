import { PageEditorClient } from "@/components/page-builder/PageEditorClient";
import { getSiteConfigUncached } from "@/lib/cms/config";
import { getPageByIdUncached } from "@/lib/cms/pages";
import { getBlockLibraryUncached } from "@/lib/cms/blocks";
import { getTemplatesUncached } from "@/lib/cms/templates";
import Link from "next/link";

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
          <h1 className="text-heading">Página no encontrada</h1>
          <Link href="/admin/pages" className="mt-4 inline-block text-secondary underline">
            Volver al listado
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-soft">
      <div className="border-b border-border bg-background px-4 py-3 sm:px-6">
        <Link href="/admin/pages" className="text-caption text-secondary hover:underline">
          ← Páginas
        </Link>
      </div>
      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
        <PageEditorClient
          initialPage={page}
          blockLibrary={blockLibrary}
          templates={templates}
          config={config}
        />
      </div>
    </div>
  );
}
