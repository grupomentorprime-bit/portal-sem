import "./refuse-operational-mongo.cjs";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;
const EVENT_ID = "ipn-congreso-varones-2026";

if (!uri || !dbName) {
  console.error("missing mongo env");
  process.exit(1);
}

function compare(a, b) {
  const byCreated = String(a.createdAt ?? "").localeCompare(String(b.createdAt ?? ""));
  if (byCreated !== 0) return byCreated;
  const byName = String(a.identity?.fullName ?? "").localeCompare(
    String(b.identity?.fullName ?? ""),
    "es"
  );
  if (byName !== 0) return byName;
  return String(a._id).localeCompare(String(b._id));
}

const client = new MongoClient(uri);
await client.connect();
const db = client.db(dbName);
const col = db.collection("congress_registrations");
const seqCol = db.collection("congress_sequences");

const tenantIds = await col.distinct("tenantId", { eventId: EVENT_ID });
console.log("tenants", tenantIds);

for (const tenantId of tenantIds) {
  const rows = await col.find({ tenantId, eventId: EVENT_ID }).toArray();
  let maxEntryNumber = 0;
  const missing = [];
  for (const row of rows) {
    const n = row.entryNumber;
    if (typeof n === "number" && Number.isInteger(n) && n > 0) {
      if (n > maxEntryNumber) maxEntryNumber = n;
    } else {
      missing.push(row);
    }
  }
  missing.sort(compare);
  let next = maxEntryNumber;
  let assigned = 0;
  for (const row of missing) {
    next += 1;
    await col.updateOne(
      { _id: row._id },
      {
        $set: { entryNumber: next, updatedAt: new Date().toISOString() },
        $inc: { version: 1 },
      }
    );
    assigned += 1;
  }
  await seqCol.updateOne(
    { _id: `${tenantId}:${EVENT_ID}:registration-entry` },
    { $set: { seq: next } },
    { upsert: true }
  );
  console.log({ tenantId, total: rows.length, assigned, maxEntryNumber: next });
}

await client.close();
