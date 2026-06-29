import { MenuEditorClient } from "@/components/menu/MenuEditorClient";
import { getMenuByIdUncached } from "@/lib/cms/menus";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminMenuEditPage({ params }: PageProps) {
  const { id } = await params;
  const menu = await getMenuByIdUncached(id);

  if (!menu) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold">Menú no encontrado</h1>
          <Link href="/admin/menus" className="mt-4 inline-block text-sm underline">
            Volver al listado
          </Link>
        </div>
      </div>
    );
  }

  return <MenuEditorClient menu={menu} />;
}
