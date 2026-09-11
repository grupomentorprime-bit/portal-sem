/**
 * OT-GROWTH-CORE-006 — Backfill histórico Growth Core (tenant-scoped).
 *
 * Uso:
 *   npm run backfill:growth -- <tenantId>
 *   npm run backfill:growth -- <tenantId> --batch=50
 *   npm run backfill:growth -- <tenantId> --dry-run
 *
 * Reejecutable e idempotente. No modifica portal_interesados ni submissions.
 * Requiere --require scripts/_stub-server-only.cjs (incluido en el npm script)
 * porque el cableado de Workflow/Event Bus usa el marcador server-only de Next.
 */

import { MongoClient } from "mongodb";
import {
  createMongoGrowthBackfillSource,
  ensureGrowthCoreIndexes,
  openGrowthOpportunityStore,
  openGrowthPersonaStore,
  runGrowthBackfill,
  type GrowthBackfillSummary,
} from "../src/core/growth";
import { createGrowthEventBusAdapter } from "../src/lib/growth/event-bus";
import { createMongoGrowthOpportunityWorkflow } from "../src/lib/growth/opportunity-workflow";

function parseArgs(argv: string[]): {
  tenantId: string;
  batchSize: number;
  dryRun: boolean;
} {
  const positional = argv.filter((a) => !a.startsWith("--"));
  const tenantId = positional[0]?.trim() ?? "";
  let batchSize = 100;
  let dryRun = false;
  for (const arg of argv) {
    if (arg === "--dry-run") dryRun = true;
    const m = arg.match(/^--batch=(\d+)$/);
    if (m) batchSize = Math.max(1, Number(m[1]));
  }
  return { tenantId, batchSize, dryRun };
}

function printSummary(summary: GrowthBackfillSummary): void {
  console.log("");
  console.log("Resumen backfill Growth Core");
  console.log(`  procesados:     ${summary.processed}`);
  console.log(`  creados:        ${summary.created}`);
  console.log(`  ya existentes:  ${summary.alreadyExisting}`);
  console.log(`  conflictos:     ${summary.conflicts}`);
  console.log(`  omitidos:       ${summary.omitted}`);
  console.log(`  errores:        ${summary.errors}`);
}

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;
  const { tenantId, batchSize, dryRun } = parseArgs(process.argv.slice(2));

  if (!uri || !dbName) {
    console.error("Faltan MONGODB_URI o MONGODB_DB.");
    process.exit(1);
  }
  if (!tenantId) {
    console.error(
      "Uso: npm run backfill:growth -- <tenantId> [--batch=100] [--dry-run]"
    );
    process.exit(1);
  }

  const client = new MongoClient(uri);
  await client.connect();
  try {
    const db = client.db(dbName);
    await ensureGrowthCoreIndexes(db);
    const [personas, oportunidades] = await Promise.all([
      openGrowthPersonaStore(db),
      openGrowthOpportunityStore(db),
    ]);
    const deps = {
      personas,
      oportunidades,
      workflow: createMongoGrowthOpportunityWorkflow(),
      eventBus: createGrowthEventBusAdapter(),
    };
    const reader = createMongoGrowthBackfillSource(db);

    console.log(
      `Backfill Growth Core · tenant=${tenantId} · batch=${batchSize}${dryRun ? " · dry-run" : ""}`
    );

    const summary = await runGrowthBackfill(deps, reader, {
      tenantId,
      batchSize,
      dryRun,
    });
    printSummary(summary);

    if (summary.errors > 0) {
      process.exitCode = 2;
    }
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
