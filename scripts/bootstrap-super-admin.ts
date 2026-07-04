/**
 * Bootstrap del Super Admin reservado (soporte@mentorprime.cl).
 * Uso: npx tsx --env-file=.env scripts/bootstrap-super-admin.ts [tenantId] [email]
 */
import { MongoClient } from "mongodb";
import { ROLE_CODES } from "../src/core/identity/roles/codes";
import { roleIdForTenant } from "../src/core/identity/roles/defaults";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;
const tenantId = process.argv[2]?.trim() || "seminario-ipn";
const email = (process.argv[3]?.trim() || "soporte@mentorprime.cl").toLowerCase();

if (!uri || !dbName) {
  console.error("Faltan MONGODB_URI o MONGODB_DB.");
  process.exit(1);
}

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const now = new Date().toISOString();

  const superAdminRoleId = roleIdForTenant(tenantId, ROLE_CODES.SUPER_ADMIN);

  let role = await db.collection("identity_roles").findOne({ _id: superAdminRoleId });
  if (!role) {
    role = await db.collection("identity_roles").findOne({
      tenantId,
      $or: [{ code: ROLE_CODES.SUPER_ADMIN }, { name: { $in: ["Super Admin", "Tenant Owner"] } }],
    });
  }

  if (!role) {
    console.error("Rol Super Admin no encontrado. Ejecuta sync-tenant-roles primero.");
    process.exit(1);
  }

  let user = await db.collection("identity_users").findOne({ email });
  if (!user) {
    const userId = `user-${Date.now()}`;
    await db.collection("identity_users").insertOne({
      _id: userId,
      email,
      emailVerified: true,
      displayName: "Soporte MentorPrime",
      isSystemAccount: true,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
    user = await db.collection("identity_users").findOne({ _id: userId });
    console.log(`  + usuario creado: ${email}`);
  } else {
    await db.collection("identity_users").updateOne(
      { _id: user._id },
      { $set: { isSystemAccount: true, updatedAt: now } }
    );
  }

  const membership = await db.collection("identity_memberships").findOne({
    tenantId,
    userId: user!._id,
  });

  if (!membership) {
    await db.collection("identity_memberships").insertOne({
      _id: `membership-${tenantId}-${user!._id}`,
      tenantId,
      userId: user!._id,
      roleIds: [role._id],
      status: "active",
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`  + membresía Super Admin asignada`);
  } else {
    await db.collection("identity_memberships").updateOne(
      { _id: membership._id },
      { $set: { roleIds: [role._id], updatedAt: now } }
    );
    console.log(`  ↻ membresía actualizada a Super Admin`);
  }

  await client.close();
  console.log(`\n✓ Super Admin configurado: ${email} en tenant ${tenantId}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
