import { MongoClient, type Db } from "mongodb";
import { MIGRATIONS } from "@/core/migrations/registry";
import {
  MIGRATIONS_COLLECTION,
  type MigrationContext,
  type MigrationRecord,
} from "@/core/migrations/types";

export interface RunMigrationsOptions {
  db: Db;
  /** Si se define, ejecuta solo esa migración */
  only?: string;
  log?: (message: string) => void;
}

export interface RunMigrationsSummary {
  applied: string[];
  skipped: string[];
  failed: string[];
}

async function getAppliedMigrationIds(db: Db): Promise<Set<string>> {
  const records = await db
    .collection<MigrationRecord>(MIGRATIONS_COLLECTION)
    .find({ status: "success" })
    .toArray();

  return new Set(records.map((r) => r._id));
}

export async function runMigrations(
  options: RunMigrationsOptions
): Promise<RunMigrationsSummary> {
  const log = options.log ?? console.log;
  const applied = await getAppliedMigrationIds(options.db);
  const summary: RunMigrationsSummary = {
    applied: [],
    skipped: [],
    failed: [],
  };

  const queue = options.only
    ? MIGRATIONS.filter((m) => m.id === options.only)
    : MIGRATIONS;

  if (options.only && queue.length === 0) {
    throw new Error(`Migración no encontrada: ${options.only}`);
  }

  for (const migration of queue) {
    if (applied.has(migration.id)) {
      log(`⏭  ${migration.id} — ya aplicada`);
      summary.skipped.push(migration.id);
      continue;
    }

    log(`\n▶  ${migration.id} — ${migration.description}`);
    const started = Date.now();

    const ctx: MigrationContext = { db: options.db, log };

    try {
      const result = await migration.run(ctx);
      const record: MigrationRecord = {
        _id: migration.id,
        appliedAt: new Date().toISOString(),
        documentsAffected: result.documentsAffected,
        skipped: result.skipped,
        durationMs: Date.now() - started,
        status: "success",
      };

      await options.db
        .collection<MigrationRecord>(MIGRATIONS_COLLECTION)
        .replaceOne({ _id: migration.id }, record, { upsert: true });

      log(
        `✓  ${migration.id} — ${result.documentsAffected} doc(s), ${result.skipped} omitido(s) (${record.durationMs}ms)`
      );

      if (result.details?.length) {
        for (const line of result.details) {
          log(`   ${line}`);
        }
      }

      summary.applied.push(migration.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const record: MigrationRecord = {
        _id: migration.id,
        appliedAt: new Date().toISOString(),
        documentsAffected: 0,
        skipped: 0,
        durationMs: Date.now() - started,
        status: "failed",
        error: message,
      };

      await options.db
        .collection<MigrationRecord>(MIGRATIONS_COLLECTION)
        .replaceOne({ _id: migration.id }, record, { upsert: true });

      log(`✗  ${migration.id} — ERROR: ${message}`);
      summary.failed.push(migration.id);
      throw error;
    }
  }

  return summary;
}

export async function runMigrationsCli(only?: string): Promise<void> {
  const { requireMongoEnv } = await import("@/core/migrations/env");
  const { uri, dbName } = requireMongoEnv();

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);

    logHeader();
    const summary = await runMigrations({ db, only });
    logFooter(summary);
  } finally {
    await client.close();
  }
}

function logHeader(): void {
  console.log("AprendeHoy — Migration Framework\n");
}

function logFooter(summary: RunMigrationsSummary): void {
  console.log("\n—".repeat(40));
  console.log(
    `Aplicadas: ${summary.applied.length} | Omitidas: ${summary.skipped.length} | Fallidas: ${summary.failed.length}`
  );
}
