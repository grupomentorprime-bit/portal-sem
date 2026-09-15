import type { MigrationDefinition } from "@/core/migrations/types";
import type { IdentityMembership } from "@/types/identity";

async function ensureIndex(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  collection: { createIndex: (keys: Record<string, 1 | -1>, options?: any) => Promise<string> },
  keys: Record<string, 1 | -1>,
  options: { name: string; unique?: boolean }
): Promise<"created" | "exists"> {
  try {
    const indexOptions: { name: string; background: boolean; unique?: boolean } = {
      name: options.name,
      background: true,
    };
    if (options.unique) indexOptions.unique = true;
    await collection.createIndex(keys, indexOptions);
    return "created";
  } catch (error) {
    const code = (error as { code?: number }).code;
    if (code === 85 || code === 86) return "exists";
    throw error;
  }
}

const STATUS_RANK: Record<string, number> = {
  active: 3,
  invited: 2,
  suspended: 1,
  archived: 0,
};

/**
 * OT-GROWTH-TEAM-IMPLEMENT-003 — unicidad (userId, tenantId) en identity_memberships (D3).
 * Dedup previo + índice único. Idempotente.
 */
export const migration023GrowthTeamMembershipUnique: MigrationDefinition = {
  id: "023-growth-team-membership-unique",
  description:
    "Unicidad identity_memberships (userId, tenantId) + deduplicación previa Equipo V1",
  modules: [],

  async run({ db, log }) {
    const col = db.collection<IdentityMembership>("identity_memberships");
    let documentsAffected = 0;
    let skipped = 0;
    const details: string[] = [];

    const duplicates = await col
      .aggregate<{ _id: { userId: string; tenantId: string }; ids: string[] }>([
        {
          $group: {
            _id: { userId: "$userId", tenantId: "$tenantId" },
            ids: { $push: "$_id" },
            count: { $sum: 1 },
          },
        },
        { $match: { count: { $gt: 1 } } },
      ])
      .toArray();

    for (const group of duplicates) {
      const docs = await col
        .find({ _id: { $in: group.ids } })
        .toArray();
      docs.sort((a, b) => {
        const rankDiff =
          (STATUS_RANK[b.status] ?? -1) - (STATUS_RANK[a.status] ?? -1);
        if (rankDiff !== 0) return rankDiff;
        return (b.updatedAt || b.createdAt || "").localeCompare(
          a.updatedAt || a.createdAt || ""
        );
      });
      const keep = docs[0];
      const removeIds = docs.slice(1).map((d) => d._id);
      if (removeIds.length > 0) {
        const result = await col.deleteMany({ _id: { $in: removeIds } });
        documentsAffected += result.deletedCount;
        details.push(
          `dedup user=${group._id.userId} tenant=${group._id.tenantId} kept=${keep?._id} removed=${result.deletedCount}`
        );
      }
    }

    if (duplicates.length === 0) {
      details.push("dedup=none");
      skipped += 1;
    }

    const indexResult = await ensureIndex(
      col,
      { userId: 1, tenantId: 1 },
      { name: "userId_tenantId_unique", unique: true }
    );
    details.push(`index userId_tenantId_unique=${indexResult}`);
    if (indexResult === "created") documentsAffected += 1;
    else skipped += 1;

    for (const line of details) log(line);
    return { documentsAffected, skipped, details };
  },
};
