/**
 * Puerto de persistencia Automatizaciones (inyectable para tests).
 */

import type {
  GrowthAutomation,
  GrowthAutomationVersion,
} from "./types";

export interface GrowthAutomationStore {
  insertAutomation(doc: GrowthAutomation): Promise<GrowthAutomation>;
  replaceAutomation(doc: GrowthAutomation): Promise<GrowthAutomation>;
  findAutomationById(
    tenantId: string,
    automationId: string
  ): Promise<GrowthAutomation | null>;
  findAutomationBySeedKey(
    tenantId: string,
    seedKey: string
  ): Promise<GrowthAutomation | null>;
  listAutomations(tenantId: string): Promise<GrowthAutomation[]>;

  insertVersion(doc: GrowthAutomationVersion): Promise<GrowthAutomationVersion>;
  replaceVersion(doc: GrowthAutomationVersion): Promise<GrowthAutomationVersion>;
  findVersion(
    tenantId: string,
    automationId: string,
    version: number
  ): Promise<GrowthAutomationVersion | null>;
  listVersions(
    tenantId: string,
    automationId: string
  ): Promise<GrowthAutomationVersion[]>;
}
