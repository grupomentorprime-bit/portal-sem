/**
 * Persistencia de Oportunidad + space config + actividades (inyectable).
 */

import type { GrowthActivityRecorder } from "./activity";
import type {
  GrowthActivity,
  GrowthOportunidad,
  GrowthSpaceConfig,
} from "./types";

export interface GrowthOpportunityStore extends GrowthActivityRecorder {
  findById(
    tenantId: string,
    oportunidadId: string
  ): Promise<GrowthOportunidad | null>;

  listByPersona(
    tenantId: string,
    personaId: string
  ): Promise<GrowthOportunidad[]>;

  /**
   * Oportunidad reutilizable: mismo typeKey + asunto y status no final.
   */
  findOpenBySubject(input: {
    tenantId: string;
    personaId: string;
    typeKey: string;
    subjectType: string;
    subjectId?: string;
  }): Promise<GrowthOportunidad | null>;

  /**
   * Idempotencia de ingestión: misma fuente abre a lo sumo una Oportunidad
   * (incluye finales — no reabrir tras handoff).
   */
  findBySource(
    tenantId: string,
    sourceCollection: string,
    sourceId: string
  ): Promise<GrowthOportunidad | null>;

  insert(oportunidad: GrowthOportunidad): Promise<GrowthOportunidad>;
  replace(oportunidad: GrowthOportunidad): Promise<GrowthOportunidad>;

  getSpaceConfig(tenantId: string): Promise<GrowthSpaceConfig | null>;
  upsertSpaceConfig(config: GrowthSpaceConfig): Promise<GrowthSpaceConfig>;

  /**
   * Insert append-only. Preferir `recordGrowthActivity` para Event Bus.
   */
  recordActivity(activity: GrowthActivity): Promise<GrowthActivity>;
}
