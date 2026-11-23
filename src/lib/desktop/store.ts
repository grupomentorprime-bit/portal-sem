import "server-only";

import { findTenantById } from "@/core/tenant";
import { TENANTS_COLLECTION } from "@/core/tenant/constants";
import type { TenantDocument } from "@/core/tenant/types";
import type { IdentityUser } from "@/types/identity";
import {
  parseWallpaper,
  type DesktopWallpaper,
  type MentorAppId,
  type WallpaperChoice,
} from "@/lib/desktop/catalog";
import type { DeskIconSpot } from "@/lib/desktop/layout";
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
      try {
        await db.collection<AppRequest>(REQUESTS).insertOne(row);
      } catch (error) {
        if ((error as { code?: unknown }).code === 11000) return;
        throw error;
      }
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
    async listAllOpen() {
      const db = await getDatabase();
      return db.collection<AppRequest>(REQUESTS).find({ status: "open" }).toArray();
    },
  };
}

export async function readSpaceContract(tenantId: string): Promise<{
  contracted: MentorAppId[];
  aprendeHoyEntryUrl: string | null;
  spaceType: string | null;
}> {
  const db = await getDatabase();
  const tenant = await findTenantById(db, tenantId);
  const rawType = tenant?.type;
  return {
    contracted: resolveContractedApps({
      tenantId,
      contractedApps: tenant?.contractedApps,
    }),
    aprendeHoyEntryUrl: tenant?.aprendeHoyEntryUrl ?? null,
    spaceType: typeof rawType === "string" && rawType.trim() ? rawType.trim() : null,
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
  await db.collection<TenantDocument>(TENANTS_COLLECTION).updateOne(
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
  wallpaper: WallpaperChoice
): Promise<void> {
  const db = await getDatabase();
  await db.collection<IdentityUser>("identity_users").updateOne(
    { _id: userId },
    {
      $set: {
        desktopWallpaper: wallpaper,
        updatedAt: new Date().toISOString(),
      },
    }
  );
}

export async function saveCustomDesktopWallpaper(
  userId: string,
  updatedAt: string
): Promise<void> {
  const db = await getDatabase();
  await db.collection<IdentityUser>("identity_users").updateOne(
    { _id: userId },
    {
      $set: {
        desktopWallpaper: "custom",
        desktopWallpaperCustom: true,
        desktopWallpaperUpdatedAt: updatedAt,
        updatedAt,
      },
    }
  );
}

export async function setAvatarPreset(userId: string, presetId: string): Promise<void> {
  const db = await getDatabase();
  await db.collection<IdentityUser>("identity_users").updateOne(
    { _id: userId },
    {
      $set: {
        avatarPresetId: presetId,
        updatedAt: new Date().toISOString(),
      },
    }
  );
}

export async function saveAvatarPhoto(userId: string, updatedAt: string): Promise<void> {
  const db = await getDatabase();
  await db.collection<IdentityUser>("identity_users").updateOne(
    { _id: userId },
    {
      $set: {
        avatarPhoto: true,
        avatarPhotoUpdatedAt: updatedAt,
        updatedAt,
      },
    }
  );
}

export async function clearAvatarPhoto(userId: string): Promise<void> {
  const db = await getDatabase();
  await db.collection<IdentityUser>("identity_users").updateOne(
    { _id: userId },
    {
      $set: {
        updatedAt: new Date().toISOString(),
      },
      $unset: {
        avatarPhoto: "",
        avatarPhotoUpdatedAt: "",
      },
    }
  );
}

export async function clearDesktopAvatar(userId: string): Promise<void> {
  const db = await getDatabase();
  await db.collection<IdentityUser>("identity_users").updateOne(
    { _id: userId },
    {
      $set: {
        updatedAt: new Date().toISOString(),
      },
      $unset: {
        avatarPresetId: "",
        avatarPhoto: "",
        avatarPhotoUpdatedAt: "",
      },
    }
  );
}

/** Borra la marca del fondo propio. Si estaba activo, vuelve a Mar. */
export async function clearCustomDesktopWallpaper(userId: string): Promise<DesktopWallpaper> {
  const db = await getDatabase();
  const user = await db.collection<IdentityUser>("identity_users").findOne({ _id: userId });
  const next: DesktopWallpaper =
    user?.desktopWallpaper === "custom" ? "mar" : parseWallpaper(user?.desktopWallpaper);
  await db.collection<IdentityUser>("identity_users").updateOne(
    { _id: userId },
    {
      $set: {
        desktopWallpaper: next,
        updatedAt: new Date().toISOString(),
      },
      $unset: {
        desktopWallpaperCustom: "",
        desktopWallpaperUpdatedAt: "",
      },
    }
  );
  return next;
}

export async function setDesktopLayout(userId: string, icons: DeskIconSpot[]): Promise<void> {
  const db = await getDatabase();
  await db.collection<IdentityUser>("identity_users").updateOne(
    { _id: userId },
    {
      $set: {
        desktopLayout: icons,
        updatedAt: new Date().toISOString(),
      },
    }
  );
}
