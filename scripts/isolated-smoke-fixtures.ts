/**
 * Datos sintéticos para el smoke del servidor aislado.
 * No abre ni escribe SeminarioIPN.
 */
import "./_mongo-guard";
import { MongoClient } from "mongodb";
import { materializeSemTenantContent } from "../src/core/tenant/sem-content";
import { SEM_SITE_ID, SEM_TENANT_ID } from "../src/core/tenant/constants";
import { ensureSemTenantFoundation } from "../src/core/tenant/migrate-sem";
import {
  classifyMongoConnection,
  isDestructiveEnvironmentAuthorized,
  isProtectedDatabaseName,
} from "../src/lib/mongo/destructive-guard";

const dbName = process.env.MONGODB_DB?.trim() ?? "";
const uri = process.env.MONGODB_URI?.trim() ?? "";
const port = process.env.SMOKE_PORT?.trim() || "41881";

if (!uri || !dbName) {
  throw new Error("MONGODB_URI y MONGODB_DB son obligatorios.");
}
if (
  !isDestructiveEnvironmentAuthorized(process.env) ||
  classifyMongoConnection(uri, process.env) !== "isolated-test"
) {
  throw new Error("El smoke solo escribe en un Mongo aislado autorizado.");
}
if (dbName !== "nelzuri_fixture" || isProtectedDatabaseName(dbName)) {
  throw new Error("El smoke solo escribe en nelzuri_fixture.");
}

async function main(): Promise<void> {
  const host = `seminario-ipn.localhost:${port}`;
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  try {
    await ensureSemTenantFoundation(db, { hosts: [host] });
    await db.collection("site_config").updateOne(
      { _id: SEM_SITE_ID, tenantId: SEM_TENANT_ID },
      {
        $set: {
          sitePublished: true,
          siteEnabled: true,
          "features.forms": true,
          "features.applications": true,
        },
      }
    );
    await materializeSemTenantContent(db);
    const published = await db.collection("experience_forms").updateOne(
      { _id: "convocatoria-talca-aurora-jul-2026", tenant: SEM_TENANT_ID },
      { $set: { active: true, visible: true, private: false, archived: false } }
    );
    if (published.matchedCount !== 1) {
      throw new Error("No quedó el formulario sintético de la convocatoria.");
    }
    const config = await db.collection("site_config").findOne({ tenantId: SEM_TENANT_ID });
    console.log(
      JSON.stringify({
        db: dbName,
        host,
        sitePublished: config?.sitePublished === true,
        siteEnabled: config?.siteEnabled === true,
        forms: config?.features?.forms === true,
        applications: config?.features?.applications === true,
        form: published.matchedCount === 1,
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
