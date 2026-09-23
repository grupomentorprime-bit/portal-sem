import "server-only";

import { getDatabase } from "@/lib/mongodb";
import {
  setPlatformSpaceStatus as setPlatformSpaceStatusCore,
  SetPlatformSpaceStatusError,
  isSpaceControlStatus,
  type SetPlatformSpaceStatusResult,
  type SpaceControlStatus,
} from "@/core/tenant/space-status";

export {
  SetPlatformSpaceStatusError,
  isSpaceControlStatus,
  type SetPlatformSpaceStatusResult,
  type SpaceControlStatus,
};

export async function setPlatformSpaceStatus(
  tenantId: string,
  status: string,
  actorUserId: string
): Promise<SetPlatformSpaceStatusResult> {
  const db = await getDatabase();
  return setPlatformSpaceStatusCore(db, { tenantId, status, actorUserId });
}
