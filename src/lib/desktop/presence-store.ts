import "server-only";

import { getDatabase } from "@/lib/mongodb";
import type { PresenceBeat } from "@/lib/desktop/presence";

const PRESENCE = "attention_presence";

interface PresenceDoc {
  _id: string;
  kind: "staff" | "client";
  tenantId: string | null;
  company: string;
  displayName: string;
  seenAt: string;
}

function toBeat(doc: PresenceDoc): PresenceBeat {
  return {
    userId: doc._id,
    kind: doc.kind === "staff" ? "staff" : "client",
    tenantId: doc.tenantId || null,
    company: doc.company || "",
    displayName: doc.displayName || "",
    seenAt: doc.seenAt,
  };
}

export async function touchPresence(beat: PresenceBeat): Promise<void> {
  const db = await getDatabase();
  const collection = db.collection<PresenceDoc>(PRESENCE);
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await collection.deleteMany({ seenAt: { $lt: cutoff } });
  await collection.updateOne(
    { _id: beat.userId },
    {
      $set: {
        kind: beat.kind,
        tenantId: beat.tenantId,
        company: beat.company,
        displayName: beat.displayName,
        seenAt: beat.seenAt,
      },
    },
    { upsert: true }
  );
}

export async function listPresence(): Promise<PresenceBeat[]> {
  const db = await getDatabase();
  const docs = await db.collection<PresenceDoc>(PRESENCE).find({}).toArray();
  return docs.map((doc) => toBeat(doc));
}
