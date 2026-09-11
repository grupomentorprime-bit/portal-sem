import { ensureDomainIndexes } from "@/core/tenant/domains";
import { DOMAINS_COLLECTION, SEM_SITE_ID } from "@/core/tenant/constants";
import type { DomainDocument, DomainKind } from "@/core/tenant/types";
import type { MigrationDefinition } from "@/core/migrations/types";

/**
 * OT-GROWTH-SAAS-008 — dominios por Site.
 * Índices de unicidad + backfill de `kind` (sin tocar DNS/TLS).
 */
export const migration011SaasDomains: MigrationDefinition = {
  id: "011-saas-domains",
  description:
    "Dominios por Site: índices únicos + kind (custom / platform_subdomain / legacy)",
  modules: [],

  async run({ db, log }) {
    await ensureDomainIndexes(db);

    const col = db.collection<DomainDocument>(DOMAINS_COLLECTION);
    const missingKind = await col
      .find({ kind: { $exists: false } } as Record<string, unknown>)
      .toArray();

    let updated = 0;
    const at = new Date().toISOString();

    for (const doc of missingKind) {
      const kind: DomainKind =
        doc.siteId === SEM_SITE_ID ? "legacy" : "custom";
      const result = await col.updateOne(
        { _id: doc._id },
        { $set: { kind, updatedAt: at } }
      );
      if (result.modifiedCount > 0) updated += 1;
    }

    // Reparar Sites con >1 primary: conserva el primero por host.
    const multiPrimary = await col
      .aggregate<{ _id: string; hosts: string[] }>([
        { $match: { isPrimary: true } },
        {
          $group: {
            _id: "$siteId",
            hosts: { $push: "$host" },
            count: { $sum: 1 },
          },
        },
        { $match: { count: { $gt: 1 } } },
      ])
      .toArray();

    let primariesFixed = 0;
    for (const group of multiPrimary) {
      const keep = [...group.hosts].sort()[0]!;
      const demote = await col.updateMany(
        { siteId: group._id, isPrimary: true, host: { $ne: keep } },
        { $set: { isPrimary: false, updatedAt: at } }
      );
      primariesFixed += demote.modifiedCount;
    }

    const details = [
      `kind backfilled=${updated}`,
      `extra primaries demoted=${primariesFixed}`,
      `indexes ensured on ${DOMAINS_COLLECTION}`,
    ];
    for (const line of details) log(line);

    return {
      documentsAffected: updated + primariesFixed,
      skipped: 0,
      details,
    };
  },
};
