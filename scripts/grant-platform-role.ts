/**
 * Asigna o revoca capacidad global de Growth OS en identity_users.
 * No crea membresías de Espacio. No usa emails hardcodeados.
 *
 * Uso:
 *   npx tsx --env-file=.env scripts/grant-platform-role.ts --user-id USER_ID --role platform_operator
 *   npx tsx --env-file=.env scripts/grant-platform-role.ts --email user@example.com --role platform_owner
 *   npx tsx --env-file=.env scripts/grant-platform-role.ts --user-id USER_ID --revoke
 */
import { MongoClient } from "mongodb";
import {
  isPlatformRoleCode,
  normalizePlatformRoles,
  type PlatformRoleCode,
} from "../src/core/identity/platform/codes";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

function argValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1]?.trim();
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

async function main() {
  if (!uri || !dbName) {
    console.error("Faltan MONGODB_URI o MONGODB_DB.");
    process.exit(1);
  }

  const userIdArg = argValue("--user-id");
  const emailArg = argValue("--email")?.toLowerCase();
  const roleArg = argValue("--role");
  const revoke = hasFlag("--revoke");

  if (!userIdArg && !emailArg) {
    console.error("Indica --user-id o --email. No hay destinatario por defecto.");
    process.exit(1);
  }

  let roles: PlatformRoleCode[] = [];
  if (!revoke) {
    if (!roleArg || !isPlatformRoleCode(roleArg)) {
      console.error("Indica --role platform_owner|platform_operator, o --revoke.");
      process.exit(1);
    }
    roles = [roleArg];
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const now = new Date().toISOString();

  const users = db.collection("identity_users");
  const user = userIdArg
    ? await users.findOne({ _id: userIdArg })
    : await users.findOne({ email: emailArg });

  if (!user) {
    console.error("Usuario no encontrado.");
    await client.close();
    process.exit(1);
  }

  const previous = normalizePlatformRoles(user.platformRoles);
  await users.updateOne(
    { _id: user._id },
    { $set: { platformRoles: roles, updatedAt: now } }
  );

  const action = roles.length === 0 ? "platform.role.revoke" : "platform.role.grant";
  await db.collection("identity_audit").insertOne({
    _id: `audit-${Date.now()}`,
    scope: "platform",
    userId: String(user._id),
    action,
    entity: "user",
    entityId: String(user._id),
    metadata: { previous, roles, via: "script" },
    createdAt: now,
  });

  await client.close();
  console.log(
    roles.length
      ? `✓ ${roles.join(", ")} asignado a ${user._id}`
      : `✓ capacidad de plataforma revocada en ${user._id}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
