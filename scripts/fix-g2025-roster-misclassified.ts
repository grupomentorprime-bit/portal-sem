/**
 * Corrige 1 alumno G-2025 mal clasificado en Otros.
 * npx tsx --env-file=.env scripts/fix-g2025-roster-misclassified.ts
 */
import { MongoClient } from "mongodb";
import { normalizeGenerationValue } from "../src/lib/experience/forms/generations";

const SLUG = "talca-aurora-jul-2026";

const FIXES: Array<{ rutKey: string; rut: string; fullName: string }> = [
  { rutKey: "9789129k", rut: "9.789.129-k", fullName: "Manuel Alberto Garrido Poblete" },
];

function normalizeRut(value: string): string {
  return value.replace(/\./g, "").replace(/-/g, "").replace(/\s+/g, "").toLowerCase().trim();
}

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI!, { serverSelectionTimeoutMS: 20000 });
  await client.connect();
  const db = client.db(process.env.MONGODB_DB!);

  const roster = await db.collection("convocatoria_rosters").findOne({ convocatoriaSlug: SLUG });
  if (!roster) throw new Error("Nómina no encontrada");

  const students = [...(roster.students ?? [])];
  for (const fix of FIXES) {
    const index = students.findIndex(
      (student) => student.rut && normalizeRut(student.rut) === fix.rutKey
    );
    if (index < 0) {
      console.warn("No encontrado:", fix.rut);
      continue;
    }
    const previous = students[index];
    students[index] = { ...previous, rut: fix.rut, fullName: fix.fullName, generation: "G-2025" };
    console.log(`✓ ${fix.fullName}: ${previous.generation} → G-2025`);
  }

  await db.collection("convocatoria_rosters").updateOne(
    { convocatoriaSlug: SLUG },
    { $set: { students, updatedAt: new Date().toISOString() } }
  );

  const g2025 = students.filter(
    (s) => normalizeGenerationValue(s.generation) === "G-2025"
  );
  console.log("G-2025:", g2025.length);

  await client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
