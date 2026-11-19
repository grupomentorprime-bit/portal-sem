import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB);
const codes = ["AC-00014", "AC-00015", "AC-00016", "AC-00017"];
const cases = await db
  .collection("attention_cases")
  .find({ correlative: { $in: codes } })
  .toArray();
for (const x of cases.sort((a, b) => a.correlative.localeCompare(b.correlative))) {
  console.log("---", x.correlative);
  console.log(
    JSON.stringify(
      {
        tenant: x.tenantId,
        subject: x.subject,
        intake: x.intakeChannel,
        requester: x.requesterName,
        origin: x.helpFrom?.originId,
        shared: x.sharedWithCompany,
        status: x.status,
        events: (x.events || []).map((e) => ({ kind: e.kind, detail: e.detail, actor: e.actorName })),
        msgs: (x.messages || []).map((m) => ({ role: m.role, author: m.authorName, body: m.body })),
      },
      null,
      2
    )
  );
}
const d = await db.collection("attention_report_dispatches").find({}).sort({ at: -1 }).limit(2).toArray();
console.log(
  "DISPATCH",
  JSON.stringify(
    d.map((x) => ({
      at: x.at,
      company: x.company,
      channel: x.channelLabel,
      result: x.result,
      detail: x.detail,
      to: x.to,
      cc: x.cc,
      message: x.message,
    })),
    null,
    2
  )
);
await client.close();
