import "server-only";

import { findTenantById } from "@/core/tenant";
import { TENANTS_COLLECTION } from "@/core/tenant/constants";
import type { DesktopWallpaper, MentorAppId } from "@/lib/desktop/catalog";
import { resolveContractedApps } from "@/lib/desktop/contract";
import type { AppRequest, AppRequestStore } from "@/lib/desktop/requests";
import { getDatabase } from "@/lib/mongodb";

const REQUESTS = "space_app_requests";

export function mongoAppRequestStore(): AppRequestStore {
  return {
    async findOpen(tenantId, appId) {
      const db = await getDatabase();
      return db
        .collection<AppRequest>(REQUESTS)
        .findOne({ tenantId, appId, status: "open" });
    },
    async insertOpen(row) {
      const db = await getDatabase();
      await db.collection(REQUESTS).createIndex(
        { tenantId: 1, appId: 1 },
        {
          unique: true,
          partialFilterExpression: { status: "open" },
          name: "one_open_request",
        }
      );
      await db.collection<AppRequest>(REQUESTS).insertOne(row);
    },
    async fulfillOpen(tenantId, appId) {
      const db = await getDatabase();
      await db.collection<AppRequest>(REQUESTS).updateMany(
        { tenantId, appId, status: "open" },
        { $set: { status: "fulfilled" } }
      );
    },
    async listOpen(tenantId) {
      const db = await getDatabase();
      return db
        .collection<AppRequest>(REQUESTS)
        .find({ tenantId, status: "open" })
        .toArray();
    },
  };
}

export async function readSpaceContract(tenantId: string): Promise<{
  contracted: MentorAppId[];
  aprendeHoyEntryUrl: string | null;
}> {
  const db = await getDatabase();
  const tenant = await findTenantById(db, tenantId);
  return {
    contracted: resolveContractedApps({
      tenantId,
      contractedApps: tenant?.contractedApps,
    }),
    aprendeHoyEntryUrl: tenant?.aprendeHoyEntryUrl ?? null,
  };
}

export async function writeSpaceContract(
  tenantId: string,
  patch: {
    contractedApps: MentorAppId[];
    aprendeHoyEntryUrl: string | null;
  }
): Promise<void> {
  const db = await getDatabase();
  await db.collection(TENANTS_COLLECTION).updateOne(
    { $or: [{ _id: tenantId }, { tenantId }] },
    {
      $set: {
        contractedApps: patch.contractedApps,
        aprendeHoyEntryUrl: patch.aprendeHoyEntryUrl,
        updatedAt: new Date().toISOString(),
      },
    }
  );
}

export async function setDesktopWallpaper(
  userId: string,
  wallpaper: DesktopWallpaper
): Promise<void> {
  const db = await getDatabase();
  await db.collection("identity_users").updateOne(
    { _id: userId },
    {
      $set: {
        desktopWallpaper: wallpaper,
        updatedAt: new Date().toISOString(),
      },
    }
  );
}
