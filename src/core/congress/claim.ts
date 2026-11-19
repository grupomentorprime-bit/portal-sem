import { createHash, randomBytes, timingSafeEqual } from "crypto";
import {
  collectPersonSearchSuggestions,
  foldPersonSearchText,
  matchesPersonSearch,
} from "@/lib/experience/forms/person-search";
import { normalizeChileRut } from "@/lib/experience/forms/rut-chile";
import type {
  CongressAttendanceDays,
  CongressRegistration,
} from "@/core/congress/types";

export const PUBLIC_CONGRESS_SEARCH_MIN = 3;
export const PUBLIC_CONGRESS_SEARCH_LIMIT = 8;

export function isCongressRegistrationClaimable(reg: CongressRegistration): boolean {
  return reg.source === "import" && !reg.submissionId;
}

/** Un id de cliente no es autorización de escritura, aunque apunte a la fila. */
export function registrationIdAuthorizesChange(): boolean {
  return false;
}

/** Coincidencia de nombre o RUT no prueba la identidad. */
export function nameOrRutMatchAuthorizesChange(): boolean {
  return false;
}

export function shouldCreateFormRegistrationFromSubmission(
  data: Record<string, unknown>
): boolean {
  if (String(data.selectionRef ?? "").trim()) return false;
  if (String(data.registrationId ?? "").trim()) return false;
  return true;
}

export interface PublicClaimRequest {
  registrationId: string;
  submissionId: string;
  fieldNames: string[];
}

export interface ProposedRegistrationChange {
  submissionId: string;
  fullName: string;
  rut: string | null;
  email: string | null;
  phone: string | null;
  zoneId: string;
  churchName: string;
  expectedDays: CongressAttendanceDays;
}

export interface AccreditedContactChallenge {
  registrationId: string;
  channel: "email" | "phone";
  destinationFingerprint: string;
  tokenHash: string;
  expiresAt: string;
  consumed: boolean;
}

export type ClaimAuthorization =
  | { method: "operator"; permission: "congress.operate" }
  | {
      method: "accredited-contact";
      token: string;
      challenge: AccreditedContactChallenge;
      nowIso: string;
    };

const PROPOSED_FIELD_NAMES = [
  "fullName",
  "rut",
  "email",
  "phone",
  "zoneId",
  "churchName",
  "expectedDays",
  "submissionId",
] as const;

export function claimAuditMetadata(input: {
  phase: "requested" | "applied" | "challenge_issued" | "challenge_rejected";
  fields: string[];
  authorization?: "operator" | "accredited-contact";
  channel?: "email" | "phone";
}): { phase: string; fields: string[]; authorization?: string; channel?: string } {
  const fields = input.fields.filter((name) => PROPOSED_FIELD_NAMES.includes(name as never));
  return {
    phase: input.phase,
    fields,
    ...(input.authorization ? { authorization: input.authorization } : {}),
    ...(input.channel ? { channel: input.channel } : {}),
  };
}

export function filePublicClaimRequest(input: {
  registration: CongressRegistration;
  submissionId: string;
  tenantId: string;
  opened: { ok: true; kind: string; tenantId: string; subjectId: string } | { ok: false };
}):
  | { ok: true; request: PublicClaimRequest; registration: CongressRegistration }
  | { ok: false; error: "not_claimable" | "id_not_authority"; registration: CongressRegistration } {
  const unchanged = input.registration;
  if (!input.opened.ok) {
    return { ok: false, error: "id_not_authority", registration: unchanged };
  }
  if (
    input.opened.kind !== "congress" ||
    input.opened.tenantId !== input.tenantId ||
    input.opened.subjectId !== input.registration._id
  ) {
    return { ok: false, error: "id_not_authority", registration: unchanged };
  }
  if (!isCongressRegistrationClaimable(input.registration)) {
    return { ok: false, error: "not_claimable", registration: unchanged };
  }
  return {
    ok: true,
    registration: unchanged,
    request: {
      registrationId: input.registration._id,
      submissionId: input.submissionId,
      fieldNames: [...PROPOSED_FIELD_NAMES],
    },
  };
}

function fingerprintContact(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function accreditedTokenHash(token: string): string {
  return hashToken(token);
}

export const ACCREDITED_CONTACT_TTL_MS = 15 * 60 * 1000;

function hashesEqual(left: string, right: string): boolean {
  const a = Buffer.from(left, "hex");
  const b = Buffer.from(right, "hex");
  if (a.length !== b.length || a.length === 0) return false;
  return timingSafeEqual(a, b);
}

export function issueAccreditedContactChallenge(input: {
  registration: CongressRegistration;
  channel: "email" | "phone";
  nowIso: string;
  ttlMs: number;
  token?: string;
}):
  | { ok: true; challenge: AccreditedContactChallenge; token: string }
  | { ok: false; error: "no_accredited_contact" } {
  const stored =
    input.channel === "email" ? input.registration.identity.email : input.registration.identity.phone;
  if (!stored?.trim()) return { ok: false, error: "no_accredited_contact" };
  const token = input.token ?? randomBytes(32).toString("base64url");
  const expires = new Date(Date.parse(input.nowIso) + input.ttlMs).toISOString();
  return {
    ok: true,
    token,
    challenge: {
      registrationId: input.registration._id,
      channel: input.channel,
      destinationFingerprint: fingerprintContact(stored),
      tokenHash: hashToken(token),
      expiresAt: expires,
      consumed: false,
    },
  };
}

function keepText(proposed: string | null | undefined, current: string | null): string | null {
  const next = proposed?.trim() ?? "";
  return next ? next : current;
}

export function applyProtectedRegistrationChange(input: {
  registration: CongressRegistration;
  proposed: ProposedRegistrationChange;
  authorization: ClaimAuthorization | { method: string };
  nowIso: string;
}):
  | { ok: true; registration: CongressRegistration; auditAuthorization: "operator" | "accredited-contact"; channel?: "email" | "phone" }
  | { ok: false; error: "identity_not_proven" | "not_claimable" | "challenge_rejected" } {
  if (!isCongressRegistrationClaimable(input.registration)) {
    return { ok: false, error: "not_claimable" };
  }
  const authorization = input.authorization;
  if (authorization.method === "operator") {
    if (!("permission" in authorization) || authorization.permission !== "congress.operate") {
      return { ok: false, error: "identity_not_proven" };
    }
  } else if (authorization.method === "accredited-contact") {
    if (!("challenge" in authorization) || !("token" in authorization)) {
      return { ok: false, error: "identity_not_proven" };
    }
    const challenge = authorization.challenge;
    const stored =
      challenge.channel === "email"
        ? input.registration.identity.email
        : input.registration.identity.phone;
    if (
      challenge.consumed ||
      challenge.registrationId !== input.registration._id ||
      !stored?.trim() ||
      fingerprintContact(stored) !== challenge.destinationFingerprint ||
      Date.parse(challenge.expiresAt) <= Date.parse(authorization.nowIso) ||
      !hashesEqual(challenge.tokenHash, hashToken(authorization.token))
    ) {
      return { ok: false, error: "challenge_rejected" };
    }
  } else {
    return { ok: false, error: "identity_not_proven" };
  }

  const rutText = input.proposed.rut?.trim()
    ? normalizeChileRut(input.proposed.rut) ?? input.registration.identity.rut
    : input.registration.identity.rut;
  const registration: CongressRegistration = {
    ...input.registration,
    submissionId: input.proposed.submissionId,
    zoneId: input.proposed.zoneId.trim() || input.registration.zoneId,
    churchName: input.proposed.churchName.trim() || input.registration.churchName,
    expectedDays: input.proposed.expectedDays,
    identity: {
      ...input.registration.identity,
      fullName: input.proposed.fullName.trim() || input.registration.identity.fullName,
      rut: rutText,
      email: keepText(input.proposed.email, input.registration.identity.email),
      phone: keepText(input.proposed.phone, input.registration.identity.phone),
      status: input.registration.identity.status,
    },
    needsReview: input.registration.needsReview,
    updatedAt: input.nowIso,
    version: input.registration.version + 1,
  };
  return {
    ok: true,
    registration,
    auditAuthorization: authorization.method,
    ...("challenge" in authorization ? { channel: authorization.challenge.channel } : {}),
  };
}

/** Aplica el cambio y deja el desafío consumido. Un segundo uso del mismo objeto falla. */
export function consumeAccreditedContactChange(input: {
  registration: CongressRegistration;
  proposed: ProposedRegistrationChange;
  challenge: AccreditedContactChallenge;
  token: string;
  nowIso: string;
}):
  | {
      ok: true;
      registration: CongressRegistration;
      challenge: AccreditedContactChallenge;
      auditAuthorization: "accredited-contact";
      channel: "email" | "phone";
    }
  | { ok: false; error: "identity_not_proven" | "not_claimable" | "challenge_rejected" | "already_consumed" } {
  if (input.challenge.consumed) return { ok: false, error: "already_consumed" };
  const applied = applyProtectedRegistrationChange({
    registration: input.registration,
    proposed: input.proposed,
    authorization: {
      method: "accredited-contact",
      token: input.token,
      challenge: input.challenge,
      nowIso: input.nowIso,
    },
    nowIso: input.nowIso,
  });
  if (!applied.ok) return applied;
  return {
    ok: true,
    registration: applied.registration,
    challenge: { ...input.challenge, consumed: true },
    auditAuthorization: "accredited-contact",
    channel: input.challenge.channel,
  };
}

export function searchClaimableCongressRegistrations(
  registrations: CongressRegistration[],
  query: string,
  limit = PUBLIC_CONGRESS_SEARCH_LIMIT
) {
  const empty = { matches: [], suggestions: [], hasMore: false, suggestionsHasMore: false };
  if (foldPersonSearchText(query).length < PUBLIC_CONGRESS_SEARCH_MIN) return empty;
  const claimable = registrations.filter(isCongressRegistrationClaimable);
  const fields = (r: CongressRegistration) => [r.identity.fullName];
  const matches = claimable.filter((r) => matchesPersonSearch(query, fields(r)));
  const matchIds = new Set(matches.map((r) => r._id));
  const suggestions = collectPersonSearchSuggestions(
    query,
    claimable.filter((r) => !matchIds.has(r._id)),
    fields,
    3
  );
  return {
    matches: matches.slice(0, limit),
    suggestions: suggestions.items,
    hasMore: matches.length > limit,
    suggestionsHasMore: suggestions.hasMore,
  };
}

export function toPublicCongressRosterHit(
  reg: CongressRegistration,
  selectionRef: string
) {
  return {
    selectionRef,
    fullName: reg.identity.fullName,
    churchName: reg.churchName,
    zoneId: reg.zoneId,
  };
}
