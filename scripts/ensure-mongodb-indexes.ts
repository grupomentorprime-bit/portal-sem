/**
 * Crea índices recomendados para convocatorias, formularios y Growth Core.
 * Ejecutar una vez por entorno tras desplegar:
 *   npx tsx --env-file=.env scripts/ensure-mongodb-indexes.ts
 */
import { ensureGrowthCoreIndexes } from "../src/core/growth/indexes";
import { getDatabase } from "../src/lib/mongodb";

async function main() {
  const db = await getDatabase();

  const submissions = db.collection("experience_form_submissions");
  await submissions.createIndex({ tenant: 1, formId: 1, createdAt: -1 });
  await submissions.createIndex({ tenant: 1, formId: 1, "data.studentId": 1 });
  await submissions.createIndex({ tenant: 1, formId: 1, "data.email": 1 });
  console.log("✓ Índices en experience_form_submissions");

  const rosters = db.collection("convocatoria_rosters");
  await rosters.createIndex({ tenant: 1, convocatoriaSlug: 1 }, { unique: true });
  console.log("✓ Índice en convocatoria_rosters");

  const growth = await ensureGrowthCoreIndexes(db);
  for (const r of growth.results) {
    console.log(`✓ growth index ${r.name}=${r.result}`);
  }

  console.log("\nListo. Los índices existentes no se duplican (createIndex es idempotente).");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
