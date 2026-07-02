import "server-only";

import { writeAudit } from "@/lib/identity/audit";

export async function writeMediaAudit(input: {
  tenantId: string;
  userId: string;
  action: string;
  mediaId: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await writeAudit({
    tenantId: input.tenantId,
    userId: input.userId,
    action: input.action,
    entity: "cms_media",
    entityId: input.mediaId,
    metadata: input.metadata,
  });
}
