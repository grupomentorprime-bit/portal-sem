/**
 * OT-GROWTH-UX-ACTIVITY-002 — diseño final /admin/actividad.
 * Lectura vía adaptador existente (OT-GROWTH-ACTIVITY-001).
 * Auditoría Identity permanece en /admin/settings/activity.
 */

import { ActividadFeedClient } from "@/components/admin/growth/ActividadFeedClient";
import { can } from "@/core/identity/policies/engine";
import {
  GROWTH_ACTIVIDAD_FEED_CATEGORIES,
  listGrowthActividadFeed,
  type GrowthActividadFeedCategoryFilter,
} from "@/lib/growth/actividad-read";
import { loadSessionContext } from "@/lib/identity/sessions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    category?: string;
    cursor?: string;
  }>;
}

function parseCategory(raw: string | undefined): GrowthActividadFeedCategoryFilter {
  if (
    raw &&
    (GROWTH_ACTIVIDAD_FEED_CATEGORIES as readonly string[]).includes(raw)
  ) {
    return raw as GrowthActividadFeedCategoryFilter;
  }
  return "all";
}

export default async function AdminActividadPage({ searchParams }: PageProps) {
  const session = await loadSessionContext();
  const tenantId = session?.session.tenantId?.trim();
  if (!session || !tenantId || !session.membership) {
    redirect("/admin/login?next=/admin/actividad");
  }

  const { resolvePermissionsForMembership } = await import(
    "@/lib/identity/permission-resolver"
  );
  const { readPlatformRoles } = await import(
    "@/core/identity/platform/capability"
  );
  const permissions = await resolvePermissionsForMembership(
    tenantId,
    session.membership
  );
  const authCtx = {
    user: session.user,
    session: session.session,
    membership: session.membership,
    permissions,
    tenantId,
    platformRoles: readPlatformRoles(session.user),
    compatMode: false,
  };
  if (
    !can(authCtx, "growth.sales.read") &&
    !can(authCtx, "growth.sales.operate")
  ) {
    redirect("/admin");
  }

  const params = await searchParams;
  const category = parseCategory(params.category?.trim());
  /** Cursor de URL solo por compatibilidad; «Cargar más» pagina en el cliente. */
  const cursor = params.cursor?.trim() || undefined;

  const { items, nextCursor } = await listGrowthActividadFeed(tenantId, {
    category,
    cursor,
    limit: 40,
  });

  return (
    <ActividadFeedClient
      items={items}
      category={category}
      nextCursor={nextCursor}
    />
  );
}
