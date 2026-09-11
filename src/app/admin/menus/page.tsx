import { MenuListClient } from "@/components/menu/MenuListClient";
import { getSessionActiveTenantId } from "@/core/identity";
import { getDefaultMenusForTenant } from "@/lib/cms/menu-defaults";
import { getAllMenusUncached } from "@/lib/cms/menus";

export const dynamic = "force-dynamic";

export default async function AdminMenusPage() {
  const tenant = await getSessionActiveTenantId();
  const menus = tenant ? await getAllMenusUncached(tenant) : [];
  const seedMenus = getDefaultMenusForTenant(tenant ?? "");
  return <MenuListClient initialMenus={menus} seedMenus={seedMenus} />;
}
