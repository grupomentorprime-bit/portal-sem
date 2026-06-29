import type { MediaUsageRef } from "@/types/media";

export interface UsageScanResult {
  mediaId: string;
  ref: MediaUsageRef;
}

export interface MigrationIncident {
  module: string;
  entityId: string;
  field: string;
  legacyUrl: string;
  reason: string;
}
