/**
 * Audita nómina de convocatoria vs respuestas.
 * Ejecutar: npx tsx --env-file=.env scripts/audit-convocatoria-roster.ts [slug]
 */
import { MongoClient } from "mongodb";
import { formatGenerationDisplay, normalizeGenerationValue } from "../src/lib/experience/forms/generations";

const slug = process.argv[2] ?? "talca-aurora-jul-2026";
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

if (!uri || !dbName) {
  console.error("Faltan MONGODB_URI o MONGODB_DB");
  process.exit(1);
}

function normalizeRut(value: string): string {
  return value.replace(/\./g, "").replace(/-/g, "").toLowerCase().trim();
}

async function main() {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 20000 });
  await client.connect();
  const db = client.db(dbName);

  const roster = await db.collection("convocatoria_rosters").findOne({ convocatoriaSlug: slug });
  if (!roster) {
    console.error("Sin nómina para slug:", slug);
    process.exit(1);
  }

  const students = (roster.students ?? []) as Array<{
    id: string;
    rut?: string;
    fullName: string;
    generation: string;
  }>;

  console.log("=== Nómina convocatoria:", slug, "===");
  console.log("Total en BD:", students.length);
  console.log("Actualizada:", roster.updatedAt);

  const byDisplay = new Map<string, typeof students>();
  for (const student of students) {
    const generation = formatGenerationDisplay(student.generation);
    const list = byDisplay.get(generation) ?? [];
    list.push(student);
    byDisplay.set(generation, list);
  }

  console.log("\n--- Por programa (display) ---");
  for (const [generation, list] of [...byDisplay.entries()].sort((a, b) => a[0].localeCompare(b[0], "es"))) {
    console.log(`${list.length}\t${generation}`);
  }

  const g2023 = students.filter((s) => normalizeGenerationValue(s.generation) === "G-2023");
  console.log("\n--- G-2023 detalle ---");
  console.log("En nómina (canónico G-2023):", g2023.length);

  const rutSeen = new Map<string, string>();
  const duplicateRuts: Array<{ rut: string; first: string; second: string }> = [];
  const missingRut = g2023.filter((s) => !s.rut?.trim());
  for (const student of g2023) {
    if (!student.rut?.trim()) continue;
    const key = normalizeRut(student.rut);
    const prev = rutSeen.get(key);
    if (prev) duplicateRuts.push({ rut: student.rut, first: prev, second: student.fullName });
    else rutSeen.set(key, student.fullName);
  }

  console.log("Con RUT:", g2023.length - missingRut.length);
  console.log("Sin RUT:", missingRut.length);
  if (duplicateRuts.length) {
    console.log("RUT duplicados (descartados al importar):", duplicateRuts.length);
    duplicateRuts.forEach((d) => console.log(`  ${d.rut}: ${d.first} / ${d.second}`));
  }

  const other2023 = students.filter((s) => {
    const canon = normalizeGenerationValue(s.generation);
    return canon !== "G-2023" && String(s.generation).includes("2023");
  });
  if (other2023.length) {
    console.log("\nFilas con '2023' pero generación distinta a G-2023:", other2023.length);
    other2023.forEach((s) => console.log(`  ${s.fullName} | raw: ${s.generation}`));
  }

  const formId = roster.formId ?? `convocatoria-${slug}`;
  const subs = await db
    .collection("experience_form_submissions")
    .find({ formId })
    .project({ data: 1 })
    .toArray();

  const confirmedByGen = new Map<string, number>();
  for (const sub of subs) {
    const data = sub.data as Record<string, unknown>;
    if (data.attendance !== "yes") continue;
    const gen = formatGenerationDisplay(data.generation ?? data.program);
    confirmedByGen.set(gen, (confirmedByGen.get(gen) ?? 0) + 1);
  }

  console.log("\n--- Confirmados vs nómina ---");
  for (const [generation, list] of [...byDisplay.entries()].sort((a, b) => a[0].localeCompare(b[0], "es"))) {
    const confirmed = confirmedByGen.get(generation) ?? 0;
    const nominated = list.length;
    const pct = nominated > 0 ? Math.round((confirmed / nominated) * 100) : 0;
    console.log(`${generation}: ${confirmed}/${nominated} (${pct}%)`);
  }

  const g2023Display = formatGenerationDisplay("G-2023");
  const g2023Confirmed = confirmedByGen.get(g2023Display) ?? 0;
  console.log(`\nUI G-2023 esperado: ${g2023Confirmed}/${g2023.length}`);

  if (g2023.length < 32) {
    console.log(`\n⚠ Diferencia vs 32 esperados: faltan ${32 - g2023.length} en BD.`);
    console.log("Posibles causas:");
    console.log("  1. Filas sin nombre o generación al importar Excel");
    console.log("  2. RUT duplicados (mergeRosterStudents los elimina)");
    console.log("  3. Alumnos clasificados en otra generación (Equipo, Otros, etc.)");
    console.log("  4. Re-importación parcial sobrescribió la nómina anterior");
  }

  console.log("\n--- Listado G-2023 en nómina ---");
  g2023
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "es"))
    .forEach((student, index) => {
      console.log(`${index + 1}. ${student.fullName} | ${student.rut ?? "sin RUT"}`);
    });

  const g2023Subs = subs.filter(
    (sub) =>
      normalizeGenerationValue(
        (sub.data as Record<string, unknown>).generation ??
          (sub.data as Record<string, unknown>).program
      ) === "G-2023"
  );
  console.log("\n--- Respuestas G-2023 ---");
  console.log("Total respuestas:", g2023Subs.length);
  const rosterRuts = new Set(
    g2023
      .map((s) => (s.rut ? normalizeRut(s.rut) : ""))
      .filter(Boolean)
  );
  const rosterNames = new Set(g2023.map((s) => s.fullName.toLowerCase()));

  const subsNotOnRoster = g2023Subs.filter((sub) => {
    const data = sub.data as Record<string, unknown>;
    const rut = normalizeRut(String(data.rut ?? ""));
    const name = String(data.name ?? data.fullName ?? "").toLowerCase();
    if (rut && rosterRuts.has(rut)) return false;
    if (name && rosterNames.has(name)) return false;
    return true;
  });
  if (subsNotOnRoster.length) {
    console.log("Respondieron pero NO están en nómina G-2023:", subsNotOnRoster.length);
    subsNotOnRoster.forEach((sub) => {
      const data = sub.data as Record<string, unknown>;
      console.log(`  ${String(data.name ?? data.fullName)} | ${String(data.attendance)}`);
    });
  }

  const rosterWithoutResponse = g2023.filter((student) => {
    const rut = student.rut ? normalizeRut(student.rut) : "";
    return !g2023Subs.some((sub) => {
      const data = sub.data as Record<string, unknown>;
      const subRut = normalizeRut(String(data.rut ?? ""));
      const subName = String(data.name ?? data.fullName ?? "").toLowerCase();
      return (rut && subRut === rut) || subName === student.fullName.toLowerCase();
    });
  });
  console.log("\nEn nómina G-2023 sin respuesta:", rosterWithoutResponse.length);
  rosterWithoutResponse.forEach((s) => console.log(`  ${s.fullName}`));

  await client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
