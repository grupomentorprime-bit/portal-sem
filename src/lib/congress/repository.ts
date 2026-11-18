import "server-only";

import { generateId } from "@/core/identity/auth/crypto";
import {
  CONGRESS_COLLECTIONS,
  CONGRESS_EVENT_ID,
} from "@/core/congress/constants";
import { emptyAttendance } from "@/core/congress/attendance";
import { buildChargeAmountClp } from "@/core/congress/charges";
import { emptyExpectedDays, parseExpectedDayLabel } from "@/core/congress/expected-days";
import { allocatePayment, voidPayment } from "@/core/congress/payments";
import type {
  CongressAttendanceDays,
  CongressAuditEntry,
  CongressChurchLodgingRequest,
  CongressLodgingAssignment,
  CongressLodgingHome,
  CongressLodgingNeed,
  CongressPayment,
  CongressPaymentAllocation,
  CongressPaymentMethod,
  CongressRegistration,
} from "@/core/congress/types";
import { getDatabase } from "@/lib/mongodb";

/** Normaliza campos nuevos sobre fichas legacy leídas de Mongo. */
export function normalizeCongressRegistration(
  reg: CongressRegistration
): CongressRegistration {
  const expectedDays: CongressAttendanceDays =
    reg.expectedDays ??
    (reg.expectedDayLabel
      ? parseExpectedDayLabel(reg.expectedDayLabel)
      : emptyExpectedDays());
  return {
    ...reg,
    expectedDays,
    lodgingNeed: reg.lodgingNeed ?? "unknown",
    isChurchGroupLeader: reg.isChurchGroupLeader === true,
    isZoneLeader: reg.isZoneLeader === true,
    attendanceMeta: reg.attendanceMeta ?? {},
    attendanceHistory: reg.attendanceHistory ?? [],
  };
}

function eventFilter(tenantId: string, eventId = CONGRESS_EVENT_ID) {
  return { tenantId, eventId };
}

export async function listCongressRegistrations(
  tenantId: string,
  opts: { q?: string; zoneId?: string; churchName?: string } = {}
): Promise<CongressRegistration[]> {
  const db = await getDatabase();
  const filter: Record<string, unknown> = eventFilter(tenantId);
  if (opts.zoneId?.trim()) filter.zoneId = opts.zoneId.trim();
  if (opts.churchName?.trim()) {
    filter.churchName = { $regex: opts.churchName.trim(), $options: "i" };
  }
  if (opts.q?.trim()) {
    const q = opts.q.trim();
    filter.$or = [
      { "identity.fullName": { $regex: q, $options: "i" } },
      { "identity.rut": { $regex: q, $options: "i" } },
      { churchName: { $regex: q, $options: "i" } },
      { "identity.email": { $regex: q, $options: "i" } },
      { "identity.phone": { $regex: q, $options: "i" } },
    ];
  }
  const rows = await db
    .collection<CongressRegistration>(CONGRESS_COLLECTIONS.registrations)
    .find(filter)
    .sort({ churchName: 1, "identity.fullName": 1 })
    .toArray();
  return rows.map(normalizeCongressRegistration);
}

export async function getCongressRegistration(
  tenantId: string,
  id: string
): Promise<CongressRegistration | null> {
  const db = await getDatabase();
  const row = await db
    .collection<CongressRegistration>(CONGRESS_COLLECTIONS.registrations)
    .findOne({ ...eventFilter(tenantId), _id: id });
  return row ? normalizeCongressRegistration(row) : null;
}

export async function insertCongressRegistration(
  reg: CongressRegistration
): Promise<CongressRegistration> {
  const db = await getDatabase();
  await db.collection<CongressRegistration>(CONGRESS_COLLECTIONS.registrations).insertOne(reg);
  return reg;
}

export async function updateCongressRegistration(
  tenantId: string,
  id: string,
  patch: Partial<CongressRegistration>,
  expectedVersion?: number
): Promise<CongressRegistration | null> {
  const db = await getDatabase();
  const filter: Record<string, unknown> = { ...eventFilter(tenantId), _id: id };
  if (expectedVersion != null) filter.version = expectedVersion;
  const result = await db
    .collection<CongressRegistration>(CONGRESS_COLLECTIONS.registrations)
    .findOneAndUpdate(
      filter,
      {
        $set: {
          ...patch,
          updatedAt: new Date().toISOString(),
        },
        $inc: { version: 1 },
      },
      { returnDocument: "after" }
    );
  return result ? normalizeCongressRegistration(result) : null;
}

export function buildRegistrationDraft(input: {
  tenantId: string;
  source: CongressRegistration["source"];
  zoneId: string;
  churchName: string;
  fullName: string;
  rut?: string | null;
  email?: string | null;
  phone?: string | null;
  identityStatus: CongressRegistration["identity"]["status"];
  submissionId?: string | null;
  importRowId?: string | null;
  expectedDayLabel?: string | null;
  expectedDays?: CongressAttendanceDays;
  lodgingNeed?: CongressLodgingNeed;
  needsReview?: boolean;
  now?: string;
}): CongressRegistration {
  const now = input.now ?? new Date().toISOString();
  const fullName = input.fullName.trim();
  const expectedDays =
    input.expectedDays ??
    (input.expectedDayLabel
      ? parseExpectedDayLabel(input.expectedDayLabel)
      : emptyExpectedDays());
  return {
    _id: generateId("creg"),
    tenantId: input.tenantId,
    eventId: CONGRESS_EVENT_ID,
    source: input.source,
    submissionId: input.submissionId ?? null,
    importRowId: input.importRowId ?? null,
    zoneId: input.zoneId,
    churchName: input.churchName.trim(),
    identity: {
      fullName,
      rut: input.rut ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      status: input.identityStatus,
    },
    expectedDayLabel: input.expectedDayLabel ?? null,
    expectedDays,
    lodgingNeed: input.lodgingNeed ?? "unknown",
    attendance: emptyAttendance(),
    attendanceMeta: {},
    attendanceHistory: [],
    chargeAmountClp: buildChargeAmountClp({ fullName }),
    allocatedPaidClp: 0,
    needsReview: Boolean(input.needsReview),
    version: 1,
    createdAt: now,
    updatedAt: now,
  };
}

export async function recordCongressPayment(input: {
  tenantId: string;
  payerType: CongressPayment["payerType"];
  payerName: string;
  churchName?: string | null;
  amountClp: number;
  method: CongressPaymentMethod;
  paidOn: string;
  receiptRef?: string | null;
  note?: string | null;
  allocations: CongressPaymentAllocation[];
  createdByUserId: string;
}): Promise<
  | { ok: true; payment: CongressPayment; updated: CongressRegistration[] }
  | { ok: false; error: string }
> {
  const db = await getDatabase();
  const ids = [...new Set(input.allocations.map((a) => a.registrationId))];
  const registrations = await db
    .collection<CongressRegistration>(CONGRESS_COLLECTIONS.registrations)
    .find({ ...eventFilter(input.tenantId), _id: { $in: ids } })
    .toArray();

  const now = new Date().toISOString();
  const result = allocatePayment({
    paymentId: generateId("cpay"),
    tenantId: input.tenantId,
    eventId: CONGRESS_EVENT_ID,
    payerType: input.payerType,
    payerName: input.payerName,
    churchName: input.churchName,
    amountClp: input.amountClp,
    method: input.method,
    paidOn: input.paidOn,
    receiptRef: input.receiptRef,
    note: input.note,
    allocations: input.allocations,
    createdByUserId: input.createdByUserId,
    createdAt: now,
    registrations,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  const applied: Array<{ id: string; previousPaid: number; previousVersion: number }> = [];
  for (const updated of result.updatedRegistrations) {
    const original = registrations.find((r) => r._id === updated._id);
    if (!original) {
      return { ok: false, error: "unknown_registration" };
    }
    const write = await db
      .collection<CongressRegistration>(CONGRESS_COLLECTIONS.registrations)
      .updateOne(
        {
          _id: updated._id,
          tenantId: input.tenantId,
          eventId: CONGRESS_EVENT_ID,
          version: original.version,
          allocatedPaidClp: original.allocatedPaidClp,
        },
        {
          $set: {
            allocatedPaidClp: updated.allocatedPaidClp,
            updatedAt: now,
          },
          $inc: { version: 1 },
        }
      );
    if (write.matchedCount !== 1) {
      for (const prev of applied) {
        await db.collection<CongressRegistration>(CONGRESS_COLLECTIONS.registrations).updateOne(
          { _id: prev.id, tenantId: input.tenantId, eventId: CONGRESS_EVENT_ID },
          {
            $set: {
              allocatedPaidClp: prev.previousPaid,
              version: prev.previousVersion,
              updatedAt: now,
            },
          }
        );
      }
      return { ok: false, error: "concurrent_payment" };
    }
    applied.push({
      id: updated._id,
      previousPaid: original.allocatedPaidClp,
      previousVersion: original.version,
    });
  }

  await db.collection<CongressPayment>(CONGRESS_COLLECTIONS.payments).insertOne(result.payment);
  return { ok: true, payment: result.payment, updated: result.updatedRegistrations };
}

export async function listCongressPayments(tenantId: string): Promise<CongressPayment[]> {
  const db = await getDatabase();
  return db
    .collection<CongressPayment>(CONGRESS_COLLECTIONS.payments)
    .find(eventFilter(tenantId))
    .sort({ createdAt: -1 })
    .toArray();
}

export async function voidCongressPayment(input: {
  tenantId: string;
  paymentId: string;
  reason: string;
  actorUserId: string;
}): Promise<
  | { ok: true; payment: CongressPayment; updated: CongressRegistration[] }
  | { ok: false; error: string }
> {
  const db = await getDatabase();
  const payment = await db
    .collection<CongressPayment>(CONGRESS_COLLECTIONS.payments)
    .findOne({ ...eventFilter(input.tenantId), _id: input.paymentId });
  if (!payment) return { ok: false, error: "not_found" };

  const ids = payment.allocations.map((a) => a.registrationId);
  const registrations = await db
    .collection<CongressRegistration>(CONGRESS_COLLECTIONS.registrations)
    .find({ ...eventFilter(input.tenantId), _id: { $in: ids } })
    .toArray();

  const now = new Date().toISOString();
  const result = voidPayment({
    payment,
    registrations,
    reason: input.reason,
    voidedByUserId: input.actorUserId,
    voidedAt: now,
  });
  if (!result.ok) return { ok: false, error: result.error };

  const claim = await db.collection<CongressPayment>(CONGRESS_COLLECTIONS.payments).updateOne(
    { _id: payment._id, tenantId: input.tenantId, status: "posted" },
    {
      $set: {
        status: "voided",
        voidedAt: result.payment.voidedAt,
        voidedByUserId: result.payment.voidedByUserId,
        voidReason: result.payment.voidReason,
        voidedAllocations: result.payment.voidedAllocations,
      },
    }
  );
  if (claim.matchedCount !== 1) return { ok: false, error: "already_voided" };

  for (const updated of result.updatedRegistrations) {
    const original = registrations.find((r) => r._id === updated._id);
    await db.collection<CongressRegistration>(CONGRESS_COLLECTIONS.registrations).updateOne(
      {
        _id: updated._id,
        tenantId: input.tenantId,
        version: original?.version,
      },
      {
        $set: { allocatedPaidClp: updated.allocatedPaidClp, updatedAt: now },
        $inc: { version: 1 },
      }
    );
  }

  await appendCongressAudit({
    tenantId: input.tenantId,
    actorUserId: input.actorUserId,
    action: "payment.void",
    entity: "congress_payment",
    entityId: payment._id,
    metadata: { reason: input.reason, allocations: payment.allocations },
  });

  return { ok: true, payment: result.payment, updated: result.updatedRegistrations };
}

export async function listCongressHomes(tenantId: string): Promise<CongressLodgingHome[]> {
  const db = await getDatabase();
  return db
    .collection<CongressLodgingHome>(CONGRESS_COLLECTIONS.homes)
    .find(eventFilter(tenantId))
    .sort({ name: 1 })
    .toArray();
}

export async function listCongressAssignments(
  tenantId: string
): Promise<CongressLodgingAssignment[]> {
  const db = await getDatabase();
  return db
    .collection<CongressLodgingAssignment>(CONGRESS_COLLECTIONS.assignments)
    .find(eventFilter(tenantId))
    .toArray();
}

export async function listChurchLodgingRequests(
  tenantId: string
): Promise<CongressChurchLodgingRequest[]> {
  const db = await getDatabase();
  return db
    .collection<CongressChurchLodgingRequest>(CONGRESS_COLLECTIONS.churchRequests)
    .find(eventFilter(tenantId))
    .sort({ zoneId: 1, churchName: 1 })
    .toArray();
}

export async function appendCongressAudit(
  entry: Omit<CongressAuditEntry, "_id" | "createdAt" | "eventId"> & {
    eventId?: string;
  }
): Promise<CongressAuditEntry> {
  const db = await getDatabase();
  const full: CongressAuditEntry = {
    _id: generateId("caud"),
    eventId: entry.eventId ?? CONGRESS_EVENT_ID,
    tenantId: entry.tenantId,
    actorUserId: entry.actorUserId,
    action: entry.action,
    entity: entry.entity,
    entityId: entry.entityId,
    metadata: entry.metadata,
    createdAt: new Date().toISOString(),
  };
  await db.collection<CongressAuditEntry>(CONGRESS_COLLECTIONS.audit).insertOne(full);
  return full;
}

export async function listCongressAudit(
  tenantId: string,
  limit = 80
): Promise<CongressAuditEntry[]> {
  const db = await getDatabase();
  return db
    .collection<CongressAuditEntry>(CONGRESS_COLLECTIONS.audit)
    .find(eventFilter(tenantId))
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}

export async function buildCongressSummary(tenantId: string) {
  const [registrations, assignments, homes, churchRequests] = await Promise.all([
    listCongressRegistrations(tenantId),
    listCongressAssignments(tenantId),
    listCongressHomes(tenantId),
    listChurchLodgingRequests(tenantId),
  ]);
  const activeAssignments = assignments.filter(
    (a) => a.status === "assigned" || a.status === "confirmed" || (a.status == null && a.confirmed !== false)
  );

  const bySource = { form: 0, import: 0, door: 0 };
  const attendanceSaturday = { present: 0, absent: 0, unmarked: 0 };
  const attendanceSunday = { present: 0, absent: 0, unmarked: 0 };
  const receptionSaturday = { expected: 0, present: 0, pendingArrival: 0 };
  const receptionSunday = { expected: 0, present: 0, pendingArrival: 0 };
  let totalChargeClp = 0;
  let totalPaidClp = 0;
  let needsReviewCount = 0;

  for (const reg of registrations) {
    bySource[reg.source] += 1;
    if (reg.attendance.saturday === true) attendanceSaturday.present += 1;
    else if (reg.attendance.saturday === false) attendanceSaturday.absent += 1;
    else attendanceSaturday.unmarked += 1;
    if (reg.attendance.sunday === true) attendanceSunday.present += 1;
    else if (reg.attendance.sunday === false) attendanceSunday.absent += 1;
    else attendanceSunday.unmarked += 1;

    const expected = reg.expectedDays ?? emptyExpectedDays();
    if (expected.saturday === true) {
      receptionSaturday.expected += 1;
      if (reg.attendance.saturday === true) receptionSaturday.present += 1;
      else receptionSaturday.pendingArrival += 1;
    }
    if (expected.sunday === true) {
      receptionSunday.expected += 1;
      if (reg.attendance.sunday === true) receptionSunday.present += 1;
      else receptionSunday.pendingArrival += 1;
    }

    if (reg.chargeAmountClp != null) totalChargeClp += reg.chargeAmountClp;
    totalPaidClp += reg.allocatedPaidClp;
    if (reg.needsReview) needsReviewCount += 1;
  }

  return {
    registrationsTotal: registrations.length,
    registrationsBySource: bySource,
    attendanceSaturday,
    attendanceSunday,
    receptionSaturday,
    receptionSunday,
    balances: {
      totalChargeClp,
      totalPaidClp,
      totalOutstandingClp: Math.max(0, totalChargeClp - totalPaidClp),
      needsReviewCount,
    },
    lodging: {
      requestedBeds: churchRequests.reduce((sum, r) => sum + r.requestedBeds, 0),
      assignedBeds: activeAssignments.length,
      homesCount: homes.length,
      unmetRequestBeds: Math.max(
        0,
        churchRequests.reduce((sum, r) => sum + r.requestedBeds, 0) - activeAssignments.length
      ),
    },
    churchLodgingRequests: churchRequests,
    lodgingHomes: homes,
    lodgingAssignments: activeAssignments,
  };
}
