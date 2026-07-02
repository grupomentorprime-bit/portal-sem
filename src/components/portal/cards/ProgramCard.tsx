/**
 * @deprecated
 *
 * Reemplazado por:
 * PortalCatalogCard
 *
 * Eliminación prevista:
 * Core UI v2.0
 *
 * @see docs/core/CORE-CATALOG-CARD-v1.md
 */

import type { ProgramItem } from "@/types/content";
import { PortalCatalogCard, programItemToCatalogCard } from "@/components/portal/catalog";

interface ProgramCardProps {
  program: ProgramItem;
}

/** @deprecated Usar PortalCatalogCard */
export function ProgramCard({ program }: ProgramCardProps) {
  return (
    <PortalCatalogCard
      {...programItemToCatalogCard(program, {
        ctaLabel: program.ctaPrimaryLabel?.trim() || "Más información",
        variant: program.featured ? "featured" : "default",
      })}
      className="w-full max-w-none"
    />
  );
}
