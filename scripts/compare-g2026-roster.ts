/**
 * Compara nómina G-2026 pegada vs BD.
 * npx tsx --env-file=.env scripts/compare-g2026-roster.ts [--fix]
 */
import { getDatabase } from "../src/lib/mongodb";
import { parseConvocatoriaRosterRowsFromSheet } from "../src/lib/experience/forms/roster-import";
import { formatGenerationDisplay, normalizeGenerationValue } from "../src/lib/experience/forms/generations";

const USER_ROWS = `16.594.793-2	JESSICA NATALIA	QUINTEROS SAEZ
13.161.181-1	ROBERTO CARLOS	RAMIREZ RAMIREZ
16.879.403-7	GERSON FRANCISCO	ASTORGA PEÑA
18.650.551-4	CRISTINA MAGDALENA	QUEZADA SOTO
13.392.490-6	ERICA DE LA CRUZ	ERICES MENDOZA
20.604.032-7	BRIAN ADRIÁN	GÁLVEZ VALLADARES
19.372.114-1	NICOLAS ANDRES	BASCUR FLORES
20.307.168-k	DANIA ANTONIA	MUÑOZ CISTERNAS
16.255.584-7	HUMBERTO ANTONIO	GONZÁLEZ ROJAS
17.212.119-5	GÉNESIS MAGDALENA	LARA ORELLANA
20.046.211-4	AXEL NICOLÁS ENRIQUE	PACHECO GODOY
21.759.480-4	DAVID NATANAEL	SALGADO MONDACA
14.359.951-5	CARLA ALEJANDRA	RÍOS ERICES
15.850.626-2	DANIEL MAURICIO	CARRILLO BASTIAS
21.667.500-2	CATALINA ANTONIA	SOTO LEÓN
19.393.046-8	OSVALDO IGNACIO	LEÓN VERGARA
19.768.813-0	ROSSMERY PAZ	VALENZUELA GONZÁLEZ
13.782.208-3	HECTOR PATRICIO	MUÑOZ BARRERA
20.919.813-4	ANDRÉS ESTEBAN	SEPÚLVEDA CABEZAS
14.069.289-1	JESSICA PAOLA	QUEZADA QUILODRAN
16.999.179-0	IVAN	FLORES VALDES
19.715.693-7	LISSETTE ELIZABETH	RODRIGUEZ GUTIERREZ
19.944.038-1	NELSON ESTEBAN	VEGA CÁCERES
13.129.009-8	LUIS ALEX	NEIRA MARQUEZ
11.973.844-k	PAOLA	RAMÍREZ VÁSQUEZ
20.322.460-5	MARÍA ELIZABETH CATALINA	AVELLO RIQUELME
18.702.635-0	NEFTALÍ ADRIAN	LEYTON LEMUS
10.321.086-0	LINDA AMALIA	MATURANA MATURANA
9.324.554-7	IVÁN ELIEL	PÉREZ FUENTES`;

const SLUG = "talca-aurora-jul-2026";
const FORM_ID = "convocatoria-talca-aurora-jul-2026";
const GENERATION = "G-2026";

function normalizeRut(value: string): string {
  return value.replace(/\./g, "").replace(/-/g, "").replace(/\s+/g, "").toLowerCase().trim();
}

function formatName(first: string, last: string): string {
  return [first, last]
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

async function main() {
  const shouldFix = process.argv.includes("--fix");
  const rows = USER_ROWS.split("\n").map((line) => line.split("\t"));
  console.log("Filas en tu lista:", rows.length);

  const parsed = parseConvocatoriaRosterRowsFromSheet(rows, "TSR. G-2026");
  console.log("Filas aceptadas por importador:", parsed.length);
  if (parsed.length !== rows.length) {
    const parsedRuts = new Set(parsed.map((s) => normalizeRut(s.rut ?? "")));
    console.log("\nRechazadas por importador:");
    rows.forEach((row, i) => {
      const rut = normalizeRut(row[0] ?? "");
      if (!parsedRuts.has(rut)) {
        console.log(`  ${i + 1}. ${formatName(row[1] ?? "", row[2] ?? "")} | ${row[0]?.trim()}`);
      }
    });
  }

  const db = await getDatabase();
  const roster = await db.collection("convocatoria_rosters").findOne({ convocatoriaSlug: SLUG });
  if (!roster) throw new Error("Sin nómina");

  const students = [...(roster.students ?? [])];
  const dbG2026 = students.filter(
    (s) => normalizeGenerationValue(s.generation) === GENERATION
  );
  const dbRuts = new Map(dbG2026.map((s) => [normalizeRut(s.rut ?? ""), s]));

  console.log("\nG-2026 en nómina BD:", dbG2026.length);

  const missing: Array<{ rut: string; rutKey: string; name: string; anywhere?: (typeof students)[0] }> =
    [];
  for (const row of rows) {
    const rut = row[0]?.trim() ?? "";
    const rutKey = normalizeRut(rut);
    const name = formatName(row[1] ?? "", row[2] ?? "");
    if (!rutKey) continue;
    if (!dbRuts.has(rutKey)) {
      const anywhere = students.find((s) => s.rut && normalizeRut(s.rut) === rutKey);
      missing.push({ rut, rutKey, name, anywhere });
    }
  }

  console.log("\n--- Faltan en G-2026 (están en tu lista) ---");
  if (missing.length === 0) {
    console.log("(ninguno)");
  } else {
    missing.forEach((item, i) => {
      console.log(`${i + 1}. ${item.name} | ${item.rut}`);
      if (item.anywhere) {
        console.log(
          `   → En BD: ${item.anywhere.fullName} | ${formatGenerationDisplay(item.anywhere.generation)}`
        );
      } else {
        console.log("   → No está en la nómina");
      }
    });
  }

  console.log("\n--- En G-2026 BD pero no en tu lista ---");
  const userRuts = new Set(rows.map((row) => normalizeRut(row[0] ?? "")).filter(Boolean));
  let extra = 0;
  for (const student of dbG2026) {
    const rut = normalizeRut(student.rut ?? "");
    if (!userRuts.has(rut)) {
      extra += 1;
      console.log(`- ${student.fullName} | ${student.rut}`);
    }
  }
  if (extra === 0) console.log("(ninguno)");

  const subs = await db.collection("experience_form_submissions").find({ formId: FORM_ID }).toArray();
  const confirmed = subs.filter(
    (sub) =>
      sub.data?.attendance === "yes" &&
      normalizeGenerationValue(sub.data?.generation ?? sub.data?.program) === GENERATION
  ).length;
  const subsWrongGen = subs.filter((sub) => {
    const rut = normalizeRut(String(sub.data?.rut ?? ""));
    if (!userRuts.has(rut)) return false;
    return normalizeGenerationValue(sub.data?.generation ?? sub.data?.program) !== GENERATION;
  });

  console.log(`\nConfirmados G-2026 (respuestas): ${confirmed}/${dbG2026.length}`);
  if (subsWrongGen.length) {
    console.log("\nEn tu lista pero respuesta con otra generación:");
    subsWrongGen.forEach((sub) => {
      console.log(
        `- ${sub.data?.name ?? sub.data?.fullName} | respuesta: ${formatGenerationDisplay(sub.data?.generation ?? sub.data?.program)}`
      );
    });
  }

  if (shouldFix && missing.length > 0) {
    let fixed = 0;
    for (const item of missing) {
      if (!item.anywhere) continue;
      const index = students.findIndex((s) => s.rut && normalizeRut(s.rut) === item.rutKey);
      if (index < 0) continue;
      students[index] = {
        ...students[index],
        rut: item.rut,
        fullName: item.name,
        generation: GENERATION,
      };
      fixed += 1;
      console.log(`\n✓ Nómina: ${item.name} → G-2026`);
    }
    if (fixed > 0) {
      await db.collection("convocatoria_rosters").updateOne(
        { convocatoriaSlug: SLUG },
        { $set: { students, updatedAt: new Date().toISOString() } }
      );
    }
    for (const sub of subsWrongGen) {
      await db.collection("experience_form_submissions").updateOne(
        { _id: sub._id },
        { $set: { "data.generation": GENERATION, "data.program": GENERATION } }
      );
      console.log(`✓ Respuesta: ${sub.data?.name ?? sub.data?.fullName} → G-2026`);
    }
    const g2026 = students.filter(
      (s) => normalizeGenerationValue(s.generation) === GENERATION
    ).length;
    console.log("\nG-2026 tras corrección:", g2026);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
