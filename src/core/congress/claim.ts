import {
  collectPersonSearchSuggestions,
  matchesPersonSearch,
} from "@/lib/experience/forms/person-search";
import { normalizeChileRut } from "@/lib/experience/forms/rut-chile";
import type {
  CongressAttendanceDays,
  CongressRegistration,
} from "@/core/congress/types";

export function applyCongressFormClaim(input: {
  registration: CongressRegistration;
  submissionId: string;
  fullName: string;
  rut: string | null;
  email: string | null;
  phone: string | null;
  zoneId: string;
  churchName: string;
  expectedDays: CongressAttendanceDays;
  nowIso: string;
  conflictingRutRegistrationId: string | null;
}):
  | { ok: true; registration: CongressRegistration }
  | { ok: false; error: "not_claimable" | "rut_conflict" } {
  if (!isCongressRegistrationClaimable(input.registration)) {
    return { ok: false, error: "not_claimable" };
  }
  if (
    input.conflictingRutRegistrationId &&
    input.conflictingRutRegistrationId !== input.registration._id
  ) {
    return { ok: false, error: "rut_conflict" };
  }
  const rut = input.rut ? normalizeChileRut(input.rut) ?? input.rut : null;
  const fullName = input.fullName.trim() || input.registration.identity.fullName;
  return {
    ok: true,
    registration: {
      ...input.registration,
      submissionId: input.submissionId,
      zoneId: input.zoneId.trim() || input.registration.zoneId,
      churchName: input.churchName.trim() || input.registration.churchName,
      expectedDays: input.expectedDays,
      identity: {
        ...input.registration.identity,
        fullName,
        rut,
        email: input.email,
        phone: input.phone,
        status: rut ? "verified" : "provisional",
      },
      needsReview: !rut,
      updatedAt: input.nowIso,
      version: input.registration.version + 1,
    },
  };
}

export function isCongressRegistrationClaimable(reg: CongressRegistration): boolean {
  return reg.source === "import" && !reg.submissionId;
}

/** True si sync debe crear una ficha source=form nueva (sin reclamo de nómina). */
export function shouldCreateFormRegistrationFromSubmission(
  data: Record<string, unknown>
): boolean {
  return !String(data.registrationId ?? "").trim();
}

export function toPublicCongressRosterHit(reg: CongressRegistration) {
  return {
    registrationId: reg._id,
    fullName: reg.identity.fullName,
    churchName: reg.churchName,
    zoneId: reg.zoneId,
  };
}

export function searchClaimableCongressRegistrations(
  registrations: CongressRegistration[],
  query: string,
  limit = 40
) {
  const claimable = registrations.filter(isCongressRegistrationClaimable);
  const fields = (r: CongressRegistration) => [r.identity.fullName, r.churchName];
  const matches = claimable.filter((r) => matchesPersonSearch(query, fields(r)));
  const matchIds = new Set(matches.map((r) => r._id));
  const suggestions = collectPersonSearchSuggestions(
    query,
    claimable.filter((r) => !matchIds.has(r._id)),
    fields,
    8
  );
  return {
    matches: matches.slice(0, limit),
    suggestions: suggestions.items,
    hasMore: matches.length > limit,
    suggestionsHasMore: suggestions.hasMore,
  };
}
