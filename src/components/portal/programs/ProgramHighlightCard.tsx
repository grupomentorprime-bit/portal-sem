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

interface ProgramHighlightCardProps {
  program: ProgramItem;
  ctaLabel?: string;
  staggerIndex?: number;
  priorityImage?: boolean;
}

/** @deprecated Usar PortalCatalogCard */
export function ProgramHighlightCard({
  program,
  ctaLabel,
  staggerIndex,
  priorityImage,
}: ProgramHighlightCardProps) {
  return (
    <PortalCatalogCard
      {...programItemToCatalogCard(program, {
        ctaLabel,
        staggerIndex,
        priorityImage,
      })}
    />
  );
}
