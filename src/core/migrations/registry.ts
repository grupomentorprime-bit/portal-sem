import { migration001HeroV2 } from "@/core/migrations/001-hero-v2";
import { migration002MenuV2 } from "@/core/migrations/002-menu-v2";
import { migration003FooterV2 } from "@/core/migrations/003-footer-v2";
import { migration004BrandingV2 } from "@/core/migrations/004-branding-v2";
import { migration005ContentV2 } from "@/core/migrations/005-content-v2";
import type { MigrationDefinition } from "@/core/migrations/types";

/** Registro ordenado de migraciones — añadir nuevas al final */
export const MIGRATIONS: MigrationDefinition[] = [
  migration001HeroV2,
  migration002MenuV2,
  migration003FooterV2,
  migration004BrandingV2,
  migration005ContentV2,
];

export function getMigrationById(id: string): MigrationDefinition | undefined {
  return MIGRATIONS.find((m) => m.id === id);
}
