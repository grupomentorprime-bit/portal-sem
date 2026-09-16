/**
 * OT-GROWTH-MESSAGING-002 — puerto de conexiones WhatsApp (inyectable).
 */

import type { GrowthWhatsAppConnection } from "./types";

export interface GrowthWhatsAppConnectionStore {
  /** Cualquier estado — un phone_number_id no puede pertenecer a dos Espacios. */
  findByPhoneNumberId(
    phoneNumberId: string
  ): Promise<GrowthWhatsAppConnection | null>;

  /** Solo habilitada y única. 0 u 2+ coincidencias → null (no se ingesta). */
  findEnabledByPhoneNumberId(
    phoneNumberId: string
  ): Promise<GrowthWhatsAppConnection | null>;

  findByTenantId(tenantId: string): Promise<GrowthWhatsAppConnection | null>;

  listEnabled(): Promise<GrowthWhatsAppConnection[]>;

  upsert(
    connection: GrowthWhatsAppConnection
  ): Promise<GrowthWhatsAppConnection>;

  /** Desconectar Espacio (Embedded Signup / admin). Opcional en stores antiguos. */
  deleteByTenantId?(tenantId: string): Promise<boolean>;
}
