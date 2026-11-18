import { normalizeChileRut, isValidChileRut } from "@/lib/experience/forms/rut-chile";
import { findDuplicateRegistrationId } from "@/core/congress/duplicates";
import { generateId } from "@/core/identity/auth/crypto";
import type {
  CongressAttendanceDays,
  CongressLodgingNeed,
  CongressRegistration,
} from "@/core/congress/types";
import {
  buildRegistrationDraft,
  insertCongressRegistration,
  listCongressRegistrations,
} from "@/lib/congress/repository";
import { appendCongressAudit } from "@/lib/congress/repository";

export type DoorEnrollInput = {
  tenantId: string;
  actorUserId: string;
  fullName: string;
  zoneId: string;
  churchName: string;
  rut?: string | null;
  phone?: string | null;
  email?: string | null;
  expectedDays?: CongressAttendanceDays;
  lodgingNeed?: CongressLodgingNeed;
};

export type DoorEnrollResult =
  | { ok: true; registration: CongressRegistration }
  | {
      ok: false;
      error: "missing_name" | "invalid_rut" | "duplicate" | "missing_zone";
      duplicateId?: string;
    };

export async function enrollAtDoor(input: DoorEnrollInput): Promise<DoorEnrollResult> {
  const fullName = input.fullName.trim();
  if (!fullName) return { ok: false, error: "missing_name" };
  if (!input.zoneId.trim()) return { ok: false, error: "missing_zone" };

  const rutRaw = String(input.rut ?? "").trim();
  let rut: string | null = null;
  let identityStatus: CongressRegistration["identity"]["status"] = "provisional";
  let needsReview = true;
  let provisionalKey: string | null = null;

  if (rutRaw) {
    if (!isValidChileRut(rutRaw)) return { ok: false, error: "invalid_rut" };
    rut = normalizeChileRut(rutRaw);
    identityStatus = "verified";
    needsReview = false;
  } else {
    provisionalKey = generateId("door");
  }

  const existing = await listCongressRegistrations(input.tenantId);
  const duplicateId = findDuplicateRegistrationId(
    existing.map((r) => ({
      _id: r._id,
      rut: r.identity.rut,
      provisionalKey: r.source === "door" && !r.identity.rut ? r._id : null,
    })),
    { rut, provisionalKey }
  );
  if (duplicateId) {
    return { ok: false, error: "duplicate", duplicateId };
  }

  const lodgingNeed = input.lodgingNeed ?? "unknown";

  const registration = buildRegistrationDraft({
    tenantId: input.tenantId,
    source: "door",
    zoneId: input.zoneId.trim(),
    churchName: input.churchName.trim() || "Sin iglesia",
    fullName,
    rut,
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    identityStatus,
    needsReview,
    expectedDays: input.expectedDays,
    lodgingNeed,
  });

  await insertCongressRegistration(registration);
  await appendCongressAudit({
    tenantId: input.tenantId,
    actorUserId: input.actorUserId,
    action: "registration.door_enroll",
    entity: "congress_registration",
    entityId: registration._id,
    metadata: {
      identityStatus,
      needsReview,
      zoneId: registration.zoneId,
      lodgingNeed,
    },
  });

  return { ok: true, registration };
}
