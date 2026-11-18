import "server-only";

import { applyCongressFormClaim } from "@/core/congress/claim";
import { parseExpectedDayLabel } from "@/core/congress/expected-days";
import type { CongressAttendanceDays } from "@/core/congress/types";
import { enrolleeIdentity } from "@/lib/experience/forms/already-enrolled";
import {
  getCongressRegistration,
  listCongressRegistrations,
  updateCongressRegistration,
} from "@/lib/congress/repository";

function expectedDaysFromFormData(
  data: Record<string, unknown>,
  fallback: CongressAttendanceDays | undefined
): CongressAttendanceDays {
  if (data.expectedDays && typeof data.expectedDays === "object") {
    const raw = data.expectedDays as { saturday?: unknown; sunday?: unknown };
    return {
      saturday: typeof raw.saturday === "boolean" ? raw.saturday : null,
      sunday: typeof raw.sunday === "boolean" ? raw.sunday : null,
    };
  }
  const label = String(
    data.expectedDayLabel ?? data.diasPrevistos ?? data.diaAsistir ?? ""
  ).trim();
  if (label) return parseExpectedDayLabel(label);
  return fallback ?? { saturday: null, sunday: null };
}

export async function claimCongressRegistrationFromForm(input: {
  tenantId: string;
  registrationId: string;
  submissionId: string;
  data: Record<string, unknown>;
}): Promise<
  | { ok: true }
  | { ok: false; error: "not_claimable" | "rut_conflict" | "not_found" }
> {
  const registration = await getCongressRegistration(
    input.tenantId,
    input.registrationId
  );
  if (!registration) return { ok: false, error: "not_found" };

  const identity = enrolleeIdentity(input.data);
  let conflictingRutRegistrationId: string | null = null;
  if (identity.rut) {
    const all = await listCongressRegistrations(input.tenantId);
    const other = all.find(
      (r) => r.identity.rut === identity.rut && r._id !== registration._id
    );
    if (other) conflictingRutRegistrationId = other._id;
  }

  const fullName = String(
    input.data.fullName ?? input.data.nombre ?? input.data.name ?? ""
  ).trim();
  const zoneId = String(
    input.data.zona ?? input.data.zoneId ?? input.data.zone ?? ""
  ).trim();
  const churchName = String(
    input.data.iglesia ?? input.data.churchName ?? input.data.church ?? ""
  ).trim();

  const applied = applyCongressFormClaim({
    registration,
    submissionId: input.submissionId,
    fullName,
    rut: identity.rut,
    email: identity.email,
    phone: String(input.data.phone ?? input.data.telefono ?? "").trim() || null,
    zoneId: zoneId || registration.zoneId,
    churchName: churchName || registration.churchName,
    expectedDays: expectedDaysFromFormData(input.data, registration.expectedDays),
    nowIso: new Date().toISOString(),
    conflictingRutRegistrationId,
  });

  if (!applied.ok) return applied;

  const updated = await updateCongressRegistration(
    input.tenantId,
    registration._id,
    {
      submissionId: applied.registration.submissionId,
      zoneId: applied.registration.zoneId,
      churchName: applied.registration.churchName,
      expectedDays: applied.registration.expectedDays,
      identity: applied.registration.identity,
      needsReview: applied.registration.needsReview,
    },
    registration.version
  );
  if (!updated) {
    // Concurrent update — treat as not claimable for the client.
    return { ok: false, error: "not_claimable" };
  }
  return { ok: true };
}

