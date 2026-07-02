/**
 * Sincroniza permisos de roles de sistema con TENANT_ROLES (defaults).
 * Uso: npx tsx --env-file=.env scripts/sync-tenant-roles.ts [tenantId]
 */
import { MongoClient } from "mongodb";
import { TENANT_ROLES, roleSlug } from "../src/core/identity/roles/defaults";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;
const tenantId = process.argv[2]?.trim() || "seminario-ipn";

if (!uri || !dbName) {
  console.error("Faltan MONGODB_URI o MONGODB_DB.");
  process.exit(1);
}

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const now = new Date().toISOString();
  const templateByName = new Map(TENANT_ROLES.map((t) => [t.name, t]));

  const existing = await db
    .collection("identity_roles")
    .find({ tenantId })
    .toArray();

  const existingByName = new Map(existing.map((r) => [r.name, r]));
  let inserted = 0;
  let updated = 0;

  for (const template of TENANT_ROLES) {
    const current = existingByName.get(template.name);
    if (!current) {
      await db.collection("identity_roles").insertOne({
        _id: `role-${tenantId}-${roleSlug(template.name)}`,
        tenantId,
        name: template.name,
        description: template.description,
        permissionIds: [...template.permissionIds],
        system: template.system,
        createdAt: now,
        updatedAt: now,
      });
      inserted += 1;
      console.log(`  + creado ${template.name}`);
      continue;
    }

    if (!current.system) continue;

    const templatePerms = [...template.permissionIds].sort().join(",");
    const rolePerms = [...(current.permissionIds ?? [])].sort().join(",");
    if (templatePerms !== rolePerms) {
      const added = template.permissionIds.filter(
        (p) => !(current.permissionIds ?? []).includes(p)
      );
      await db.collection("identity_roles").updateOne(
        { _id: current._id },
        { $set: { permissionIds: [...template.permissionIds], updatedAt: now } }
      );
      updated += 1;
      console.log(`  ↻ ${template.name} (+${added.join(", ") || "sync"})`);
    }
  }

  await client.close();
  console.log(`\n✓ Tenant ${tenantId}: ${inserted} creados, ${updated} actualizados`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
