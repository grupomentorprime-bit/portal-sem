import { MenuListClient } from "@/components/menu/MenuListClient";
import { getAllMenusUncached } from "@/lib/cms/menus";

export const dynamic = "force-dynamic";

export default async function AdminMenusPage() {
  const menus = await getAllMenusUncached();
  return <MenuListClient initialMenus={menus} />;
}
