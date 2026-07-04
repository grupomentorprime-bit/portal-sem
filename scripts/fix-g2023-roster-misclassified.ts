/**
 * Corrige 4 alumnos G-2023 mal clasificados en Otros/Equipo.
 * npx tsx --env-file=.env scripts/fix-g2023-roster-misclassified.ts
 */
import { MongoClient } from "mongodb";
import { normalizeGenerationValue } from "../src/lib/experience/forms/generations";

const SLUG = "talca-aurora-jul-2026";

const FIXES: Array<{ rutKey: string; rut: string; fullName: string }> = [
  { rutKey: "128105441", rut: "12.810.544-1", fullName: "Ericsson Duran Soto" },
  { rutKey: "105325975", rut: "10.532.597-5", fullName: "Jose Daniel Hernandez Caceres" },
  { rutKey: "143218929", rut: "14.321.892-9", fullName: "Marco Antonio Alarcon Rojas" },
  { rutKey: "139557697", rut: "13.955.769-7", fullName: "Mauricio Carrasco Alegria" },
];

function normalizeRut(value: string): string {
  return value.replace(/\./g, "").replace(/-/g, "").toLowerCase().trim();
}

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI!, { serverSelectionTimeoutMS: 20000 });
  await client.connect();
  const db = client.db(process.env.MONGODB_DB!);

  const roster = await db.collection("convocatoria_rosters").findOne({ convocatoriaSlug: SLUG });
  if (!roster) {
    throw new Error("Nómina no encontrada");
  }

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
      generation: "G-2023",
    };
    updated += 1;
    console.log(
      `✓ ${fix.fullName}: ${previous.generation} → G-2023 (${previous.fullName})`
    );
  }

  if (updated === 0) {
    throw new Error("Ningún registro actualizado");
  }

  const now = new Date().toISOString();
  await db.collection("convocatoria_rosters").updateOne(
    { convocatoriaSlug: SLUG },
    {
      $set: {
        students,
        updatedAt: now,
      },
    }
  );

  const g2023 = students.filter(
    (student) => normalizeGenerationValue(student.generation) === "G-2023"
  );
  const otros = students.filter(
    (student) => normalizeGenerationValue(student.generation) === "other"
  );
  const staff = students.filter(
    (student) => normalizeGenerationValue(student.generation) === "staff"
  );

  console.log("\nResumen post-corrección:");
  console.log("  G-2023:", g2023.length);
  console.log("  Otros:", otros.length);
  console.log("  Equipo:", staff.length);
  console.log("  Total:", students.length);
  console.log("  Actualizado:", now);

  await client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
