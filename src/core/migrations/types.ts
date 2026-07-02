import type { Db } from "mongodb";
import type { ConfigModuleName } from "@/lib/cms/schema-versions";

export const MIGRATIONS_COLLECTION = "cms_migrations" as const;

export interface MigrationContext {
  db: Db;
  log: (message: string) => void;
}

export interface MigrationRunResult {
  documentsAffected: number;
  skipped: number;
  details?: string[];
}

export interface MigrationDefinition {
  /** Identificador ordenable, ej. `001-hero-v2` */
  id: string;
  description: string;
  /** Módulo(s) cuya versión se actualiza en cms_config.modules */
  modules: ConfigModuleName[];
  run: (ctx: MigrationContext) => Promise<MigrationRunResult>;
}

export interface MigrationRecord {
  _id: string;
  appliedAt: string;
  documentsAffected: number;
  skipped: number;
  durationMs: number;
  status: "success" | "failed";
  error?: string;
}
