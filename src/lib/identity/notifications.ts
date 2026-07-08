import "server-only";

import { getDatabase } from "@/lib/mongodb";
import { generateId } from "@/core/identity/auth/crypto";
import type {
  PlatformNotification,
  PlatformNotificationInput,
} from "@/types/notifications";

const COLLECTION = "identity_notifications";

export async function createNotifications(
  inputs: PlatformNotificationInput[]
): Promise<PlatformNotification[]> {
  if (!inputs.length) return [];
  const db = await getDatabase();
  const now = new Date().toISOString();
  const docs: PlatformNotification[] = inputs.map((input) => ({
    _id: generateId("ntf"),
    tenantId: input.tenantId,
    userId: input.userId,
    category: input.category,
    title: input.title,
    body: input.body,
    href: input.href,
    entity: input.entity,
    entityId: input.entityId,
    metadata: input.metadata,
    read: false,
    createdAt: now,
  }));

  await db.collection<PlatformNotification>(COLLECTION).insertMany(docs);
  return docs;
}

export async function listNotificationsByUser(
  tenantId: string,
  userId: string,
  options?: { limit?: number; unreadOnly?: boolean }
): Promise<PlatformNotification[]> {
  const db = await getDatabase();
  const filter: Record<string, unknown> = { tenantId, userId };
  if (options?.unreadOnly) filter.read = false;
  return db
    .collection<PlatformNotification>(COLLECTION)
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(options?.limit ?? 30)
    .toArray();
}

export async function countUnreadNotifications(
  tenantId: string,
  userId: string
): Promise<number> {
  const db = await getDatabase();
  return db
    .collection<PlatformNotification>(COLLECTION)
    .countDocuments({ tenantId, userId, read: false });
}

export async function markNotificationRead(
  tenantId: string,
  userId: string,
  notificationId: string
): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.collection<PlatformNotification>(COLLECTION).updateOne(
    { _id: notificationId, tenantId, userId },
    { $set: { read: true, readAt: new Date().toISOString() } }
  );
  return result.matchedCount > 0;
}

export async function markAllNotificationsRead(
  tenantId: string,
  userId: string
): Promise<number> {
  const db = await getDatabase();
  const result = await db.collection<PlatformNotification>(COLLECTION).updateMany(
    { tenantId, userId, read: false },
    { $set: { read: true, readAt: new Date().toISOString() } }
  );
  return result.modifiedCount;
}
