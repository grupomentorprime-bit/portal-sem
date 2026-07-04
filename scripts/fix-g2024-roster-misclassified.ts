/**
 * Corrige 3 alumnos G-2024 mal clasificados en Otros.
 * npx tsx --env-file=.env scripts/fix-g2024-roster-misclassified.ts
 */
import { MongoClient } from "mongodb";
import { normalizeGenerationValue } from "../src/lib/experience/forms/generations";

const SLUG = "talca-aurora-jul-2026";

const FIXES: Array<{ rutKey: string; rut: string; fullName: string }> = [
  { rutKey: "113716657", rut: "11.371.665-7", fullName: "Abraham Jorquera" },
  { rutKey: "143444112", rut: "14.344.411-2", fullName: "Jeannette Villagra" },
  { rutKey: "157370316", rut: "15.737.031-6", fullName: "Maria Jose Lopez Rojas" },
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
  let updated = 0;

  for (const fix of FIXES) {
    const index = students.findIndex(
      (student) => student.rut && normalizeRut(student.rut) === fix.rutKey
    );
    if (index < 0) {
      console.warn("No encontrado:", fix.rut, fix.fullName);
      continue;
    }

    const previous = students[index];
    students[index] = {
      ...previous,
      rut: fix.rut,
      fullName: fix.fullName,
      generation: "G-2024",
    };
    updated += 1;
    console.log(`✓ ${fix.fullName}: ${previous.generation} → G-2024 (${previous.fullName})`);
  }

  const now = new Date().toISOString();
  await db.collection("convocatoria_rosters").updateOne(
    { convocatoriaSlug: SLUG },
    { $set: { students, updatedAt: now } }
  );

  const g2024 = students.filter(
    (s) => normalizeGenerationValue(s.generation) === "G-2024"
  );
  const otros = students.filter(
    (s) => normalizeGenerationValue(s.generation) === "other"
  );

  console.log("\nResumen:");
  console.log("  G-2024:", g2024.length);
  console.log("  Otros:", otros.length);
  console.log("  Actualizado:", updated, "registros");

  await client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
