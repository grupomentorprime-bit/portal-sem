import "server-only";

import {
  churchLeadersToClear,
  zoneLeadersToClear,
} from "@/core/congress/leadership";
import type { CongressRegistration } from "@/core/congress/types";
import {
  listCongressRegistrations,
  updateCongressRegistration,
} from "@/lib/congress/repository";

/**
 * Aplica unicidad: 1 líder de grupo por iglesia+zona y 1 jefe por zona.
 * Devuelve los IDs desmarcados (para refrescar UI).
 */
export async function enforceLeadershipUniqueness(input: {
  tenantId: string;
  registration: CongressRegistration;
  patch: {
    isChurchGroupLeader?: boolean;
    isZoneLeader?: boolean;
  };
}): Promise<string[]> {
  const cleared = new Set<string>();
  const all = await listCongressRegistrations(input.tenantId);

  if (input.patch.isChurchGroupLeader === true) {
    for (const id of churchLeadersToClear({
      next: input.registration,
      registrations: all,
    })) {
      const updated = await updateCongressRegistration(input.tenantId, id, {
        isChurchGroupLeader: false,
      });
      if (updated) cleared.add(id);
    }
  }

  if (input.patch.isZoneLeader === true) {
    for (const id of zoneLeadersToClear({
      next: input.registration,
      registrations: all,
    })) {
      const updated = await updateCongressRegistration(input.tenantId, id, {
        isZoneLeader: false,
      });
      if (updated) cleared.add(id);
    }
  }

  return [...cleared];
}
