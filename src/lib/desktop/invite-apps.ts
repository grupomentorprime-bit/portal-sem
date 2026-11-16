import "server-only";

import { parseAuthorizedAppsPatch, resolveAuthorizedApps } from "@/lib/desktop/app-access";
import type { MentorAppId } from "@/lib/desktop/catalog";
import { readSpaceContract } from "@/lib/desktop/store";

/**
 * Llaves al invitar o aceptar.
 * Si el cliente no manda lista, se conserva el comportamiento previo: todo el techo.
 * Si manda lista (incluida vacía), se respeta acotada al techo.
 */
export async function resolveInviteAuthorizedApps(
  tenantId: string,
  authorizedApps?: unknown
): Promise<MentorAppId[]> {
  const contract = await readSpaceContract(tenantId);
  if (authorizedApps === undefined) {
    return resolveAuthorizedApps({
      contracted: contract.contracted,
      authorizedApps: null,
    });
  }
  const patch = parseAuthorizedAppsPatch({
    authorizedApps,
    contracted: contract.contracted,
  });
  if (!patch.ok) {
    throw new Error("Solo se pueden autorizar aplicaciones contratadas.");
  }
  return patch.authorizedApps;
}
