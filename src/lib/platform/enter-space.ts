import "server-only";

import {
  grantOperatorSpaceAccess as grantOperatorSpaceAccessCore,
  grantOwnerSpaceAccess as grantOwnerSpaceAccessCore,
  operatorHasActiveSpaceAccess as operatorHasActiveSpaceAccessCore,
  PlatformEnterSpaceError,
  SPACE_ACCESS_REQUIRED_MESSAGE,
} from "@/core/identity/platform/grant-space-access";
import { getDatabase } from "@/lib/mongodb";

export {
  PlatformEnterSpaceError,
  SPACE_ACCESS_REQUIRED_MESSAGE,
};

export async function operatorHasActiveSpaceAccess(
  userId: string,
  tenantId: string
): Promise<boolean> {
  const db = await getDatabase();
  return operatorHasActiveSpaceAccessCore(db, userId, tenantId);
}

/**
 * Alta explícita y mínima de acceso del operador al Espacio (rol Soporte).
 * Nunca asigna Dueño / super_admin.
 */
export async function grantOperatorSpaceAccess(input: {
  tenantId: string;
  operatorUserId: string;
}) {
  const db = await getDatabase();
  return grantOperatorSpaceAccessCore(db, input);
}

/** Solo el superadministrador. El operador no pasa por aquí. */
export async function grantOwnerSpaceAccess(input: {
  tenantId: string;
  ownerUserId: string;
}) {
  const db = await getDatabase();
  return grantOwnerSpaceAccessCore(db, input);
}
