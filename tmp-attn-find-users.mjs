import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB);
const tenants = ["mentor-prime-capacitacion", "adl", "seminario-ipn", "ipn-chile", "fundacion-mueve", "cumple"];
for (const tid of tenants) {
  const mems = await db.collection("identity_memberships").find({ tenantId: tid, status: "active" }).toArray();
  const rows = [];
  for (const m of mems) {
    const u = await db.collection("identity_users").findOne(
      { _id: m.userId },
      { projection: { email: 1, displayName: 1, platformRoles: 1, status: 1 } }
    );
    if (!u || u.status !== "active") continue;
    const plat = Array.isArray(u.platformRoles) ? u.platformRoles : [];
    rows.push({
      email: u.email,
      name: u.displayName,
      plat,
      nonPlat: plat.length === 0,
    });
  }
  console.log(
    tid,
    rows.filter((r) => r.nonPlat).slice(0, 10),
    "total",
    rows.length,
    "nonPlat",
    rows.filter((r) => r.nonPlat).length
  );
}
await client.close();
