/**
 * Compara nómina G-2023 pegada por el usuario vs BD e importador.
 * npx tsx --env-file=.env scripts/compare-g2023-roster.ts
 */
import { MongoClient } from "mongodb";
import { parseConvocatoriaRosterRowsFromSheet } from "../src/lib/experience/forms/roster-import";
import { normalizeGenerationValue } from "../src/lib/experience/forms/generations";

const USER_ROWS = `13.786.472-K	ALEJANDRA	GUTIERREZ CARRASCO
15.215.127-6	ALEJANDRO JAVIER	MOLINA CABEZAS
14.514.812-K	ALEX 	BRANA GODOY
17.755.979-2	ALEXIS ANTONIO	GUZMAN RAMIREZ
16.628.806-3	ANDRES ENMANUEL	SEPULVEDA 
11.070.170-5	CRISTINA	GONZALEZ GATICA
13.627.685-9	DAMARIS JACKELINE	SAEZ MEDINA
15.722.249-k	DANIELA	SANTANA GONZALEZ
12.810.544-1	ERICSSON	DURAN SOTO
4.357.239-3	EULOGIO	FIERRO  SANHUEZA
14.070.928-k	FREDDY GIOVANNI	GONZALEZ REBOLLEDO
8.552.748-7	INES	CASTRO MOLINA
11.341.006-k	IVAN	GONZALEZ RODRIGUEZ
12.859.207-5 	JOEL ANTONIO	DIAZ GONZALEZ
 10.532.597-5	JOSE DANIEL	HERNANDEZ CACERES
12.984.639-9	JUAN ANTONIO	MORA BENAVIDEZ
13.373.003-6	JUAN MIGUEL	MONTECINO CASTILLO
10.145.657-1	LUIS ADRIANO	SOTO PALMA
9.423.104-3	MANUEL	BURGOS ARTEAGA
14.321.892-9	MARCO ANTONIO	ALARCON ROJAS
11.982.493-1	MARIA	LEON ILLANES
9.463.434-2	MARIA ISABEL	GONZALEZ SALAZAR
13.955.769-7	MAURICIO 	CARRASCO ALEGRIA
16.914.304-8	MICHELLE	DURAN VILLAROEL
14.352.588-0	NATALIA JACQUELINE	GUZMAN HIDALGO
8.299.262-6	PEDRO RICARDO	CEA MEDINA
9.871.234-8	PEDRO SEGUNDO	BASTIAS  RODRIGUEZ
10.505.318-5	SERGIO NARCISO	RODRIGUEZ ESPINOZA
14.054.572-4	SILVANA GUADALUPE	ROCO GUTIERREZ
7.064.258-1	SILVIA	GUTIERREZ ROJAS
14.027.005-9	SORAYA PROSPERINA	SEPULVEDA POBLETE
18.788.511-6	VICTORIA EMILIA	SEPULVEDA ANDRADE`;

function normalizeRut(value: string): string {
  return value.replace(/\./g, "").replace(/-/g, "").toLowerCase().trim();
}

async function main() {
  const rows = USER_ROWS.split("\n").map((line) => line.split("\t"));
  console.log("Filas en nómina del usuario:", rows.length);

  const parsed = parseConvocatoriaRosterRowsFromSheet(rows, "TSR. G-2023");
  console.log("Filas que el importador acepta:", parsed.length);

  const client = new MongoClient(process.env.MONGODB_URI!, { serverSelectionTimeoutMS: 20000 });
  await client.connect();
  const db = client.db(process.env.MONGODB_DB!);
  const roster = await db.collection("convocatoria_rosters").findOne({
    convocatoriaSlug: "talca-aurora-jul-2026",
  });
  const dbStudents = roster?.students ?? [];
  const dbG2023 = dbStudents.filter(
    (s: { generation: string }) => normalizeGenerationValue(s.generation) === "G-2023"
  );
  const dbRuts = new Set(
    dbG2023.map((s: { rut?: string }) => (s.rut ? normalizeRut(s.rut) : "")).filter(Boolean)
  );

  const parsedRuts = new Map(parsed.map((s) => [normalizeRut(s.rut ?? ""), s.fullName]));

  console.log("\n--- Faltan en BD (están en tu lista) ---");
  let missingCount = 0;
  for (const row of rows) {
    const rut = normalizeRut(row[0] ?? "");
    const name = [row[1], row[2]].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
    if (!rut) continue;
    if (!dbRuts.has(rut)) {
      missingCount += 1;
      const inOtherGen = dbStudents.find(
        (s: { rut?: string }) => s.rut && normalizeRut(s.rut) === rut
      );
      const parsedOk = parsedRuts.has(rut);
      console.log(`${missingCount}. ${name} | ${row[0].trim()}`);
      console.log(`   Importador: ${parsedOk ? "OK" : "RECHAZADO"}`);
      console.log(`   En otra generación BD: ${inOtherGen ? inOtherGen.generation : "no"}`);
    }
  }

  console.log("\n--- En BD pero no en tu lista ---");
  for (const student of dbG2023) {
    const rut = normalizeRut(student.rut ?? "");
    if (!parsedRuts.has(rut)) {
      console.log(`- ${student.fullName} | ${student.rut}`);
    }
  }

  await client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
