import type { MigrationDefinition } from "@/core/migrations/types";
import {
  CONGRESS_COLLECTIONS,
  CONGRESS_EVENT_ID,
} from "@/core/congress/constants";

/**
 * Índices del módulo operativo del Congreso Nacional de Varones 2026.
 * No importa filas del Excel ni altera submissions.
 */
export const migration032CongressVaronesOps: MigrationDefinition = {
  id: "032-congress-varones-ops",
  description:
    "Índices y evento base del panel operativo Congreso Nacional de Varones 2026",
  modules: [],

  async run({ db, log }) {
    let documentsAffected = 0;
    const details: string[] = [];

    const eventCol = db.collection(CONGRESS_COLLECTIONS.events);
    const eventResult = await eventCol.updateOne(
      { _id: CONGRESS_EVENT_ID },
      {
        $setOnInsert: {
          _id: CONGRESS_EVENT_ID,
          name: "3.° Congreso Nacional de Varones",
          formId: "ipn-asistencia-congreso-varones-2026",
          contributionClp: 17_000,
          nights: ["2026-11-20", "2026-11-21"],
          createdAt: new Date().toISOString(),
        },
      },
      { upsert: true }
    );
    if (eventResult.upsertedCount) {
      documentsAffected += 1;
      details.push("event-upserted");
    } else {
      details.push("event-exists");
    }

    const reg = db.collection(CONGRESS_COLLECTIONS.registrations);
    await reg.createIndex({ tenantId: 1, eventId: 1, "identity.fullName": 1 });
    await reg.createIndex({ tenantId: 1, eventId: 1, zoneId: 1, churchName: 1 });
    await reg.createIndex(
      { tenantId: 1, eventId: 1, submissionId: 1 },
      {
        unique: true,
        partialFilterExpression: { submissionId: { $type: "string" } },
        name: "uniq_submission_link",
      }
    );
    await reg.createIndex(
      { tenantId: 1, eventId: 1, "identity.rut": 1 },
      {
        unique: true,
        partialFilterExpression: { "identity.rut": { $type: "string" } },
        name: "uniq_event_rut",
      }
    );

    await db
      .collection(CONGRESS_COLLECTIONS.payments)
      .createIndex({ tenantId: 1, eventId: 1, createdAt: -1 });
    await db
      .collection(CONGRESS_COLLECTIONS.assignments)
      .createIndex(
        { tenantId: 1, eventId: 1, homeId: 1, night: 1, registrationId: 1 },
        { unique: true, name: "uniq_bed_assignment" }
      );
    await db
      .collection(CONGRESS_COLLECTIONS.audit)
      .createIndex({ tenantId: 1, eventId: 1, createdAt: -1 });

    log(`congress indexes ready event=${CONGRESS_EVENT_ID}`);
    return { documentsAffected, skipped: 0, details };
  },
};
