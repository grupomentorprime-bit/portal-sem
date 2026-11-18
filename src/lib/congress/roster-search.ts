import "server-only";

import {
  searchClaimableCongressRegistrations,
  toPublicCongressRosterHit,
} from "@/core/congress/claim";
import { listCongressRegistrations } from "@/lib/congress/repository";

export async function searchCongressPublicRoster(tenantId: string, query: string) {
  const all = await listCongressRegistrations(tenantId);
  const result = searchClaimableCongressRegistrations(all, query);
  return {
    matches: result.matches.map(toPublicCongressRosterHit),
    suggestions: result.suggestions.map(toPublicCongressRosterHit),
    hasMore: result.hasMore,
    suggestionsHasMore: result.suggestionsHasMore,
  };
}
