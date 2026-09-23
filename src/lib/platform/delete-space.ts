import "server-only";

import { getDatabase } from "@/lib/mongodb";
import {
  deletePlatformSpace as deletePlatformSpaceCore,
  DeletePlatformSpaceError,
  isProtectedPlatformSpace,
  type DeletePlatformSpaceResult,
} from "@/core/tenant/delete-platform-space";

export {
  DeletePlatformSpaceError,
  isProtectedPlatformSpace,
  type DeletePlatformSpaceResult,
};

/**
 * Wrapper Platform Admin: obtiene DB y delega al motor de baja.
 */
export async function deletePlatformSpace(
  tenantId: string,
  confirmSlug: string,
  actorUserId: string
): Promise<DeletePlatformSpaceResult> {
  const db = await getDatabase();
  return deletePlatformSpaceCore(db, {
    tenantId,
    confirmSlug,
    actorUserId,
  });
}
