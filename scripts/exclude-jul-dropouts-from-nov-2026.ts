/**
 * Saca de la nómina de noviembre a quienes AE cerró como deserción en julio.
 * Quedan bloqueados para marcar asistencia solos; AE/Soporte/Admin pueden reincorporarlos.
 *
 * Uso: npx tsx --env-file=.env scripts/exclude-jul-dropouts-from-nov-2026.ts
 */
import { MongoClient } from "mongodb";
import {
  findExcludedStudentByIdentity,
  reconcileExcludedStudents,
} from "../src/lib/experience/forms/roster-exclusion";
import { findRosterStudentByIdentity } from "../src/lib/experience/forms/roster-import";
import type {
  ConvocatoriaExcludedStudent,
  ConvocatoriaRosterStudent,
} from "../src/types/convocatoria-roster";

const SOURCE_FORM_ID = "convocatoria-talca-aurora-jul-2026";
const SOURCE_SLUG = "talca-aurora-jul-2026";
const TARGET_FORM_ID = "convocatoria-talca-aurora-nov-2026";
const TARGET_SLUG = "talca-aurora-nov-2026";
const TENANT = "seminario-ipn";

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;
  if (!uri || !dbName) {
    console.error("Faltan MONGODB_URI / MONGODB_DB");
    process.exit(1);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const now = new Date().toISOString();

  try {
    const dropouts = await db
      .collection("experience_form_submissions")
      .find({
        tenant: TENANT,
        formId: SOURCE_FORM_ID,
        "absenceReview.closureReason": "dropout",
      })
      .toArray();

    const sourceRoster = await db.collection("convocatoria_rosters").findOne({
      tenant: TENANT,
      convocatoriaSlug: SOURCE_SLUG,
    });
    const targetRoster = await db.collection("convocatoria_rosters").findOne({
      tenant: TENANT,
      convocatoriaSlug: TARGET_SLUG,
    });
    if (!targetRoster) {
      throw new Error(`No existe la nómina ${TARGET_SLUG}`);
    }

    const sourceStudents = (sourceRoster?.students ?? []) as ConvocatoriaRosterStudent[];
    const currentStudents = (targetRoster.students ?? []) as ConvocatoriaRosterStudent[];
    const previousExcluded = (targetRoster.excludedStudents ??
      []) as ConvocatoriaExcludedStudent[];

    const toExclude: ConvocatoriaExcludedStudent[] = [];
    for (const submission of dropouts) {
      const data = (submission.data ?? {}) as Record<string, unknown>;
      const studentId = String(data.studentId ?? "").trim();
      const fullName = String(data.fullName ?? "").trim();
      const fromSource =
        sourceStudents.find((student) => student.id === studentId) ??
        findRosterStudentByIdentity(sourceStudents, { fullName }) ??
        findRosterStudentByIdentity(currentStudents, {
          fullName,
          rut: undefined,
        }) ??
        currentStudents.find((student) => student.id === studentId);

      const review = submission.absenceReview as
        | { closureNotes?: string; closedByName?: string }
        | undefined;

      toExclude.push({
        id: fromSource?.id || studentId || `dropout-${String(submission._id)}`,
        fullName: fromSource?.fullName || fullName,
        generation: fromSource?.generation || String(data.program ?? "other"),
        rut: fromSource?.rut,
        phone: fromSource?.phone || String(data.phone ?? "") || undefined,
        email: fromSource?.email || String(data.email ?? "") || undefined,
        reason:
          review?.closureNotes?.trim() ||
          `Deserción registrada en julio 2026${
            review?.closedByName ? ` · ${review.closedByName}` : ""
          }`,
        excludedAt: now,
        sourceFormId: SOURCE_FORM_ID,
      });
    }

    const remainingStudents = currentStudents.filter((student) => {
      if (toExclude.some((blocked) => blocked.id === student.id)) return false;
      return !findRosterStudentByIdentity(toExclude, {
        fullName: student.fullName,
        rut: student.rut,
      });
    });

    const mergedExcluded = [...previousExcluded];
    for (const blocked of toExclude) {
      const existing = findExcludedStudentByIdentity(mergedExcluded, {
        fullName: blocked.fullName,
        rut: blocked.rut,
        studentId: blocked.id,
      });
      if (existing) {
        const index = mergedExcluded.findIndex((item) => item.id === existing.id);
        if (index >= 0) mergedExcluded[index] = { ...existing, ...blocked };
      } else {
        mergedExcluded.push(blocked);
      }
    }

    const excludedStudents = reconcileExcludedStudents(
      remainingStudents,
      mergedExcluded
    );

    await db.collection("convocatoria_rosters").updateOne(
      { tenant: TENANT, convocatoriaSlug: TARGET_SLUG },
      {
        $set: {
          tenant: TENANT,
          convocatoriaSlug: TARGET_SLUG,
          formId: TARGET_FORM_ID,
          students: remainingStudents,
          excludedStudents,
          updatedAt: now,
        },
      }
    );

    console.log(
      JSON.stringify(
        {
          excluded: excludedStudents.length,
          activeStudents: remainingStudents.length,
          names: excludedStudents.map((student) => student.fullName),
        },
        null,
        2
      )
    );
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
