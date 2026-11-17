import "server-only";

import { generateId } from "@/core/identity/auth/crypto";
import {
  CONGRESS_COLLECTIONS,
  CONGRESS_EVENT_ID,
  type CongressNight,
} from "@/core/congress/constants";
import {
  canAssignBed,
  emptyCapacityByNight,
  isCongressNight,
  occupiedBedsForNight,
} from "@/core/congress/lodging";
import type {
  CongressLodgingAssignment,
  CongressLodgingHome,
} from "@/core/congress/types";
import { appendCongressAudit } from "@/lib/congress/repository";
import { getDatabase } from "@/lib/mongodb";

function eventFilter(tenantId: string) {
  return { tenantId, eventId: CONGRESS_EVENT_ID };
}

const ACTIVE_STATUSES = ["assigned", "confirmed"] as const;

export async function listLodgingHomes(tenantId: string): Promise<CongressLodgingHome[]> {
  const db = await getDatabase();
  return db
    .collection<CongressLodgingHome>(CONGRESS_COLLECTIONS.homes)
    .find(eventFilter(tenantId))
    .sort({ name: 1 })
    .toArray();
}

export async function listActiveAssignments(
  tenantId: string
): Promise<CongressLodgingAssignment[]> {
  const db = await getDatabase();
  return db
    .collection<CongressLodgingAssignment>(CONGRESS_COLLECTIONS.assignments)
    .find({
      ...eventFilter(tenantId),
      status: { $in: [...ACTIVE_STATUSES] },
    })
    .toArray();
}

export async function listAllAssignments(
  tenantId: string
): Promise<CongressLodgingAssignment[]> {
  const db = await getDatabase();
  return db
    .collection<CongressLodgingAssignment>(CONGRESS_COLLECTIONS.assignments)
    .find(eventFilter(tenantId))
    .sort({ createdAt: -1 })
    .toArray();
}

export async function upsertLodgingHome(input: {
  tenantId: string;
  actorUserId: string;
  homeId?: string;
  name: string;
  contactName?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  notes?: string | null;
  capacityByNight: Partial<Record<CongressNight, number>>;
}): Promise<CongressLodgingHome> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const capacity = emptyCapacityByNight();
  for (const night of Object.keys(capacity) as CongressNight[]) {
    capacity[night] = Math.max(0, Math.trunc(Number(input.capacityByNight[night] ?? 0)));
  }

  if (input.homeId) {
    const updated = await db
      .collection<CongressLodgingHome>(CONGRESS_COLLECTIONS.homes)
      .findOneAndUpdate(
        { ...eventFilter(input.tenantId), _id: input.homeId },
        {
          $set: {
            name: input.name.trim(),
            contactName: input.contactName ?? null,
            contactPhone: input.contactPhone ?? null,
            address: input.address ?? null,
            notes: input.notes ?? null,
            capacityByNight: capacity,
            updatedAt: now,
          },
          $inc: { version: 1 },
        },
        { returnDocument: "after" }
      );
    if (!updated) throw new Error("home_not_found");
    await appendCongressAudit({
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      action: "lodging.home_update",
      entity: "congress_lodging_home",
      entityId: updated._id,
    });
    return updated;
  }

  const home: CongressLodgingHome = {
    _id: generateId("chome"),
    tenantId: input.tenantId,
    eventId: CONGRESS_EVENT_ID,
    name: input.name.trim(),
    contactName: input.contactName ?? null,
    contactPhone: input.contactPhone ?? null,
    address: input.address ?? null,
    notes: input.notes ?? null,
    capacityByNight: capacity,
    version: 1,
    createdAt: now,
    updatedAt: now,
  };
  await db.collection<CongressLodgingHome>(CONGRESS_COLLECTIONS.homes).insertOne(home);
  await appendCongressAudit({
    tenantId: input.tenantId,
    actorUserId: input.actorUserId,
    action: "lodging.home_create",
    entity: "congress_lodging_home",
    entityId: home._id,
  });
  return home;
}

export type AssignBedResult =
  | { ok: true; assignment: CongressLodgingAssignment }
  | {
      ok: false;
      error:
        | "invalid_night"
        | "home_not_found"
        | "capacity_full"
        | "already_assigned"
        | "concurrent_capacity";
    };

/**
 * Asigna cama con control de cupo concurrente:
 * cuenta activas justo antes de insertar; índice único evita doble cama por persona/noche/hogar.
 */
export async function assignBed(input: {
  tenantId: string;
  actorUserId: string;
  homeId: string;
  registrationId: string;
  night: string;
  confirmed?: boolean;
}): Promise<AssignBedResult> {
  if (!isCongressNight(input.night)) return { ok: false, error: "invalid_night" };
  const night = input.night;
  const db = await getDatabase();

  const home = await db
    .collection<CongressLodgingHome>(CONGRESS_COLLECTIONS.homes)
    .findOne({ ...eventFilter(input.tenantId), _id: input.homeId });
  if (!home) return { ok: false, error: "home_not_found" };

  const existingForPerson = await db
    .collection<CongressLodgingAssignment>(CONGRESS_COLLECTIONS.assignments)
    .findOne({
      ...eventFilter(input.tenantId),
      registrationId: input.registrationId,
      night,
      status: { $in: [...ACTIVE_STATUSES] },
    });
  if (existingForPerson) return { ok: false, error: "already_assigned" };

  const active = await db
    .collection<CongressLodgingAssignment>(CONGRESS_COLLECTIONS.assignments)
    .find({
      ...eventFilter(input.tenantId),
      homeId: input.homeId,
      night,
      status: { $in: [...ACTIVE_STATUSES] },
    })
    .toArray();

  const occupied = occupiedBedsForNight(active, input.homeId, night);
  const capacity = home.capacityByNight[night] ?? 0;
  if (!canAssignBed({ capacity, occupied })) {
    return { ok: false, error: "capacity_full" };
  }

  const now = new Date().toISOString();
  const assignment: CongressLodgingAssignment = {
    _id: generateId("cass"),
    tenantId: input.tenantId,
    eventId: CONGRESS_EVENT_ID,
    homeId: input.homeId,
    registrationId: input.registrationId,
    night,
    status: input.confirmed ? "confirmed" : "assigned",
    confirmed: Boolean(input.confirmed),
    cancelledAt: null,
    reassignedFromId: null,
    version: 1,
    createdAt: now,
    updatedAt: now,
  };

  // Re-check + insert: si otro operador ganó el último cupo, el segundo conteo falla.
  const occupiedNow = await db
    .collection<CongressLodgingAssignment>(CONGRESS_COLLECTIONS.assignments)
    .countDocuments({
      ...eventFilter(input.tenantId),
      homeId: input.homeId,
      night,
      status: { $in: [...ACTIVE_STATUSES] },
    });
  if (occupiedNow >= capacity) {
    return { ok: false, error: "concurrent_capacity" };
  }

  try {
    await db
      .collection<CongressLodgingAssignment>(CONGRESS_COLLECTIONS.assignments)
      .insertOne(assignment);
  } catch {
    return { ok: false, error: "concurrent_capacity" };
  }

  // Verificación post-insert: si se excedió por carrera, cancelar esta asignación.
  const after = await db
    .collection<CongressLodgingAssignment>(CONGRESS_COLLECTIONS.assignments)
    .countDocuments({
      ...eventFilter(input.tenantId),
      homeId: input.homeId,
      night,
      status: { $in: [...ACTIVE_STATUSES] },
    });
  if (after > capacity) {
    await db.collection<CongressLodgingAssignment>(CONGRESS_COLLECTIONS.assignments).updateOne(
      { _id: assignment._id },
      {
        $set: {
          status: "cancelled",
          confirmed: false,
          cancelledAt: now,
          updatedAt: now,
        },
        $inc: { version: 1 },
      }
    );
    return { ok: false, error: "concurrent_capacity" };
  }

  await appendCongressAudit({
    tenantId: input.tenantId,
    actorUserId: input.actorUserId,
    action: "lodging.assign",
    entity: "congress_lodging_assignment",
    entityId: assignment._id,
    metadata: { homeId: input.homeId, night, registrationId: input.registrationId },
  });

  return { ok: true, assignment };
}

export async function setAssignmentStatus(input: {
  tenantId: string;
  actorUserId: string;
  assignmentId: string;
  action: "confirm" | "cancel";
}): Promise<CongressLodgingAssignment | null> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const patch =
    input.action === "confirm"
      ? { status: "confirmed" as const, confirmed: true, cancelledAt: null }
      : {
          status: "cancelled" as const,
          confirmed: false,
          cancelledAt: now,
        };

  const updated = await db
    .collection<CongressLodgingAssignment>(CONGRESS_COLLECTIONS.assignments)
    .findOneAndUpdate(
      {
        ...eventFilter(input.tenantId),
        _id: input.assignmentId,
        status: { $in: [...ACTIVE_STATUSES] },
      },
      { $set: { ...patch, updatedAt: now }, $inc: { version: 1 } },
      { returnDocument: "after" }
    );
  if (!updated) return null;

  await appendCongressAudit({
    tenantId: input.tenantId,
    actorUserId: input.actorUserId,
    action: input.action === "confirm" ? "lodging.confirm" : "lodging.cancel",
    entity: "congress_lodging_assignment",
    entityId: updated._id,
  });
  return updated;
}

export async function reassignBed(input: {
  tenantId: string;
  actorUserId: string;
  assignmentId: string;
  homeId: string;
  night?: string;
}): Promise<AssignBedResult> {
  const db = await getDatabase();
  const current = await db
    .collection<CongressLodgingAssignment>(CONGRESS_COLLECTIONS.assignments)
    .findOne({
      ...eventFilter(input.tenantId),
      _id: input.assignmentId,
      status: { $in: [...ACTIVE_STATUSES] },
    });
  if (!current) return { ok: false, error: "already_assigned" };

  const night = input.night ?? current.night;
  await setAssignmentStatus({
    tenantId: input.tenantId,
    actorUserId: input.actorUserId,
    assignmentId: current._id,
    action: "cancel",
  });

  const created = await assignBed({
    tenantId: input.tenantId,
    actorUserId: input.actorUserId,
    homeId: input.homeId,
    registrationId: current.registrationId,
    night,
    confirmed: current.confirmed,
  });

  if (created.ok) {
    const db2 = await getDatabase();
    await db2.collection<CongressLodgingAssignment>(CONGRESS_COLLECTIONS.assignments).updateOne(
      { _id: created.assignment._id },
      { $set: { reassignedFromId: current._id } }
    );
    created.assignment.reassignedFromId = current._id;
  }
  return created;
}
