import { MongoClient } from "mongodb";

async function main() {
const client = new MongoClient(process.env.MONGODB_URI!);
await client.connect();
const db = client.db(process.env.MONGODB_DB);
const cases = await db
  .collection("attention_cases")
  .find({ correlative: { $in: ["AC-00019", "AC-00026", "AC-00018", "AC-00006"] } })
  .project({
    correlative: 1,
    tenantId: 1,
    subject: 1,
    status: 1,
    intakeChannel: 1,
    ticketCaseId: 1,
    createdAt: 1,
    originId: 1,
    helpFrom: 1,
  })
  .toArray();
const tenants = await db
  .collection("tenants")
  .find({ tenantId: { $in: [...new Set(cases.map((item) => item.tenantId))] } })
  .project({ tenantId: 1, name: 1, displayName: 1 })
  .toArray();
console.log(JSON.stringify({ cases, tenants }, null, 2));
await client.close();
}
main();
