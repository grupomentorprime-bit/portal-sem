import "server-only";

import { getDatabase } from "@/lib/mongodb";
import {
  createPlatformSpace as createPlatformSpaceCore,
  CreatePlatformSpaceError,
  normalizeSpaceSlug,
  type CreatePlatformSpaceInput,
  type CreatePlatformSpaceSummary,
} from "@/core/tenant/create-platform-space";

export {
  CreatePlatformSpaceError,
  normalizeSpaceSlug,
  type CreatePlatformSpaceInput,
  type CreatePlatformSpaceSummary,
};

/**
 * Wrapper Platform Admin: obtiene DB y delega al motor de provisión.
 */
export async function createPlatformSpace(
  input: CreatePlatformSpaceInput,
  actorUserId: string
): Promise<CreatePlatformSpaceSummary> {
  const db = await getDatabase();
  return createPlatformSpaceCore(db, input, actorUserId);
}
