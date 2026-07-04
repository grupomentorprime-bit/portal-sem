/**
 * Compara nómina G-2025 pegada vs BD.
 * npx tsx --env-file=.env scripts/compare-g2025-roster.ts [--fix]
 */
import { getDatabase } from "../src/lib/mongodb";
import { parseConvocatoriaRosterRowsFromSheet } from "../src/lib/experience/forms/roster-import";
import { formatGenerationDisplay, normalizeGenerationValue } from "../src/lib/experience/forms/generations";

const USER_ROWS = `19.743.565-8	ABSALON	GONZALEZ CHANDIA
16.985.497-1	ALEJANDRO ANTONIO	CASTILLO LEÓN
17.683.114-6	ALEX MAURICIO	ESPINOZA VEGA
13.464.147-9	ALVARO RONALD	GONZÁLEZ RODRÍGUEZ
14.904.935-5	ANITA MARIA	CISTERNA MOSQUEIRA
22.218.070-8	BÁRBARA BELÉN	OLAVE MEDINA
19.526.409-0	CARLA PAZ	NERETY GALLEGUILLOS
12.780.779-5	CHRISTIAN	HERNÁNDEZ ACUÑA
15.133.886-0	CRISTIAN RODRIGO	TRONCOSO CÁCERES
20.219.307-2	DANIEL ALEXIS	CEA CUEVAS
18.574.230-k	DANIELA ESTEFANY	REYES CONTRERAS
19.895.181-1	DANIELLA	ARAYA NORAMBUENA
10.997.468-4	DINA ESTER	CUEVAS BENAVIDES
7.489.449-6	ELIAS	CÉSPEDES VILLEGAS
18.213.729-4	ESTEBAN LUIS	VEGA FUENTES
17.449.735-4	FERNANDA DEL PILAR	NORAMBUENA REYES
16.759.467-9	FERNANDO ESTEBAN	ARRIAGADA ROJAS
22.644.480-7	FRANCISCA JACQUELINE	MOLINA SÁEZ
17.900.916-1	HUGO GABRIEL JESÚS	HUEMUR VALLADARES
15.513.575-1	JAIME OCTAVIO	CEA CASTRO
21.332.732-1	JEREMÍAS ERNESTO	PARDO HERNÁNDEZ
22.004.124-7	JOSÉ ALFONSO	MUÑOZ FAÚNDEZ
12.749.698-6	JUAN HUGO	REYES ARANEDA
9.789.129-k	MANUEL ALBERTO	GARRIDO POBLETE
12.769.756-6	MARÍA ANGÉLICA	MEDINA BENAVIDES
18.624.582-2	MARILYN CAMILA	VIDAL ÑANCUPIL
22.821.386-1	MATEO ANDRÉS	CUEVAS CISTERNA
13.157.080-5	OLGA INÉS	ÑANCUPIL MILLAHUAL
21.078.404-7	PABLO ANDRES	MUÑOZ GODOY
15.906.944-3	PABLO ANDRÉS	RODRÍGUEZ MÉNDEZ
19.294.595-k	PAOLA	ASTUDILLO BECERRA
16.255.420-4	PAOLA LORENA	VALENZUELA GONZÁLEZ
14.054.938-k	PATRICIO ENRIQUE	ABARCA GUTIERREZ
16.856.960-2	PAULINA DEL CARMEN	VALENZUELA GONZÁLEZ
21.648.778-8	REINA	GONZÁLEZ HERNÁNDEZ
13.055.903-4	SANDRA	CHANDÍA DONOSO
15.648.268-4	SUSY VIVIANA	ABURTO VILLAGRÁN
17.826.028-6	TABITA XIMENA	VALENZUELA GONZÁLEZ
16.679.126-k	VERONICA	VALENZUELA
14.616.776-4	YOKO ESTER	HAYASHI VIVEROS`;

const SLUG = "talca-aurora-jul-2026";
const GENERATION = "G-2025";

const FIXES: Array<{ rutKey: string; rut: string; fullName: string }> = [];

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
  console.log("Filas en nómina del usuario:", rows.length);

  const parsed = parseConvocatoriaRosterRowsFromSheet(rows, "TSR. G-2025");
  console.log("Filas que el importador acepta:", parsed.length);
  if (parsed.length !== rows.length) {
    console.log("\nFilas rechazadas por importador:");
    const parsedRuts = new Set(parsed.map((s) => normalizeRut(s.rut ?? "")));
    rows.forEach((row, index) => {
      const rut = normalizeRut(row[0] ?? "");
      if (!parsedRuts.has(rut)) {
        console.log(`  ${index + 1}. ${formatName(row[1] ?? "", row[2] ?? "")} | ${row[0]?.trim()}`);
      }
    });
  }

  const db = await getDatabase();
  const roster = await db.collection("convocatoria_rosters").findOne({ convocatoriaSlug: SLUG });
  const students = [...(roster?.students ?? [])];

  const dbG2025 = students.filter(
    (s) => normalizeGenerationValue(s.generation) === GENERATION
  );
  const dbRuts = new Map(
    dbG2025.map((s) => [normalizeRut(s.rut ?? ""), s])
  );

  console.log("\nG-2025 en BD:", dbG2025.length);

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

  console.log("\n--- Faltan en G-2025 (están en tu lista) ---");
  if (missing.length === 0) {
    console.log("(ninguno)");
  } else {
    missing.forEach((item, index) => {
      console.log(`${index + 1}. ${item.name} | ${item.rut}`);
      if (item.anywhere) {
        console.log(
          `   → En BD como: ${item.anywhere.fullName} | ${formatGenerationDisplay(item.anywhere.generation)}`
        );
        FIXES.push({ rutKey: item.rutKey, rut: item.rut, fullName: item.name });
      } else {
        console.log("   → No está en la nómina");
      }
    });
  }

  console.log("\n--- En G-2025 BD pero no en tu lista ---");
  const userRuts = new Set(rows.map((row) => normalizeRut(row[0] ?? "")).filter(Boolean));
  let extra = 0;
  for (const student of dbG2025) {
    const rut = normalizeRut(student.rut ?? "");
    if (!userRuts.has(rut)) {
      extra += 1;
      console.log(`- ${student.fullName} | ${student.rut}`);
    }
  }
  if (extra === 0) console.log("(ninguno)");

  const subs = await db
    .collection("experience_form_submissions")
    .find({ formId: roster?.formId ?? "convocatoria-talca-aurora-jul-2026" })
    .project({ data: 1 })
    .toArray();
  const confirmed = subs.filter(
    (sub) =>
      sub.data?.attendance === "yes" &&
      normalizeGenerationValue(sub.data?.generation ?? sub.data?.program) === GENERATION
  ).length;
  console.log(`\nConfirmados G-2025: ${confirmed}/${dbG2025.length} (UI actual)`);
  console.log(`Tras corregir a ${rows.length}: ${confirmed}/${rows.length}`);

  if (shouldFix && FIXES.length > 0) {
    let updated = 0;
    for (const fix of FIXES) {
      const index = students.findIndex(
        (student) => student.rut && normalizeRut(student.rut) === fix.rutKey
      );
      if (index < 0) continue;
      const previous = students[index];
      students[index] = {
        ...previous,
        rut: fix.rut,
        fullName: fix.fullName,
        generation: GENERATION,
      };
      updated += 1;
      console.log(`\n✓ Corregido: ${fix.fullName} (${previous.generation} → G-2025)`);
    }
    if (updated > 0) {
      await db.collection("convocatoria_rosters").updateOne(
        { convocatoriaSlug: SLUG },
        { $set: { students, updatedAt: new Date().toISOString() } }
      );
      const g2025 = students.filter(
        (s) => normalizeGenerationValue(s.generation) === GENERATION
      );
      console.log("\nG-2025 tras corrección:", g2025.length);
    }
  }

}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
