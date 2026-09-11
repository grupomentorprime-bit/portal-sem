import { MenuEditorClient } from "@/components/menu/MenuEditorClient";
import { getMenuByIdUncached } from "@/lib/cms/menus";
import { getOperationalSiteConfig } from "@/lib/cms/config";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminMenuEditPage({ params }: PageProps) {
  const { id } = await params;
  const config = await getOperationalSiteConfig();
  const activeTenant = config?.institution.tenant?.trim() ?? "";
  const menu = activeTenant ? await getMenuByIdUncached(id, activeTenant) : null;

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
