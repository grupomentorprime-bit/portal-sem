import type { TenantDocument } from "@/core/tenant/types";
import type { MigrationDefinition } from "@/core/migrations/types";
import { migrationAuthorizedApps } from "@/lib/desktop/app-access";
import { resolveContractedApps } from "@/lib/desktop/contract";
import type { IdentityMembership } from "@/types/identity";

/**
 * Materializa la llave que cada membresía ya tenía de facto (todo el techo).
 * No otorga apps fuera del plan. Idempotente: no pisa `authorizedApps` ya presente.
 */
export const migration031MembershipAuthorizedApps: MigrationDefinition = {
  id: "031-membership-authorized-apps",
  description:
    "Backfill identity_memberships.authorizedApps con el plan contratado del Espacio",
  modules: [],

  async run({ db, log }) {
    const tenants = await db.collection<TenantDocument>("tenants").find({}).toArray();
    const contractedByTenant = new Map(
      tenants.map((tenant) => [
        tenant.tenantId,
        migrationAuthorizedApps(
          resolveContractedApps({
            tenantId: tenant.tenantId,
            contractedApps: tenant.contractedApps,
          })
        ),
      ])
    );

    const col = db.collection<IdentityMembership>("identity_memberships");
    const pending = await col
      .find({ authorizedApps: { $exists: false } })
      .project({ _id: 1, tenantId: 1 })
      .toArray();

    let documentsAffected = 0;
    let skipped = 0;
    const details: string[] = [];

    for (const row of pending) {
      const contracted =
        contractedByTenant.get(row.tenantId) ??
        migrationAuthorizedApps(resolveContractedApps({ tenantId: row.tenantId }));
      const result = await col.updateOne(
        { _id: row._id, authorizedApps: { $exists: false } },
        {
          $set: {
            authorizedApps: contracted,
            updatedAt: new Date().toISOString(),
          },
        }
      );
      if (result.modifiedCount > 0) {
        documentsAffected += 1;
      } else {
        skipped += 1;
      }
    }

    const already = await col.countDocuments({ authorizedApps: { $exists: true } });
    details.push(`pending=${pending.length}`);
    details.push(`withAuthorizedApps=${already}`);
    log(
      `authorizedApps backfill: affected=${documentsAffected} skipped=${skipped} totalWithField=${already}`
    );

    return { documentsAffected, skipped, details };
  },
};
