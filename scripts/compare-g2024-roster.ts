/**
 * Compara nómina G-2024 pegada vs BD.
 * npx tsx --env-file=.env scripts/compare-g2024-roster.ts
 */
import { MongoClient } from "mongodb";
import { parseConvocatoriaRosterRowsFromSheet } from "../src/lib/experience/forms/roster-import";
import { formatGenerationDisplay, normalizeGenerationValue } from "../src/lib/experience/forms/generations";

const USER_ROWS = `11.371.665-7	ABRAHAM	JORQUERA
14.063.951-6	ADELA	CORTÉS
16.594.765-7	ANDRES	OYARCE FAUNDEZ
21.769.375-6	ANGGI	MOLINA SÁEZ
17.272.463-9	CARLA	VÁSQUEZ SUAZO
15.835.432-2	CAROLINA	APABLAZA CONTRERAS
21.214.445-2	CELESTE	GONZÁLEZ LARA
14.905.480-4	CLAUDIA	NILO ESPINOZA
17.192.396-4	CONSTANSA	BASTIAS
17.224.797-0	CONSTANZA	BECAR ARAYA
14.464.448-4	CRISTIAN	ROJAS GONZÁLEZ
15.495.447-3	DANIEL	CASTRO GAVILÁN
19.807.507-8	DARIO	RIQUELME URRA
17.158.628-3	EDGAR	FERNÁNDEZ PACHECO
20.527.974-1	EDISON	ERICES ROJAS
17.224.885-3	ELÍAS	HERRADA MEDINA
14.326.373-8	ESTER	HERNÁNDEZ CÁCERES
9.208.517-1	GABRIEL	PINILLA CUEVAS
18.543.016-2	GABRIEL	VIVANCO OÑATE
20.759.259-8	GÉNESIS	RODRÍGUEZ MONTECINO
20.825.394-8	GERSON	MOLINA SÁEZ
13.131.219-9	GUILLERMO	RIVAS FUENZALIDA
13.393.703-K	HÉCTOR	MOLINA MEDINA
6.320.041-7	HECTOR	VIVANCO SILVA
13.576.004-8	INÉS PAULA	PARADA CACERES
10.367.293-7	JACQUELINE	GONZÁLEZ FUENTES
15.797.477-7	JAIME	GATICA ARAYA
15.481.562-7	JEANETTE	YAÑEZ
14.344.411-2	JEANNETTE	VILLAGRA
13.182.874-8	JESSICA	RÍOS ERICES
14.007.048-3	JESSICA	ESPINOZA BADILLO
19.008.698-4	JOEL	PARDO HERNÁNDEZ
20.780.921-7	JONATHAN	ROJAS RAMÍREZ
14 454 543-5	JOSE	AGUILAR GAJARDO
20.848.220-3	JOSÉ	GATICA ARAYA
16.410.993-3	JULIO	ALARCON ROJAS
17.225.312-1	KATALYN	ARAYA GONZALEZ
9.983.072-7	LEONEL	MOLINA MEDINA
10.734.662-7	LUIS	BARRERA MARDONES
11.300.756-7	LUIS	MONDACA POBLETE
12.178.053-4	LUIS	LEIVA ORELLANA
14.397.969-5	MA	LARA GUTIÉRREZ
9.017.683-8	MANUEL	PALMA OLIVA
15.190.752-0	MARCELA	RAMIREZ OPAZO
17.886.098-4	MARCELA	MEDINA OSORES
12.544.476-8	MARCELA	NORAMBUENA VALDÉS
14.465.920-1	MARCELA	OTAROLA FLORES
15.676.490-6	MARCO	SEPÚLVEDA BUSTOS
19.611.191-3	MARÍA	JOSÉ CABRERA
15.737.031-6	MARÍA	JOSÉ LÓPEZ ROJAS
15.156.280-9	MARIA	MONTENICO CASTILLO
13.146.357-k	MARIELA	CUEVAS BENAVIDES
9.197.837-7	MARIO	GALLARDO GALLARDO
17.322.227-0	MARTIN	RODRIGUEZ SEPULVEDA
17.982.110-9	NATALIA	RODRIGUEZ GUTIERREZ
18.967.729-4	NICOLE	BASTÍAS ALCAPÁN
13.626.571-7	NUVIA	CUEVAS BENAVIDES
10.900.725-0	OLEGARIO	PEREIRA PEREIRA
17.156.200-7	PABLO	HERNANDEZ GONZALEZ
14.293.962-2	PAOLA	FIERRO VERDUGO
11.788.303-5	PATRICIA	REYES VALENZUELA
19.474.513-3	RENATO	GONZÁLEZ LARA
13.392.830-8	RICHARD	ANDRÉS CEA CASTRO
12 177319-8	RODIS	DÍAZ HUERTA
15.810.222-6	RODRIGO	LUNA GÓMEZ
18.645.300-k	SONIA	NORAMBUENA PAINIQUEO
12.365.013-1	STALIN	GUZMAN CÓRDOVA
11.780.419-4	VERÓNICA	GODOY BARRA
10.202.933-k	WALTER	VERGARA RAMIREZ
16.542.466-2	YESSICA	JIMÉNEZ ARELLANO
20.563.328-6	YUNAISSE	URRA
16.554.885-k	CAROLINA DEL PILAR	NUÑEZ VASQUEZ`;

const SLUG = "talca-aurora-jul-2026";
const GENERATION = "G-2024";

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
  const rows = USER_ROWS.split("\n").map((line) => line.split("\t"));
  console.log("Filas en nómina del usuario:", rows.length);

  const parsed = parseConvocatoriaRosterRowsFromSheet(rows, "TSR. G-2024");
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

  const client = new MongoClient(process.env.MONGODB_URI!, { serverSelectionTimeoutMS: 20000 });
  await client.connect();
  const db = client.db(process.env.MONGODB_DB!);
  const roster = await db.collection("convocatoria_rosters").findOne({ convocatoriaSlug: SLUG });
  const students = roster?.students ?? [];

  const dbG2024 = students.filter(
    (s: { generation: string }) => normalizeGenerationValue(s.generation) === GENERATION
  );
  const dbRuts = new Map(
    dbG2024.map((s: { rut?: string; fullName: string; generation: string }) => [
      normalizeRut(s.rut ?? ""),
      s,
    ])
  );

  console.log("\nG-2024 en BD:", dbG2024.length);

  console.log("\n--- Faltan en G-2024 (están en tu lista) ---");
  let missing = 0;
  for (const row of rows) {
    const rut = normalizeRut(row[0] ?? "");
    const name = formatName(row[1] ?? "", row[2] ?? "");
    if (!rut) continue;
    if (!dbRuts.has(rut)) {
      missing += 1;
      const anywhere = students.find(
        (s: { rut?: string }) => s.rut && normalizeRut(s.rut) === rut
      );
      console.log(`${missing}. ${name} | ${row[0]?.trim()}`);
      if (anywhere) {
        console.log(
          `   → En BD como: ${anywhere.fullName} | ${formatGenerationDisplay(anywhere.generation)} (raw: ${anywhere.generation})`
        );
      } else {
        console.log("   → No está en la nómina");
      }
    }
  }

  console.log("\n--- En G-2024 BD pero no en tu lista ---");
  const userRuts = new Set(rows.map((row) => normalizeRut(row[0] ?? "")).filter(Boolean));
  for (const student of dbG2024) {
    const rut = normalizeRut(student.rut ?? "");
    if (!userRuts.has(rut)) {
      console.log(`- ${student.fullName} | ${student.rut}`);
    }
  }

  const g2024Display = formatGenerationDisplay(GENERATION);
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
  console.log(`\nConfirmados G-2024: ${confirmed}/${dbG2024.length} (UI actual)`);
  console.log(`Tras corregir a ${rows.length}: ${confirmed}/${rows.length}`);

  await client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
