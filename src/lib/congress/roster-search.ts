import "server-only";

import { displayBrotherName } from "@/core/congress/brother-name";
import {
  searchClaimableCongressRegistrations,
  searchEnrolledCongressRegistrations,
  toPublicCongressRosterHit,
} from "@/core/congress/claim";
import { sealSelectionRef, selectionRefSecret } from "@/core/security/selection-ref";
import { listCongressRegistrations } from "@/lib/congress/repository";

const SELECTION_TTL_MS = 2 * 60 * 60 * 1000;

export async function searchCongressPublicRoster(tenantId: string, query: string) {
  const all = await listCongressRegistrations(tenantId);
  const result = searchClaimableCongressRegistrations(all, query);
  const enrolled = searchEnrolledCongressRegistrations(all, query);
  const secret = selectionRefSecret();
  const exp = Date.now() + SELECTION_TTL_MS;
  const seal = (id: string) =>
    sealSelectionRef(
      { kind: "congress", tenantId, subjectId: id, exp },
      secret
    );
  return {
    matches: result.matches.map((reg) => toPublicCongressRosterHit(reg, seal(reg._id))),
    suggestions: result.suggestions.map((reg) => toPublicCongressRosterHit(reg, seal(reg._id))),
    hasMore: result.hasMore,
    suggestionsHasMore: result.suggestionsHasMore,
    registered: enrolled.matches.map((reg) => ({
      selectionRef: "",
      fullName: displayBrotherName(reg.identity.fullName),
      churchName: reg.churchName,
      zoneId: reg.zoneId,
    })),
    registeredHasMore: enrolled.hasMore,
  };
}
