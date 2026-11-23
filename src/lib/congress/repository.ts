import "server-only";

import { generateId } from "@/core/identity/auth/crypto";
import {
  CONGRESS_COLLECTIONS,
  CONGRESS_EVENT_ID,
  CONGRESS_PAYMENT_FOLIO_YEAR,
} from "@/core/congress/constants";
import { emptyAttendance } from "@/core/congress/attendance";
import { buildChargeAmountClp } from "@/core/congress/charges";
import {
  reconcilePostedAllocationsWithCollected,
  summarizeCashBox,
} from "@/core/congress/cash-box";
import { formatCongressChurchLabel } from "@/core/congress/church-name";
import { compareRegistrationsForEntryBackfill, planCompactEntryNumbers } from "@/core/congress/entry-order";
import { emptyExpectedDays, parseExpectedDayLabel } from "@/core/congress/expected-days";
import {
  countsAsPendingVerification,
  registrationOriginBucket,
} from "@/core/congress/form-engagement";
import { formatPaymentFolio } from "@/core/congress/payment-folio";
import {
  allocatePayment,
  restorePayment,
  revisePayment,
  voidPayment,
  type PaymentRevision,
} from "@/core/congress/payments";
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

function paymentFolioSequenceId(tenantId: string, eventId = CONGRESS_EVENT_ID) {
  return `${tenantId}:${eventId}:payment-folio`;
}

function registrationEntrySequenceId(
  tenantId: string,
  eventId = CONGRESS_EVENT_ID
) {
  return `${tenantId}:${eventId}:registration-entry`;
}

/** Correlativo de ficha nueva (1, 2, 3…). */
export async function allocateNextRegistrationEntryNumber(
  tenantId: string
): Promise<number> {
  const db = await getDatabase();
  const doc = await db
    .collection<{ _id: string; seq: number }>(CONGRESS_COLLECTIONS.sequences)
    .findOneAndUpdate(
      { _id: registrationEntrySequenceId(tenantId) },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: "after" }
    );
  const seq = doc?.seq;
  if (!seq || !Number.isInteger(seq) || seq <= 0) {
    throw new Error("entry_number_sequence_failed");
  }
  return seq;
}

async function setRegistrationEntrySequence(
  tenantId: string,
  seq: number
): Promise<void> {
  if (!Number.isInteger(seq) || seq < 0) {
    throw new Error("entry_number_sequence_invalid");
  }
  const db = await getDatabase();
  await db.collection<{ _id: string; seq: number }>(CONGRESS_COLLECTIONS.sequences).updateOne(
    { _id: registrationEntrySequenceId(tenantId) },
    { $set: { seq } },
    { upsert: true }
  );
}

/** Sube el correlativo hasta `atLeast` sin bajar un valor que otra carga ya avanzó. */
async function raiseRegistrationEntrySequence(
  tenantId: string,
  atLeast: number
): Promise<void> {
  if (!Number.isInteger(atLeast) || atLeast < 0) {
    throw new Error("entry_number_sequence_invalid");
  }
  const db = await getDatabase();
  await db.collection<{ _id: string; seq: number }>(CONGRESS_COLLECTIONS.sequences).updateOne(
    { _id: registrationEntrySequenceId(tenantId) },
    [
      {
        $set: {
          seq: { $max: [{ $ifNull: ["$seq", 0] }, atLeast] },
        },
      },
    ],
    { upsert: true }
  );
}

function unnumberedEntryFilter(): Record<string, unknown> {
  return {
    $or: [
      { entryNumber: { $exists: false } },
      { entryNumber: null },
      { entryNumber: { $not: { $type: "number" } } },
      { entryNumber: { $lte: 0 } },
    ],
  };
}

/**
 * Asigna correlativo a fichas que aún no lo tienen.
 * No renumera las que ya tienen. Solo altas nuevas piden el siguiente.
 */
export async function backfillRegistrationEntryNumbers(
  tenantId: string
): Promise<{ assigned: number; maxEntryNumber: number }> {
  const db = await getDatabase();
  const col = db.collection<CongressRegistration>(CONGRESS_COLLECTIONS.registrations);
  const unnumbered = await col.findOne(
    { ...eventFilter(tenantId), ...unnumberedEntryFilter() },
    { projection: { _id: 1 } }
  );
  if (!unnumbered) return { assigned: 0, maxEntryNumber: 0 };

  const rows = await col.find(eventFilter(tenantId)).toArray();

  let maxEntryNumber = 0;
  const missing: CongressRegistration[] = [];
  for (const row of rows) {
    const n = row.entryNumber;
    if (typeof n === "number" && Number.isInteger(n) && n > 0) {
      if (n > maxEntryNumber) maxEntryNumber = n;
    } else {
      missing.push(row);
    }
  }

  missing.sort(compareRegistrationsForEntryBackfill);
  if (missing.length === 0) return { assigned: 0, maxEntryNumber };

  await raiseRegistrationEntrySequence(tenantId, maxEntryNumber);

  let assigned = 0;
  let highest = maxEntryNumber;
  for (const row of missing) {
    const next = await allocateNextRegistrationEntryNumber(tenantId);
    const claim = await col.updateOne(
      {
        _id: row._id,
        tenantId,
        eventId: CONGRESS_EVENT_ID,
        ...unnumberedEntryFilter(),
      },
      {
        $set: {
          entryNumber: next,
          updatedAt: new Date().toISOString(),
        },
        $inc: { version: 1 },
      }
    );
    if (claim.matchedCount !== 1) continue;
    assigned += 1;
    if (next > highest) highest = next;
  }

  return { assigned, maxEntryNumber: highest };
}

export async function allocateNextPaymentFolio(tenantId: string): Promise<string> {
  const db = await getDatabase();
  const doc = await db
    .collection<{ _id: string; seq: number }>(CONGRESS_COLLECTIONS.sequences)
    .findOneAndUpdate(
      { _id: paymentFolioSequenceId(tenantId) },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: "after" }
    );
  const seq = doc?.seq;
  if (!seq || !Number.isInteger(seq) || seq <= 0) {
    throw new Error("folio_sequence_failed");
  }
  return formatPaymentFolio(seq, CONGRESS_PAYMENT_FOLIO_YEAR);
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

export async function listCongressChurchLabels(
  tenantId: string,
  opts: { zoneId?: string } = {}
): Promise<Array<{ zoneId: string; churchName: string }>> {
  const db = await getDatabase();
  const filter: Record<string, unknown> = eventFilter(tenantId);
  if (opts.zoneId?.trim()) filter.zoneId = opts.zoneId.trim();
  const rows = await db
    .collection<CongressRegistration>(CONGRESS_COLLECTIONS.registrations)
    .find(filter, { projection: { zoneId: 1, churchName: 1, _id: 0 } })
    .toArray();
  return rows.map((row) => ({
    zoneId: String(row.zoneId ?? ""),
    churchName: String(row.churchName ?? ""),
  }));
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
  const hasNumber =
    typeof reg.entryNumber === "number" &&
    Number.isInteger(reg.entryNumber) &&
    reg.entryNumber > 0;
  const withNumber: CongressRegistration = hasNumber
    ? reg
    : {
        ...reg,
        entryNumber: await allocateNextRegistrationEntryNumber(reg.tenantId),
      };
  await db
    .collection<CongressRegistration>(CONGRESS_COLLECTIONS.registrations)
    .insertOne(withNumber);
  return withNumber;
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

export async function deleteCongressRegistration(
  tenantId: string,
  id: string
): Promise<{ deleted: boolean; entryNumbers: Array<{ _id: string; entryNumber: number }> }> {
  const db = await getDatabase();
  const scope = eventFilter(tenantId);
  const result = await db
    .collection<CongressRegistration>(CONGRESS_COLLECTIONS.registrations)
    .deleteOne({ ...scope, _id: id });
  if (result.deletedCount !== 1) return { deleted: false, entryNumbers: [] };
  await db.collection(CONGRESS_COLLECTIONS.assignments).deleteMany({
    ...scope,
    registrationId: id,
  });

  const col = db.collection<CongressRegistration>(CONGRESS_COLLECTIONS.registrations);
  const remaining = await col.find(scope).toArray();
  const entryNumbers = planCompactEntryNumbers(remaining);
  const now = new Date().toISOString();
  const updates = entryNumbers.filter((next) => {
    const current = remaining.find((row) => row._id === next._id);
    return current?.entryNumber !== next.entryNumber;
  });
  if (updates.length > 0) {
    await col.bulkWrite(
      updates.map((next) => ({
        updateOne: {
          filter: { _id: next._id, ...scope },
          update: {
            $set: { entryNumber: next.entryNumber, updatedAt: now },
            $inc: { version: 1 },
          },
        },
      }))
    );
  }
  await setRegistrationEntrySequence(
    tenantId,
    entryNumbers.reduce((max, row) => Math.max(max, row.entryNumber), 0)
  );
  return { deleted: true, entryNumbers };
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
    churchName: formatCongressChurchLabel(
      input.churchName.trim() || "Sin iglesia"
    ),
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
    chargeHistory: [],
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
  bank?: string | null;
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
    bank: input.bank,
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

  let folio: string;
  try {
    folio = await allocateNextPaymentFolio(input.tenantId);
  } catch {
    return { ok: false, error: "folio_sequence_failed" };
  }

  const paymentWithFolio: CongressPayment = { ...result.payment, folio };

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

  await db.collection<CongressPayment>(CONGRESS_COLLECTIONS.payments).insertOne(paymentWithFolio);
  return { ok: true, payment: paymentWithFolio, updated: result.updatedRegistrations };
}

export async function ensureCongressPaymentFolio(input: {
  tenantId: string;
  paymentId: string;
}): Promise<{ ok: true; payment: CongressPayment } | { ok: false; error: string }> {
  const db = await getDatabase();
  const payments = db.collection<CongressPayment>(CONGRESS_COLLECTIONS.payments);
  const filter = { ...eventFilter(input.tenantId), _id: input.paymentId };
  const payment = await payments.findOne(filter);
  if (!payment) return { ok: false, error: "not_found" };
  if (payment.folio) return { ok: true, payment };

  let folio: string;
  try {
    folio = await allocateNextPaymentFolio(input.tenantId);
  } catch {
    return { ok: false, error: "folio_sequence_failed" };
  }

  const updated = await payments.findOneAndUpdate(
    {
      ...filter,
      $or: [{ folio: null }, { folio: { $exists: false } }, { folio: "" }],
    },
    { $set: { folio } },
    { returnDocument: "after" }
  );
  if (updated) return { ok: true, payment: updated };

  const racedPayment = await payments.findOne(filter);
  if (racedPayment?.folio) return { ok: true, payment: racedPayment };
  return { ok: false, error: "folio_sequence_failed" };
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

  const wrote = await writeRegistrationPaid({
    tenantId: input.tenantId,
    now,
    originals: registrations,
    updated: result.updatedRegistrations,
  });
  if (!wrote.ok) {
    await db.collection<CongressPayment>(CONGRESS_COLLECTIONS.payments).updateOne(
      {
        _id: payment._id,
        tenantId: input.tenantId,
        eventId: CONGRESS_EVENT_ID,
        status: "voided",
      },
      {
        $set: {
          status: "posted",
          voidedAt: null,
          voidedByUserId: null,
          voidReason: null,
          voidedAllocations: payment.voidedAllocations ?? null,
        },
      }
    );
    return { ok: false, error: wrote.error };
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

async function writeRegistrationPaid(input: {
  tenantId: string;
  now: string;
  originals: CongressRegistration[];
  updated: CongressRegistration[];
}): Promise<{ ok: true } | { ok: false; error: "concurrent_payment" | "unknown_registration" }> {
  const db = await getDatabase();
  const applied: Array<{ id: string; previousPaid: number; previousVersion: number }> = [];
  for (const next of input.updated) {
    const original = input.originals.find((row) => row._id === next._id);
    if (!original) return { ok: false, error: "unknown_registration" };
    const write = await db
      .collection<CongressRegistration>(CONGRESS_COLLECTIONS.registrations)
      .updateOne(
        {
          _id: next._id,
          tenantId: input.tenantId,
          eventId: CONGRESS_EVENT_ID,
          version: original.version,
          allocatedPaidClp: original.allocatedPaidClp,
        },
        {
          $set: { allocatedPaidClp: next.allocatedPaidClp, updatedAt: input.now },
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
              updatedAt: input.now,
            },
          }
        );
      }
      return { ok: false, error: "concurrent_payment" };
    }
    applied.push({
      id: next._id,
      previousPaid: original.allocatedPaidClp,
      previousVersion: original.version,
    });
  }
  return { ok: true };
}

export async function reviseCongressPayment(input: {
  tenantId: string;
  paymentId: string;
  revision: PaymentRevision;
  actorUserId: string;
}): Promise<
  | { ok: true; payment: CongressPayment; updated: CongressRegistration[] }
  | { ok: false; error: string }
> {
  const db = await getDatabase();
  const payments = db.collection<CongressPayment>(CONGRESS_COLLECTIONS.payments);
  const payment = await payments.findOne({
    ...eventFilter(input.tenantId),
    _id: input.paymentId,
  });
  if (!payment) return { ok: false, error: "not_found" };

  const ids = [
    ...new Set([
      ...payment.allocations.map((row) => row.registrationId),
      ...(payment.voidedAllocations ?? []).map((row) => row.registrationId),
    ]),
  ];
  const registrations =
    ids.length === 0
      ? []
      : await db
          .collection<CongressRegistration>(CONGRESS_COLLECTIONS.registrations)
          .find({ ...eventFilter(input.tenantId), _id: { $in: ids } })
          .toArray();

  const now = new Date().toISOString();
  const result = revisePayment({
    payment,
    registrations,
    ...input.revision,
    revisedAt: now,
  });
  if (!result.ok) return { ok: false, error: result.error };

  const wrote = await writeRegistrationPaid({
    tenantId: input.tenantId,
    now,
    originals: registrations,
    updated: result.updatedRegistrations,
  });
  if (!wrote.ok) return { ok: false, error: wrote.error };

  const claim = await payments.updateOne(
    {
      _id: payment._id,
      tenantId: input.tenantId,
      eventId: CONGRESS_EVENT_ID,
      status: payment.status,
      amountClp: payment.amountClp,
    },
    {
      $set: {
        payerName: result.payment.payerName,
        method: result.payment.method,
        bank: result.payment.bank ?? null,
        paidOn: result.payment.paidOn,
        receiptRef: result.payment.receiptRef ?? null,
        note: result.payment.note ?? null,
        amountClp: result.payment.amountClp,
        allocations: result.payment.allocations,
        unallocatedClp: result.payment.unallocatedClp,
        voidedAllocations: result.payment.voidedAllocations ?? null,
      },
    }
  );
  if (claim.matchedCount !== 1) {
    for (const next of result.updatedRegistrations) {
      const original = registrations.find((row) => row._id === next._id);
      if (!original) continue;
      await db.collection<CongressRegistration>(CONGRESS_COLLECTIONS.registrations).updateOne(
        { _id: next._id, tenantId: input.tenantId, eventId: CONGRESS_EVENT_ID },
        {
          $set: {
            allocatedPaidClp: original.allocatedPaidClp,
            version: original.version,
            updatedAt: now,
          },
        }
      );
    }
    return { ok: false, error: "concurrent_payment" };
  }

  await appendCongressAudit({
    tenantId: input.tenantId,
    actorUserId: input.actorUserId,
    action: "payment.revise",
    entity: "congress_payment",
    entityId: payment._id,
    metadata: {
      folio: payment.folio ?? null,
      previousAmountClp: payment.amountClp,
      amountClp: result.payment.amountClp,
      status: payment.status,
    },
  });

  return { ok: true, payment: result.payment, updated: result.updatedRegistrations };
}

export async function restoreCongressPayment(input: {
  tenantId: string;
  paymentId: string;
  actorUserId: string;
}): Promise<
  | { ok: true; payment: CongressPayment; updated: CongressRegistration[] }
  | { ok: false; error: string }
> {
  const db = await getDatabase();
  const payments = db.collection<CongressPayment>(CONGRESS_COLLECTIONS.payments);
  const payment = await payments.findOne({
    ...eventFilter(input.tenantId),
    _id: input.paymentId,
  });
  if (!payment) return { ok: false, error: "not_found" };

  const sourceAllocations =
    payment.allocations.length > 0 ? payment.allocations : (payment.voidedAllocations ?? []);
  const ids = [...new Set(sourceAllocations.map((row) => row.registrationId))];
  const registrations =
    ids.length === 0
      ? []
      : await db
          .collection<CongressRegistration>(CONGRESS_COLLECTIONS.registrations)
          .find({ ...eventFilter(input.tenantId), _id: { $in: ids } })
          .toArray();

  const now = new Date().toISOString();
  const result = restorePayment({
    payment,
    registrations,
    restoredAt: now,
  });
  if (!result.ok) return { ok: false, error: result.error };

  const claim = await payments.updateOne(
    {
      _id: payment._id,
      tenantId: input.tenantId,
      eventId: CONGRESS_EVENT_ID,
      status: "voided",
    },
    {
      $set: {
        status: "posted",
        voidedAt: null,
        voidedByUserId: null,
        voidReason: null,
        allocations: result.payment.allocations,
      },
    }
  );
  if (claim.matchedCount !== 1) return { ok: false, error: "not_voided" };

  const wrote = await writeRegistrationPaid({
    tenantId: input.tenantId,
    now,
    originals: registrations,
    updated: result.updatedRegistrations,
  });
  if (!wrote.ok) {
    await payments.updateOne(
      { _id: payment._id, tenantId: input.tenantId, eventId: CONGRESS_EVENT_ID },
      {
        $set: {
          status: "voided",
          voidedAt: payment.voidedAt ?? null,
          voidedByUserId: payment.voidedByUserId ?? null,
          voidReason: payment.voidReason ?? null,
          allocations: payment.allocations,
        },
      }
    );
    return { ok: false, error: wrote.error };
  }

  await appendCongressAudit({
    tenantId: input.tenantId,
    actorUserId: input.actorUserId,
    action: "payment.restore",
    entity: "congress_payment",
    entityId: payment._id,
    metadata: {
      folio: payment.folio ?? null,
      amountClp: result.payment.amountClp,
      allocations: result.payment.allocations,
    },
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
  const [registrations, assignments, homes, churchRequests, payments] = await Promise.all([
    listCongressRegistrations(tenantId),
    listCongressAssignments(tenantId),
    listCongressHomes(tenantId),
    listChurchLodgingRequests(tenantId),
    listCongressPayments(tenantId),
  ]);
  const activeAssignments = assignments.filter(
    (a) => a.status === "assigned" || a.status === "confirmed" || (a.status == null && a.confirmed !== false)
  );

  const bySource = { form: 0, updated: 0, import: 0, door: 0 };
  const attendanceSaturday = { present: 0, absent: 0, unmarked: 0 };
  const attendanceSunday = { present: 0, absent: 0, unmarked: 0 };
  const receptionSaturday = { expected: 0, present: 0, pendingArrival: 0 };
  const receptionSunday = { expected: 0, present: 0, pendingArrival: 0 };
  let totalChargeClp = 0;
  let totalPaidClp = 0;
  let needsReviewCount = 0;

  for (const reg of registrations) {
    bySource[registrationOriginBucket(reg)] += 1;
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
    if (countsAsPendingVerification(reg)) needsReviewCount += 1;
  }

  const voidedPayments = payments.filter((payment) => payment.status === "voided");
  const voidedClp = voidedPayments.reduce(
    (sum, payment) => sum + Math.trunc(payment.amountClp || 0),
    0
  );
  const ledger = reconcilePostedAllocationsWithCollected(payments, registrations);
  const postedCollectedClp = summarizeCashBox(payments, { status: "posted" }).totalsClp.total;

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
      voidedCount: voidedPayments.length,
      voidedClp,
      postedCollectedClp,
      ledgerDeltaClp: ledger.deltaClp,
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
