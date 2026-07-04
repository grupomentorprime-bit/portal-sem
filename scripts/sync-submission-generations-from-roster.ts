/**
 * Alinea generación en respuestas con la nómina oficial (por RUT).
 * npx tsx --env-file=.env scripts/sync-submission-generations-from-roster.ts
 */
import { getDatabase } from "../src/lib/mongodb";
import { normalizeGenerationValue } from "../src/lib/experience/forms/generations";
import { findRosterStudentByIdentity } from "../src/lib/experience/forms/roster-import";
import type { ConvocatoriaRosterStudent } from "../src/types/convocatoria-roster";

const SLUG = "talca-aurora-jul-2026";

function normalizeRut(value: string): string {
  return value.replace(/\./g, "").replace(/-/g, "").replace(/\s+/g, "").toLowerCase().trim();
}

async function main() {
  const db = await getDatabase();
  const roster = await db.collection("convocatoria_rosters").findOne({ convocatoriaSlug: SLUG });
  if (!roster) throw new Error("Sin nómina");

  const students = (roster.students ?? []) as ConvocatoriaRosterStudent[];
  const rutToGeneration = new Map<string, string>();
  for (const student of students) {
    if (!student.rut) continue;
    rutToGeneration.set(normalizeRut(student.rut), student.generation);
  }

  const formId = roster.formId ?? "convocatoria-talca-aurora-jul-2026";
  const submissions = await db.collection("experience_form_submissions").find({ formId }).toArray();

  let fixed = 0;
  for (const submission of submissions) {
    const data = submission.data as Record<string, unknown>;
    const rut = normalizeRut(String(data.rut ?? ""));
    const fullName = String(data.fullName ?? data.name ?? "").trim();

    let rosterGeneration: string | undefined;
    if (rut && rutToGeneration.has(rut)) {
      rosterGeneration = rutToGeneration.get(rut);
    } else if (fullName) {
      const match = findRosterStudentByIdentity(students, { fullName, rut: rut || undefined });
      if (match) rosterGeneration = match.generation;
    }
    if (!rosterGeneration) continue;
    const submissionGeneration = normalizeGenerationValue(data.generation ?? data.program);
    const rosterCanonical = normalizeGenerationValue(rosterGeneration);

    if (submissionGeneration === rosterCanonical) continue;

    await db.collection("experience_form_submissions").updateOne(
      { _id: submission._id },
      {
        $set: {
          "data.generation": rosterGeneration,
          "data.program": rosterGeneration,
        },
      }
    );

    fixed += 1;
    console.log(
      `✓ ${String(data.name ?? data.fullName)}: ${submissionGeneration} → ${rosterCanonical}`
    );
  }

  console.log(`\nTotal corregidas: ${fixed}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
