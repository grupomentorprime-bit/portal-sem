/**
 * Persistencia mínima de Persona / Actividad (inyectable para tests).
 * Nunca toca identity_users, content_people ni portal_interesados.
 */

import type { GrowthActivityRecorder } from "./activity";
import type { GrowthActivity, GrowthPersona } from "./types";

export interface GrowthPersonaStore extends GrowthActivityRecorder {
  findByEmail(
    tenantId: string,
    emailNormalized: string
  ): Promise<GrowthPersona | null>;
  findByPhone(
    tenantId: string,
    phoneNormalized: string
  ): Promise<GrowthPersona | null>;
  findById(tenantId: string, personaId: string): Promise<GrowthPersona | null>;
  insert(persona: GrowthPersona): Promise<GrowthPersona>;
  replace(persona: GrowthPersona): Promise<GrowthPersona>;
  /**
   * Inserta Actividad con ingestKey único (sparse).
   * Si ya existe el mismo ingestKey en el tenant → retorna la existente (idempotente).
   * Preferir `recordGrowthActivity` para publicar al Event Bus.
   */
  recordActivity(activity: GrowthActivity): Promise<GrowthActivity>;
}
