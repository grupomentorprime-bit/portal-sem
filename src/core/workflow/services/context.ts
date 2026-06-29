import type { AuthContext } from "@/types/identity";
import type { ExecutionContext } from "@/types/workflow";
import { randomBytes } from "node:crypto";

export function buildExecutionContext(auth: AuthContext): ExecutionContext {
  return {
    requestId: randomBytes(8).toString("hex"),
    tenant: auth.tenantId,
    user: auth.user,
    membership: auth.membership,
    permissions: auth.permissions,
    session: auth.session,
    locale: "es",
    timezone: "America/Santiago",
    traceId: randomBytes(8).toString("hex"),
    compatMode: auth.compatMode,
  };
}
