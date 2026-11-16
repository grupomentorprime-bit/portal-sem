import "server-only";

import { writeAudit } from "@/lib/identity/audit";
import { isLaunchCode } from "@/lib/connect/policy";
import type { ConnectAudit } from "@/lib/connect/protocol";

const BLOCKED_METADATA = new Set([
  "code",
  "codeHash",
  "secret",
  "password",
  "authorization",
  "token",
]);

export function auditConnect(event: ConnectAudit): void {
  const metadata: Record<string, string> = {};
  for (const [key, value] of Object.entries(event.metadata)) {
    if (BLOCKED_METADATA.has(key)) continue;
    if (value.length > 120 || isLaunchCode(value)) continue;
    metadata[key] = value;
  }
  void writeAudit({
    tenantId: event.tenantId,
    userId: event.userId,
    action: event.action,
    entity: "connect_launch",
    metadata,
  }).catch(() => undefined);
}
