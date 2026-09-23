import { isSemTenant } from "@/core/tenant/is-sem";
import { applyPortal001HomeMigration } from "@/lib/cms/home-portal-001";
import { applySemPublicHome } from "@/lib/portal/sem-identity-v7";
import type { PageBlock } from "@/types/page";
import type { PortalPageModel } from "@/types/portal";

/**
 * Home pública a partir de la página del propio Espacio.
 * SEM conserva su composición institucional. Cualquier otro Espacio
 * muestra solo sus bloques; si no hay, un héroe neutro sin copia del SEM.
 */
export function composeStoredPublicHome(
  tenantId: string,
  stored: Pick<PortalPageModel, "title" | "blocks" | "seo"> | null
): PortalPageModel {
  const base: PortalPageModel = {
    slug: "/",
    title: stored?.title?.trim() || "Inicio",
    blocks: stored?.blocks ?? [],
    seo: stored?.seo ?? {},
    tenantId,
  };

  if (base.blocks.length > 0) return base;

  if (!isSemTenant(tenantId)) {
    const hero: PageBlock = {
      id: "space-home",
      type: "hero",
      visible: true,
      order: 0,
      settings: { variant: "default" },
    };
    return { ...base, blocks: [hero] };
  }

  return applySemPublicHome(applyPortal001HomeMigration(base));
}
