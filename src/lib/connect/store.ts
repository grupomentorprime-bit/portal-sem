import "server-only";

import { getDatabase } from "@/lib/mongodb";
import type { LaunchCodeStore, LaunchTicket } from "@/lib/connect/protocol";

const COLLECTION = "connect_launch_codes";

type StoredTicket = LaunchTicket & { expireAt: Date };

export function mongoLaunchCodeStore(): LaunchCodeStore {
  return {
    async insert(ticket) {
      const db = await getDatabase();
      const collection = db.collection<StoredTicket>(COLLECTION);
      await collection.createIndex({ codeHash: 1 }, { unique: true, name: "connect_code_hash" });
      await collection.createIndex(
        { expireAt: 1 },
        { expireAfterSeconds: 0, name: "connect_code_ttl" }
      );
      await collection.insertOne({
        codeHash: ticket.codeHash,
        userId: ticket.userId,
        tenantId: ticket.tenantId,
        appId: ticket.appId,
        destinationOrigin: ticket.destinationOrigin,
        issuerOrigin: ticket.issuerOrigin,
        transactionHash: ticket.transactionHash,
        expiresAt: ticket.expiresAt,
        usedAt: null,
        expireAt: new Date(ticket.expiresAt),
      });
    },
    async consume(codeHash, nowIso) {
      const db = await getDatabase();
      const before = await db.collection<StoredTicket>(COLLECTION).findOneAndUpdate(
        { codeHash, usedAt: null, expiresAt: { $gt: nowIso } },
        { $set: { usedAt: nowIso } },
        { returnDocument: "before" }
      );
      if (!before) return null;
      return {
        codeHash: before.codeHash,
        userId: before.userId,
        tenantId: before.tenantId,
        appId: before.appId,
        destinationOrigin: before.destinationOrigin,
        issuerOrigin: before.issuerOrigin,
        transactionHash: before.transactionHash,
        expiresAt: before.expiresAt,
        usedAt: null,
      };
    },
    async find(codeHash) {
      const db = await getDatabase();
      const row = await db.collection<StoredTicket>(COLLECTION).findOne({ codeHash });
      if (!row) return null;
      return {
        codeHash: row.codeHash,
        userId: row.userId,
        tenantId: row.tenantId,
        appId: row.appId,
        destinationOrigin: row.destinationOrigin,
        issuerOrigin: row.issuerOrigin,
        transactionHash: row.transactionHash,
        expiresAt: row.expiresAt,
        usedAt: row.usedAt,
      };
    },
  };
}
