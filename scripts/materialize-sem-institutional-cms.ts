/**
 * Escribe en el CMS de T001 el menú institucional aprobado y las páginas en borrador.
 * No publica y no toca ADL.
 *
 *   node --require ./scripts/_stub-server-only.cjs ./node_modules/tsx/dist/cli.mjs --env-file=.env scripts/materialize-sem-institutional-cms.ts
 */
import { MongoClient } from "mongodb";
import { applySemInstitutionalCms } from "../src/core/tenant/sem-institutional-cms";

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;
  if (!uri || !dbName) throw new Error("La base de datos no está configurada.");
  const client = new MongoClient(uri);
  await client.connect();
  try {
    const result = await applySemInstitutionalCms(client.db(dbName));
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
