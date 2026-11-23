/**
 * Carga los seis Espacios sintéticos en nelzuri_dev.
 * No abre el servidor operativo ni copia personas.
 */
import "./_mongo-guard";
import { MongoClient } from "mongodb";
import { applyNextDevEnv } from "../src/lib/mongo/dev-env-files";
import { assertIsolatedDev } from "../src/lib/mongo/local-boundary";
import { seedSyntheticSpaces } from "../src/dev/synthetic-spaces";

async function main(): Promise<void> {
  const merged = applyNextDevEnv();
  assertIsolatedDev(merged);
  const uri = merged.MONGODB_URI ?? "";
  const dbName = merged.MONGODB_DB ?? "";
  const client = new MongoClient(uri);
  await client.connect();
  try {
    const db = client.db(dbName);
    const spaces = await seedSyntheticSpaces(db);
    const denied: string[] = [];
    for (const foreign of ["SeminarioIPN", "nelzuri_core"]) {
      try {
        await client.db(foreign).collection("probe").insertOne({ probe: true });
        denied.push(foreign);
      } catch {
        /* la cuenta local no puede crear esas bases */
      }
    }
    if (denied.length > 0) {
      throw new Error("La cuenta de desarrollo pudo escribir una base ajena.");
    }
    console.log(
      JSON.stringify({
        db: dbName,
        spaces: spaces.map((space) => space.code),
        users: spaces[0]?.users ?? 0,
        copiedFromOperational: false,
      })
    );
  } finally {
    await client.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
