/**
 * Marco Antonio Alarcon Rojas es equipo docente, no G-2023.
 * npx tsx --env-file=.env scripts/fix-marco-alarcon-staff.ts
 */
import { getDatabase } from "../src/lib/mongodb";

const SLUG = "talca-aurora-jul-2026";
const FORM_ID = "convocatoria-talca-aurora-jul-2026";
const RUT_KEY = "143218929";
const RUT = "14.321.892-9";
const FULL_NAME = "Marco Antonio Alarcon Rojas";
const GENERATION = "staff";

function normalizeRut(value: string): string {
  return value.replace(/\./g, "").replace(/-/g, "").replace(/\s+/g, "").toLowerCase().trim();
}

async function main() {
  const db = await getDatabase();
  const roster = await db.collection("convocatoria_rosters").findOne({ convocatoriaSlug: SLUG });
  if (!roster) throw new Error("Sin nómina");

  const students = [...(roster.students ?? [])];
  const index = students.findIndex((s) => s.rut && normalizeRut(s.rut) === RUT_KEY);
  if (index < 0) throw new Error("No encontrado en nómina");

  const previous = students[index];
  students[index] = {
    ...previous,
    rut: RUT,
    fullName: FULL_NAME,
    generation: GENERATION,
  };

  await db.collection("convocatoria_rosters").updateOne(
    { convocatoriaSlug: SLUG },
    { $set: { students, updatedAt: new Date().toISOString() } }
  );
  console.log(`Nómina: ${previous.generation} → ${GENERATION}`);

  const submission = await db.collection("experience_form_submissions").findOne({
    formId: FORM_ID,
    "data.rut": { $regex: /14\.?321\.?892-?9/i },
  });

  if (submission) {
    await db.collection("experience_form_submissions").updateOne(
      { _id: submission._id },
      {
        $set: {
          "data.generation": GENERATION,
          "data.program": GENERATION,
        },
      }
    );
    console.log("Respuesta al formulario: actualizada a Equipo (staff)");
  } else {
    console.log("Sin respuesta al formulario encontrada por RUT");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
