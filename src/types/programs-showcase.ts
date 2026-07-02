/**
 * OT-PORTAL-ADMISION-008 — Configuración genérica de showcase de programas.
 * Reutilizable en cualquier institución (AprendeHoy Learning OS).
 */

import type { CmsAnimation } from "./cms-shared";

export type ProgramsShowcaseFilterMatch = "all" | "text" | "status" | "category";

export interface ProgramsShowcaseFilter {
  id: string;
  label: string;
  matchKind: ProgramsShowcaseFilterMatch;
  matchValue?: string;
  visible: boolean;
  order: number;
}

export interface ProgramsShowcaseHelpConfig {
  enabled: boolean;
  title: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
}

export interface ProgramsShowcaseConfig {
  enabled: boolean;
  overline?: string;
  title: string;
  description?: string;
  /** Línea editorial secundaria bajo la descripción */
  tagline?: string;
  catalogHref?: string;
  catalogLabel?: string;
  cardCtaLabel?: string;
  featuredProgramId?: string;
  secondaryProgramIds?: string[];
  maxSecondaryVisible?: number;
  filters: ProgramsShowcaseFilter[];
  /** Mínimo de programas para mostrar filtros (default 8) */
  minProgramsForFilters?: number;
  help: ProgramsShowcaseHelpConfig;
  animation?: CmsAnimation;
}
